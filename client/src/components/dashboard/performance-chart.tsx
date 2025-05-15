import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

// Sample data
const weeklyData = [
  { name: "Mon", value: 150 },
  { name: "Tue", value: 100 },
  { name: "Wed", value: 180 },
  { name: "Thu", value: 120 },
  { name: "Fri", value: 60 },
  { name: "Sat", value: 170 },
  { name: "Sun", value: 90 },
];

const monthlyData = [
  { name: "Week 1", value: 600 },
  { name: "Week 2", value: 800 },
  { name: "Week 3", value: 700 },
  { name: "Week 4", value: 900 },
];

const yearlyData = [
  { name: "Jan", value: 2500 },
  { name: "Feb", value: 3000 },
  { name: "Mar", value: 2800 },
  { name: "Apr", value: 3300 },
  { name: "May", value: 3100 },
  { name: "Jun", value: 3500 },
  { name: "Jul", value: 3400 },
  { name: "Aug", value: 3700 },
  { name: "Sep", value: 3600 },
  { name: "Oct", value: 3900 },
  { name: "Nov", value: 3800 },
  { name: "Dec", value: 4200 },
];

interface PerformanceChartProps {
  title?: string;
}

export function PerformanceChart({ title = "Performance Overview" }: PerformanceChartProps) {
  const [period, setPeriod] = useState("weekly");
  
  const data = period === "weekly" 
    ? weeklyData 
    : period === "monthly" 
    ? monthlyData 
    : yearlyData;

  return (
    <Card className="dark-card border shadow-sm">
      <CardContent className="p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-semibold text-slate-800 dark:text-white text-lg">{title}</h3>
          <Tabs value={period} onValueChange={setPeriod}>
            <TabsList className="dark:bg-slate-800">
              <TabsTrigger value="weekly" className="dark:data-[state=active]:bg-slate-700 dark:text-white dark:data-[state=active]:text-white">Weekly</TabsTrigger>
              <TabsTrigger value="monthly" className="dark:data-[state=active]:bg-slate-700 dark:text-white dark:data-[state=active]:text-white">Monthly</TabsTrigger>
              <TabsTrigger value="yearly" className="dark:data-[state=active]:bg-slate-700 dark:text-white dark:data-[state=active]:text-white">Yearly</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
        
        <div className="h-[240px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={data}
              margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#374151" />
              <XAxis 
                dataKey="name" 
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: 'var(--muted-foreground)' }}
              />
              <YAxis 
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: 'var(--muted-foreground)' }}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'var(--card)',
                  border: '1px solid var(--border)',
                  borderRadius: '0.5rem',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                  color: 'var(--foreground)'
                }}
              />
              <defs>
                <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2563eb" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <Line 
                type="monotone" 
                dataKey="value" 
                stroke="#2563eb" 
                strokeWidth={3} 
                dot={{ r: 4, fill: '#2563eb', strokeWidth: 2, stroke: 'white' }}
                activeDot={{ r: 6, fill: '#2563eb', strokeWidth: 2, stroke: 'white' }}
                fill="url(#colorValue)"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
