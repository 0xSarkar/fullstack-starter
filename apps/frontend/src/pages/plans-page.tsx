import { getRouteApi } from '@tanstack/react-router';
import { confirmCheckoutSessionApi, createCheckoutSessionApi, createBillingPortalApi } from '@fullstack-starter/shared-api';
import { Separator } from '@/components/ui/separator';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { sleep } from '@/lib/utils';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { PricingTable } from '@/components/plans/pricing-table';
import { toast } from 'sonner';
import type { PlansResponseType } from '@fullstack-starter/api-schema';
import { useAuthStore } from '@/stores/auth-store';
import { CurrentPlan } from '@/components/plans/current-plan';

// Constants
const POLLING_CONFIG = {
  maxAttempts: 6, // e.g., 1s,2s,4s,8s,16s,32s ~ total ~63s
  baseDelay: 1000,
  maxDelay: 32000,
} as const;

const MESSAGES = {
  success: 'Subscription successful! Thank you for your support.',
  failed: 'We could not confirm your subscription. Please contact support.',
  canceled: 'Subscription process was canceled. No changes were made to your account.',
  processing: 'Your subscription is being processed. If it does not complete shortly, contact support.',
  genericError: 'An unexpected error occurred. Please contact support.',
  fallbackError: 'Unable to confirm subscription.',
} as const;

type ConfirmationStatus = 'idle' | 'pending' | 'complete' | 'failed';

const route = getRouteApi('/_appLayout/plans');

