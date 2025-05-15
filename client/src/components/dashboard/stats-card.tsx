import { ReactNode } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatsCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon?: ReactNode;
  trend?: {
    value: number;
    positive: boolean;
  };
  className?: string;
  gradient?: boolean;
}

export function StatsCard({
  title,
  value,
  description,
  icon,
  trend,
  className,
  gradient = false,
}: StatsCardProps) {
  return (
    <Card className={cn("overflow-hidden", className, {
      "border-0 text-white": gradient
    })}>
      {gradient && (
        <div className="absolute inset-0 card-gradient-purple -z-10" />
      )}
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">
          {title}
        </CardTitle>
        {icon && (
          <div className={cn("p-2 rounded-full", gradient ? "bg-white/10" : "bg-muted")}>
            {icon}
          </div>
        )}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {description && (
          <p className={cn("text-xs mt-1", gradient ? "text-white/70" : "text-muted-foreground")}>
            {description}
          </p>
        )}
        {trend && (
          <div className="flex items-center mt-2">
            <span
              className={cn(
                "text-xs font-medium mr-1",
                trend.positive ? "text-success" : "text-destructive"
              )}
            >
              {trend.positive ? "+" : "-"}
              {trend.value}%
            </span>
            <span className={cn("text-xs", gradient ? "text-white/70" : "text-muted-foreground")}>
              from last month
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}