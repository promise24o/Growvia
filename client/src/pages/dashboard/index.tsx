import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/dashboard/layout";
import { StatsCard } from "@/components/dashboard/stats-card";
import { EarningsChart } from "@/components/dashboard/earnings-chart";
import { SupportTracker } from "@/components/dashboard/support-tracker";
import { WebsiteAnalytics } from "@/components/dashboard/website-analytics";
import { Users, CreditCard, BarChart3, ArrowUpRight } from "lucide-react";

export default function Dashboard() {
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["/api/analytics/organization"],
  });

  const { data: topMarketers, isLoading: marketersLoading } = useQuery({
    queryKey: ["/api/marketers/top"],
  });

  const { data: activities, isLoading: activitiesLoading } = useQuery({
    queryKey: ["/api/activities"],
  });

  const { data: topApps, isLoading: appsLoading } = useQuery({
    queryKey: ["/api/apps/top"],
  });

  // Dashboard data from API or fallback to empty objects if still loading
  const dashboardData = {
    stats: stats || {
      activeMarketers: 0,
      totalClicks: 0,
      conversions: 0,
      commissionEarned: 0
    },
    marketers: topMarketers || [],
    activities: activities || [],
    apps: topApps || []
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-3xl font-bold mb-1">Dashboard</h1>
          <p className="text-muted-foreground">Welcome to your affiliate marketing platform dashboard.</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          <StatsCard
            title="Active Marketers"
            value={dashboardData.stats.activeMarketers}
            icon={<Users className="h-4 w-4" />}
            trend={{ value: 12, positive: true }}
            description="Total active affiliate marketers"
          />
          
          <StatsCard
            title="Total Clicks"
            value={dashboardData.stats.totalClicks}
            icon={<ArrowUpRight className="h-4 w-4" />}
            trend={{ value: 8.5, positive: true }}
            description="Clicks on affiliate links"
          />
          
          <StatsCard
            title="Conversions"
            value={dashboardData.stats.conversions}
            icon={<BarChart3 className="h-4 w-4" />}
            trend={{ value: 3.2, positive: true }}
            description="Successful conversions"
          />
          
          <StatsCard
            title="Commission Earned"
            value={`$${dashboardData.stats.commissionEarned.toFixed(2)}`}
            icon={<CreditCard className="h-4 w-4" />}
            trend={{ value: 10.4, positive: true }}
            description="Total commission earned"
            gradient
          />
        </div>

        {/* Dashboard Widgets */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <EarningsChart 
            title="Commission Overview"
            subtitle="Weekly commission payouts"
            amount={`$${dashboardData.stats.commissionEarned.toFixed(2)}`}
          />
          
          <SupportTracker 
            title="Conversion Rates"
            subtitle="Last 30 Days"
            total={dashboardData.stats.conversions}
            completionRate={
              dashboardData.stats.totalClicks > 0
                ? Math.round((dashboardData.stats.conversions / dashboardData.stats.totalClicks) * 100)
                : 0
            }
          />
        </div>

        {/* Analytics Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <WebsiteAnalytics
            title="Link Performance"
            subtitle={`${dashboardData.stats.conversions} Conversions from ${dashboardData.stats.totalClicks} Clicks`}
            stats={{
              traffic: {
                percentage: 
                  dashboardData.stats.totalClicks > 0
                    ? Math.round((dashboardData.stats.conversions / dashboardData.stats.totalClicks) * 100)
                    : 0,
                count: dashboardData.stats.totalClicks
              },
              sessions: dashboardData.stats.totalClicks,
              pageViews: 0,
              leads: dashboardData.stats.conversions,
              conversions: {
                percentage:
                  dashboardData.stats.totalClicks > 0
                    ? Math.round((dashboardData.stats.conversions / dashboardData.stats.totalClicks) * 100)
                    : 0,
                count: dashboardData.stats.conversions
              }
            }}
          />
        </div>
      </div>
    </DashboardLayout>
  );
}