"use client";

import { useMemo, useState } from "react";
import { Check, ChevronDown, PackageOpen, SlidersHorizontal, X } from "lucide-react";
import { ProductCard } from "@/components/customer/ProductCard";
import { PageIntro } from "@/components/customer/PageIntro";
import {
  DEFAULT_FILTERS,
  PRICE_CEILING,
  PRICE_FLOOR,
  ProductFilters,
  type FilterState,
} from "@/components/customer/ProductFilters";
import { EmptyState, ErrorState, LoadingState } from "@/components/customer/StateBlock";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useProducts } from "@/lib/hooks/use-customer";
import type { Product } from "@/lib/api/services/public";
import { useCategories } from "@/lib/hooks/use-homepage";
import { cn } from "@/lib/utils";

const SORT_OPTIONS = [
  { value: "newest", label: "Newest first" },
  { value: "price-low", label: "Price: low to high" },
  { value: "price-high", label: "Price: high to low" },
  { value: "name", label: "Name: A to Z" },
] as const;

type SortValue = (typeof SORT_OPTIONS)[number]["value"];

/**
 * The complete product-listing experience: filters, sort and grid.
 *
 * /products, /new-arrivals, /best-sellers and /sales were four copies of the
 * same ~470-line file that differed only in their page title and one query
 * flag — and had already drifted apart. They are now thin wrappers around this.
 */
