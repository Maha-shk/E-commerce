"use client";

import { useRouter } from "next/navigation";
import { Heart, Loader2, ShoppingCart } from "lucide-react";
import { AccountShell } from "@/components/account/AccountShell";
import { AccountPageHeader } from "@/components/account/AccountPageHeader";
import { AccountEmptyState } from "@/components/account/AccountEmptyState";
import { ProductCard } from "@/components/customer/ProductCard";
import { Button } from "@/components/ui/button";
import { useWishlist } from "@/lib/hooks/use-wishlist";

export default function WishlistPage() {
  const router = useRouter();
  const { wishlistItems, isLoading } = useWishlist();

  const count = wishlistItems.length;

  return (
    <AccountShell loadingLabel="Loading your wishlist…">
      <AccountPageHeader
        title="My Wishlist"
        description={
          isLoading
            ? "Products you've saved for later."
            : count === 1
              ? "1 product saved for later."
              : `${count} products saved for later.`
        }
      />

      {isLoading ? (
        <div className="flex flex-col items-center gap-3 py-16">
          <Loader2 className="size-6 animate-spin text-primary" aria-hidden />
          <p className="text-sm text-muted-foreground">Loading your wishlist…</p>
        </div>
      ) : count > 0 ? (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {wishlistItems.map((item) => (
            <ProductCard
              key={item.productId}
              product={{
                id: item.productId,
                name: item.name,
                price: item.price,
                salePrice: item.salePrice,
                discountPercent: item.discount,
                inStock: item.inStock,
                stock: item.stock,
                lowStock: item.lowStock,
                images: item.image ? [item.image] : [],
                category: item.category,
              }}
            />
          ))}
        </div>
      ) : (
        <AccountEmptyState
          bordered
          icon={Heart}
          title="Your wishlist is empty"
          description="Tap the heart on any product and it will be saved here for later."
          action={
            <>
              <Button size="lg" onClick={() => router.push("/products")}>
                <ShoppingCart className="size-4" aria-hidden />
                Explore Products
              </Button>
              <Button size="lg" variant="outline" onClick={() => router.push("/categories")}>
                Browse Categories
              </Button>
            </>
          }
        />
      )}
    </AccountShell>
  );
}
