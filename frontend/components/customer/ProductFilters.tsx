"use client";

import { useId, useState, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { formatMoney } from "@/lib/format";
import { cn } from "@/lib/utils";

export type PriceRange = { min: number; max: number };

export const PRICE_FLOOR = 0;
export const PRICE_CEILING = 5000;

export type FilterState = {
  categoryIds: string[];
  price: PriceRange;
  inStockOnly: boolean;
};

export const DEFAULT_FILTERS: FilterState = {
  categoryIds: [],
  price: { min: PRICE_FLOOR, max: PRICE_CEILING },
  inStockOnly: false,
};

/** Collapsible group inside the filter panel. */
function FilterSection({
  title,
  children,
  defaultOpen = true,
}: {
  title: string;
  children: ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const panelId = useId();

  return (
    <div className="border-b border-border py-4 first:pt-0 last:border-0 last:pb-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls={panelId}
        className="flex w-full items-center justify-between gap-2 rounded-md text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
      >
        <span className="eyebrow">{title}</span>
        <ChevronDown
          className={cn(
            "size-4 shrink-0 text-muted-foreground transition-transform duration-200",
            open && "rotate-180",
          )}
          aria-hidden
        />
      </button>

      {open ? (
        <div id={panelId} className="mt-3">
          {children}
        </div>
      ) : null}
    </div>
  );
}

/**
 * Two overlaid native range inputs.
 *
 * The previous version was a pair of <div> handles driven by global
 * `mousemove` listeners: no touch support, no keyboard support, and it kept
 * re-registering document listeners on every pixel of movement. Native inputs
 * give pointer, touch and arrow-key control for free.
 */
function PriceRangeSlider({
  value,
  onChange,
}: {
  value: PriceRange;
  onChange: (next: PriceRange) => void;
}) {
  const minPercent = (value.min / PRICE_CEILING) * 100;
  const maxPercent = (value.max / PRICE_CEILING) * 100;

  const thumb =
    "pointer-events-none absolute inset-x-0 top-1/2 h-0 w-full -translate-y-1/2 appearance-none bg-transparent " +
    "[&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:size-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-primary [&::-webkit-slider-thumb]:bg-card [&::-webkit-slider-thumb]:shadow-sm " +
    "[&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:size-4 [&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-primary [&::-moz-range-thumb]:bg-card";

  return (
    <div className="space-y-3">
      <div className="relative h-4">
        {/* Track */}
        <div className="absolute inset-x-0 top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-muted" />
        {/* Selected span */}
        <div
          className="absolute top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-primary"
          style={{ left: `${minPercent}%`, width: `${Math.max(0, maxPercent - minPercent)}%` }}
        />

        <input
          type="range"
          min={PRICE_FLOOR}
          max={PRICE_CEILING}
          step={10}
          value={value.min}
          aria-label="Minimum price"
          onChange={(e) =>
            onChange({ ...value, min: Math.min(Number(e.target.value), value.max - 10) })
          }
          className={thumb}
        />
        <input
          type="range"
          min={PRICE_FLOOR}
          max={PRICE_CEILING}
          step={10}
          value={value.max}
          aria-label="Maximum price"
          onChange={(e) =>
            onChange({ ...value, max: Math.max(Number(e.target.value), value.min + 10) })
          }
          className={thumb}
        />
      </div>

      <div className="flex items-center justify-between text-xs font-medium tabular-nums">
        <span className="text-muted-foreground">{formatMoney(value.min)}</span>
        <span className="text-foreground">
          {value.max >= PRICE_CEILING ? `${formatMoney(PRICE_CEILING)}+` : formatMoney(value.max)}
        </span>
      </div>
    </div>
  );
}

export function ProductFilters({
  categories,
  value,
  onChange,
  onReset,
  resultCount,
}: {
  categories: { id: string; name: string; productCount?: number }[];
  value: FilterState;
  onChange: (next: FilterState) => void;
  onReset: () => void;
  resultCount: number;
}) {
  const toggleCategory = (id: string) =>
    onChange({
      ...value,
      categoryIds: value.categoryIds.includes(id)
        ? value.categoryIds.filter((c) => c !== id)
        : [...value.categoryIds, id],
    });

  const isDirty =
    value.categoryIds.length > 0 ||
    value.inStockOnly ||
    value.price.min !== PRICE_FLOOR ||
    value.price.max !== PRICE_CEILING;

  return (
    <Card className="gap-0 py-0">
      <div className="flex items-center justify-between gap-2 border-b border-border px-5 pt-5 pb-4">
        <h2 className="text-base font-semibold tracking-tight">Filters</h2>
        {isDirty ? (
          <Button size="xs" variant="ghost" onClick={onReset} className="-mr-1.5">
            Clear all
          </Button>
        ) : null}
      </div>

      <div className="px-5 py-4">
        <FilterSection title="Category">
          {categories.length === 0 ? (
            <p className="text-sm text-muted-foreground">No categories yet.</p>
          ) : (
            <ul className="space-y-2.5">
              {categories.map((category) => {
                const id = `cat-${category.id}`;
                return (
                  <li key={category.id} className="flex items-center gap-2.5">
                    <Checkbox
                      id={id}
                      checked={value.categoryIds.includes(category.id)}
                      onCheckedChange={() => toggleCategory(category.id)}
                    />
                    <Label
                      htmlFor={id}
                      className="flex-1 justify-between gap-2 text-sm font-normal"
                    >
                      <span className="truncate">{category.name}</span>
                      {typeof category.productCount === "number" ? (
                        <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
                          {category.productCount}
                        </span>
                      ) : null}
                    </Label>
                  </li>
                );
              })}
            </ul>
          )}
        </FilterSection>

        <FilterSection title="Price range">
          <PriceRangeSlider
            value={value.price}
            onChange={(price) => onChange({ ...value, price })}
          />
        </FilterSection>

        <FilterSection title="Availability">
          <div className="flex items-center justify-between gap-3">
            <Label htmlFor="inStockOnly" className="text-sm font-normal">
              In stock only
            </Label>
            <Switch
              id="inStockOnly"
              checked={value.inStockOnly}
              onCheckedChange={(inStockOnly) => onChange({ ...value, inStockOnly })}
            />
          </div>
        </FilterSection>
      </div>

      <div className="border-t border-border px-5 py-3">
        <p className="text-xs text-muted-foreground">
          <span className="font-medium text-foreground tabular-nums">{resultCount}</span>{" "}
          {resultCount === 1 ? "product" : "products"} match
        </p>
      </div>
    </Card>
  );
}
