"use client";

import { useState } from "react";
import Link from "next/link";
import { Heart, Loader2, ShoppingCart } from "lucide-react";
import { useSession } from "@/lib/hooks/use-auth";
import { useWishlist } from "@/lib/hooks/use-wishlist";
import { useCart } from "@/lib/hooks/use-cart";
import { ProductImage } from "@/components/customer/ProductImage";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { LoginRequiredDialog } from "@/components/ui/login-required-dialog";
import { Button } from "@/components/ui/button";
import { formatMoney } from "@/lib/format";
import { cn } from "@/lib/utils";

interface ProductCardProps {
  product: {
    id: string;
    name: string;
    price: number;
    salePrice: number;
    discountPercent: number;
    inStock: boolean;
    stock: number;
    lowStock?: boolean;
    images?: { url: string }[];
    category?: { name: string } | null;
  };
}

export function ProductCard({ product }: ProductCardProps) {
  const { isAuthenticated } = useSession();
  const { isInWishlist, addToWishlist, removeFromWishlist } = useWishlist();
  const { addItem } = useCart();

  const [pendingRemove, setPendingRemove] = useState<string | null>(null);
  const [loginRequiredAction, setLoginRequiredAction] = useState<"add to wishlist" | null>(
    null,
  );
  const [isAdding, setIsAdding] = useState(false);

  const inWishlist = isInWishlist(product.id);
  const href = `/products/${product.id}`;

  const handleWishlistClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isAuthenticated) {
      setLoginRequiredAction("add to wishlist");
      return;
    }

    if (inWishlist) {
      setPendingRemove(product.id);
    } else {
      // Ensure we always store ID as string for consistency
      addToWishlist(product.id.toString());
    }
  };

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    setIsAdding(true);
    try {
      await addItem(product.id, 1);
    } catch {
      // useCart already surfaced the reason as a toast.
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <>
      {/*
       * `isolate` + a stretched link. The image and title used to be two
       * separate <button>s calling router.push, which meant no middle-click,
       * no "open in new tab" and no href for crawlers. One <Link> now covers
       * the card, with the wishlist/cart controls raised above it.
       */}
      <div className="group/card relative isolate flex h-full flex-col overflow-hidden rounded-xl bg-card ring-1 ring-foreground/10 transition-shadow duration-150 hover:shadow-card-hover">
        {/* Image */}
        <div className="relative aspect-square overflow-hidden bg-muted">
          <ProductImage
            src={product.images?.[0]?.url}
            // Without this Next serves a full-viewport-width source for a
            // ~270px card, which is most of the homepage's image weight.
            sizes="(max-width: 640px) 90vw, (max-width: 1024px) 45vw, 280px"
            className="transition-transform duration-300 group-hover/card:scale-105"
          />

          {/* Badges. Deliberately NOT z-raised: they paint above the image by
              source order, but stay below the stretched title link so they
              never eat a click meant for the product page. */}
          {product.discountPercent > 0 ? (
            <span className="absolute top-3 left-3 rounded-full bg-orange-500 px-2 py-0.5 text-xs font-semibold text-white shadow-sm">
              −{product.discountPercent}%
            </span>
          ) : null}

          {product.lowStock && product.inStock ? (
            <span className="absolute top-3 right-3 rounded-full bg-destructive px-2 py-0.5 text-xs font-semibold text-white shadow-sm">
              Low stock
            </span>
          ) : null}

          {!product.inStock ? (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50">
              <span className="rounded-full bg-card px-3 py-1 text-sm font-semibold text-foreground">
                Out of stock
              </span>
            </div>
          ) : null}
        </div>

        {/* Info */}
        <div className="flex flex-1 flex-col p-4">
          <div className="flex items-start justify-between gap-2">
            <p className="min-w-0 truncate text-xs text-muted-foreground">
              {product.category?.name ?? " "}
            </p>

            <button
              type="button"
              onClick={handleWishlistClick}
              aria-pressed={inWishlist}
              aria-label={inWishlist ? "Remove from wishlist" : "Add to wishlist"}
              className={cn(
                "relative z-20 -mt-1 -mr-1 flex size-7 shrink-0 items-center justify-center rounded-full transition-colors duration-150",
                "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
                inWishlist
                  ? "text-red-500 hover:bg-red-500/10"
                  : "text-muted-foreground hover:bg-muted hover:text-red-500",
              )}
            >
              <Heart className={cn("size-4.5", inWishlist && "fill-current")} aria-hidden />
            </button>
          </div>

          <h3 className="mt-1 line-clamp-2 text-sm leading-snug font-semibold tracking-tight">
            <Link
              href={href}
              className="after:absolute after:inset-0 after:z-10 after:content-[''] hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            >
              {product.name}
            </Link>
          </h3>

          {/* Price + stock, pushed to the bottom so cards with 1- and 2-line
              titles still align their price rows across the grid. */}
          <div className="mt-auto pt-3">
            <div className="flex items-baseline justify-between gap-2">
              <div className="flex items-baseline gap-1.5">
                <span className="text-base font-semibold tabular-nums text-orange-600">
                  {formatMoney(product.salePrice)}
                </span>
                {product.discountPercent > 0 ? (
                  <span className="text-xs tabular-nums text-muted-foreground line-through">
                    {formatMoney(product.price)}
                  </span>
                ) : null}
              </div>

              {product.inStock && !product.lowStock ? (
                <span className="text-xs font-medium text-success">In stock</span>
              ) : product.inStock ? (
                <span className="text-xs font-medium text-warning">
                  {product.stock} left
                </span>
              ) : null}
            </div>

            <Button
              className="relative z-20 mt-3 w-full"
              disabled={!product.inStock || isAdding}
              onClick={handleAddToCart}
            >
              {isAdding ? (
                <Loader2 className="size-4 animate-spin" aria-hidden />
              ) : (
                <ShoppingCart className="size-4" aria-hidden />
              )}
              {product.inStock ? "Add to Cart" : "Out of Stock"}
            </Button>
          </div>
        </div>
      </div>

      {/* Confirm Remove from Wishlist Dialog */}
      {pendingRemove ? (
        <ConfirmDialog
          open={pendingRemove !== null}
          onOpenChange={(open) => !open && setPendingRemove(null)}
          title="Remove from Wishlist?"
          description={
            <span>
              Are you sure you want to remove{" "}
              <span className="font-semibold text-foreground">{product.name}</span> from your
              wishlist?
            </span>
          }
          confirmLabel="Remove"
          cancelLabel="Cancel"
          onConfirm={() => {
            removeFromWishlist(pendingRemove);
            setPendingRemove(null);
          }}
        />
      ) : null}

      {/* Login Required Dialog */}
      {loginRequiredAction ? (
        <LoginRequiredDialog
          open={loginRequiredAction !== null}
          onOpenChange={(open) => !open && setLoginRequiredAction(null)}
          action={loginRequiredAction}
        />
      ) : null}
    </>
  );
}
