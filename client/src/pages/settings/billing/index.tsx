import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  ArrowRightIcon, 
  CalendarIcon, 
  CheckIcon, 
  InfoIcon, 
  RefreshCwIcon, 
  CreditCardIcon
} from 'lucide-react';
import { SubscriptionPlan, PLAN_LIMITS } from '@shared/schema';
import { PlanModal } from '@/components/subscription/plan-modal';
import { useToast } from '@/hooks/use-toast';
import { getTrialDaysRemaining } from '@/lib/utils';

interface Organization {
  id: number;
  name: string;
  email: string;
  plan: string;
  trialEndsAt: string | null;
}

export default function BillingPage() {
  const { toast } = useToast();
  const [trialDaysLeft, setTrialDaysLeft] = useState<number>(0);
  
  // Fetch organization data
  const { data: organization, isLoading, error } = useQuery<Organization>({
    queryKey: ['/api/organization'],
  });
  
  useEffect(() => {
    if (organization?.trialEndsAt) {
      setTrialDaysLeft(getTrialDaysRemaining(new Date(organization.trialEndsAt)));
    }
  }, [organization]);
  
  if (isLoading) {
    return (
      <div className="container py-10">
        <div className="flex justify-center items-center h-64">
          <RefreshCwIcon className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }
  
  if (error || !organization) {
    return (
      <div className="container py-10">
        <Card>
          <CardHeader>
            <CardTitle>Error Loading Billing Information</CardTitle>
            <CardDescription>
              We couldn't load your billing information. Please try again later.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => window.location.reload()}>
              Refresh Page
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  const getFormattedPlanName = (plan: string): string => {
    switch (plan) {
      case SubscriptionPlan.FREE_TRIAL:
        return 'Free Trial';
      case SubscriptionPlan.STARTER:
        return 'Starter';
      case SubscriptionPlan.GROWTH:
        return 'Growth';
      case SubscriptionPlan.PRO:
        return 'Pro';
      case SubscriptionPlan.ENTERPRISE:
        return 'Enterprise';
      default:
        return plan;
    }
  };
  
  const getPlanPrice = (plan: string): number => {
    switch (plan) {
      case SubscriptionPlan.FREE_TRIAL:
        return 0;
      case SubscriptionPlan.STARTER:
        return 29;
      case SubscriptionPlan.GROWTH:
        return 79;
      case SubscriptionPlan.PRO:
        return 199;
      case SubscriptionPlan.ENTERPRISE:
        return 499;
      default:
        return 0;
    }
  };
  
  const getPlanLimits = (plan: string) => {
    switch (plan) {
      case SubscriptionPlan.FREE_TRIAL:
        return PLAN_LIMITS[SubscriptionPlan.FREE_TRIAL];
      case SubscriptionPlan.STARTER:
        return PLAN_LIMITS[SubscriptionPlan.STARTER];
      case SubscriptionPlan.GROWTH:
        return PLAN_LIMITS[SubscriptionPlan.GROWTH];
      case SubscriptionPlan.PRO:
        return PLAN_LIMITS[SubscriptionPlan.PRO];
      case SubscriptionPlan.ENTERPRISE:
        return PLAN_LIMITS[SubscriptionPlan.ENTERPRISE];
      default:
        return { apps: 0, marketers: 0 };
    }
  };
  
  const planLimits = getPlanLimits(organization.plan);
  const currentPlanPrice = getPlanPrice(organization.plan);
  
  return (
    <div className="container py-10">
      <div className="flex flex-col gap-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Billing & Subscription</h1>
          <p className="text-muted-foreground mt-2">
            Manage your plan and billing information.
          </p>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Current Plan</CardTitle>
            <CardDescription>
              Your current subscription plan and usage.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 border rounded-lg">
                <div>
                  <h3 className="text-xl font-semibold">
                    {getFormattedPlanName(organization.plan)}
                    {organization.plan === SubscriptionPlan.FREE_TRIAL && (
                      <span className="ml-2 px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">
                        Trial
                      </span>
                    )}
                  </h3>
                  <div className="flex items-center mt-1">
                    <span className="text-2xl font-bold">
                      ${currentPlanPrice}
                    </span>
                    {currentPlanPrice > 0 && (
                      <span className="text-muted-foreground ml-1">/month</span>
                    )}
                  </div>
                  <div className="mt-3 space-y-1">
                    <div className="flex items-center text-sm">
                      <CheckIcon className="h-4 w-4 text-green-500 mr-2" />
                      <span>Up to {planLimits.apps} app{planLimits.apps !== 1 ? 's' : ''}</span>
                    </div>
                    <div className="flex items-center text-sm">
                      <CheckIcon className="h-4 w-4 text-green-500 mr-2" />
                      <span>Up to {planLimits.marketers} marketer{planLimits.marketers !== 1 ? 's' : ''}</span>
                    </div>
                    {organization.plan === SubscriptionPlan.FREE_TRIAL && (
                      <div className="flex items-center text-sm">
                        <CalendarIcon className="h-4 w-4 text-yellow-500 mr-2" />
                        <span>{trialDaysLeft} day{trialDaysLeft !== 1 ? 's' : ''} remaining</span>
                      </div>
                    )}
                  </div>
                </div>
                <div>
                  <PlanModal 
                    trigger={<Button size="lg">
                      {organization.plan === SubscriptionPlan.FREE_TRIAL ? 'Upgrade Plan' : 'Change Plan'}
                      <ArrowRightIcon className="h-4 w-4 ml-1" />
                    </Button>} 
                    currentPlan={organization.plan}
                    trialDaysLeft={trialDaysLeft}
                  />
                </div>
              </div>
              
              {organization.plan === SubscriptionPlan.FREE_TRIAL && trialDaysLeft <= 3 && (
                <div className="flex items-start p-4 border border-yellow-200 bg-yellow-50 rounded-lg">
                  <InfoIcon className="h-5 w-5 text-yellow-500 mt-0.5 mr-3 shrink-0" />
                  <div>
                    <h4 className="font-medium">Your free trial is ending soon</h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      {trialDaysLeft === 0 
                        ? 'Your free trial has ended. Upgrade now to continue using all features.'
                        : `You have ${trialDaysLeft} day${trialDaysLeft !== 1 ? 's' : ''} left in your free trial. Upgrade now to avoid any service interruptions.`
                      }
                    </p>
                    <Button variant="outline" size="sm" className="mt-2" onClick={() => {
                      document.getElementById('upgrade-button')?.click();
                    }}>
                      <CreditCardIcon className="h-4 w-4 mr-1" />
                      Upgrade Now
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Billing History</CardTitle>
            <CardDescription>
              Your recent billing history and invoice records.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {organization.plan === SubscriptionPlan.FREE_TRIAL ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>You don't have any billing history yet.</p>
                <p className="mt-1">Billing history will appear here after you upgrade to a paid plan.</p>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <p>No recent billing transactions found.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}