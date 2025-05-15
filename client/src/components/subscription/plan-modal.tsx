import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { SubscriptionPlan, PLAN_LIMITS } from '@shared/schema';
import { PaymentGateway, usePayment } from '@/lib/payment';
import { CheckIcon, InfoIcon } from 'lucide-react';

interface PlanCardProps {
  title: string;
  price: number;
  description: string;
  features: string[];
  recommended?: boolean;
  planId: SubscriptionPlan;
  currentPlan: string;
  onSelect: (planId: SubscriptionPlan) => void;
  disabled?: boolean;
}

const PlanCard = ({
  title,
  price,
  description,
  features,
  recommended,
  planId,
  currentPlan,
  onSelect,
  disabled
}: PlanCardProps) => {
  const isCurrentPlan = currentPlan === planId;
  
  return (
    <Card 
      className={`relative h-full flex flex-col ${recommended ? 'border-2 border-primary shadow-lg' : ''}`}
    >
      {recommended && (
        <div className="absolute -top-3 left-0 right-0 flex justify-center">
          <span className="bg-primary text-primary-foreground text-xs font-medium px-3 py-1 rounded-full">
            RECOMMENDED
          </span>
        </div>
      )}
      <CardHeader>
        <CardTitle className="text-xl">{title}</CardTitle>
        <div className="flex items-baseline mt-2">
          <span className="text-3xl font-bold">${price}</span>
          {price > 0 && <span className="text-sm text-muted-foreground ml-1">/month</span>}
        </div>
        <CardDescription className="mt-2">{description}</CardDescription>
      </CardHeader>
      <CardContent className="flex-grow">
        <ul className="space-y-2">
          {features.map((feature, index) => (
            <li key={index} className="flex items-start">
              <CheckIcon className="h-5 w-5 text-green-500 shrink-0 mr-2" />
              <span className="text-sm">{feature}</span>
            </li>
          ))}
        </ul>
      </CardContent>
      <CardFooter>
        <Button 
          className="w-full" 
          variant={isCurrentPlan ? "outline" : (recommended ? "default" : "secondary")}
          onClick={() => onSelect(planId)}
          disabled={disabled || isCurrentPlan}
        >
          {isCurrentPlan ? 'Current Plan' : 'Select Plan'}
        </Button>
      </CardFooter>
    </Card>
  );
};

interface PlanModalProps {
  trigger?: React.ReactNode;
  currentPlan: string;
  trialDaysLeft?: number;
  onUpgradeSuccess?: () => void;
}