export function PlansPage() {
  const [loading, setLoading] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [status, setStatus] = useState<ConfirmationStatus>('idle');
  const [isYearly, setIsYearly] = useState(false);

  const plans = route.useLoaderData();
  const navigate = route.useNavigate();
  const isMountedRef = useRef(true);
  const startedSessionRef = useRef<string | undefined>(undefined);
  const { checkout, session_id } = route.useSearch();
  const { user } = useAuthStore();

  // Determine the most popular plan (highest price for current interval)
  const mostPopularPlanId = useMemo(() => {
    const filteredPlans = plans.filter((plan: PlansResponseType[0]) => plan.interval === (isYearly ? 'year' : 'month'));
    if (filteredPlans.length === 0) return undefined;

    const highestPricePlan = filteredPlans.reduce((prev: PlansResponseType[0], current: PlansResponseType[0]) =>
      (current.amount || 0) > (prev.amount || 0) ? current : prev
    );

    return highestPricePlan.id;
  }, [plans, isYearly]);

  const clearCheckoutParams = useCallback(() => {
    // Navigate to the same route without search params
    navigate({ to: '/plans', search: { checkout: undefined, session_id: undefined } });
  }, [navigate]);

  const handleConfirmationResult = useCallback((
    confirmedStatus: string,
    lastStatus: { current: ConfirmationStatus; }
  ) => {
    if (!isMountedRef.current) return false;

    if (confirmedStatus === 'complete') {
      lastStatus.current = 'complete';
      setStatus('complete');
      toast.success(MESSAGES.success);
      clearCheckoutParams();
      return true;
    }

    if (confirmedStatus === 'failed') {
      lastStatus.current = 'failed';
      setStatus('failed');
      toast.error(MESSAGES.failed);
      clearCheckoutParams();
      return true;
    }

    lastStatus.current = 'pending';
    setStatus('pending');
    return false;
  }, [clearCheckoutParams]);

  const handleConfirmationError = useCallback((
    err: any,
    lastStatus: { current: ConfirmationStatus; }
  ) => {
    if (!isMountedRef.current) return false;

    console.error('confirmSession error', err);

    const isClientError = err?.status >= 400 && err?.status < 500;
    if (isClientError) {
      lastStatus.current = 'failed';
      setStatus('failed');
      const message = err.data?.error || err.message || MESSAGES.fallbackError;
      toast.error(message);
      clearCheckoutParams();
      return true;
    }

    return false; // Transient error, retry
  }, [clearCheckoutParams]);

  const confirmSessionPolling = useCallback(async (sessionId: string) => {
    setConfirming(true);
    setStatus('pending');

    const lastStatus = { current: 'pending' as ConfirmationStatus };
    let attempt = 0;

    while (attempt < POLLING_CONFIG.maxAttempts && isMountedRef.current) {
      try {
        const data = await confirmCheckoutSessionApi(sessionId);
        const shouldStop = handleConfirmationResult(data.status, lastStatus);
        if (shouldStop) break;
      } catch (err) {
        const shouldStop = handleConfirmationError(err, lastStatus);
        if (shouldStop) break;
      }

      if (!isMountedRef.current) return;

      attempt += 1;
      if (attempt < POLLING_CONFIG.maxAttempts) {
        const delay = Math.min(POLLING_CONFIG.baseDelay * (2 ** attempt), POLLING_CONFIG.maxDelay);
        await sleep(delay);
      }
    }

    // Handle timeout scenario
    if (lastStatus.current === 'pending' && attempt >= POLLING_CONFIG.maxAttempts && isMountedRef.current) {
      toast(MESSAGES.processing);
      clearCheckoutParams();
    }

    setConfirming(false);
  }, [handleConfirmationResult, handleConfirmationError, clearCheckoutParams]);

  const handleUpgrade = async (plan: PlansResponseType[0]) => {
    setLoading(true);
    try {
      const res = await createCheckoutSessionApi(plan.stripe_price_id);
      if (res?.url) {
        window.location.assign(res.url);
      } else {
        toast.error(MESSAGES.genericError);
      }
    } catch (err) {
      console.error('Error creating checkout session:', err);
      toast.error(MESSAGES.genericError);
    } finally {
      setLoading(false);
    }
  };

  const handleManageSubscription = async () => {
    setLoading(true);
    try {
      const res = await createBillingPortalApi();
      if (res?.url) {
        window.location.assign(res.url);
      } else {
        toast.error(MESSAGES.genericError);
      }
    } catch (err) {
      console.error('Error creating billing portal:', err);
      toast.error(MESSAGES.genericError);
    } finally {
      setLoading(false);
    }
  };

  // Handle checkout confirmation flow
  useEffect(() => {
    let cancelled = false;

    const handleCheckout = async () => {
      if (cancelled || !isMountedRef.current) return;

      if (checkout === 'success' && session_id) {
        // Only start confirmation once per session_id to avoid duplicates
        if (startedSessionRef.current !== session_id) {
          startedSessionRef.current = session_id;
          await confirmSessionPolling(session_id);
        }
      } else if (checkout === 'cancel') {
        startedSessionRef.current = undefined;
        toast.error(MESSAGES.canceled);
        clearCheckoutParams();
      } else {
        // Clear marker when no checkout params
        startedSessionRef.current = undefined;
      }
    };

    handleCheckout();

    return () => {
      cancelled = true;
    };
  }, [checkout, session_id]);

  // Component mount/unmount tracking
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const hasActiveSubscription = user?.subscription?.status === 'active' || user?.subscription?.status === 'trialing';

  const getStatusMessage = () => {
    switch (status) {
      case 'pending':
        return <div>Your subscription is being processed. This may take a few moments...</div>;
      case 'complete':
        return <div className="text-success">Subscription confirmed — thank you!</div>;
      case 'failed':
        return <div className="text-destructive">We could not confirm your subscription. Please contact support.</div>;
      default:
        return null;
    }
  };

  return (
    <>
      <header className="flex h-16 shrink-0 items-center gap-2">
        <div className="flex items-center gap-1 px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator
            orientation="vertical"
            className="mr-2 data-[orientation=vertical]:h-4"
          />
          <div className='font-semibold text-base max-w-56 md:max-w-xs truncate flex items-center gap-2'>
            <span className="truncate">Plans</span>
          </div>
        </div>
      </header>

      <div className="flex flex-1 flex-col gap-4 p-4 pt-0 h-full">
        {hasActiveSubscription ? (
          <CurrentPlan
            user={user}
            loading={loading}
            confirming={confirming}
            onManageSubscription={handleManageSubscription}
          />
        ) : (
          /* Pricing Table View */
          <PricingTable
            plans={plans}
            isYearly={isYearly}
            setIsYearly={setIsYearly}
            onUpgrade={handleUpgrade}
            loading={loading}
            confirming={confirming}
            mostPopularPlanId={mostPopularPlanId}
          />
        )}

        {status !== 'idle' && (
          <div className="mt-4 text-sm text-center">
            {getStatusMessage()}
          </div>
        )}
      </div>
    </>
  );
}
