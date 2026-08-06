"use client";

import { Heart, ShoppingCart } from "lucide-react";
import { useSession } from "@/lib/hooks/use-auth";
import { useWishlist } from "@/lib/hooks/use-wishlist";
import { useCart } from "@/lib/hooks/use-cart";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useState } from "react";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { LoginRequiredDialog } from "@/components/ui/login-required-dialog";
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
  const router = useRouter();
  const { isAuthenticated } = useSession();
  const { isInWishlist, addToWishlist, removeFromWishlist } = useWishlist();
  const { addItem } = useCart();
  const [pendingRemove, setPendingRemove] = useState<string | null>(null);
  const [loginRequiredAction, setLoginRequiredAction] = useState<"add to wishlist" | "add to cart" | null>(null);

  const inWishlist = isInWishlist(product.id);

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

  const handleRemoveConfirm = () => {
    if (pendingRemove) {
      removeFromWishlist(pendingRemove);
      setPendingRemove(null);
    }
  };

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isAuthenticated) {
      setLoginRequiredAction("add to cart");
      return;
    }

    try {
      await addItem(product.id, 1);
    } catch (error) {
      console.error('Failed to add to cart:', error);
    }
  };

  return (
    <>
      <div className="bg-card rounded-xl border border-border hover:shadow-lg transition-all overflow-hidden group">
        {/* Product Image */}
        <div className="relative h-56 overflow-hidden bg-muted rounded-t-xl">
          <button
            onClick={() => router.push(`/products/${product.id}`)}
            className="w-full h-full"
          >
            {product.images && product.images.length > 0 ? (
              <Image
                src={product.images[0].url}
                alt={product.name}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-300"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <div className="text-muted-foreground">
                  <svg className="w-12 h-12 mx-auto mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                  <p className="text-xs text-center">No Image</p>
                </div>
              </div>
            )}
          </button>

          {/* Sale Badge */}
          {product.discountPercent > 0 && (
            <div className="absolute top-3 left-3 bg-orange-500 text-white px-2 py-1 rounded-full text-xs font-bold shadow-md z-10">
              -{product.discountPercent}%
            </div>
          )}

          {/* Low Stock Badge */}
          {product.lowStock && product.inStock && (
            <div className="absolute top-3 right-3 bg-red-500 text-white px-2 py-1 rounded-full text-xs font-bold z-10">
              Low Stock
            </div>
          )}

          {/* Out of Stock Overlay */}
          {!product.inStock && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-10">
              <span className="bg-destructive text-white px-3 py-1 rounded-full text-sm font-bold">
                Out of Stock
              </span>
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="p-4">
          {/* Category and Wishlist Heart */}
          <div className="flex items-center justify-between mb-1">
            {product.category && (
              <p className="text-xs text-muted-foreground">
                {product.category.name}
              </p>
            )}
            <button
              onClick={handleWishlistClick}
              className={cn(
                "hover:scale-110 transition-transform",
                inWishlist ? "text-red-500 hover:text-red-600" : "text-muted-foreground hover:text-red-500"
              )}
            >
              <Heart className={cn("w-5 h-5", inWishlist && "fill-current")} />
            </button>
          </div>

          {/* Product Name */}
          <button
            onClick={() => router.push(`/products/${product.id}`)}
            className="text-left w-full"
          >
            <h3 className="font-semibold mb-2 line-clamp-2 hover:text-primary transition-colors leading-tight">
              {product.name}
            </h3>
          </button>

          {/* Price and Stock Status */}
          <div className="flex items-center justify-between mb-3">
            {/* Price */}
            <div className="flex items-center gap-2">
              {product.discountPercent > 0 ? (
                <>
                  <span className="text-orange-500 font-bold text-lg">
                    €{product.salePrice.toFixed(2)}
                  </span>
                  <span className="text-muted-foreground/50 line-through text-sm">
                    €{product.price.toFixed(2)}
                  </span>
                </>
              ) : (
                <span className="text-orange-500 font-bold text-lg">
                  €{product.salePrice.toFixed(2)}
                </span>
              )}
            </div>

            {/* Stock Status */}
            <div>
              {!product.inStock ? (
                <span className="text-destructive text-xs font-medium">Out of Stock</span>
              ) : product.lowStock ? (
                <span className="text-orange-500 text-xs font-medium">
                  Only {product.stock} left
                </span>
              ) : (
                <span className="text-success text-xs font-medium">In Stock</span>
              )}
            </div>
          </div>

          {/* Add to Cart Button */}
          <button
            onClick={handleAddToCart}
            disabled={!product.inStock}
            className={cn(
              "w-full py-2.5 px-4 rounded-lg font-semibold flex items-center justify-center gap-2 transition-all",
              product.inStock
                ? 'bg-primary hover:bg-primary/90 text-white'
                : 'bg-muted text-muted-foreground cursor-not-allowed'
            )}
          >
            <ShoppingCart className="w-4 h-4" />
            {product.inStock ? 'Add to Cart' : 'Out of Stock'}
          </button>
        </div>
      </div>

      {/* Confirm Remove from Wishlist Dialog */}
      {pendingRemove && (
        <ConfirmDialog
          open={pendingRemove !== null}
          onOpenChange={(open) => !open && setPendingRemove(null)}
          title="Remove from Wishlist?"
          description={
            <span>
              Are you sure you want to remove <span className="font-semibold">{product.name}</span> from your wishlist? This action cannot be undone.
            </span>
          }
          confirmLabel="Remove"
          cancelLabel="Cancel"
          onConfirm={handleRemoveConfirm}
        />
      )}

      {/* Login Required Dialog */}
      {loginRequiredAction && (
        <LoginRequiredDialog
          open={loginRequiredAction !== null}
          onOpenChange={(open) => !open && setLoginRequiredAction(null)}
          action={loginRequiredAction}
        />
      )}
    </>
  );
}
