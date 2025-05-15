import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { ArrowDownIcon, ArrowUpIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  iconColor?: "primary" | "success" | "warning" | "error";
  change?: number;
  changeLabel?: string;
}

export function StatCard({
  title,
  value,
  icon,
  iconColor = "primary",
  change,
  changeLabel = "from last month",
}: StatCardProps) {
  const bgColors = {
    primary: "bg-primary-50 dark:bg-primary/20 text-primary-600 dark:text-primary",
    success: "bg-success-50 dark:bg-emerald-500/20 text-success-500 dark:text-emerald-400",
    warning: "bg-warning-50 dark:bg-amber-500/20 text-warning-500 dark:text-amber-400",
    error: "bg-error-50 dark:bg-rose-500/20 text-error-500 dark:text-rose-400",
  };

  const changeColors = change && change >= 0 
    ? "text-success-500 dark:text-emerald-400" 
    : "text-error-500 dark:text-rose-400";

  const ChangeIcon = change && change >= 0 ? ArrowUpIcon : ArrowDownIcon;
  
  return (
    <Card className="dark-card border shadow-sm">
      <CardContent className="p-6">
        <div className="flex items-center">
          <div className={cn("flex-shrink-0 p-3 rounded-lg", bgColors[iconColor])}>
            {icon}
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{title}</p>
            <h3 className="text-2xl font-semibold text-slate-800 dark:text-white mt-1">{value}</h3>
          </div>
        </div>
        {typeof change !== 'undefined' && (
          <div className="mt-4 flex items-center text-sm">
            <span className={cn("font-medium flex items-center", changeColors)}>
              <ChangeIcon className="mr-1 h-4 w-4" />
              {Math.abs(change).toFixed(1)}%
            </span>
            <span className="text-slate-500 dark:text-slate-400 ml-2">{changeLabel}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
