import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ProgressCircle } from "./progress-circle";

interface SupportTrackerProps {
  title?: string;
  subtitle?: string;
  total?: number;
  completionRate?: number;
  ticketStats?: {
    new: number;
    open: number;
    response: string;
  };
}

export function SupportTracker({
  title = "Support Tracker",
  subtitle = "Last 7 Days",
  total = 164,
  completionRate = 85,
  ticketStats = {
    new: 142,
    open: 28,
    response: "1 Day",
  },
}: SupportTrackerProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>{title}</CardTitle>
            <CardDescription>{subtitle}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4">
          <div className="text-center">
            <div className="text-3xl font-bold">{total}</div>
            <div className="text-sm text-muted-foreground">Total Tickets</div>
          </div>
          
          {/* Progress circle */}
          <div className="mx-auto">
            <ProgressCircle 
              value={completionRate} 
              size={150}
              valueLabel={`${completionRate}%`}
              label="Completed Task"
              color="hsl(var(--primary))"
            />
          </div>
          
          {/* Ticket stats */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                <span className="h-2 w-2 rounded-full bg-primary mr-1" />
              </Badge>
              <div className="flex-1">New Tickets</div>
              <div className="font-medium">{ticketStats.new}</div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-info/10 text-info border-info/20">
                <span className="h-2 w-2 rounded-full bg-info mr-1" />
              </Badge>
              <div className="flex-1">Open Tickets</div>
              <div className="font-medium">{ticketStats.open}</div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-warning/10 text-warning border-warning/20">
                <span className="h-2 w-2 rounded-full bg-warning mr-1" />
              </Badge>
              <div className="flex-1">Response Time</div>
              <div className="font-medium">{ticketStats.response}</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}