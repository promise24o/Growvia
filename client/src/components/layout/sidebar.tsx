import { useState } from "react";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth";
import { PLAN_LIMITS, PLAN_NAMES, SubscriptionPlan } from "@/lib/types";
import { 
  LayoutDashboard, 
  Store, 
  Users, 
  LineChart, 
  DollarSign, 
  Settings, 
  Menu, 
  X, 
  LogOut
} from "lucide-react";
import { AvatarWithStatus } from "@/components/ui/avatar-with-status";
import { Button } from "@/components/ui/button";
import { PlanModal } from "@/components/subscription/plan-modal";
import { ThemeToggle } from "@/components/theme/theme-toggle";

interface SidebarLinkProps {
  href: string;
  icon: React.ReactNode;
  label: string;
  active?: boolean;
}

function SidebarLink({ href, icon, label, active }: SidebarLinkProps) {
  return (
    <Link href={href}>
      <a className={cn(
        "flex items-center px-4 py-3 rounded-lg transition-colors",
        active 
          ? "text-primary-600 bg-primary-50" 
          : "text-slate-600 hover:bg-slate-100"
      )}>
        {icon}
        <span className="ml-3 font-medium">{label}</span>
      </a>
    </Link>
  );
}

export function Sidebar() {
  const [location] = useLocation();
  const { user, organization, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [planModalOpen, setPlanModalOpen] = useState(false);

  // Handle mobile menu toggle
  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  // Get plan limits
  const getPlanDetails = () => {
    if (!organization) return null;
    
    const plan = organization.plan as SubscriptionPlan;
    const limits = PLAN_LIMITS[plan];
    
    return {
      name: PLAN_NAMES[plan],
      limits
    };
  };

  const planDetails = getPlanDetails();

  return (
    <>
      <aside className={cn(
        "w-full md:w-64 bg-white shadow-md md:flex md:flex-col md:fixed md:inset-y-0 z-10 transition-all",
        mobileMenuOpen ? "fixed inset-0" : "relative"
      )}>
        <div className="p-4 border-b">
          <div className="flex items-center justify-between">
            <Link href="/dashboard">
              <a className="flex items-center">
                <div className="bg-primary-600 text-white p-2 rounded">
                  <Link className="h-5 w-5" />
                </div>
                <h1 className="ml-3 text-xl font-semibold text-slate-800 font-heading">AffiliateHub</h1>
              </a>
            </Link>
            <button 
              className="md:hidden text-slate-500 hover:text-slate-700"
              onClick={toggleMobileMenu}
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
        
        <div className={cn(
          "flex flex-col h-full justify-between overflow-y-auto",
          mobileMenuOpen ? "block" : "hidden md:flex"
        )}>
          <nav className="p-4 space-y-1">
            <SidebarLink 
              href="/dashboard" 
              icon={<LayoutDashboard className="h-5 w-5" />} 
              label="Dashboard" 
              active={location === "/dashboard"} 
            />
            <SidebarLink 
              href="/apps" 
              icon={<Store className="h-5 w-5" />} 
              label="Apps" 
              active={location === "/apps"} 
            />
            <SidebarLink 
              href="/marketers" 
              icon={<Users className="h-5 w-5" />} 
              label="Marketers" 
              active={location === "/marketers"} 
            />
            <SidebarLink 
              href="/analytics" 
              icon={<LineChart className="h-5 w-5" />} 
              label="Analytics" 
              active={location === "/analytics"} 
            />
            <SidebarLink 
              href="/commissions" 
              icon={<DollarSign className="h-5 w-5" />} 
              label="Commissions" 
              active={location === "/commissions"} 
            />
            <SidebarLink 
              href="/settings" 
              icon={<Settings className="h-5 w-5" />} 
              label="Settings" 
              active={location === "/settings"} 
            />
          </nav>

          <div className="p-4 mt-auto">
            {planDetails && (
              <div className="bg-primary-50 rounded-lg p-4">
                <p className="text-sm text-slate-700 font-medium">{planDetails.name} Plan</p>
                <div className="mt-2 flex items-center text-xs text-slate-500">
                  <span>{planDetails.limits.apps === 999999 ? "Unlimited" : planDetails.limits.apps} Apps</span>
                  <span className="mx-2 text-slate-300">|</span>
                  <span>{planDetails.limits.marketers === 999999 ? "Unlimited" : planDetails.limits.marketers} Marketers</span>
                </div>
                <div className="mt-3">
                  <Button 
                    variant="link" 
                    className="p-0 h-auto text-primary-600 text-sm font-medium hover:text-primary-700"
                    onClick={() => setPlanModalOpen(true)}
                  >
                    Upgrade Plan →
                  </Button>
                </div>
              </div>
            )}
            
            <div className="mt-4 flex items-center justify-between p-2">
              <div className="text-sm font-medium text-slate-500">Appearance</div>
              <ThemeToggle />
            </div>
            
            {user && (
              <div className="mt-4 flex items-center p-2 rounded-lg hover:bg-slate-100">
                <AvatarWithStatus user={user} />
                <button 
                  className="ml-auto text-slate-400 hover:text-slate-500"
                  onClick={logout}
                >
                  <LogOut className="h-5 w-5" />
                </button>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Backdrop for mobile menu */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-0 md:hidden"
          onClick={toggleMobileMenu}
        />
      )}

      {/* Plan Modal */}
      <PlanModal 
        open={planModalOpen} 
        onClose={() => setPlanModalOpen(false)} 
        currentPlan={organization?.plan as SubscriptionPlan}
      />
    </>
  );
}
