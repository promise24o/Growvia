import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Check, CreditCard } from "lucide-react";
import { SubscriptionPlan, PLAN_NAMES } from "@/lib/types";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { usePayment, PaymentGateway } from "@/lib/payment";

interface PlanFeature {
  label: string;
  available: boolean;
}

interface Plan {
  id: SubscriptionPlan;
  name: string;
  price: string;
  popular?: boolean;
  features: PlanFeature[];
  current?: boolean;
}

interface PlanModalProps {
  open: boolean;
  onClose: () => void;
  currentPlan?: SubscriptionPlan;
}

export function PlanModal({ open, onClose, currentPlan = SubscriptionPlan.STARTER }: PlanModalProps) {
  const { toast } = useToast();
  const { processPayment } = usePayment();
  const [processing, setProcessing] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);
  const [showPaymentOptions, setShowPaymentOptions] = useState(false);

  const plans: Plan[] = [
    {
      id: SubscriptionPlan.FREE_TRIAL,
      name: PLAN_NAMES[SubscriptionPlan.FREE_TRIAL],
      price: "$0",
      current: currentPlan === SubscriptionPlan.FREE_TRIAL,
      popular: currentPlan !== SubscriptionPlan.FREE_TRIAL,
      features: [
        { label: "1 App", available: true },
        { label: "10 Marketers", available: true },
        { label: "Basic Analytics", available: true },
        { label: `7 Days Trial`, available: true },
      ],
    },
    {
      id: SubscriptionPlan.STARTER,
      name: PLAN_NAMES[SubscriptionPlan.STARTER],
      price: "$29",
      current: currentPlan === SubscriptionPlan.STARTER,
      features: [
        { label: "1 App", available: true },
        { label: "50 Marketers", available: true },
        { label: "Basic Analytics", available: true },
        { label: "Email Support", available: true },
      ],
    },
    {
      id: SubscriptionPlan.GROWTH,
      name: PLAN_NAMES[SubscriptionPlan.GROWTH],
      price: "$79",
      popular: true,
      current: currentPlan === SubscriptionPlan.GROWTH,
      features: [
        { label: "5 Apps", available: true },
        { label: "300 Marketers", available: true },
        { label: "Advanced Analytics", available: true },
        { label: "Priority Support", available: true },
      ],
    },
    {
      id: SubscriptionPlan.PRO,
      name: PLAN_NAMES[SubscriptionPlan.PRO],
      price: "$199",
      current: currentPlan === SubscriptionPlan.PRO,
      features: [
        { label: "Unlimited Apps", available: true },
        { label: "1,000 Marketers", available: true },
        { label: "Premium Analytics", available: true },
        { label: "24/7 Support", available: true },
      ],
    },
    {
      id: SubscriptionPlan.ENTERPRISE,
      name: PLAN_NAMES[SubscriptionPlan.ENTERPRISE],
      price: "Custom Pricing",
      current: currentPlan === SubscriptionPlan.ENTERPRISE,
      features: [
        { label: "Unlimited Everything", available: true },
        { label: "Dedicated Support", available: true },
        { label: "Custom Integration", available: true },
        { label: "SLA Guarantee", available: true },
      ],
    },
  ];

  const handleUpgrade = (plan: SubscriptionPlan) => {
    if (plan === currentPlan) {
      return;
    }

    // For Free Trial plan, activate immediately
    if (plan === SubscriptionPlan.FREE_TRIAL) {
      setProcessing(true);
      // Start free trial immediately
      setTimeout(() => {
        toast({
          title: "Free Trial Activated",
          description: `Your 7-day free trial has been activated. Enjoy all features!`,
        });
        setProcessing(false);
        onClose();
      }, 1000);
      return;
    }
    
    // For Enterprise plan, show contact sales message
    if (plan === SubscriptionPlan.ENTERPRISE) {
      setProcessing(true);
      // For Enterprise, redirect to contact sales
      setTimeout(() => {
        toast({
          title: "Contact request sent",
          description: `Our sales team will contact you soon about the ${PLAN_NAMES[plan]} plan.`,
        });
        setProcessing(false);
        onClose();
      }, 1000);
      return;
    }
    
    // For paid plans, show payment options
    setSelectedPlan(plan);
    setShowPaymentOptions(true);
  };
  
  // Handle payment processing with selected gateway
  const handlePayment = async (gateway: PaymentGateway) => {
    if (!selectedPlan) return;
    
    setProcessing(true);
    
    try {
      const response = await processPayment(selectedPlan, gateway);
      
      if (response.success) {
        // Payment initialization successful
        toast({
          title: "Payment initialized",
          description: "You will be redirected to complete your payment.",
        });
        // The payment process will redirect the user
      } else {
        // Payment initialization failed
        toast({
          title: "Payment failed",
          description: response.message || "Failed to initialize payment. Please try again.",
          variant: "destructive",
        });
        setProcessing(false);
      }
    } catch (error) {
      console.error("Payment error:", error);
      toast({
        title: "Payment error",
        description: "An unexpected error occurred. Please try again later.",
        variant: "destructive",
      });
      setProcessing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl">
        {!showPaymentOptions ? (
          // Plan selection view
          <>
            <DialogHeader>
              <DialogTitle className="text-xl font-semibold">Choose a Plan</DialogTitle>
            </DialogHeader>

            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mt-4">
              {plans.map((plan) => (
                <div
                  key={plan.id}
                  className={`border rounded-xl p-6 relative transition-all ${
                    plan.current
                      ? "border-primary-600"
                      : "border-slate-200 hover:border-primary-600"
                  }`}
                >
                  {plan.popular && (
                    <div className="absolute -top-3 right-4 bg-success-500 text-white px-3 py-1 text-xs font-medium rounded-full">
                      {plan.id === SubscriptionPlan.FREE_TRIAL ? "Free Trial" : "Popular"}
                    </div>
                  )}
                  
                  <h3 className="font-semibold text-lg mb-2">{plan.name}</h3>
                  <div className="flex items-baseline mb-4">
                    <span className={plan.id === SubscriptionPlan.ENTERPRISE ? "text-xl" : "text-3xl"} style={{fontWeight: 700}}>
                      {plan.price}
                    </span>
                    {plan.id !== SubscriptionPlan.ENTERPRISE && (
                      <span className="text-slate-600 ml-1">/mo</span>
                    )}
                  </div>

                  <ul className="space-y-3 mb-6">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-start">
                        <Check className="h-4 w-4 text-success-500 mt-1 mr-2" />
                        <span className="text-sm text-slate-600">{feature.label}</span>
                      </li>
                    ))}
                  </ul>

                  <Button
                    variant={plan.current ? "outline" : plan.id === SubscriptionPlan.GROWTH ? "default" : "outline"}
                    className="w-full"
                    disabled={plan.current || processing}
                    onClick={() => handleUpgrade(plan.id)}
                  >
                    {plan.current
                      ? "Current Plan"
                      : plan.id === SubscriptionPlan.FREE_TRIAL
                      ? "Start Free Trial"
                      : plan.id === SubscriptionPlan.ENTERPRISE
                      ? "Contact Sales"
                      : "Upgrade Plan"}
                  </Button>
                </div>
              ))}
            </div>

            <DialogFooter className="flex flex-col sm:flex-row items-center justify-between border-t border-slate-200 pt-4 mt-4 bg-slate-50 -mx-6 -mb-6 px-6 py-4 rounded-b-xl">
              <p className="text-sm text-slate-600 mb-4 sm:mb-0">
                Need a custom plan?{" "}
                <a href="#" className="text-primary-600 font-medium">
                  Contact our sales team
                </a>
              </p>
              <Button variant="outline" onClick={onClose}>
                Close
              </Button>
            </DialogFooter>
          </>
        ) : (
          // Payment method selection view
          <>
            <DialogHeader>
              <DialogTitle className="text-xl font-semibold">Select Payment Method</DialogTitle>
            </DialogHeader>
            
            <div className="mt-4">
              <p className="text-sm text-slate-600 mb-6">
                You're upgrading to the <span className="font-semibold">{selectedPlan && PLAN_NAMES[selectedPlan]}</span> plan 
                at <span className="font-semibold">${selectedPlan && PLAN_LIMITS[selectedPlan].price}/month</span>. 
                Please select your preferred payment method to continue.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Flutterwave Option */}
                <div className="border rounded-xl p-6 hover:border-primary-600 cursor-pointer transition-all" 
                     onClick={() => !processing && handlePayment(PaymentGateway.FLUTTERWAVE)}>
                  <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center">
                      <div className="bg-orange-100 p-2 rounded-md mr-3">
                        <CreditCard className="h-6 w-6 text-orange-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold">Flutterwave</h3>
                        <p className="text-sm text-slate-600">Pay with card, bank or mobile money</p>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Paystack Option */}
                <div className="border rounded-xl p-6 hover:border-primary-600 cursor-pointer transition-all"
                     onClick={() => !processing && handlePayment(PaymentGateway.PAYSTACK)}>
                  <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center">
                      <div className="bg-green-100 p-2 rounded-md mr-3">
                        <CreditCard className="h-6 w-6 text-green-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold">Paystack</h3>
                        <p className="text-sm text-slate-600">Pay with card or bank transfer</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <DialogFooter className="flex items-center justify-between border-t border-slate-200 pt-4 mt-6 bg-slate-50 -mx-6 -mb-6 px-6 py-4 rounded-b-xl">
              <Button 
                variant="outline" 
                onClick={() => {
                  setShowPaymentOptions(false);
                  setSelectedPlan(null);
                }}
                disabled={processing}
              >
                Back to Plans
              </Button>
              
              <div className="flex items-center">
                {processing && <p className="text-sm text-slate-600 mr-4">Processing...</p>}
                <Button variant="outline" onClick={onClose} disabled={processing}>
                  Cancel
                </Button>
              </div>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