export function ProductBrowser({
  title,
  description,
  query,
  emptyMessage = "Try adjusting your filters.",
  guard,
}: {
  title: string;
  description?: string;
  /**
   * Extra params merged into the products query, e.g. `{ sale: true }`.
   *
   * Any level of the hierarchy scopes the list — `companyId` is a brand page,
   * `modelId` is "parts that fit this model".
   */
  query?: {
    categoryId?: string;
    companyId?: string;
    productTypeId?: string;
    modelId?: string;
    search?: string;
    bestsellers?: boolean;
    newArrivals?: boolean;
    sale?: boolean;
  };
  emptyMessage?: string;
  /**
   * Client-side safety net applied before the user's own filters, for pages
   * whose definition must hold regardless of what the API returns (e.g. /sales
   * must never show a product that isn't discounted).
   */
  guard?: (product: Product) => boolean;
}) {
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);
  const [sortBy, setSortBy] = useState<SortValue>("newest");
  const [filtersOpen, setFiltersOpen] = useState(false);

  const {
    data: raw,
    isPending,
    isError,
    refetch,
  } = useProducts({ ...query, limit: 50 });

  // Applied before anything else, so the category list and the grid agree.
  const products = useMemo(
    () => (guard ? (raw ?? []).filter(guard) : (raw ?? [])),
    [raw, guard],
  );

  // Real categories from the API. The old pages filtered against a hardcoded
  // ["Electronics", "Audio", "Accessories", "Cameras", "Gaming"] list, so
  // ticking a box usually matched nothing at all.
  const { data: allCategories } = useCategories(100);

  // Only offer categories that actually appear in this result set.
  const categories = useMemo(() => {
    if (!allCategories) return [];
    const present = new Set(products.map((p) => p.categoryId).filter(Boolean));
    return allCategories
      .filter((c) => present.has(c.id))
      .map((c) => ({ id: c.id, name: c.name, productCount: c.productCount }));
  }, [products, allCategories]);

  /*
   * Brands are derived from the products on screen rather than fetched.
   *
   * `/public/brands` lists every company with a public product anywhere in the
   * store, which on a page like /sales would offer brands that have nothing on
   * sale. Reading them off the result set keeps the facet honest, and the
   * counts with it.
   */
  const brands = useMemo(() => {
    const counts = new Map<string, { id: string; name: string; productCount: number }>();
    for (const product of products) {
      if (!product.company) continue;
      const existing = counts.get(product.company.id);
      if (existing) {
        existing.productCount += 1;
      } else {
        counts.set(product.company.id, {
          id: product.company.id,
          name: product.company.name,
          productCount: 1,
        });
      }
    }
    return [...counts.values()].sort((a, b) => a.name.localeCompare(b.name));
  }, [products]);

  const visible = useMemo(() => {
    const list = products.filter((product) => {
      if (filters.categoryIds.length > 0) {
        if (!product.categoryId || !filters.categoryIds.includes(product.categoryId)) {
          return false;
        }
      }
      if (filters.companyIds.length > 0) {
        if (!product.company || !filters.companyIds.includes(product.company.id)) {
          return false;
        }
      }
      if (filters.inStockOnly && !product.inStock) return false;
      if (product.salePrice < filters.price.min) return false;
      // The ceiling doubles as "and above", so don't cap at the top of the range.
      if (filters.price.max < PRICE_CEILING && product.salePrice > filters.price.max) {
        return false;
      }
      return true;
    });

    return list.sort((a, b) => {
      switch (sortBy) {
        case "price-low":
          return a.salePrice - b.salePrice;
        case "price-high":
          return b.salePrice - a.salePrice;
        case "name":
          return a.name.localeCompare(b.name);
        default:
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
    });
  }, [products, filters, sortBy]);

  const activeFilterCount =
    filters.categoryIds.length +
    filters.companyIds.length +
    (filters.inStockOnly ? 1 : 0) +
    (filters.price.min !== PRICE_FLOOR || filters.price.max !== PRICE_CEILING ? 1 : 0);

  const currentSort =
    SORT_OPTIONS.find((o) => o.value === sortBy)?.label ?? SORT_OPTIONS[0].label;

  const panel = (
    <ProductFilters
      categories={categories}
      brands={brands}
      value={filters}
      onChange={setFilters}
      onReset={() => setFilters(DEFAULT_FILTERS)}
      resultCount={visible.length}
    />
  );

  return (
    <>
      <PageIntro title={title} description={description} />

      <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
        {/* Desktop filter rail */}
        <aside className="hidden w-72 shrink-0 lg:sticky lg:top-24 lg:block lg:self-start">
          {panel}
        </aside>

        <div className="min-w-0 flex-1">
          {/* Toolbar */}
          <div className="mb-5 flex items-center justify-between gap-3">
            <Button
              variant="outline"
              className="lg:hidden"
              onClick={() => setFiltersOpen((v) => !v)}
              aria-expanded={filtersOpen}
            >
              <SlidersHorizontal className="size-4" aria-hidden />
              Filters
              {activeFilterCount > 0 ? (
                <span className="ml-0.5 flex size-5 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground tabular-nums">
                  {activeFilterCount}
                </span>
              ) : null}
            </Button>

            <p className="hidden text-sm text-muted-foreground lg:block">
              Showing{" "}
              <span className="font-medium text-foreground tabular-nums">
                {visible.length}
              </span>{" "}
              {visible.length === 1 ? "product" : "products"}
            </p>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">
                  <span className="text-muted-foreground">Sort:</span>
                  {currentSort}
                  <ChevronDown className="size-4" aria-hidden />
                </Button>
              </DropdownMenuTrigger>
              {/* Replaces a hand-rolled dropdown that never closed on outside
                  click or Escape and had no keyboard navigation. */}
              <DropdownMenuContent align="end" className="w-56">
                {SORT_OPTIONS.map((option) => (
                  <DropdownMenuItem
                    key={option.value}
                    onSelect={() => setSortBy(option.value)}
                    className="justify-between"
                  >
                    {option.label}
                    {sortBy === option.value ? (
                      <Check className="size-4" aria-hidden />
                    ) : null}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Mobile filter panel */}
          {filtersOpen ? (
            <div className="mb-5 lg:hidden">
              <div className="mb-2 flex justify-end">
                <Button size="sm" variant="ghost" onClick={() => setFiltersOpen(false)}>
                  <X className="size-4" aria-hidden />
                  Close
                </Button>
              </div>
              {panel}
            </div>
          ) : null}

          {isError ? (
            <ErrorState
              title="Couldn't load products"
              description="Something went wrong on our side."
              onRetry={() => refetch()}
            />
          ) : isPending ? (
            <LoadingState label="Loading products…" />
          ) : visible.length === 0 ? (
            <EmptyState
              icon={PackageOpen}
              bordered
              title="No products found"
              description={emptyMessage}
              action={
                activeFilterCount > 0 ? (
                  <Button variant="outline" onClick={() => setFilters(DEFAULT_FILTERS)}>
                    Clear filters
                  </Button>
                ) : undefined
              }
            />
          ) : (
            <div
              className={cn(
                "grid gap-5",
                "grid-cols-1 sm:grid-cols-2 xl:grid-cols-3",
              )}
            >
              {visible.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
