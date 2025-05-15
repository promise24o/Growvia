import { useState } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { 
  CheckIcon, 
  CreditCardIcon, 
  ArrowRightIcon, 
  ChevronsUpDownIcon,
  AlertTriangleIcon
} from 'lucide-react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { SubscriptionPlan, PLAN_LIMITS, PaymentGateway } from '@shared/schema';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

interface PlanModalProps {
  trigger: React.ReactNode;
  currentPlan: string;
  trialDaysLeft: number;
}

export function PlanModal({ trigger, currentPlan, trialDaysLeft }: PlanModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);
  const [paymentGateway, setPaymentGateway] = useState<PaymentGateway>(PaymentGateway.FLUTTERWAVE);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const plans = [
    {
      id: SubscriptionPlan.STARTER,
      name: 'Starter',
      price: 29,
      features: [
        `${PLAN_LIMITS[SubscriptionPlan.STARTER].apps} app`,
        `${PLAN_LIMITS[SubscriptionPlan.STARTER].marketers} marketers`,
        'Basic analytics',
        'Email support'
      ],
      recommended: false
    },
    {
      id: SubscriptionPlan.GROWTH,
      name: 'Growth',
      price: 79,
      features: [
        `${PLAN_LIMITS[SubscriptionPlan.GROWTH].apps} apps`,
        `${PLAN_LIMITS[SubscriptionPlan.GROWTH].marketers} marketers`,
        'Advanced analytics',
        'Priority email support',
        'API access'
      ],
      recommended: true
    },
    {
      id: SubscriptionPlan.PRO,
      name: 'Pro',
      price: 199,
      features: [
        `${PLAN_LIMITS[SubscriptionPlan.PRO].apps} apps`,
        `${PLAN_LIMITS[SubscriptionPlan.PRO].marketers} marketers`,
        'Complete analytics suite',
        'Dedicated support',
        'API access',
        'White-label options'
      ],
      recommended: false
    }
  ];

  const handlePlanSelect = (planId: SubscriptionPlan) => {
    setSelectedPlan(planId);
  };

  const handlePaymentInitiate = async () => {
    if (!selectedPlan) {
      toast({
        title: 'Please select a plan',
        description: 'You need to select a subscription plan to continue.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);

    try {
      const payload = {
        planId: selectedPlan,
        gateway: paymentGateway,
        callbackUrl: `${window.location.origin}/settings/billing/success`
      };

      const response = await apiRequest('/api/payment/initialize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (response.success && response.redirectUrl) {
        // Redirect to payment gateway
        window.location.href = response.redirectUrl;
      } else {
        toast({
          title: 'Payment Initialization Failed',
          description: response.message || 'Something went wrong. Please try again.',
          variant: 'destructive',
        });
        setIsLoading(false);
      }
    } catch (error) {
      console.error('Payment error:', error);
      toast({
        title: 'Error',
        description: 'An error occurred while initializing payment. Please try again.',
        variant: 'destructive',
      });
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <div id="upgrade-button">
          {trigger}
        </div>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[900px]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Choose a Plan</DialogTitle>
          <DialogDescription>
            Select the subscription plan that best suits your needs. All plans include our core features.
          </DialogDescription>
        </DialogHeader>

        {currentPlan === SubscriptionPlan.FREE_TRIAL && trialDaysLeft > 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3 mb-5 flex items-start">
            <AlertTriangleIcon className="h-5 w-5 text-yellow-500 mr-2 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-yellow-800">
                Your trial ends in {trialDaysLeft} day{trialDaysLeft !== 1 ? 's' : ''}
              </p>
              <p className="text-xs text-yellow-700 mt-1">
                Choose a plan now to continue using all features without interruption.
              </p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {plans.map((plan) => (
            <Card 
              key={plan.id}
              className={`relative overflow-hidden ${selectedPlan === plan.id ? 'border-primary' : ''}`}
            >
              {plan.recommended && (
                <div className="absolute top-0 right-0">
                  <Badge variant="default" className="rounded-bl-md rounded-tr-md rounded-br-none rounded-tl-none px-3 py-1">
                    Recommended
                  </Badge>
                </div>
              )}
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center justify-between">
                  <span>{plan.name}</span>
                  {currentPlan === plan.id && (
                    <Badge variant="outline" className="ml-2">Current</Badge>
                  )}
                </CardTitle>
                <div className="mt-2">
                  <span className="text-3xl font-bold">${plan.price}</span>
                  <span className="text-muted-foreground">/month</span>
                </div>
              </CardHeader>
              <CardContent className="py-0">
                <ul className="space-y-2">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start">
                      <CheckIcon className="h-5 w-5 text-green-500 mr-2 shrink-0" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter className="pt-6">
                <Button 
                  className="w-full"
                  variant={selectedPlan === plan.id ? "default" : "outline"}
                  onClick={() => handlePlanSelect(plan.id as SubscriptionPlan)}
                  disabled={currentPlan === plan.id}
                >
                  {selectedPlan === plan.id ? (
                    <>Selected</>
                  ) : currentPlan === plan.id ? (
                    <>Current Plan</>
                  ) : (
                    <>Select</>
                  )}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>

        {selectedPlan && (
          <Tabs defaultValue="payment" className="w-full">
            <TabsList className="grid w-full grid-cols-1">
              <TabsTrigger value="payment">Payment Method</TabsTrigger>
            </TabsList>
            <TabsContent value="payment" className="pt-4">
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium mb-2">Select Payment Gateway</h3>
                  <Select 
                    value={paymentGateway} 
                    onValueChange={(value) => setPaymentGateway(value as PaymentGateway)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select a payment gateway" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={PaymentGateway.FLUTTERWAVE}>Flutterwave</SelectItem>
                      <SelectItem value={PaymentGateway.PAYSTACK}>Paystack</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="bg-muted p-4 rounded-md">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Selected Plan:</span>
                    <span className="font-medium">{plans.find(p => p.id === selectedPlan)?.name}</span>
                  </div>
                  <div className="flex justify-between items-center mt-2">
                    <span className="text-sm font-medium">Price:</span>
                    <span className="text-lg font-bold">
                      ${plans.find(p => p.id === selectedPlan)?.price}/month
                    </span>
                  </div>
                </div>

                <div className="flex justify-end space-x-2 pt-2">
                  <Button variant="outline" onClick={() => setIsOpen(false)}>
                    Cancel
                  </Button>
                  <Button 
                    onClick={handlePaymentInitiate}
                    disabled={isLoading || !selectedPlan}
                  >
                    {isLoading ? (
                      <>
                        <ChevronsUpDownIcon className="mr-2 h-4 w-4 animate-pulse" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <CreditCardIcon className="mr-2 h-4 w-4" />
                        Proceed to Payment
                        <ArrowRightIcon className="ml-2 h-4 w-4" />
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
}