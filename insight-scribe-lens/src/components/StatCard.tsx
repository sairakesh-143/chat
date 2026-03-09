import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: { value: number; label: string };
  variant?: "default" | "green" | "amber" | "red" | "blue";
}

const variantStyles = {
  default: "border-border",
  green: "border-chart-green/20",
  amber: "border-chart-amber/20",
  red: "border-chart-red/20",
  blue: "border-chart-blue/20",
};

const iconBg = {
  default: "bg-secondary",
  green: "bg-chart-green/10",
  amber: "bg-chart-amber/10",
  red: "bg-chart-red/10",
  blue: "bg-chart-blue/10",
};

const iconStyles = {
  default: "text-muted-foreground",
  green: "text-chart-green",
  amber: "text-chart-amber",
  red: "text-chart-red",
  blue: "text-chart-blue",
};

export default function StatCard({ title, value, subtitle, icon: Icon, trend, variant = "default" }: StatCardProps) {
  return (
    <div className={cn(
      "bg-card rounded-lg border p-5 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 group cursor-default",
      "hover:shadow-[0_8px_30px_-8px_hsl(var(--primary)/0.12)]",
      variantStyles[variant]
    )}>
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{title}</p>
          <p className="text-2xl font-bold font-mono text-card-foreground">{value}</p>
          {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
          {trend && (
            <p className={cn("text-xs font-medium", trend.value >= 0 ? "text-chart-green" : "text-chart-red")}>
              {trend.value >= 0 ? "↑" : "↓"} {Math.abs(trend.value)}% {trend.label}
            </p>
          )}
        </div>
        <div className={cn("p-2 rounded-md transition-transform duration-300 group-hover:scale-110", iconBg[variant], iconStyles[variant])}>
          <Icon className="h-4 w-4" />
        </div>
      </div>
    </div>
  );
}
