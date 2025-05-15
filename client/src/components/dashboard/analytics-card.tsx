import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Ellipsis } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface AnalyticsCardProps {
  title: string;
  subtitle?: string;
  gradient?: boolean;
  className?: string;
  actionButton?: React.ReactNode;
  children?: React.ReactNode;
}

export function AnalyticsCard({
  title,
  subtitle,
  gradient = false,
  className,
  actionButton,
  children,
}: AnalyticsCardProps) {
  return (
    <Card 
      className={cn("overflow-hidden", className, {
        "border-0 text-white": gradient
      })}
    >
      {gradient && (
        <div className="absolute inset-0 card-gradient-purple -z-10" />
      )}
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <div>
          <CardTitle className="text-base font-medium">{title}</CardTitle>
          {subtitle && (
            <CardDescription 
              className={cn(gradient ? "text-white/70" : "text-muted-foreground")}
            >
              {subtitle}
            </CardDescription>
          )}
        </div>
        <div className="flex items-center gap-2">
          {actionButton}
          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
            <Ellipsis className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}