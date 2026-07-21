"use client";

import { useState } from "react";
import { CalendarDays } from "lucide-react";
import { Popover, PopoverAnchor, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { parseDate, formatDate } from "@/lib/admin/discounts";

/* Shared field styles — matches the filled inputs used across admin forms. */
const fieldClass = "h-11 rounded-lg bg-muted/40";
const labelClass = "text-sm font-medium text-muted-foreground";

/**
 * Date field backed by our own calendar popover rather than the browser's
 * unstyleable native picker. The text input stays editable for fast entry.
 */
export function DateField({
  id,
  label,
  value,
  onChange,
}: {
  id: string;
  label: string;
  /** MM/DD/YYYY, matching how dates are stored on a Discount. */
  value: string;
  onChange: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="space-y-2">
      <label htmlFor={id} className={labelClass}>
        {label}
      </label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverAnchor asChild>
          <div className="relative">
            <Input
              id={id}
              className={`${fieldClass} pr-10`}
              placeholder="MM/DD/YYYY"
              value={value}
              onChange={(e) => onChange(e.target.value)}
            />
            <PopoverTrigger asChild>
              <button
                type="button"
                aria-label={`Pick ${label.toLowerCase()}`}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-subtle outline-none transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                <CalendarDays className="size-4" />
              </button>
            </PopoverTrigger>
          </div>
        </PopoverAnchor>
        {/* End-aligned so the calendar sits under (or over) the trigger icon. */}
        <PopoverContent align="end">
          <Calendar
            selected={parseDate(value)}
            onSelect={(date) => {
              onChange(date ? formatDate(date) : "");
              if (date) setOpen(false);
            }}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}
