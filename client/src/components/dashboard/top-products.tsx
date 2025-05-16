import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/lib/auth";
import { Product } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { BookOpen, Briefcase, ChevronDown, ChevronUp, LayoutGrid, ShoppingBag, Video } from "lucide-react";
import { Link } from "wouter";

function getProductIcon(iconName: string | null, id: number) {
  switch (iconName) {
    case "ri-shopping-bag-line":
      return <ShoppingBag className="h-5 w-5" />;
    case "ri-book-line":
      return <BookOpen className="h-5 w-5" />;
    case "ri-video-line":
      return <Video className="h-5 w-5" />;
    case "ri-tools-line":
      return <Briefcase className="h-5 w-5" />;
    default:
      return <LayoutGrid className="h-5 w-5" />;
  }
}

interface TopProductsProps {
  limit?: number;
}

export function TopProducts({ limit = 4 }: TopProductsProps) {
  const { token } = useAuth();

  const { data: products, isLoading } = useQuery<Product[]>({
    queryKey: ['/api/apps/top'],
    enabled: !!token, 
  });

  const displayProducts = products?.slice(0, limit);

  return (
    <Card className="dark-card border shadow-sm">
      <CardContent className="p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-semibold text-slate-800 dark:text-white text-lg">Top Products</h3>
          <Link href="/apps">
            <Button variant="link" className="text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 text-sm font-medium p-0 h-auto">
              View All
            </Button>
          </Link>
        </div>

        <div className="space-y-4">
          {isLoading ? (
            // Loading skeleton
            Array.from({ length: limit }).map((_, index) => (
              <div key={index} className="flex items-center py-3 border-b border-slate-100 dark:border-slate-700/50">
                <Skeleton className="h-10 w-10 rounded-lg dark:bg-slate-700" />
                <div className="ml-3 flex-1">
                  <Skeleton className="h-4 w-32 mb-1 dark:bg-slate-700" />
                  <Skeleton className="h-3 w-24 dark:bg-slate-700" />
                </div>
                <div className="text-right">
                  <Skeleton className="h-4 w-16 ml-auto mb-1 dark:bg-slate-700" />
                  <Skeleton className="h-3 w-10 ml-auto dark:bg-slate-700" />
                </div>
              </div>
            ))
          ) : (
            // Actual data
            displayProducts?.map((product) => (
              <div key={product.id} className="flex items-center py-3 border-b border-slate-100 dark:border-slate-700/50">
                <div className="bg-primary-50 dark:bg-primary/20 h-10 w-10 rounded-lg flex items-center justify-center text-primary-600 dark:text-primary-400">
                  {getProductIcon(product.icon, product.id)}
                </div>
                <div className="ml-3 flex-1">
                  <h4 className="text-sm font-medium text-slate-800 dark:text-white">{product.name}</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{product.conversions} conversions</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-slate-800 dark:text-white">${product.revenue.toFixed(2)}</p>
                  <div className={cn(
                    "flex items-center text-xs justify-end",
                    product.growth >= 0 
                      ? "text-success-500 dark:text-emerald-400" 
                      : "text-error-500 dark:text-rose-400"
                  )}>
                    {product.growth >= 0 ? (
                      <ChevronUp className="h-3 w-3 mr-1" />
                    ) : (
                      <ChevronDown className="h-3 w-3 mr-1" />
                    )}
                    <span>{Math.abs(product.growth).toFixed(1)}%</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
