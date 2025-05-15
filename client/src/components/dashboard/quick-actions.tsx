import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UserPlus, Store, LineChart } from "lucide-react";
import { useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { PLAN_LIMITS, SubscriptionPlan } from "@/lib/types";
import { PlanModal } from "@/components/subscription/plan-modal";

interface QuickActionProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  buttonText: string;
  buttonVariant?: "primary" | "outline";
  onClick: () => void;
  iconColor?: "primary" | "warning" | "success";
}

function QuickAction({
  icon,
  title,
  description,
  buttonText,
  buttonVariant = "outline",
  onClick,
  iconColor = "primary"
}: QuickActionProps) {
  const bgColors = {
    primary: "bg-primary-50 text-primary-600",
    warning: "bg-warning-50 text-warning-500",
    success: "bg-success-50 text-success-500",
  };

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center mb-4">
          <div className={`p-3 rounded-lg ${bgColors[iconColor]}`}>
            {icon}
          </div>
          <h3 className="ml-3 text-lg font-semibold text-slate-800">{title}</h3>
        </div>
        <p className="text-slate-600 text-sm mb-4">{description}</p>
        <Button
          variant={buttonVariant === "primary" ? "default" : "outline"}
          className="w-full"
          onClick={onClick}
        >
          {buttonText}
        </Button>
      </CardContent>
    </Card>
  );
}

export function QuickActions() {
  const [, navigate] = useLocation();
  const { organization } = useAuth();
  const [planModalOpen, setPlanModalOpen] = useState(false);

  // Check plan limits
  const checkPlanLimits = (resourceType: 'apps' | 'marketers') => {
    if (!organization) return true;
    
    const plan = organization.plan as SubscriptionPlan;
    const currentPlanLimits = PLAN_LIMITS[plan];
    
    // For simplicity, we're assuming the current counts are within limits
    // In a real application, you would fetch the current counts and compare
    return true;
  };

  const handleInviteMarketers = () => {
    if (checkPlanLimits('marketers')) {
      navigate('/marketers');
    } else {
      setPlanModalOpen(true);
    }
  };

  const handleAddApp = () => {
    if (checkPlanLimits('apps')) {
      navigate('/apps');
    } else {
      setPlanModalOpen(true);
    }
  };

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <QuickAction
          icon={<UserPlus className="h-5 w-5" />}
          title="Invite Marketers"
          description="Grow your affiliate network by inviting new marketers to join your program."
          buttonText="Invite Now"
          buttonVariant="primary"
          onClick={handleInviteMarketers}
          iconColor="primary"
        />
        
        <QuickAction
          icon={<Store className="h-5 w-5" />}
          title="Add New App"
          description="Add another product or app to your affiliate program to expand your reach."
          buttonText="Add App"
          onClick={handleAddApp}
          iconColor="warning"
        />
        
        <QuickAction
          icon={<LineChart className="h-5 w-5" />}
          title="View Analytics"
          description="Get detailed insights into your affiliate program's performance and trends."
          buttonText="View Reports"
          onClick={() => navigate('/analytics')}
          iconColor="success"
        />
      </div>

      <PlanModal
        open={planModalOpen}
        onClose={() => setPlanModalOpen(false)}
        currentPlan={organization?.plan as SubscriptionPlan}
      />
    </>
  );
}
