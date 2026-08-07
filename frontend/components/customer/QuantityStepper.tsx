"use client";

import { Minus, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Segmented −/quantity/+ control.
 *
 * Rendered as one bordered group rather than three loose circles so the
 * quantity reads as a single control, and the number sits in a fixed-width
 * tabular slot so the row doesn't reflow going from 9 to 10.
 */
export function QuantityStepper({
  value,
  min = 1,
  max,
  disabled = false,
  onChange,
  label = "Quantity",
}: {
  value: number;
  min?: number;
  max: number;
  disabled?: boolean;
  onChange: (next: number) => void;
  label?: string;
}) {
  const canDecrease = !disabled && value > min;
  const canIncrease = !disabled && value < max;

  const buttonClass =
    "flex size-9 items-center justify-center text-foreground transition-colors hover:bg-muted disabled:pointer-events-none disabled:opacity-40 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring";

  return (
    <div
      className={cn(
        "inline-flex items-center overflow-hidden rounded-lg border border-border bg-card",
        disabled && "opacity-60",
      )}
    >
      <button
        type="button"
        onClick={() => onChange(value - 1)}
        disabled={!canDecrease}
        aria-label={`Decrease ${label.toLowerCase()}`}
        className={cn(buttonClass, "border-r border-border")}
      >
        <Minus className="size-3.5" aria-hidden />
      </button>

      <span
        aria-live="polite"
        aria-label={`${label}: ${value}`}
        className="w-10 text-center text-sm font-semibold tabular-nums"
      >
        {value}
      </span>

      <button
        type="button"
        onClick={() => onChange(value + 1)}
        disabled={!canIncrease}
        aria-label={`Increase ${label.toLowerCase()}`}
        title={value >= max ? `Only ${max} in stock` : undefined}
        className={cn(buttonClass, "border-l border-border")}
      >
        <Plus className="size-3.5" aria-hidden />
      </button>
    </div>
  );
}
