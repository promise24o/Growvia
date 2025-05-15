import { User } from "@/lib/types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

interface AvatarWithStatusProps {
  user: Pick<User, "name" | "email" | "avatar" | "status">;
  showStatus?: boolean;
  size?: "sm" | "md" | "lg";
  showDetails?: boolean;
}

export function AvatarWithStatus({
  user,
  showStatus = true,
  size = "md",
  showDetails = true,
}: AvatarWithStatusProps) {
  const { name, email, avatar, status } = user;
  
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .substring(0, 2);
  
  const sizeClasses = {
    sm: "h-8 w-8",
    md: "h-10 w-10",
    lg: "h-12 w-12",
  };
  
  // Always use bright green for the status indicator
  const statusColor = "bg-green-500";

  return (
    <div className="flex items-center">
      <div className="relative">
        <Avatar className={cn("border border-slate-200", sizeClasses[size])}>
          <AvatarImage src={avatar || undefined} alt={name} />
          <AvatarFallback>{initials}</AvatarFallback>
        </Avatar>
        
        {showStatus && (
          <span 
            className={cn(
              "absolute bottom-0 right-0 block rounded-full ring-2 ring-white dark:ring-slate-800",
              statusColor,
              size === "sm" ? "h-2 w-2" : "h-3 w-3"
            )}
          />
        )}
      </div>
      
      {showDetails && (
        <div className="ml-3">
          <p className="text-sm font-medium text-slate-800">{name}</p>
          <p className="text-xs text-slate-500">{email}</p>
        </div>
      )}
    </div>
  );
}
