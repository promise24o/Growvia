import { CircleDot } from "lucide-react";
import { AnalyticsCard } from "./analytics-card";
import { Badge } from "@/components/ui/badge";

interface AnalyticsStats {
  traffic: {
    percentage: number;
    count: number;
  };
  sessions: number;
  pageViews: number;
  leads: number;
  conversions: {
    percentage: number;
    count: number;
  };
}

interface WebsiteAnalyticsProps {
  title?: string;
  subtitle?: string;
  conversionRate?: number;
  stats?: AnalyticsStats;
}

export function WebsiteAnalytics({
  title = "Website Analytics",
  subtitle = "Total 28.5% Conversion Rate",
  stats = {
    traffic: {
      percentage: 28,
      count: 0
    },
    sessions: 3100,
    pageViews: 0,
    leads: 1200,
    conversions: {
      percentage: 12,
      count: 0
    }
  }
}: WebsiteAnalyticsProps) {
  return (
    <AnalyticsCard
      title={title}
      subtitle={subtitle}
      gradient={true}
      className="col-span-1 lg:col-span-2"
      actionButton={
        <div className="flex space-x-1">
          <CircleDot className="h-2 w-2 fill-white text-white" />
          <CircleDot className="h-2 w-2 fill-white/50 text-white/50" />
          <CircleDot className="h-2 w-2 fill-white/30 text-white/30" />
        </div>
      }
    >
      <div className="grid gap-6">
        {/* 3D Sphere Visualization - This would be a custom component in a real app */}
        <div className="relative h-40 bg-white/10 rounded-xl flex items-center justify-center">
          <div className="w-32 h-32 rounded-full bg-gradient-to-r from-blue-400 to-cyan-300 shadow-lg opacity-90 animate-pulse-slow" />
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48bGluZWFyR3JhZGllbnQgaWQ9ImEiIHgxPSI1MCUiIHkxPSIwJSIgeDI9IjUwJSIgeTI9IjEwMCUiPjxzdG9wIHN0b3AtY29sb3I9IiNmZmYiIHN0b3Atb3BhY2l0eT0iLjUiIG9mZnNldD0iMCUiLz48c3RvcCBzdG9wLWNvbG9yPSIjZmZmIiBzdG9wLW9wYWNpdHk9IjAiIG9mZnNldD0iMTAwJSIvPjwvbGluZWFyR3JhZGllbnQ+PC9kZWZzPjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBmaWxsPSJ1cmwoI2EpIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiIG9wYWNpdHk9Ii4yIi8+PC9zdmc+')]" />
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-x-4 gap-y-6">
          <div>
            <div className="text-sm font-medium text-white/70">Traffic</div>
            <div className="flex items-baseline gap-2">
              <div className="text-2xl font-bold">{stats.traffic.percentage}%</div>
            </div>
          </div>
          
          <div>
            <div className="text-sm font-medium text-white/70">Sessions</div>
            <div className="flex items-baseline gap-2">
              <div className="text-2xl font-bold">{stats.sessions.toLocaleString()}k</div>
            </div>
          </div>
          
          <div>
            <div className="text-sm font-medium text-white/70">Leads</div>
            <div className="flex items-baseline gap-2">
              <div className="text-2xl font-bold">{(stats.leads / 1000).toFixed(1)}k</div>
            </div>
          </div>
          
          <div>
            <div className="text-sm font-medium text-white/70">Conversions</div>
            <div className="flex items-baseline gap-2">
              <div className="text-2xl font-bold">{stats.conversions.percentage}%</div>
            </div>
          </div>
        </div>
      </div>
    </AnalyticsCard>
  );
}