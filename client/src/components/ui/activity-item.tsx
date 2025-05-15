import { cn } from "@/lib/utils";
import { Activity } from "@/lib/types";
import { 
  UserPlus, 
  ShoppingCart, 
  DollarSign, 
  Link, 
  Settings,
  Lightbulb
} from "lucide-react";

interface ActivityItemProps {
  activity: Activity;
}

export function ActivityItem({ activity }: ActivityItemProps) {
  // Determine icon based on activity type
  const getIcon = () => {
    switch (activity.type) {
      case "user_joined":
      case "marketer_invited":
        return <UserPlus className="h-4 w-4" />;
      case "conversion":
      case "conversion_created":
        return <ShoppingCart className="h-4 w-4" />;
      case "payout":
        return <DollarSign className="h-4 w-4" />;
      case "affiliate_link":
      case "affiliate_link_created":
        return <Link className="h-4 w-4" />;
      case "system_update":
        return <Settings className="h-4 w-4" />;
      default:
        return <Lightbulb className="h-4 w-4" />;
    }
  };

  // Determine background color based on activity type
  const getBgColor = () => {
    switch (activity.type) {
      case "user_joined":
      case "marketer_invited":
      case "affiliate_link":
      case "affiliate_link_created":
      case "system_update":
        return "bg-primary-100 text-primary-600";
      case "conversion":
      case "conversion_created":
        return "bg-success-50 text-success-500";
      case "payout":
        return "bg-warning-50 text-warning-500";
      default:
        return "bg-slate-100 text-slate-600";
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return `Today at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } else if (diffDays === 1) {
      return `Yesterday at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  return (
    <div className="flex">
      <div className="flex-shrink-0 mt-1">
        <div className={cn("h-8 w-8 rounded-full flex items-center justify-center", getBgColor())}>
          {getIcon()}
        </div>
      </div>
      <div className="ml-3">
        <p className="text-sm text-slate-800 whitespace-normal">
          {activity.description}
        </p>
        <p className="text-xs text-slate-500 mt-1">
          {formatDate(activity.createdAt)}
        </p>
      </div>
    </div>
  );
}
