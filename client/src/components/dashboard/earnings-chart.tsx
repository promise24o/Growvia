import { BarChart, ResponsiveContainer, XAxis, YAxis, Bar, Tooltip } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

// Sample data for the earnings chart
const data = [
  { name: "Mo", earnings: 400 },
  { name: "Tu", earnings: 300 },
  { name: "We", earnings: 520 },
  { name: "Th", earnings: 450 },
  { name: "Fr", earnings: 600 },
  { name: "Sa", earnings: 350 },
  { name: "Su", earnings: 400 },
];

interface EarningsChartProps {
  title?: string;
  subtitle?: string;
  amount?: string;
  trend?: {
    value: number;
    positive: boolean;
  };
}

export function EarningsChart({
  title = "Earnings Report",
  subtitle = "Weekly Earnings Overview",
  amount = "$468",
  trend = { value: 4.2, positive: true },
}: EarningsChartProps) {
  return (
    <Card className="col-span-1 lg:col-span-2">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <CardTitle>{title}</CardTitle>
          <CardDescription className="text-sm text-muted-foreground">{subtitle}</CardDescription>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold">{amount}</div>
          <div className="flex items-center text-xs">
            <span
              className={trend.positive ? "text-success" : "text-destructive"}
            >
              {trend.positive ? "+" : "-"}
              {trend.value}%
            </span>
            <span className="text-muted-foreground ml-1">
              compared to last week
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-4 px-0">
        <div className="h-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ left: 20, right: 20 }}>
              <XAxis 
                dataKey="name" 
                axisLine={false}
                tickLine={false}
                fontSize={12}
                tickMargin={10}
              />
              <YAxis 
                axisLine={false}
                tickLine={false}
                tick={false}
              />
              <Tooltip
                cursor={{ fill: 'rgba(0, 0, 0, 0.05)' }}
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="rounded-lg border bg-background p-2 shadow-sm">
                        <div className="font-medium">{payload[0].payload.name}</div>
                        <div className="text-muted-foreground text-sm">
                          ${payload[0].value}
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar
                dataKey="earnings"
                fill="hsl(var(--primary))"
                radius={[4, 4, 0, 0]}
                maxBarSize={40}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}