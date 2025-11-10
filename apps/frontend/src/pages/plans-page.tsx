import { getRouteApi } from '@tanstack/react-router';
import type {
  CreateCheckoutSessionResponseType,
  CreateBillingPortalResponseType,
  PlanType,
} from '@fullstack-starter/shared-schemas';
import { Separator } from '@/components/ui/separator';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { PricingTable } from '@/components/plans/pricing-table';
import { toast } from 'sonner';
import { useAuth } from '@/data/queries/auth-queries';
import { CurrentPlan } from '@/components/plans/current-plan';
import { http } from '@/lib/http';

const MESSAGES = {
  success: 'Subscription successful! Thank you for your support.',
  canceled: 'Subscription process was canceled. No changes were made to your account.',
  genericError: 'An unexpected error occurred. Please contact support.',
} as const;

const route = getRouteApi('/_appLayout/plans');

export function PlansPage() {
  const [loading, setLoading] = useState(false);
  const [isYearly, setIsYearly] = useState(false);

  const { data: plans } = route.useLoaderData();
  const navigate = route.useNavigate();
  const { checkout } = route.useSearch();
  const { user } = useAuth();

  // Determine the most popular plan (highest price for current interval)
  const mostPopularPlanId = useMemo(() => {
    const filteredPlans = plans.filter((plan: PlanType) => plan.interval === (isYearly ? 'year' : 'month'));
    if (filteredPlans.length === 0) return undefined;

    const highestPricePlan = filteredPlans.reduce((prev: PlanType, current: PlanType) =>
      (current.amount || 0) > (prev.amount || 0) ? current : prev
    );

    return highestPricePlan.id;
  }, [plans, isYearly]);

  const clearCheckoutParams = useCallback(() => {
    navigate({ to: '/plans', search: { checkout: undefined, session_id: undefined } });
  }, [navigate]);

  const handleUpgrade = async (plan: PlanType) => {
    setLoading(true);
    try {
      const res = await http.post<CreateCheckoutSessionResponseType>('/billing/checkout', { priceId: plan.stripe_price_id });
      if (res.data?.url) {
        window.location.assign(res.data.url);
      } else {
        toast.error(MESSAGES.genericError);
      }
    } catch (err: unknown) {
      console.error('Error creating checkout session:', err);
      toast.error(MESSAGES.genericError);
    } finally {
      setLoading(false);
    }
  };

  const handleManageSubscription = async () => {
    setLoading(true);
    try {
      const res = await http.post<CreateBillingPortalResponseType>('/billing/billing-portal', {});
      if (res.data?.url) {
        window.location.assign(res.data.url);
      } else {
        toast.error(MESSAGES.genericError);
      }
    } catch (err: unknown) {
      console.error('Error creating billing portal:', err);
      toast.error(MESSAGES.genericError);
    } finally {
      setLoading(false);
    }
  };

  // Handle checkout success/cancel flow
  useEffect(() => {
    if (checkout === 'success') {
      toast.success(MESSAGES.success);
      clearCheckoutParams();
    } else if (checkout === 'cancel') {
      toast.error(MESSAGES.canceled);
      clearCheckoutParams();
    }
  }, [checkout, clearCheckoutParams]);

  const hasActiveSubscription = user?.subscription?.status === 'active' || user?.subscription?.status === 'trialing';

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
            confirming={false}
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
            confirming={false}
            mostPopularPlanId={mostPopularPlanId}
          />
        )}
      </div>
    </>
  );
}
