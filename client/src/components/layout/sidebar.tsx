import { useState } from "react";
import { Link as RouterLink, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth";
import { PLAN_LIMITS, PLAN_NAMES, SubscriptionPlan, Organization } from "@/lib/types";
import { 
  LayoutDashboard, 
  Store, 
  Users, 
  LineChart, 
  DollarSign, 
  Settings, 
  Menu, 
  X, 
  LogOut,
  BarChart3
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
    <RouterLink href={href}>
      <div className={cn(
        "flex items-center px-4 py-3 rounded-lg transition-colors cursor-pointer",
        active 
          ? "text-primary bg-primary/10 dark:bg-primary/20" 
          : "text-foreground/80 hover:bg-accent/10"
      )}>
        {icon}
        <span className="ml-3 font-medium">{label}</span>
      </div>
    </RouterLink>
  );
}

interface SidebarProps {
  mobileMenuOpen?: boolean;
  toggleMobileMenu?: () => void;
}

export function Sidebar({ mobileMenuOpen, toggleMobileMenu }: SidebarProps) {
  const [location] = useLocation();
  const { user, organization, logout } = useAuth();
  const [planModalOpen, setPlanModalOpen] = useState(false);
  
  // Use internal state if no props are provided (for backwards compatibility)
  const [internalMobileMenuOpen, setInternalMobileMenuOpen] = useState(false);
  
  const isMenuOpen = mobileMenuOpen !== undefined ? mobileMenuOpen : internalMobileMenuOpen;
  
  // Handle mobile menu toggle if not provided from props
  const handleToggleMobileMenu = () => {
    if (toggleMobileMenu) {
      toggleMobileMenu();
    } else {
      setInternalMobileMenuOpen(!internalMobileMenuOpen);
    }
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
        "w-full md:w-64 bg-white dark:bg-[#25293c] shadow-md md:flex md:flex-col md:fixed md:inset-y-0 z-30 transition-all",
        isMenuOpen ? "fixed inset-0 top-16 bottom-0" : "hidden md:flex"
      )}>
        <div className="p-4 border-b dark:border-slate-700/30">
          <div className="flex items-center justify-between">
            <RouterLink href="/dashboard">
              <div className="flex items-center cursor-pointer">
                <div className="bg-primary text-white p-2 rounded">
                  <BarChart3 className="h-5 w-5" />
                </div>
                <h1 className="ml-3 text-xl font-semibold text-slate-800 dark:text-white font-heading">Growvia</h1>
              </div>
            </RouterLink>
            <button 
              className="md:hidden text-slate-500 hover:text-slate-700 dark:text-slate-300 dark:hover:text-white"
              onClick={handleToggleMobileMenu}
            >
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
        
        <div className={cn(
          "flex flex-col h-full justify-between overflow-y-auto",
          isMenuOpen ? "block" : "hidden md:flex"
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
              <div className="bg-primary-50 dark:bg-[#2a3042] rounded-lg p-4">
                <p className="text-sm text-slate-700 dark:text-white font-medium">{planDetails.name} Plan</p>
                <div className="mt-2 flex items-center text-xs text-slate-500 dark:text-slate-300">
                  <span>{planDetails.limits.apps === 999999 ? "Unlimited" : planDetails.limits.apps} Apps</span>
                  <span className="mx-2 text-slate-300 dark:text-slate-500">|</span>
                  <span>{planDetails.limits.marketers === 999999 ? "Unlimited" : planDetails.limits.marketers} Marketers</span>
                </div>
                <div className="mt-3">
                  <Button 
                    variant="link" 
                    className="p-0 h-auto text-primary text-sm font-medium hover:text-primary/90"
                    onClick={() => setPlanModalOpen(true)}
                  >
                    Upgrade Plan →
                  </Button>
                </div>
              </div>
            )}
            
            {/* User profile section before the sticky theme toggle */}
            {user && (
              <div className="mt-4 flex items-center p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800/40">
                <AvatarWithStatus user={user} />
                <button 
                  className="ml-auto text-slate-400 hover:text-slate-500 dark:text-slate-400 dark:hover:text-slate-300"
                  onClick={logout}
                >
                  <LogOut className="h-5 w-5" />
                </button>
              </div>
            )}
            
            {/* Sticky theme toggle at the bottom */}
            <div className="mt-4 flex items-center justify-between p-2 sticky bottom-0 bg-white dark:bg-[#25293c] z-10 border-t dark:border-slate-700/30">
              <div className="text-sm font-medium text-slate-500 dark:text-slate-300">Appearance</div>
              <ThemeToggle />
            </div>
          </div>
        </div>
      </aside>

      {/* Backdrop for mobile menu - now moved to dashboard layout */}

      {/* Plan Modal */}
      <PlanModal 
        trigger={
          <Button 
            variant="link" 
            className="hidden"
            onClick={() => setPlanModalOpen(true)}
          >
            Upgrade Plan
          </Button>
        }
        currentPlan={organization?.plan || "free_trial"}
        trialDaysLeft={7}
      />
    </>
  );
}
