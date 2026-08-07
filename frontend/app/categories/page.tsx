"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { LayoutGrid, Search, X } from "lucide-react";
import { CustomerPageShell } from "@/components/customer/CustomerPageShell";
import { PageIntro } from "@/components/customer/PageIntro";
import { ProductImage } from "@/components/customer/ProductImage";
import { EmptyState, ErrorState, LoadingState } from "@/components/customer/StateBlock";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useCategories } from "@/lib/hooks/use-homepage";
import { useDebounce } from "@/lib/hooks/use-debounce";
import { cn } from "@/lib/utils";

export default function CategoriesPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const search = useDebounce(searchQuery, 200);

  const { data: categories, isPending, isError, refetch } = useCategories(100);

  const visible = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return categories ?? [];
    return (categories ?? []).filter(
      (category) =>
        category.name.toLowerCase().includes(query) ||
        category.description?.toLowerCase().includes(query),
    );
  }, [categories, search]);

  return (
    <CustomerPageShell>
      <PageIntro
        title="Categories"
        description="Browse the full range by category."
        action={
          <div className="relative">
            <Search
              className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden
            />
            <Input
              type="text"
              inputMode="search"
              placeholder="Search categories…"
              aria-label="Search categories"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={cn("h-10 pl-9", searchQuery && "pr-9")}
            />
            {searchQuery ? (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                aria-label="Clear search"
                className="absolute top-1/2 right-1.5 flex size-7 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
              >
                <X className="size-4" aria-hidden />
              </button>
            ) : null}
          </div>
        }
      />

      {isError ? (
        <ErrorState title="Couldn't load categories" onRetry={() => refetch()} />
      ) : isPending ? (
        <LoadingState label="Loading categories…" />
      ) : visible.length === 0 ? (
        <EmptyState
          bordered
          icon={LayoutGrid}
          title="No categories found"
          description={
            search ? `Nothing matches “${search.trim()}”.` : "No categories have been set up yet."
          }
          action={
            search ? (
              <Button variant="outline" onClick={() => setSearchQuery("")}>
                Clear search
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((category) => (
            <Link
              key={category.id}
              href={`/categories/${category.slug}`}
              className="group flex flex-col overflow-hidden rounded-xl bg-card ring-1 ring-foreground/10 transition-shadow duration-150 hover:shadow-card-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            >
              <div className="relative aspect-16/10 overflow-hidden bg-muted">
                <ProductImage
                  src={category.thumbnailName}
                  sizes="(max-width: 640px) 90vw, (max-width: 1024px) 45vw, 400px"
                  className="transition-transform duration-300 group-hover:scale-105"
                />
                <span className="absolute top-3 right-3 rounded-full bg-card/90 px-2.5 py-1 text-xs font-semibold text-foreground shadow-sm backdrop-blur-sm tabular-nums">
                  {category.productCount}{" "}
                  {category.productCount === 1 ? "product" : "products"}
                </span>
              </div>

              <div className="flex flex-1 flex-col p-5">
                <h2 className="text-base font-semibold tracking-tight group-hover:text-primary">
                  {category.name}
                </h2>
                {category.description ? (
                  <p className="mt-1.5 line-clamp-2 text-sm text-muted-foreground">
                    {category.description}
                  </p>
                ) : null}
              </div>
            </Link>
          ))}
        </div>
      )}
    </CustomerPageShell>
  );
}
