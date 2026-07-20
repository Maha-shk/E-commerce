import { TrendingUp, TrendingDown, Minus, type LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { ReportMetric, TrendDirection } from "@/lib/admin/reports";

const trendConfig: Record<TrendDirection, { icon: LucideIcon; className: string }> = {
  up: { icon: TrendingUp, className: "text-success" },
  down: { icon: TrendingDown, className: "text-destructive" },
  stable: { icon: Minus, className: "text-subtle" },
};

/**
 * Summary metric tile: muted label, large headline value, and a colour-coded
 * trend indicator (green up / red down / neutral stable).
 */
export function MetricCard({ label, value, trend }: ReportMetric) {
  const { icon: Icon, className } = trendConfig[trend.direction];

  return (
    <Card>
      <CardContent className="space-y-1.5">
        <p className="text-sm text-subtle">{label}</p>
        <p className="font-display text-2xl font-semibold text-foreground">{value}</p>
        <p className={cn("flex items-center gap-1 text-xs font-medium", className)}>
          <Icon className="size-3.5" />
          {trend.text}
        </p>
      </CardContent>
    </Card>
  );
}
