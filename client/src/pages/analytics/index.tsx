import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from "recharts";
import { Calendar } from "@/components/ui/calendar";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StatsResponse } from "@/lib/types";
import { 
  Calendar as CalendarIcon,
  BarChart2,
  PieChart as PieChartIcon,
  LineChart as LineChartIcon,
  Download
} from "lucide-react";

// Sample data for analytics
const clicksData = [
  { name: "Mon", value: 120 },
  { name: "Tue", value: 140 },
  { name: "Wed", value: 180 },
  { name: "Thu", value: 150 },
  { name: "Fri", value: 200 },
  { name: "Sat", value: 110 },
  { name: "Sun", value: 90 },
];

const conversionData = [
  { name: "Mon", value: 12 },
  { name: "Tue", value: 19 },
  { name: "Wed", value: 15 },
  { name: "Thu", value: 22 },
  { name: "Fri", value: 30 },
  { name: "Sat", value: 18 },
  { name: "Sun", value: 10 },
];

const pieData = [
  { name: "Premium Subscription", value: 540 },
  { name: "E-book Bundle", value: 320 },
  { name: "Video Course", value: 210 },
  { name: "Marketing Toolkit", value: 170 },
];

const COLORS = ['#2563eb', '#10b981', '#f59e0b', '#ef4444'];

