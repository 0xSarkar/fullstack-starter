import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { AuthUser } from '@/stores/auth-store';

interface CurrentPlanProps {
  user: AuthUser;
  loading: boolean;
  confirming: boolean;
  onManageSubscription: () => void;
}

export function CurrentPlan({ user, loading, confirming, onManageSubscription }: CurrentPlanProps) {
  const subscription = user.subscription;

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] gap-6">
      <div className="text-center">
        <Card className="relative border-2 border-primary/20 max-w-md min-w-xs mx-auto">
          <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-10">
            <span className="bg-primary text-primary-foreground text-xs font-medium px-3 py-1 rounded-full">
              Current Plan
            </span>
          </div>
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-xl">
              {subscription?.product_name || subscription?.price_name || 'Your Plan'}
            </CardTitle>
            <div className="text-3xl font-bold mb-1">
              {subscription?.amount !== undefined ? (
                <>
                  <span className="text-2xl">$</span>
                  {(subscription.amount / 100).toFixed(0)}
                  <span className="text-sm font-normal text-muted-foreground">
                    /{subscription.interval}
                  </span>
                </>
              ) : (
                <span className="text-muted-foreground">Custom pricing</span>
              )}
            </div>
            {subscription?.amount !== undefined && subscription.interval && subscription.currency && (
              <div className="text-sm text-muted-foreground mb-4">
                ${(subscription.amount / 100).toFixed(2)} {subscription.currency.toUpperCase()} per {subscription.interval}
              </div>
            )}
            <div className="text-sm text-muted-foreground">
              Status: <span className="capitalize font-medium">{subscription?.status ?? 'unknown'}</span>
            </div>
          </CardHeader>
          <CardContent className="text-center pt-0">
            <Button
              className="w-full"
              onClick={onManageSubscription}
              disabled={loading || confirming}
              variant={"secondary"}
            >
              {loading ? 'Redirecting…' : 'Manage Subscription'}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