export function PlanModal({ 
  trigger, 
  currentPlan, 
  trialDaysLeft = 0,
  onUpgradeSuccess 
}: PlanModalProps) {
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);
  const [selectedGateway, setSelectedGateway] = useState<PaymentGateway>(PaymentGateway.PAYSTACK);
  const [step, setStep] = useState(1);
  const [open, setOpen] = useState(false);
  
  const { toast } = useToast();
  const { processPayment } = usePayment();
  const queryClient = useQueryClient();
  
  const handlePlanSelect = (planId: SubscriptionPlan) => {
    setSelectedPlan(planId);
    setStep(2);
  };
  
  const handlePaymentGatewaySelect = (gateway: PaymentGateway) => {
    setSelectedGateway(gateway);
  };
  
  const handlePayment = async () => {
    if (!selectedPlan) {
      toast({
        title: 'No Plan Selected',
        description: 'Please select a subscription plan.',
        variant: 'destructive',
      });
      return;
    }
    
    await processPayment(selectedPlan, selectedGateway);
    // Modal will close when redirected to payment gateway
    setOpen(false);
  };
  
  const resetModal = () => {
    setSelectedPlan(null);
    setStep(1);
  };
  
  const handleClose = () => {
    setOpen(false);
    setTimeout(resetModal, 300);
  };

  // Generate plan content based on the PLAN_LIMITS
  const trialFeatures = [
    `${PLAN_LIMITS[SubscriptionPlan.FREE_TRIAL].apps} app`,
    `${PLAN_LIMITS[SubscriptionPlan.FREE_TRIAL].marketers} marketers`,
    `${PLAN_LIMITS[SubscriptionPlan.FREE_TRIAL].durationDays} days free trial`,
    'Basic analytics',
    'Standard support'
  ];
  
  const starterFeatures = [
    `${PLAN_LIMITS[SubscriptionPlan.STARTER].apps} app`,
    `${PLAN_LIMITS[SubscriptionPlan.STARTER].marketers} marketers`,
    'Basic analytics',
    'Email support',
    'Webhook integrations'
  ];
  
  const growthFeatures = [
    `${PLAN_LIMITS[SubscriptionPlan.GROWTH].apps} apps`,
    `${PLAN_LIMITS[SubscriptionPlan.GROWTH].marketers} marketers`,
    'Advanced analytics',
    'Priority support',
    'Custom commission structure',
    'API access',
    'Downloadable reports'
  ];
  
  const proFeatures = [
    `${PLAN_LIMITS[SubscriptionPlan.PRO].apps} apps`,
    `${PLAN_LIMITS[SubscriptionPlan.PRO].marketers} marketers`,
    'Full analytics suite',
    'Dedicated support',
    'Custom branding',
    'Advanced API access',
    'Bulk operations',
    'Fraud detection'
  ];
  
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || <Button>Upgrade Plan</Button>}
      </DialogTrigger>
      <DialogContent className="sm:max-w-4xl" onInteractOutside={(e) => e.preventDefault()}>
        {step === 1 && (
          <>
            <DialogHeader>
              <DialogTitle className="text-2xl">Choose a Subscription Plan</DialogTitle>
              <DialogDescription>
                {currentPlan === SubscriptionPlan.FREE_TRIAL && trialDaysLeft > 0 ? (
                  <div className="flex items-center bg-yellow-50 border border-yellow-100 p-2 rounded my-2">
                    <InfoIcon className="h-5 w-5 text-yellow-500 mr-2" />
                    <span>You have <strong>{trialDaysLeft} days</strong> left in your free trial.</span>
                  </div>
                ) : null}
                Select the plan that best suits your needs. You can upgrade or downgrade at any time.
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 my-4">
              <PlanCard
                title="Free Trial"
                price={0}
                description="Perfect for getting started and testing the platform."
                features={trialFeatures}
                planId={SubscriptionPlan.FREE_TRIAL}
                currentPlan={currentPlan}
                onSelect={handlePlanSelect}
                disabled={currentPlan !== SubscriptionPlan.FREE_TRIAL || trialDaysLeft === 0}
              />
              
              <PlanCard
                title="Starter"
                price={29}
                description="Great for small businesses just starting with affiliate marketing."
                features={starterFeatures}
                planId={SubscriptionPlan.STARTER}
                currentPlan={currentPlan}
                onSelect={handlePlanSelect}
              />
              
              <PlanCard
                title="Growth"
                price={79}
                description="For growing businesses with multiple products."
                features={growthFeatures}
                recommended={true}
                planId={SubscriptionPlan.GROWTH}
                currentPlan={currentPlan}
                onSelect={handlePlanSelect}
              />
              
              <PlanCard
                title="Pro"
                price={199}
                description="Enterprise-level solution for large businesses."
                features={proFeatures}
                planId={SubscriptionPlan.PRO}
                currentPlan={currentPlan}
                onSelect={handlePlanSelect}
              />
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={handleClose}>Cancel</Button>
            </DialogFooter>
          </>
        )}
        
        {step === 2 && selectedPlan && (
          <>
            <DialogHeader>
              <DialogTitle className="text-2xl">Select Payment Method</DialogTitle>
              <DialogDescription>
                Choose your preferred payment gateway to complete the subscription.
              </DialogDescription>
            </DialogHeader>
            
            <div className="py-4">
              <RadioGroup 
                defaultValue={selectedGateway} 
                onValueChange={(value) => handlePaymentGatewaySelect(value as PaymentGateway)}
                className="space-y-4"
              >
                <div className="flex items-center space-x-2 border p-4 rounded-md">
                  <RadioGroupItem value={PaymentGateway.PAYSTACK} id="paystack" />
                  <Label htmlFor="paystack" className="flex-grow cursor-pointer">
                    <div className="font-medium">Paystack</div>
                    <div className="text-sm text-muted-foreground">Pay with card, bank account, or mobile money</div>
                  </Label>
                </div>
                
                <div className="flex items-center space-x-2 border p-4 rounded-md">
                  <RadioGroupItem value={PaymentGateway.FLUTTERWAVE} id="flutterwave" />
                  <Label htmlFor="flutterwave" className="flex-grow cursor-pointer">
                    <div className="font-medium">Flutterwave</div>
                    <div className="text-sm text-muted-foreground">Pay with card, bank transfer, or mobile money</div>
                  </Label>
                </div>
              </RadioGroup>
            </div>
            
            <DialogFooter className="flex flex-col sm:flex-row gap-2 sm:justify-between">
              <Button variant="outline" onClick={() => setStep(1)}>Back to Plans</Button>
              <Button onClick={handlePayment}>Continue to Payment</Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}