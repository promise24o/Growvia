import { cn } from "@/lib/utils";

interface ProgressCircleProps {
  value: number;
  size?: number;
  strokeWidth?: number;
  label?: string;
  valueLabel?: string;
  className?: string;
  bgColor?: string;
  color?: string;
}

export function ProgressCircle({
  value,
  size = 130,
  strokeWidth = 10,
  label,
  valueLabel,
  className,
  bgColor = "hsl(var(--muted))",
  color = "hsl(var(--primary))",
}: ProgressCircleProps) {
  const radius = size / 2 - strokeWidth;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.min(Math.max(value, 0), 100);
  const offset = circumference - (progress / 100) * circumference;

  return (
    <div
      className={cn("relative flex items-center justify-center", className)}
      style={{ width: size, height: size }}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="transform -rotate-90"
      >
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          stroke={bgColor}
          fill="none"
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          stroke={color}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          fill="none"
        />
      </svg>
      
      {/* Center content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        {valueLabel && (
          <span className="text-3xl font-bold">{valueLabel}</span>
        )}
        {label && (
          <span className="text-sm text-muted-foreground mt-1">{label}</span>
        )}
      </div>
    </div>
  );
}