import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

/**
 * Metric tile for admin overview rows: soft icon chip top-left, optional badge
 * top-right, then a muted label and a large headline value.
 */
export function StatCard({
  icon: Icon,
  label,
  value,
  badge,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  /** Trend chip or status pill rendered in the top-right corner. */
  badge?: ReactNode;
}) {
  return (
    <Card>
      <CardContent className="flex flex-col gap-4">
        <div className="flex items-start justify-between gap-2">
          <span className="flex size-11 items-center justify-center rounded-xl bg-accent text-primary">
            <Icon className="size-5" />
          </span>
          {badge}
        </div>
        <div className="space-y-1">
          <p className="text-sm text-subtle">{label}</p>
          <p className="font-display text-3xl font-semibold text-foreground">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}
