import { Button } from "@/components/ui/button";
import { Bell, HelpCircle, Menu } from "lucide-react";

interface HeaderProps {
  title: string;
  toggleMobileMenu?: () => void;
}

export function Header({ title, toggleMobileMenu }: HeaderProps) {
  return (
    <header className="backdrop-blur-md bg-white/60 dark:bg-[#1a2035]/60 shadow-[0_8px_16px_rgba(0,0,0,0.1)] dark:shadow-[0_8px_16px_rgba(0,0,0,0.3)] border border-slate-200/50 dark:border-slate-700/50 sticky top-0 z-20 w-full left-0 right-0 rounded-b-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            {toggleMobileMenu && (
              <Button
                variant="ghost"
                size="icon"
                className="mr-3 md:hidden rounded-xl text-slate-600 dark:text-slate-300 hover:bg-white/20 dark:hover:bg-slate-800/40 shadow-inner"
                onClick={toggleMobileMenu}
              >
                <Menu className="h-5 w-5" />
              </Button>
            )}
            <h2 className="text-xl font-semibold text-slate-800 dark:text-white font-heading">
              {title}
            </h2>
          </div>

          <div className="flex items-center space-x-3">
            <Button
              variant="ghost"
              size="icon"
              className="rounded-xl text-slate-600 dark:text-slate-300 hover:bg-white/20 dark:hover:bg-slate-800/40 shadow-inner"
            >
              <Bell className="h-5 w-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="rounded-xl text-slate-600 dark:text-slate-300 hover:bg-white/20 dark:hover:bg-slate-800/40 shadow-inner"
            >
              <HelpCircle className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
