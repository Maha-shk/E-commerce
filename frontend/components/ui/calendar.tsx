"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { cn } from "@/lib/utils";

const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

/**
 * Builds the 6x7 grid for a month, padded with the trailing/leading days of the
 * neighbouring months so every week row is full.
 */
function buildMonthGrid(month: Date): Date[] {
  const firstOfMonth = new Date(month.getFullYear(), month.getMonth(), 1);
  const gridStart = new Date(firstOfMonth);
  gridStart.setDate(1 - firstOfMonth.getDay());

  return Array.from({ length: 42 }, (_, i) => {
    const day = new Date(gridStart);
    day.setDate(gridStart.getDate() + i);
    return day;
  });
}

/** Month-grid date picker styled with the admin design tokens. */
export function Calendar({
  selected,
  onSelect,
  className,
}: {
  selected?: Date;
  onSelect: (date: Date | undefined) => void;
  className?: string;
}) {
  const today = startOfDay(new Date());
  const [month, setMonth] = React.useState(
    () => new Date((selected ?? today).getFullYear(), (selected ?? today).getMonth(), 1),
  );

  const days = buildMonthGrid(month);

  function shiftMonth(delta: number) {
    setMonth((m) => new Date(m.getFullYear(), m.getMonth() + delta, 1));
  }

  return (
    <div className={cn("w-70 p-3", className)}>
      {/* Month navigation */}
      <div className="flex items-center justify-between gap-2 pb-3">
        <button
          type="button"
          aria-label="Previous month"
          onClick={() => shiftMonth(-1)}
          className="flex size-8 items-center justify-center rounded-lg border border-input text-subtle outline-none transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          <ChevronLeft className="size-4" />
        </button>
        <p aria-live="polite" className="font-display text-sm font-semibold text-foreground">
          {MONTHS[month.getMonth()]} {month.getFullYear()}
        </p>
        <button
          type="button"
          aria-label="Next month"
          onClick={() => shiftMonth(1)}
          className="flex size-8 items-center justify-center rounded-lg border border-input text-subtle outline-none transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          <ChevronRight className="size-4" />
        </button>
      </div>

      {/* Weekday header */}
      <div className="grid grid-cols-7 gap-0.5 pb-1">
        {WEEKDAYS.map((day) => (
          <span
            key={day}
            className="flex h-7 items-center justify-center text-xs font-semibold uppercase tracking-wider text-subtle"
          >
            {day}
          </span>
        ))}
      </div>

      {/* Day grid */}
      <div className="grid grid-cols-7 gap-0.5">
        {days.map((day) => {
          const outside = day.getMonth() !== month.getMonth();
          const isSelected = !!selected && isSameDay(day, selected);
          const isToday = isSameDay(day, today);

          return (
            <button
              key={day.toISOString()}
              type="button"
              aria-label={day.toDateString()}
              aria-current={isToday ? "date" : undefined}
              aria-pressed={isSelected}
              onClick={() => onSelect(day)}
              className={cn(
                "flex size-9 items-center justify-center rounded-lg text-sm font-medium outline-none transition-colors focus-visible:ring-3 focus-visible:ring-ring/50",
                isSelected
                  ? "bg-primary text-primary-foreground shadow-sm hover:bg-primary/90"
                  : outside
                    ? "text-subtle/60 hover:bg-muted hover:text-foreground"
                    : "text-foreground hover:bg-muted",
                isToday && !isSelected && "ring-1 ring-inset ring-primary/40",
              )}
            >
              {day.getDate()}
            </button>
          );
        })}
      </div>

      {/* Footer shortcuts */}
      <div className="mt-3 flex items-center justify-between border-t pt-3">
        <button
          type="button"
          onClick={() => onSelect(undefined)}
          className="rounded-lg px-2 py-1 text-sm font-medium text-subtle outline-none transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          Clear
        </button>
        <button
          type="button"
          onClick={() => {
            setMonth(new Date(today.getFullYear(), today.getMonth(), 1));
            onSelect(today);
          }}
          className="rounded-lg px-2 py-1 text-sm font-medium text-primary outline-none transition-colors hover:bg-accent focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          Today
        </button>
      </div>
    </div>
  );
}
