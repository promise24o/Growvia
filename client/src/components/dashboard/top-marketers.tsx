import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/ui/data-table";
import { AvatarWithStatus } from "@/components/ui/avatar-with-status";
import { useAuth } from "@/lib/auth";
import { Marketer } from "@/lib/types";

interface TopMarketersProps {
  limit?: number;
}

export function TopMarketers({ limit = 4 }: TopMarketersProps) {
  const { token } = useAuth();
  
  const { data: marketers, isLoading } = useQuery<Marketer[]>({
    queryKey: [`/api/marketers/top?limit=${limit}`],
    enabled: !!token
  });

  const columns = [
    {
      header: "Marketer",
      accessorKey: "name",
      cell: (data: Marketer) => (
        <AvatarWithStatus 
          user={{
            name: data.name,
            email: data.email,
            status: data.status
          }}
        />
      )
    },
    {
      header: "Conversions",
      accessorKey: "conversions",
      cell: (data: Marketer) => (
        <p className="text-sm text-slate-800 dark:text-slate-200">{data.conversions}</p>
      )
    },
    {
      header: "Revenue",
      accessorKey: "revenue",
      cell: (data: Marketer) => (
        <p className="text-sm text-slate-800 dark:text-slate-200">${data.revenue.toFixed(2)}</p>
      )
    },
    {
      header: "Status",
      accessorKey: "status",
      cell: (data: Marketer) => (
        <Badge
          variant="outline"
          className={`px-2 py-1 text-xs font-medium rounded-full ${
            data.status === "active"
              ? "bg-success-50 text-success-600 border-success-200"
              : "bg-warning-50 text-warning-600 border-warning-200"
          }`}
        >
          {data.status === "active" ? "Active" : "Pending"}
        </Badge>
      )
    }
  ];

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-semibold text-slate-800 dark:text-white text-lg">Top Marketers</h3>
          <Link href="/marketers">
            <Button variant="link" className="text-primary-600 hover:text-primary-700 text-sm font-medium p-0 h-auto">
              View All
            </Button>
          </Link>
        </div>

        <div className="overflow-x-auto">
          <DataTable 
            columns={columns} 
            data={marketers} 
            isLoading={isLoading}
            loadingRows={limit}
            emptyState={
              <div className="py-8 text-center">
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">No marketers found</p>
                <Link href="/marketers">
                  <Button size="sm" variant="outline">Invite Marketers</Button>
                </Link>
              </div>
            }
          />
        </div>
      </CardContent>
    </Card>
  );
}
