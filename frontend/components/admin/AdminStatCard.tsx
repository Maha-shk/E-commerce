import type { ReactNode } from "react";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/admin/QueryState";
import { cn } from "@/lib/utils";

/**
 * The stat tile used across the admin list screens.
 *
 * Products, Categories and Inventory each had their own version — different
 * label case, different value size, some centred and some left-aligned, some
 * with an icon chip and some with a trailing caption. One component so a row
 * of tiles reads the same on every screen.
 */
export function AdminStatCard({
  label,
  value,
  caption,
  corner,
  tone = "default",
  loading,
}: {
  label: string;
  value: string;
  /** Small qualifier under the number, e.g. "Across all pages". */
  caption?: string;
  /** Trailing icon chip or badge. */
  corner?: ReactNode;
  tone?: "default" | "warning" | "destructive";
  loading?: boolean;
}) {
  return (
    <Card className="gap-0 py-0">
      <div className="flex items-start justify-between gap-3 p-4">
        <div className="min-w-0">
          <p className="truncate text-xs font-medium text-subtle">{label}</p>

          {loading ? (
            <Skeleton className="mt-2 h-7 w-20" />
          ) : (
            <p
              className={cn(
                "mt-1.5 text-xl font-semibold tracking-tight tabular-nums",
                tone === "warning" && "text-warning",
                tone === "destructive" && "text-destructive",
                tone === "default" && "text-foreground",
              )}
            >
              {value}
            </p>
          )}

          {caption ? (
            <p className="mt-0.5 truncate text-xs text-muted-foreground">{caption}</p>
          ) : null}
        </div>

        {corner ? <div className="shrink-0">{corner}</div> : null}
      </div>
    </Card>
  );
}

/** Circular icon chip for the card's `corner` slot. */
export function StatChip({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "flex size-9 items-center justify-center rounded-full bg-muted text-muted-foreground",
        className,
      )}
    >
      {children}
    </span>
  );
}
