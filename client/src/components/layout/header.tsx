import { Bell, HelpCircle, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";

interface HeaderProps {
  title: string;
  toggleMobileMenu?: () => void;
}

export function Header({ title, toggleMobileMenu }: HeaderProps) {
  return (
    <header className="bg-white dark:bg-[#1a2035] shadow-sm dark:shadow-none border-b dark:border-slate-800 sticky top-0 z-20 w-full left-0 right-0">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            {toggleMobileMenu && (
              <Button 
                variant="ghost" 
                size="icon" 
                className="mr-3 md:hidden rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 dark:hover:text-white"
                onClick={toggleMobileMenu}
              >
                <Menu className="h-5 w-5" />
              </Button>
            )}
            <h2 className="text-xl font-semibold text-slate-800 dark:text-white font-heading">{title}</h2>
          </div>
          
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="icon" className="rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 dark:hover:text-white">
              <Bell className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" className="rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 dark:hover:text-white">
              <HelpCircle className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
