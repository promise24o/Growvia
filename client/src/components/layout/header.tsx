import { Bell, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface HeaderProps {
  title: string;
}

export function Header({ title }: HeaderProps) {
  return (
    <header className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <h2 className="text-xl font-semibold text-slate-800 font-heading">{title}</h2>
          
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="icon" className="rounded-lg text-slate-500 hover:bg-slate-100">
              <Bell className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" className="rounded-lg text-slate-500 hover:bg-slate-100">
              <HelpCircle className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
