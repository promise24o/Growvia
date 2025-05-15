import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import { SubscriptionPlan, PLAN_NAMES } from "@/lib/types";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

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
  const [processing, setProcessing] = useState(false);

  const plans: Plan[] = [
    {
      id: SubscriptionPlan.STARTER,
      name: PLAN_NAMES[SubscriptionPlan.STARTER],
      price: "$29",
      current: currentPlan === SubscriptionPlan.STARTER,
      features: [
        { label: "1 App", available: true },
        { label: "10 Marketers", available: true },
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
        { label: "50 Marketers", available: true },
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
        { label: "200 Marketers", available: true },
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

    setProcessing(true);
    
    // In a real implementation, this would call an API to upgrade the plan
    setTimeout(() => {
      toast({
        title: "Plan upgrade initiated",
        description: `You will be redirected to complete payment for the ${PLAN_NAMES[plan]} plan.`,
      });
      setProcessing(false);
      onClose();
    }, 1000);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">Choose a Plan</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-4">
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
                  Popular
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
      </DialogContent>
    </Dialog>
  );
}