export default function Analytics() {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [selectedRange, setSelectedRange] = useState("7days");
  
  // Get organization stats
  const { data: stats, isLoading } = useQuery<StatsResponse>({
    queryKey: ['/api/analytics/organization'],
  });

  return (
    <DashboardLayout title="Analytics">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Performance Analytics</h1>
          <p className="text-slate-500 dark:text-slate-300">Detailed insights into your affiliate program performance</p>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Select defaultValue={selectedRange} onValueChange={setSelectedRange}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Select range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7days">Last 7 days</SelectItem>
                <SelectItem value="30days">Last 30 days</SelectItem>
                <SelectItem value="90days">Last 90 days</SelectItem>
                <SelectItem value="year">Last 12 months</SelectItem>
                <SelectItem value="custom">Custom range</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <Button variant="outline" className="flex items-center">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>
      
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex justify-between items-center mb-4">
              <div className="flex flex-col">
                <span className="text-sm text-slate-500 dark:text-slate-400">Total Clicks</span>
                <span className="text-2xl font-semibold text-slate-800 dark:text-white">
                  {isLoading ? "..." : stats?.totalClicks.toLocaleString() || "0"}
                </span>
              </div>
              <div className="bg-primary-50 dark:bg-primary/20 p-3 rounded-full text-primary-600 dark:text-primary">
                <BarChart2 className="h-6 w-6" />
              </div>
            </div>
            <div className="h-10">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={clicksData}>
                  <Line type="monotone" dataKey="value" stroke="#2563eb" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex justify-between items-center mb-4">
              <div className="flex flex-col">
                <span className="text-sm text-slate-500 dark:text-slate-400">Conversions</span>
                <span className="text-2xl font-semibold text-slate-800 dark:text-white">
                  {isLoading ? "..." : stats?.conversions.toString() || "0"}
                </span>
              </div>
              <div className="bg-success-50 dark:bg-emerald-500/20 p-3 rounded-full text-success-500 dark:text-emerald-400">
                <LineChartIcon className="h-6 w-6" />
              </div>
            </div>
            <div className="h-10">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={conversionData}>
                  <Line type="monotone" dataKey="value" stroke="#10b981" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex justify-between items-center mb-4">
              <div className="flex flex-col">
                <span className="text-sm text-slate-500 dark:text-slate-400">Conversion Rate</span>
                <span className="text-2xl font-semibold text-slate-800 dark:text-white">
                  {isLoading 
                    ? "..." 
                    : stats 
                      ? `${((stats.conversions / stats.totalClicks) * 100).toFixed(2)}%` 
                      : "0%"
                  }
                </span>
              </div>
              <div className="bg-warning-50 dark:bg-amber-500/20 p-3 rounded-full text-warning-500 dark:text-amber-400">
                <PieChartIcon className="h-6 w-6" />
              </div>
            </div>
            <div className="h-10">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={conversionData}>
                  <Line type="monotone" dataKey="value" stroke="#f59e0b" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex justify-between items-center mb-4">
              <div className="flex flex-col">
                <span className="text-sm text-slate-500 dark:text-slate-400">Revenue</span>
                <span className="text-2xl font-semibold text-slate-800 dark:text-white">
                  {isLoading ? "..." : `$${stats?.commissionEarned.toFixed(2)}` || "$0.00"}
                </span>
              </div>
              <div className="bg-error-50 dark:bg-rose-500/20 p-3 rounded-full text-error-500 dark:text-rose-400">
                <CalendarIcon className="h-6 w-6" />
              </div>
            </div>
            <div className="h-10">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={conversionData}>
                  <Line type="monotone" dataKey="value" stroke="#ef4444" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Tabs defaultValue="clicks" className="w-full">
        <div className="overflow-x-auto pb-1">
          <TabsList className="mb-4 flex-nowrap w-max min-w-full">
            <TabsTrigger value="clicks">Clicks</TabsTrigger>
            <TabsTrigger value="conversions">Conversions</TabsTrigger>
            <TabsTrigger value="revenue">Revenue</TabsTrigger>
            <TabsTrigger value="marketers">Marketers</TabsTrigger>
          </TabsList>
        </div>
        
        <TabsContent value="clicks" className="w-full">
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Click Analytics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={clicksData.concat(clicksData).concat(clicksData)}
                    margin={{ top: 20, right: 30, left: 20, bottom: 10 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis 
                      dataKey="name" 
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis 
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="value" 
                      name="Clicks"
                      stroke="#2563eb" 
                      strokeWidth={3}
                      activeDot={{ r: 8 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="dark:text-white">Top Referrers</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={[
                        { name: "Google", value: 450 },
                        { name: "Direct", value: 300 },
                        { name: "Facebook", value: 280 },
                        { name: "Twitter", value: 200 },
                        { name: "Instagram", value: 120 },
                      ]}
                      margin={{ top: 20, right: 30, left: 20, bottom: 10 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis 
                        dataKey="name" 
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis 
                        axisLine={false}
                        tickLine={false}
                      />
                      <Tooltip />
                      <Bar dataKey="value" name="Clicks" fill="#2563eb" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Clicks by Device</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={[
                          { name: "Mobile", value: 580 },
                          { name: "Desktop", value: 320 },
                          { name: "Tablet", value: 100 },
                        ]}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      >
                        {[
                          { name: "Mobile", value: 580 },
                          { name: "Desktop", value: 320 },
                          { name: "Tablet", value: 100 },
                        ].map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="conversions">
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="dark:text-white">Conversion Analytics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={conversionData.concat(conversionData).concat(conversionData)}
                    margin={{ top: 20, right: 30, left: 20, bottom: 10 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis 
                      dataKey="name" 
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis 
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="value" 
                      name="Conversions"
                      stroke="#10b981" 
                      strokeWidth={3}
                      activeDot={{ r: 8 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Conversion by Product</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Conversion Rate by Source</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={[
                        { name: "Google", value: 4.5 },
                        { name: "Direct", value: 3.2 },
                        { name: "Facebook", value: 2.8 },
                        { name: "Twitter", value: 2.1 },
                        { name: "Instagram", value: 1.5 },
                      ]}
                      margin={{ top: 20, right: 30, left: 20, bottom: 10 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis 
                        dataKey="name" 
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis 
                        axisLine={false}
                        tickLine={false}
                        tickFormatter={(value) => `${value}%`}
                      />
                      <Tooltip formatter={(value) => [`${value}%`, "Conversion Rate"]} />
                      <Bar dataKey="value" name="Conversion Rate" fill="#10b981" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="revenue">
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Revenue Analytics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={[
                      { name: "Jan", value: 1200 },
                      { name: "Feb", value: 1400 },
                      { name: "Mar", value: 1100 },
                      { name: "Apr", value: 1700 },
                      { name: "May", value: 1300 },
                      { name: "Jun", value: 1900 },
                      { name: "Jul", value: 2100 },
                      { name: "Aug", value: 1800 },
                      { name: "Sep", value: 2400 },
                      { name: "Oct", value: 2200 },
                      { name: "Nov", value: 2600 },
                      { name: "Dec", value: 3000 },
                    ]}
                    margin={{ top: 20, right: 30, left: 20, bottom: 10 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis 
                      dataKey="name" 
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis 
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(value) => `$${value}`}
                    />
                    <Tooltip formatter={(value) => [`$${value}`, "Revenue"]} />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="value" 
                      name="Revenue"
                      stroke="#f59e0b" 
                      strokeWidth={3}
                      activeDot={{ r: 8 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Revenue by Product</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={[
                        { name: "Premium Subscription", value: 12500 },
                        { name: "E-book Bundle", value: 8700 },
                        { name: "Video Course", value: 6800 },
                        { name: "Marketing Toolkit", value: 4500 },
                      ]}
                      margin={{ top: 20, right: 30, left: 20, bottom: 10 }}
                      layout="vertical"
                    >
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                      <XAxis 
                        type="number"
                        axisLine={false}
                        tickLine={false}
                        tickFormatter={(value) => `$${value}`}
                      />
                      <YAxis 
                        type="category"
                        dataKey="name" 
                        axisLine={false}
                        tickLine={false}
                        width={150}
                      />
                      <Tooltip formatter={(value) => [`$${value}`, "Revenue"]} />
                      <Bar dataKey="value" name="Revenue" fill="#f59e0b" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Average Order Value</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={[
                        { name: "Jan", value: 85 },
                        { name: "Feb", value: 92 },
                        { name: "Mar", value: 89 },
                        { name: "Apr", value: 95 },
                        { name: "May", value: 90 },
                        { name: "Jun", value: 102 },
                        { name: "Jul", value: 110 },
                        { name: "Aug", value: 105 },
                        { name: "Sep", value: 115 },
                        { name: "Oct", value: 108 },
                        { name: "Nov", value: 120 },
                        { name: "Dec", value: 125 },
                      ]}
                      margin={{ top: 20, right: 30, left: 20, bottom: 10 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis 
                        dataKey="name" 
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis 
                        axisLine={false}
                        tickLine={false}
                        tickFormatter={(value) => `$${value}`}
                      />
                      <Tooltip formatter={(value) => [`$${value}`, "AOV"]} />
                      <Line 
                        type="monotone" 
                        dataKey="value" 
                        name="Average Order Value"
                        stroke="#ef4444" 
                        strokeWidth={3}
                        activeDot={{ r: 8 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="marketers">
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Marketer Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={[
                      { name: "Emily Cooper", clicks: 850, conversions: 42, revenue: 2890 },
                      { name: "John Doe", clicks: 720, conversions: 38, revenue: 2150 },
                      { name: "Sarah Miller", clicks: 590, conversions: 25, revenue: 1750 },
                      { name: "Michael Brown", clicks: 480, conversions: 20, revenue: 1320 },
                      { name: "Alex Wilson", clicks: 350, conversions: 15, revenue: 980 },
                    ]}
                    margin={{ top: 20, right: 30, left: 20, bottom: 10 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis 
                      dataKey="name" 
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis 
                      axisLine={false}
                      tickLine={false}
                      yAxisId="left"
                    />
                    <YAxis 
                      axisLine={false}
                      tickLine={false}
                      yAxisId="right"
                      orientation="right"
                      tickFormatter={(value) => `$${value}`}
                    />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="clicks" name="Clicks" fill="#2563eb" yAxisId="left" />
                    <Bar dataKey="conversions" name="Conversions" fill="#10b981" yAxisId="left" />
                    <Bar dataKey="revenue" name="Revenue" fill="#f59e0b" yAxisId="right" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Conversion Rate by Marketer</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={[
                        { name: "Emily Cooper", value: 4.9 },
                        { name: "John Doe", value: 5.3 },
                        { name: "Sarah Miller", value: 4.2 },
                        { name: "Michael Brown", value: 4.1 },
                        { name: "Alex Wilson", value: 4.3 },
                      ]}
                      margin={{ top: 20, right: 30, left: 20, bottom: 10 }}
                      layout="vertical"
                    >
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                      <XAxis 
                        type="number"
                        axisLine={false}
                        tickLine={false}
                        tickFormatter={(value) => `${value}%`}
                      />
                      <YAxis 
                        type="category"
                        dataKey="name" 
                        axisLine={false}
                        tickLine={false}
                        width={120}
                      />
                      <Tooltip formatter={(value) => [`${value}%`, "Conversion Rate"]} />
                      <Bar dataKey="value" name="Conversion Rate" fill="#10b981" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Revenue by Marketer</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={[
                          { name: "Emily Cooper", value: 2890 },
                          { name: "John Doe", value: 2150 },
                          { name: "Sarah Miller", value: 1750 },
                          { name: "Michael Brown", value: 1320 },
                          { name: "Others", value: 980 },
                        ]}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      >
                        {[
                          { name: "Emily Cooper", value: 2890 },
                          { name: "John Doe", value: 2150 },
                          { name: "Sarah Miller", value: 1750 },
                          { name: "Michael Brown", value: 1320 },
                          { name: "Others", value: 980 },
                        ].map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => [`$${value}`, "Revenue"]} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
}
