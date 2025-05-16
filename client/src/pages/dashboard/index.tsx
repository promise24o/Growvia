import { PerformanceChart } from "@/components/dashboard/performance-chart";
import { QuickActions } from "@/components/dashboard/quick-actions";
import { RecentActivities } from "@/components/dashboard/recent-activities";
import { TopMarketers } from "@/components/dashboard/top-marketers";
import { TopProducts } from "@/components/dashboard/top-products";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { StatCard } from "@/components/ui/stat-card";
import { useAuth } from "@/lib/auth";
import { StatsResponse } from "@/lib/types";
import { useQuery } from "@tanstack/react-query";
import {
  DollarSign,
  Link,
  ShoppingCart,
  Users
} from "lucide-react";

export default function Dashboard() {
  const { token } = useAuth();
  
  const { data: stats, isLoading } = useQuery<StatsResponse>({
    queryKey: ['/api/analytics/organization'],
    enabled: !!token
  });

  return (
    <DashboardLayout title="Dashboard">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Active Marketers"
          value={isLoading ? "..." : stats?.activeMarketers.toString() || "0"}
          icon={<Users className="h-5 w-5" />}
          iconColor="primary"
          change={12.0}
        />
        
        <StatCard
          title="Total Clicks"
          value={isLoading ? "..." : stats?.totalClicks.toLocaleString() || "0"}
          icon={<Link className="h-5 w-5" />}
          iconColor="warning"
          change={23.5}
        />
        
        <StatCard
          title="Conversions"
          value={isLoading ? "..." : stats?.conversions.toString() || "0"}
          icon={<ShoppingCart className="h-5 w-5" />}
          iconColor="success"
          change={18.2}
        />
        
        <StatCard
          title="Commission Earned"
          value={isLoading ? "..." : `$${stats?.commissionEarned.toFixed(2)}` || "$0.00"}
          icon={<DollarSign className="h-5 w-5" />}
          iconColor="primary"
          change={-4.3}
        />
      </div>

      {/* Performance Chart & Top Products */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-2">
          <PerformanceChart />
        </div>
        <div>
          <TopProducts />
        </div>
      </div>

      {/* Recent Activities & Marketers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <RecentActivities />
        <TopMarketers />
      </div>

      {/* Quick Actions */}
      <QuickActions />
    </DashboardLayout>
  );
}
