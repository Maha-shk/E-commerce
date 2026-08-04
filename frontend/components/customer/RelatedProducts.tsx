"use client";

import Link from "next/link";
import { useRelatedProducts } from "@/lib/hooks/use-customer";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Package, Loader2 } from "lucide-react";

interface RelatedProductsProps {
  categoryId: string | null;
  currentProductId: string;
  limit?: number;
}

export function RelatedProducts({
  categoryId,
  currentProductId,
  limit = 4,
}: RelatedProductsProps) {
  const { data: relatedProducts, isLoading } = useRelatedProducts(
    categoryId,
    currentProductId,
    limit
  );

  if (!categoryId) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!relatedProducts || relatedProducts.length === 0) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-2xl font-bold text-foreground">
            Related Products
          </h2>
          <p className="text-sm text-muted-foreground">Complete your style</p>
        </div>
        <Link href="/products">
          <Button variant="link" className="text-primary">
            View Collection →
          </Button>
        </Link>
      </div>

      {/* Products Grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {relatedProducts.slice(0, limit).map((product) => (
          <Link key={product.id} href={`/products/${product.id}`}>
            <Card className="h-full overflow-hidden transition-shadow hover:shadow-lg">
              <CardContent className="p-4">
                {/* Product Image */}
                <div className="relative aspect-square w-full overflow-hidden rounded-lg bg-muted mb-4">
                  {product.images && product.images.length > 0 ? (
                    <img
                      src={product.images[0].url}
                      alt={product.name}
                      className="size-full object-cover transition-transform hover:scale-105"
                    />
                  ) : (
                    <div className="flex size-full items-center justify-center">
                      <Package className="size-12 text-muted-foreground" />
                    </div>
                  )}

                  {/* Sale Badge */}
                  {product.discountPercent > 0 && (
                    <div className="absolute right-2 top-2 rounded-full bg-orange-500 px-2 py-1 text-xs font-semibold text-white">
                      -{product.discountPercent}%
                    </div>
                  )}

                  {/* Low Stock Badge */}
                  {product.lowStock && product.inStock && (
                    <div className="absolute left-2 top-2 rounded-full bg-red-500 px-2 py-1 text-xs font-semibold text-white">
                      Low Stock
                    </div>
                  )}

                  {/* Out of Stock Overlay */}
                  {!product.inStock && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                      <span className="rounded bg-destructive px-3 py-1 text-sm font-semibold text-white">
                        Out of Stock
                      </span>
                    </div>
                  )}
                </div>

                {/* Product Info */}
                <div className="space-y-2">
                  {/* Product Name */}
                  <h3 className="truncate text-sm font-semibold text-foreground">
                    {product.name}
                  </h3>

                  {/* Brand */}
                  <p className="text-xs text-muted-foreground">{product.brand}</p>

                  {/* Price */}
                  <div className="flex items-baseline gap-2">
                    <span className="font-display text-lg font-bold text-foreground">
                      €{(product.salePrice || product.price).toFixed(2)}
                    </span>
                    {product.discountPercent > 0 && (
                      <span className="text-xs text-muted-foreground line-through">
                        €{product.price.toFixed(2)}
                      </span>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
