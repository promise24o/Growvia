import { Link, useLocation } from "wouter";
import {
  BarChart3,
  HelpCircle,
  LayoutDashboard,
  LogOut,
  Plus,
  Settings,
  ShoppingCart,
  Store,
  Users,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export function Sidebar() {
  const [location] = useLocation();

  // Main menu items for the sidebar
  const mainMenuItems = [
    {
      name: "Dashboard",
      href: "/dashboard",
      icon: <LayoutDashboard className="w-4 h-4" />,
    },
    {
      name: "Analytics",
      href: "/analytics",
      icon: <BarChart3 className="w-4 h-4" />,
    },
    {
      name: "Apps",
      href: "/apps",
      icon: <Store className="w-4 h-4" />,
    },
    {
      name: "Marketers",
      href: "/marketers",
      icon: <Users className="w-4 h-4" />,
    },
    {
      name: "Commissions",
      href: "/commissions",
      icon: <ShoppingCart className="w-4 h-4" />,
    },
    {
      name: "Settings",
      href: "/settings",
      icon: <Settings className="w-4 h-4" />,
    },
  ];

  return (
    <aside className="hidden md:flex flex-col h-screen fixed w-64 p-4 bg-background/90 backdrop-blur-sm border-r">
      {/* Logo */}
      <div className="flex items-center gap-2 px-2 py-4">
        <div className="h-7 w-7 rounded-full bg-primary flex items-center justify-center text-white">
          <span className="font-bold text-sm">G</span>
        </div>
        <h1 className="font-bold text-lg tracking-tight">Growvia</h1>
      </div>

      {/* Add new app button */}
      <Button className="mt-4 mb-6" size="sm">
        <Plus className="h-4 w-4 mr-2" /> Add New App
      </Button>

      {/* Main navigation */}
      <nav className="space-y-1">
        {mainMenuItems.map((item) => {
          const isActive = location === item.href;
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`sidebar-item ${isActive ? "active" : ""}`}
            >
              {item.icon}
              <span>{item.name}</span>
              {item.name === "Apps" && (
                <Badge className="ml-auto" variant="outline">
                  3
                </Badge>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto space-y-1">
        <Link href="/help" className="sidebar-item">
          <HelpCircle className="w-4 h-4" />
          <span>Help & Support</span>
        </Link>
        <Link href="/api/logout" className="sidebar-item text-destructive hover:text-destructive">
          <LogOut className="w-4 h-4" />
          <span>Log Out</span>
        </Link>
      </div>
    </aside>
  );
}