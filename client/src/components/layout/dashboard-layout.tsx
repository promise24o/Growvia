import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";

interface DashboardLayoutProps {
  children: React.ReactNode;
  title: string;
}

export function DashboardLayout({ children, title }: DashboardLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-slate-50 dark:bg-[#1e2130] main-content">
      <Sidebar />
      
      <main className="flex-1 md:ml-64 min-h-screen dark:bg-[#1e2130] flex flex-col relative">
        <Header title={title} />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full overflow-y-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
