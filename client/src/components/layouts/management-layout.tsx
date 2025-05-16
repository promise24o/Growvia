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
      href: "/management",
      active: location === "/management",
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
    <div className="flex min-h-screen bg-gray-100 dark:bg-gray-900">
      {/* Mobile sidebar toggle */}
      <div className="fixed top-4 left-4 z-50 md:hidden">
        <button
          onClick={toggleSidebar}
          className="p-2 rounded-md bg-primary text-white"
        >
          {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Sidebar */}
      <aside
        className={`${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        } fixed top-0 left-0 z-40 w-64 h-full transition-transform duration-300 ease-in-out md:translate-x-0 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700`}
      >
        <div className="h-full px-3 py-4 overflow-y-auto">
          <div className="flex items-center mb-5 p-2">
            <h2 className="text-xl font-semibold bg-gradient-to-r from-purple-600 to-blue-500 bg-clip-text text-transparent">
              Growvia Admin
            </h2>
          </div>
          <ul className="space-y-2 font-medium">
            {sidebarItems.map((item, index) => (
              <li key={index}>
                <Link href={item.href}>
                  <a
                    className={`flex items-center p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200 ${
                      item.active
                        ? "bg-gray-100 dark:bg-gray-700 text-primary"
                        : "text-gray-700 dark:text-gray-300"
                    }`}
                  >
                    {item.icon}
                    <span>{item.title}</span>
                  </a>
                </Link>
              </li>
            ))}
            <li>
              <button
                onClick={() => logout()}
                className="flex w-full items-center p-2 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
              >
                <LogOut className="mr-2 h-5 w-5" />
                <span>Logout</span>
              </button>
            </li>
          </ul>
        </div>
      </aside>

      {/* Main Content */}
      <div className={`flex-1 ${isSidebarOpen ? "md:ml-64" : ""} transition-all duration-300 ease-in-out`}>
        <header className="sticky top-0 z-30 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3">
          <div className="flex justify-between items-center">
            <h1 className="text-xl font-semibold">Platform Management</h1>
            <div className="flex items-center space-x-4">
              <div className="hidden md:flex items-center gap-2">
                <div className="text-sm text-right">
                  <div className="font-medium">System Administrator</div>
                  <div className="text-gray-500 dark:text-gray-400 text-xs">
                    admin@admin.com
                  </div>
                </div>
                <div className="h-10 w-10 rounded-full bg-primary text-white grid place-items-center">
                  <span className="text-sm font-medium">SA</span>
                </div>
              </div>
            </div>
          </div>
        </header>
        <main className="p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}