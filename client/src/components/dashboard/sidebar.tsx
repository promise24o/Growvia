import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import {
  BarChart4,
  GanttChart,
  Home,
  Settings,
  Users,
  CreditCard,
  Layout,
  LogOut,
} from "lucide-react";

export function Sidebar() {
  const [location] = useLocation();

  const isActive = (path: string) => {
    return location === path || location.startsWith(`${path}/`);
  };

  return (
    <div className="fixed inset-y-0 left-0 z-20 hidden w-64 border-r bg-background/95 backdrop-blur-sm md:block">
      <div className="flex h-full flex-col">
        <div className="border-b p-6">
          <Link href="/" className="flex items-center gap-2 font-semibold">
            <div className="h-8 w-8 rounded-md bg-primary flex items-center justify-center text-white">
              G
            </div>
            <span className="text-xl font-bold">Growvia</span>
          </Link>
        </div>
        <nav className="flex-1 overflow-auto py-6">
          <div className="px-3">
            <h3 className="mb-2 px-4 text-xs font-medium text-muted-foreground">
              Menu
            </h3>
            <div className="space-y-1">
              <NavItem href="/dashboard" icon={Home} active={isActive("/dashboard")}>
                Dashboard
              </NavItem>
              <NavItem href="/analytics" icon={BarChart4} active={isActive("/analytics")}>
                Analytics
              </NavItem>
              <NavItem href="/apps" icon={Layout} active={isActive("/apps")}>
                Apps
              </NavItem>
              <NavItem href="/marketers" icon={Users} active={isActive("/marketers")}>
                Marketers
              </NavItem>
              <NavItem href="/commissions" icon={CreditCard} active={isActive("/commissions")}>
                Commissions
              </NavItem>
              <NavItem href="/activities" icon={GanttChart} active={isActive("/activities")}>
                Activities
              </NavItem>
            </div>
          </div>
          <div className="mt-auto px-3">
            <h3 className="mb-2 px-4 text-xs font-medium text-muted-foreground">
              Settings
            </h3>
            <div className="space-y-1">
              <NavItem href="/settings" icon={Settings} active={isActive("/settings")}>
                Settings
              </NavItem>
              <a
                href="/api/logout"
                className={cn(
                  "flex items-center gap-3 rounded-md px-4 py-2 text-sm text-muted-foreground",
                  "hover:bg-accent hover:text-accent-foreground"
                )}
              >
                <LogOut className="h-4 w-4" />
                <span>Logout</span>
              </a>
            </div>
          </div>
        </nav>
      </div>
    </div>
  );
}

interface NavItemProps {
  href: string;
  icon: React.ElementType;
  active?: boolean;
  children: React.ReactNode;
}

function NavItem({ href, icon: Icon, active, children }: NavItemProps) {
  return (
    <Link href={href}>
      <a
        className={cn(
          "flex items-center gap-3 rounded-md px-4 py-2 text-sm",
          active
            ? "bg-accent font-medium text-accent-foreground"
            : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
        )}
      >
        <Icon className="h-4 w-4" />
        <span>{children}</span>
      </a>
    </Link>
  );
}