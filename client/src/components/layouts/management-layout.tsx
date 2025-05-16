import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/lib/auth";
import {
  LayoutDashboard,
  Users,
  Building2,
  LogOut,
  Menu,
  X,
  Settings,
  BarChart3
} from "lucide-react";

const sidebarItems = [
  {
    title: "Dashboard",
    href: "/management/dashboard",
    icon: <LayoutDashboard className="h-5 w-5" />,
  },
  {
    title: "Users",
    href: "/management/users",
    icon: <Users className="h-5 w-5" />,
  },
  {
    title: "Organizations",
    href: "/management/organizations",
    icon: <Building2 className="h-5 w-5" />,
  },
  {
    title: "Analytics",
    href: "/analytics",
    icon: <BarChart3 className="h-5 w-5" />,
  },
  {
    title: "Settings",
    href: "/settings",
    icon: <Settings className="h-5 w-5" />,
  },
];

export default function ManagementLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, logout } = useAuth();
  const [location] = useLocation();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Get initials for avatar
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar for desktop */}
      <aside className="fixed inset-y-0 left-0 hidden w-64 border-r bg-muted/10 lg:block">
        <div className="flex h-full flex-col justify-between">
          <div className="flex flex-col">
            <div className="flex h-14 items-center border-b px-4">
              <Link href="/" className="flex items-center gap-2">
                <span className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-500 bg-clip-text text-transparent">
                  Growvia
                </span>
                <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-md">Admin</span>
              </Link>
            </div>
            <nav className="flex-1 overflow-y-auto p-2">
              <ul className="space-y-1">
                {sidebarItems.map((item) => (
                  <li key={item.href}>
                    <Link href={item.href}>
                      <a
                        className={`flex items-center gap-3 rounded-md px-3 py-2 transition-colors hover:bg-accent hover:text-accent-foreground ${
                          location === item.href
                            ? "bg-secondary/50 text-secondary-foreground"
                            : "text-muted-foreground"
                        }`}
                      >
                        {item.icon}
                        <span>{item.title}</span>
                      </a>
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          </div>
          <div className="border-t p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Avatar>
                  <AvatarImage src={user?.avatar || undefined} />
                  <AvatarFallback>
                    {user?.name ? getInitials(user.name) : "AD"}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-medium">{user?.name || "Admin"}</p>
                  <p className="text-xs text-muted-foreground">
                    {user?.email || "admin@admin.com"}
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                size="icon"
                onClick={() => logout()}
                title="Logout"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile sidebar */}
      <div className="lg:hidden">
        <Button
          variant="ghost"
          size="icon"
          className="fixed left-4 top-4 z-50"
          onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
        >
          {mobileSidebarOpen ? (
            <X className="h-6 w-6" />
          ) : (
            <Menu className="h-6 w-6" />
          )}
        </Button>

        {mobileSidebarOpen && (
          <div className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm lg:hidden" />
        )}

        <aside
          className={`fixed inset-y-0 left-0 z-40 w-64 transform border-r bg-background transition-transform duration-300 ease-in-out ${
            mobileSidebarOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <div className="flex h-full flex-col justify-between">
            <div className="flex flex-col">
              <div className="flex h-14 items-center border-b px-4">
                <Link href="/" className="flex items-center gap-2">
                  <span className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-500 bg-clip-text text-transparent">
                    Growvia
                  </span>
                  <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-md">Admin</span>
                </Link>
              </div>
              <nav className="flex-1 overflow-y-auto p-2">
                <ul className="space-y-1">
                  {sidebarItems.map((item) => (
                    <li key={item.href}>
                      <Link href={item.href}>
                        <a
                          className={`flex items-center gap-3 rounded-md px-3 py-2 transition-colors hover:bg-accent hover:text-accent-foreground ${
                            location === item.href
                              ? "bg-secondary/50 text-secondary-foreground"
                              : "text-muted-foreground"
                          }`}
                          onClick={() => setMobileSidebarOpen(false)}
                        >
                          {item.icon}
                          <span>{item.title}</span>
                        </a>
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>
            </div>
            <div className="border-t p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarImage src={user?.avatar || undefined} />
                    <AvatarFallback>
                      {user?.name ? getInitials(user.name) : "AD"}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium">{user?.name || "Admin"}</p>
                    <p className="text-xs text-muted-foreground">
                      {user?.email || "admin@admin.com"}
                    </p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => logout()}
                  title="Logout"
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </aside>
      </div>

      {/* Main content */}
      <main className="flex-1 lg:ml-64">
        <div className="container py-6 lg:py-10">{children}</div>
      </main>
    </div>
  );
}