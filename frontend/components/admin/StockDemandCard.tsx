"use client";

import Link from "next/link";
import { BellRing, ChevronRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useStockDemand } from "@/lib/hooks/use-admin";
import { cn } from "@/lib/utils";

/** Enough to act on; the rest are a click away in the products list. */
const VISIBLE = 5;

/**
 * What to restock first, ranked by how many people are waiting.
 *
 * This is the one question the waiting list can answer that the inventory
 * table can't: the table shows what is at zero, this shows what being at zero
 * is *costing*. Ten people waiting on one part and none on another is the
 * difference between a reorder and a shrug.
 *
 * Hidden entirely when nobody is waiting — an always-present empty panel would
 * take space at the top of the screen to say nothing.
 */
export function StockDemandCard() {
  const { data: rows, isPending } = useStockDemand();

  if (isPending || !rows || rows.length === 0) return null;

  const shown = rows.slice(0, VISIBLE);
  const waitingTotal = rows.reduce((sum, row) => sum + row.waiting, 0);

  return (
    <Card className="gap-0 py-0">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 pt-5 pb-4">
        <div className="flex items-center gap-2">
          <BellRing className="size-4 shrink-0 text-warning" aria-hidden />
          <h2 className="text-base font-semibold tracking-tight">Waiting on restock</h2>
        </div>
        <p className="text-xs text-muted-foreground">
          {waitingTotal.toLocaleString()} {waitingTotal === 1 ? "person" : "people"}{" "}
          across {rows.length} {rows.length === 1 ? "product" : "products"}
        </p>
      </div>

      <ul className="divide-y divide-border">
        {shown.map((row) => {
          // The catalog path is what makes a name like "LCD Display Assembly"
          // identifiable — there are several, one per model.
          const path = [row.company, row.productType, row.model]
            .filter(Boolean)
            .join(" · ");

          return (
            <li
              key={row.productId}
              className="flex items-center gap-3 px-5 py-3"
            >
              <Badge
                variant={row.waiting >= 5 ? "warning" : "secondary"}
                className="h-6 shrink-0 px-2.5 tabular-nums"
              >
                {row.waiting}
              </Badge>

              <div className="min-w-0 flex-1">
                <Link
                  href={`/admin/products?search=${encodeURIComponent(row.sku ?? row.name)}`}
                  className="truncate text-sm font-medium text-foreground hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                >
                  {row.name}
                </Link>
                <p className="truncate text-xs text-subtle">
                  {row.sku ? <span className="tabular-nums">{row.sku}</span> : null}
                  {row.sku && path ? " — " : ""}
                  {path}
                </p>
              </div>

              <span
                className={cn(
                  "shrink-0 text-xs font-medium tabular-nums",
                  row.stock === 0 ? "text-destructive" : "text-warning",
                )}
              >
                {row.stock} in stock
              </span>
            </li>
          );
        })}
      </ul>

      {rows.length > VISIBLE ? (
        <div className="border-t border-border px-5 py-3">
          <Button asChild variant="ghost" size="sm">
            <Link href="/admin/products?status=OUT_OF_STOCK">
              {rows.length - VISIBLE} more waiting
              <ChevronRight className="size-4" aria-hidden />
            </Link>
          </Button>
        </div>
      ) : null}
    </Card>
  );
}
