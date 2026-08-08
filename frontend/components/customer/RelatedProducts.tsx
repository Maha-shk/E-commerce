"use client";

import { Loader2 } from "lucide-react";
import { useRelatedProducts } from "@/lib/hooks/use-customer";
import { ProductCard } from "@/components/customer/ProductCard";
import { SectionHeading } from "@/components/customer/SectionHeading";

/**
 * "You might also like" rail on the product page.
 *
 * Now renders the same `ProductCard` as every other product grid on the site,
 * instead of its own bespoke card with raw `<img>` tags.
 */
export function RelatedProducts({
  categoryId,
  currentProductId,
  categoryName,
  limit = 4,
}: {
  categoryId: string | null;
  currentProductId: string;
  categoryName?: string;
  limit?: number;
}) {
  const { data: related, isPending } = useRelatedProducts(
    categoryId,
    currentProductId,
    limit,
  );

  if (!categoryId) return null;

  if (isPending) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="size-6 animate-spin text-muted-foreground" aria-hidden />
      </div>
    );
  }

  if (!related || related.length === 0) return null;

  return (
    <section aria-label="Related products">
      <SectionHeading
        title="You might also like"
        description={categoryName ? `More from ${categoryName}` : undefined}
      />
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {related.slice(0, limit).map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  );
}
