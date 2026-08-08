"use client";

import { useId, useState } from "react";
import { cn } from "@/lib/utils";

export type BarDatum = {
  /** X-axis label, e.g. "Jan". */
  label: string;
  value: number;
};

/**
 * Single-series column chart.
 *
 * Deliberately ONE measure per chart. The dashboard previously drew revenue (€)
 * and orders (a count) as adjacent bars, each scaled to its own maximum — so a
 * tall "orders" bar beside a short "revenue" bar carried no meaning. Two
 * measures on different scales must be two charts (small multiples), never two
 * scales in one plot.
 *
 * Mark spec: bars capped at 24px with a 4px rounded cap and a square baseline,
 * a 2px surface gap between neighbours, recessive axis, and a hover tooltip on
 * every column. A visually-hidden table carries the same numbers for screen
 * readers and as the non-visual "table view".
 */
export function MiniBarChart({
  data,
  title,
  formatValue,
  summary,
  className,
  height = "h-40",
}: {
  data: BarDatum[];
  /** Names the series — with one series this replaces a legend. */
  title: string;
  formatValue: (value: number) => string;
  /** Optional headline shown at the right of the title row. */
  summary?: string;
  className?: string;
  height?: string;
}) {
  const tableId = useId();
  const [hovered, setHovered] = useState<number | null>(null);

  // Bars are drawn as a share of this chart's own maximum.
  const max = Math.max(1, ...data.map((d) => d.value));
  const peakIndex = data.reduce(
    (best, d, i) => (d.value > data[best].value ? i : best),
    0,
  );

  return (
    <figure className={cn("min-w-0", className)}>
      <figcaption className="mb-3 flex items-baseline justify-between gap-3">
        <span className="text-sm font-semibold text-foreground">{title}</span>
        {summary ? (
          <span className="text-xs text-muted-foreground tabular-nums">{summary}</span>
        ) : null}
      </figcaption>

      <div
        className={cn("relative flex items-end gap-2", height)}
        role="img"
        aria-describedby={tableId}
        aria-label={`${title} by month`}
      >
        {data.map((datum, i) => {
          const pct = (datum.value / max) * 100;
          const isPeak = i === peakIndex && datum.value > 0;
          const isHovered = hovered === i;

          return (
            <div
              key={datum.label}
              className="group relative flex h-full flex-1 items-end"
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)}
            >
              {/* Full-height hit target: the bar itself can be 2px tall. */}
              <span className="absolute inset-0" aria-hidden />

              <div
                // 4px rounded cap, square baseline. Capped width so the bar
                // never fills its band — the leftover is intentional air.
                className={cn(
                  "mx-auto w-full max-w-6 rounded-t-[4px] transition-[height,background-color] duration-300 ease-out",
                  isHovered || isPeak ? "bg-primary" : "bg-primary/45",
                )}
                style={{ height: `${Math.max(pct, datum.value > 0 ? 2 : 0)}%` }}
              />

              {/* Tooltip */}
              <div
                role="tooltip"
                className={cn(
                  "pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 -translate-x-1/2 rounded-md bg-foreground px-2 py-1 text-xs font-medium whitespace-nowrap text-background shadow-md",
                  "opacity-0 transition-opacity duration-150",
                  isHovered && "opacity-100",
                )}
              >
                {datum.label}: <span className="tabular-nums">{formatValue(datum.value)}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Baseline + month labels */}
      <div className="mt-2 flex gap-2 border-t border-border pt-2">
        {data.map((datum, i) => (
          <span
            key={datum.label}
            className={cn(
              "flex-1 text-center text-xs font-medium",
              i === peakIndex ? "text-foreground" : "text-muted-foreground",
            )}
          >
            {datum.label}
          </span>
        ))}
      </div>

      {/* Table view — same numbers, for screen readers and copy/paste. */}
      <table id={tableId} className="sr-only">
        <caption>{title} by month</caption>
        <thead>
          <tr>
            <th scope="col">Month</th>
            <th scope="col">{title}</th>
          </tr>
        </thead>
        <tbody>
          {data.map((datum) => (
            <tr key={datum.label}>
              <th scope="row">{datum.label}</th>
              <td>{formatValue(datum.value)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}
