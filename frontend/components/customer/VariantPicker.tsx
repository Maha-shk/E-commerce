"use client";

import { useRef } from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

type Variant = { id: string; name: string };

/**
 * Chip-style variant selector with correct radiogroup behaviour.
 *
 * ARIA requires a radiogroup to be a SINGLE tab stop, with arrow keys moving
 * between options — not one tab stop per option. This implements that roving
 * tabindex, so a keyboard user tabs into the group once and arrows through the
 * choices, exactly like a native radio set.
 */
export function VariantPicker({
  variants,
  value,
  onChange,
  label = "Variant",
}: {
  variants: Variant[];
  value: string | null;
  onChange: (id: string) => void;
  label?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Nothing chosen yet → the first chip carries the group's tab stop.
  const activeIndex = Math.max(
    0,
    variants.findIndex((v) => v.id === value),
  );

  const focusAt = (index: number) => {
    const next = (index + variants.length) % variants.length;
    onChange(variants[next].id);
    // Move focus with selection, which is the expected radiogroup behaviour.
    const nodes = containerRef.current?.querySelectorAll<HTMLButtonElement>(
      '[role="radio"]',
    );
    nodes?.[next]?.focus();
  };

  const onKeyDown = (e: React.KeyboardEvent, index: number) => {
    switch (e.key) {
      case "ArrowRight":
      case "ArrowDown":
        e.preventDefault();
        focusAt(index + 1);
        break;
      case "ArrowLeft":
      case "ArrowUp":
        e.preventDefault();
        focusAt(index - 1);
        break;
      case "Home":
        e.preventDefault();
        focusAt(0);
        break;
      case "End":
        e.preventDefault();
        focusAt(variants.length - 1);
        break;
    }
  };

  return (
    <div
      ref={containerRef}
      role="radiogroup"
      aria-label={`Select a ${label.toLowerCase()}`}
      aria-required
      className="flex flex-wrap gap-2"
    >
      {variants.map((variant, index) => {
        const isSelected = value === variant.id;

        return (
          <button
            key={variant.id}
            type="button"
            role="radio"
            aria-checked={isSelected}
            // Exactly one chip is reachable by Tab; arrows do the rest.
            tabIndex={index === activeIndex ? 0 : -1}
            onClick={() => onChange(variant.id)}
            onKeyDown={(e) => onKeyDown(e, index)}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-lg border px-4 py-2 text-sm font-medium",
              "transition-colors duration-150",
              "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
              isSelected
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-card text-foreground hover:border-primary hover:bg-muted",
            )}
          >
            {isSelected ? <Check className="size-3.5" aria-hidden /> : null}
            {variant.name}
          </button>
        );
      })}
    </div>
  );
}
