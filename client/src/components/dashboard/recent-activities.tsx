import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ActivityItem } from "@/components/ui/activity-item";
import { useAuth } from "@/lib/auth";
import { Activity } from "@/lib/types";
import { Link } from "wouter";

interface RecentActivitiesProps {
  limit?: number;
}

export function RecentActivities({ limit = 5 }: RecentActivitiesProps) {
  const { token } = useAuth();
  
  const { data: activities, isLoading } = useQuery<Activity[]>({
    queryKey: [`/api/activities?limit=${limit}`],
    enabled: !!token
  });

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-semibold text-slate-800 dark:text-white text-lg">Recent Activities</h3>
          <Link href="/analytics">
            <Button variant="link" className="text-primary-600 hover:text-primary-700 text-sm font-medium p-0 h-auto">
              View All
            </Button>
          </Link>
        </div>

        <div className="space-y-4">
          {isLoading ? (
            // Loading skeleton
            Array.from({ length: limit }).map((_, index) => (
              <div key={index} className="flex items-start">
                <Skeleton className="h-8 w-8 rounded-full" />
                <div className="ml-3 flex-1">
                  <Skeleton className="h-4 w-full max-w-md mb-1" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>
            ))
          ) : activities && activities.length > 0 ? (
            // Actual data
            activities.map((activity) => (
              <ActivityItem key={activity.id} activity={activity} />
            ))
          ) : (
            <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-4">No recent activities found</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
