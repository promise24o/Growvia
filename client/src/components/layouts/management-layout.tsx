
import React, { useState } from "react";
import { Link, useLocation } from "wouter";
import {
  Users,
  BarChart3,
  Building2,
  CreditCard,
  Bell,
  Settings,
  ListTodo,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";

interface ManagementLayoutProps {
  children: React.ReactNode;
}

export default function ManagementLayout({ children }: ManagementLayoutProps) {
  const [location] = useLocation();
  const { logout } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  
  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  const sidebarItems = [
    {
      title: "Dashboard",
      icon: <BarChart3 className="mr-2 h-5 w-5" />,
      href: "/management/dashboard",
      active: location === "/management/dashboard",
    },
    {
      title: "Organizations",
      icon: <Building2 className="mr-2 h-5 w-5" />,
      href: "/management/organizations",
      active: location === "/management/organizations",
    },
    {
      title: "Users",
      icon: <Users className="mr-2 h-5 w-5" />,
      href: "/management/users",
      active: location === "/management/users",
    },
    {
      title: "Subscriptions",
      icon: <CreditCard className="mr-2 h-5 w-5" />,
      href: "/management/subscriptions",
      active: location === "/management/subscriptions",
    },
    {
      title: "Notifications",
      icon: <Bell className="mr-2 h-5 w-5" />,
      href: "/management/notifications",
      active: location === "/management/notifications",
    },
    {
      title: "Audit Logs",
      icon: <ListTodo className="mr-2 h-5 w-5" />,
      href: "/management/audit-logs",
      active: location === "/management/audit-logs",
    },
    {
      title: "Settings",
      icon: <Settings className="mr-2 h-5 w-5" />,
      href: "/management/settings",
      active: location === "/management/settings",
    },
  ];

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-slate-50 dark:bg-[#1e2130]">
      {/* Mobile sidebar toggle */}
      <div className="fixed top-4 left-4 z-50 md:hidden">
        <button
          onClick={toggleSidebar}
          className="p-2 rounded-lg bg-white dark:bg-gray-800 shadow-sm border border-gray-200 dark:border-gray-700"
        >
          {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed top-0 left-0 z-40 w-64 h-full transition-transform duration-300 ease-in-out md:translate-x-0",
          "bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700",
          "shadow-sm",
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="h-full px-3 py-4 overflow-y-auto">
          <div className="flex items-center mb-8 px-2">
            <h2 className="text-xl font-bold bg-gradient-to-r from-purple-600 to-blue-500 bg-clip-text text-transparent">
              Growvia Admin
            </h2>
          </div>
          <nav className="space-y-1.5">
            {sidebarItems.map((item, index) => (
              <Link key={index} href={item.href}>
                <a
                  className={cn(
                    "flex items-center px-3 py-2.5 rounded-lg transition-colors duration-200",
                    "hover:bg-gray-100 dark:hover:bg-gray-700",
                    "font-medium text-sm",
                    item.active
                      ? "bg-gray-100 dark:bg-gray-700 text-primary"
                      : "text-gray-700 dark:text-gray-300"
                  )}
                >
                  {item.icon}
                  <span>{item.title}</span>
                </a>
              </Link>
            ))}
            <button
              onClick={() => logout()}
              className={cn(
                "flex w-full items-center px-3 py-2.5 rounded-lg transition-colors duration-200",
                "hover:bg-gray-100 dark:hover:bg-gray-700",
                "font-medium text-sm text-gray-700 dark:text-gray-300"
              )}
            >
              <LogOut className="mr-2 h-5 w-5" />
              <span>Logout</span>
            </button>
          </nav>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 md:ml-64 min-h-screen dark:bg-[#1e2130] flex flex-col relative">
        <header className="sticky top-0 z-30 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700">
          <div className="px-4 py-3.5 mx-auto max-w-7xl flex justify-between items-center">
            <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Platform Management</h1>
            <div className="flex items-center gap-4">
              <div className="hidden md:flex items-center gap-3">
                <div className="text-sm text-right">
                  <div className="font-medium text-gray-900 dark:text-gray-100">System Administrator</div>
                  <div className="text-gray-500 dark:text-gray-400 text-xs">
                    admin@admin.com
                  </div>
                </div>
                <div className="h-9 w-9 rounded-full bg-primary text-white grid place-items-center">
                  <span className="text-sm font-medium">SA</span>
                </div>
              </div>
            </div>
          </div>
        </header>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full overflow-y-auto">
          {children}
        </div>
      </main>
      
      {/* Backdrop for mobile menu */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-10 md:hidden"
          onClick={toggleSidebar}
        />
      )}
    </div>
  );
}
