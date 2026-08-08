"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { ChevronRight, LayoutGrid } from "lucide-react";
import { CustomerPageShell } from "@/components/customer/CustomerPageShell";
import { ProductBrowser } from "@/components/customer/ProductBrowser";
import { EmptyState, LoadingState } from "@/components/customer/StateBlock";
import { Button } from "@/components/ui/button";
import { useCategoryBySlug } from "@/lib/hooks/use-homepage";

/**
 * A category is just the product listing scoped to one categoryId, so it runs
 * through the same `ProductBrowser` as /products, /sales and the rest.
 *
 * This page previously carried its own ~355-line copy of the filter sidebar,
 * sort dropdown and grid — which is why it still looked like the old design
 * after everything else was updated.
 */
export default function CategoryDetailPage() {
  const params = useParams();
  const slug = typeof params.slug === "string" ? params.slug : "";

  const { data: category, isPending } = useCategoryBySlug(slug);

  if (isPending) {
    return (
      <CustomerPageShell>
        <LoadingState label="Loading category…" />
      </CustomerPageShell>
    );
  }

  if (!category) {
    return (
      <CustomerPageShell>
        <EmptyState
          bordered
          icon={LayoutGrid}
          title="Category not found"
          description="This category doesn't exist, or it's no longer available."
          action={
            <Button asChild variant="outline">
              <Link href="/categories">Browse all categories</Link>
            </Button>
          }
        />
      </CustomerPageShell>
    );
  }

  return (
    <CustomerPageShell>
      <nav aria-label="Breadcrumb" className="mb-6">
        <ol className="flex flex-wrap items-center gap-1.5 text-sm">
          <li>
            <Link
              href="/categories"
              className="rounded-md text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            >
              Categories
            </Link>
          </li>
          <ChevronRight className="size-3.5 text-muted-foreground" aria-hidden />
          <li className="font-medium" aria-current="page">
            {category.name}
          </li>
        </ol>
      </nav>

      <ProductBrowser
        title={category.name}
        description={
          category.description ||
          `${category.productCount} ${category.productCount === 1 ? "product" : "products"} in this category.`
        }
        query={{ categoryId: category.id }}
        emptyMessage="Nothing in this category matches your filters."
      />
    </CustomerPageShell>
  );
}
