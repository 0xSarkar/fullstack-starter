import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import type { PlansResponseType } from '@fullstack-starter/api-schema';

interface PricingTableProps {
  plans: PlansResponseType;
  isYearly: boolean;
  setIsYearly: (value: boolean) => void;
  onUpgrade: (plan: PlansResponseType[0]) => void;
  loading: boolean;
  confirming: boolean;
  mostPopularPlanId?: string;
}

export function PricingTable({
  plans,
  isYearly,
  setIsYearly,
  onUpgrade,
  loading,
  confirming,
  mostPopularPlanId,
}: PricingTableProps) {
  return (
    <>
      {/* Pricing Toggle */}
      <div className="flex items-center justify-center gap-4 py-8">
        <span className={`text-sm font-medium ${!isYearly ? 'text-foreground' : 'text-muted-foreground'}`}>
          Monthly
        </span>
        <Switch
          checked={isYearly}
          onCheckedChange={setIsYearly}
          className="data-[state=checked]:bg-primary"
        />
        <span className={`text-sm font-medium ${isYearly ? 'text-foreground' : 'text-muted-foreground'}`}>
          Yearly
        </span>
      </div>

      {/* Pricing Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-6 max-w-3xl mx-auto">
        {/* Free Plan */}
        <Card className="relative">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-xl">Free</CardTitle>
            <div className="text-3xl font-bold">
              <span className="text-2xl">$</span>
              0
              <span className="text-sm font-normal text-muted-foreground">/month</span>
            </div>
            <div className="text-sm text-muted-foreground">
              $0.00 USD per month
            </div>
          </CardHeader>
          <CardContent className="text-center pt-0">
            <p className="text-sm text-muted-foreground mb-6">
              Perfect for getting started with basic features
            </p>
          </CardContent>
        </Card>

        {/* Paid Plans */}
        {plans
          .filter(plan => plan.interval === (isYearly ? 'year' : 'month'))
          .map((plan) => {
            const isMostPopular = mostPopularPlanId && plan.id === mostPopularPlanId;
            return (
              <Card
                key={plan.id}
                className={`relative ${isMostPopular ? 'border-2 border-primary/20' : ''}`}
              >
                {isMostPopular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-10">
                    <span className="bg-primary text-primary-foreground text-xs font-medium px-3 py-1 rounded-full">
                      Most Popular
                    </span>
                  </div>
                )}
                <CardHeader className="text-center pb-4">
                  <CardTitle className="text-xl">
                    {plan.product_name || plan.price_name || 'Unnamed Plan'}
                  </CardTitle>
                  <div className="text-3xl font-bold">
                    {plan.amount !== null ? (
                      <>
                        <span className="text-2xl">$</span>
                        {(plan.amount / 100).toFixed(0)}
                        <span className="text-sm font-normal text-muted-foreground">
                          /{isYearly ? 'year' : 'month'}
                        </span>
                      </>
                    ) : (
                      <span className="text-muted-foreground">Contact for pricing</span>
                    )}
                  </div>
                  {plan.amount !== null && (
                    <div className="text-sm text-muted-foreground">
                      ${(plan.amount / 100).toFixed(2)} {plan.currency?.toUpperCase()} per {isYearly ? 'year' : 'month'}
                    </div>
                  )}
                </CardHeader>
                <CardContent className="text-center pt-0">
                  <Button
                    className="w-full"
                    onClick={() => onUpgrade(plan)}
                    disabled={loading || confirming}
                  >
                    {loading ? 'Redirecting…' : confirming ? 'Confirming…' : 'Get Started'}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
      </div>
    </>
  );
}
