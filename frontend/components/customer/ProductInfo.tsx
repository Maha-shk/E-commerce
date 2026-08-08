"use client";

import { useState } from "react";
import { Heart, Loader2, RotateCcw, ShieldCheck, ShoppingCart, Truck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { QuantityStepper } from "@/components/customer/QuantityStepper";
import { VariantPicker } from "@/components/customer/VariantPicker";
import { LoginRequiredDialog } from "@/components/ui/login-required-dialog";
import { useCart } from "@/lib/hooks/use-cart";
import { useWishlist } from "@/lib/hooks/use-wishlist";
import { useSession } from "@/lib/hooks/use-auth";
import type { Product } from "@/lib/api/services/public";
import { formatMoney } from "@/lib/format";
import { site } from "@/lib/site";
import { cn } from "@/lib/utils";

/** Trust row under the buy buttons. Wording comes from lib/site.ts. */
const ASSURANCES = [
  {
    icon: Truck,
    text: `Free standard delivery over ${formatMoney(site.freeShippingThreshold)}`,
  },
  { icon: RotateCcw, text: `${site.returnWindowDays}-day returns` },
  { icon: ShieldCheck, text: "Secure checkout" },
] as const;

export function ProductInfo({ product }: { product: Product }) {
  const { isAuthenticated } = useSession();
  const { addItem } = useCart();
  const { isInWishlist, addToWishlist, removeFromWishlist } = useWishlist();

  const [quantity, setQuantity] = useState(1);
  const [isAdding, setIsAdding] = useState(false);
  const [selectedVariant, setSelectedVariant] = useState<string | null>(null);
  const [loginPrompt, setLoginPrompt] = useState<"add to wishlist" | null>(null);

  const hasDiscount = product.discountPercent > 0;
  const isOutOfStock = !product.inStock || product.stock === 0;
  const inWishlist = isInWishlist(product.id);

  // Admin-configured options. Replaces the hardcoded ["Black","Brown","Blue"]
  // and ["38mm","42mm","44mm"] lists that were shown on every single product
  // regardless of what it was.
  const variants = product.variants ?? [];

  // A product that offers variants can't be added until one is picked — the
  // server enforces the same rule, so sending without it would just bounce.
  const needsVariant = variants.length > 0 && !selectedVariant;
  const selectedVariantName =
    variants.find((v) => v.id === selectedVariant)?.name ?? null;

  /**
   * Previously this was a `console.log("Adding to cart", …)` TODO — the button
   * on the product page never actually added anything.
   */
  const handleAddToCart = async () => {
    if (needsVariant) {
      toast.error("Please select an option first");
      return;
    }

    setIsAdding(true);
    try {
      await addItem(product.id, quantity, selectedVariant ?? undefined);
    } catch {
      // useCart already surfaced the reason as a toast.
    } finally {
      setIsAdding(false);
    }
  };

  /** Also a TODO before: it only flipped a local boolean and never persisted. */
  const handleToggleWishlist = () => {
    if (!isAuthenticated) {
      setLoginPrompt("add to wishlist");
      return;
    }
    if (inWishlist) removeFromWishlist(product.id);
    else addToWishlist(product.id.toString());
  };

  return (
    <div className="space-y-5">
      {/* Category */}
      {product.category ? (
        <p className="eyebrow">{product.category.name}</p>
      ) : null}

      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-balance sm:text-3xl">
          {product.name}
        </h1>
        {product.brand ? (
          <p className="mt-1.5 text-sm text-muted-foreground">{product.brand}</p>
        ) : null}
      </div>

      {/* Price */}
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <span className="text-3xl font-semibold tracking-tight tabular-nums">
          {formatMoney(hasDiscount ? product.salePrice : product.price)}
        </span>
        {hasDiscount ? (
          <>
            <span className="text-base text-muted-foreground line-through tabular-nums">
              {formatMoney(product.price)}
            </span>
            <Badge className="h-6 bg-orange-500 px-2.5 text-white">
              {product.discountPercent}% off
            </Badge>
          </>
        ) : null}
      </div>

      {/* Availability */}
      <div>
        {isOutOfStock ? (
          <Badge variant="destructive" className="h-6 px-2.5">
            Out of stock
          </Badge>
        ) : product.lowStock ? (
          <Badge variant="warning" className="h-6 px-2.5">
            Low stock — only {product.stock} left
          </Badge>
        ) : (
          <Badge variant="success" className="h-6 px-2.5">
            In stock
          </Badge>
        )}
      </div>

      {/* Description — moved up from the bottom of the page to sit directly
          under the availability badge, where shoppers actually look for it. */}
      {product.description ? (
        <div className="border-t border-border pt-5">
          <p className="text-sm leading-relaxed text-muted-foreground text-pretty">
            {product.description}
          </p>
        </div>
      ) : null}

      {/* Variants */}
      {variants.length > 0 ? (
        <div className="space-y-2.5 border-t border-border pt-5">
          <div className="flex flex-wrap items-baseline justify-between gap-x-3">
            <p className="text-sm font-semibold">
              Variant
              <span className="ml-0.5 text-destructive" aria-hidden>
                *
              </span>
            </p>
            {/* Echo the choice back in words — on a long chip row the selected
                fill alone is easy to lose track of. */}
            {selectedVariantName ? (
              <p className="text-sm text-muted-foreground">
                Selected:{" "}
                <span className="font-medium text-foreground">
                  {selectedVariantName}
                </span>
              </p>
            ) : null}
          </div>

          <VariantPicker
            variants={variants}
            value={selectedVariant}
            onChange={setSelectedVariant}
          />

          {needsVariant ? (
            <p className="text-xs font-medium text-muted-foreground">
              Choose one of the {variants.length} options to continue.
            </p>
          ) : null}
        </div>
      ) : null}

      {/* Quantity */}
      {!isOutOfStock ? (
        <div className="space-y-2.5 border-t border-border pt-5">
          <p className="text-sm font-semibold">Quantity</p>
          <QuantityStepper
            value={quantity}
            max={Math.max(1, product.stock)}
            disabled={isAdding}
            onChange={setQuantity}
          />
        </div>
      ) : null}

      {/* Actions */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <Button
          size="xl"
          className="flex-1"
          // Left clickable while a variant is missing so the click can explain
          // why; a disabled button would just feel broken.
          disabled={isOutOfStock || isAdding}
          aria-disabled={needsVariant || undefined}
          onClick={handleAddToCart}
        >
          {isAdding ? (
            <Loader2 className="size-5 animate-spin" aria-hidden />
          ) : (
            <ShoppingCart className="size-5" aria-hidden />
          )}
          {isOutOfStock
            ? "Out of Stock"
            : needsVariant
              ? "Select an option"
              : "Add to Cart"}
        </Button>

        <Button
          variant="outline"
          size="xl"
          onClick={handleToggleWishlist}
          aria-pressed={inWishlist}
          className={cn(
            "flex-1",
            inWishlist && "border-destructive/40 text-destructive hover:bg-destructive/10",
          )}
        >
          <Heart className={cn("size-5", inWishlist && "fill-current")} aria-hidden />
          {inWishlist ? "In Wishlist" : "Add to Wishlist"}
        </Button>
      </div>

      {/* Assurances */}
      <ul className="space-y-2.5 border-t border-border pt-5">
        {ASSURANCES.map((item) => {
          const Icon = item.icon;
          return (
            <li
              key={item.text}
              className="flex items-center gap-3 text-sm text-muted-foreground"
            >
              <Icon className="size-4 shrink-0 text-muted-foreground" aria-hidden />
              {item.text}
            </li>
          );
        })}
      </ul>

      {/* Meta */}
      <dl className="grid grid-cols-2 gap-x-4 gap-y-2 border-t border-border pt-5 text-sm">
        {product.sku ? (
          <>
            <dt className="text-muted-foreground">SKU</dt>
            <dd className="text-right font-medium">{product.sku}</dd>
          </>
        ) : null}
        {product.brand ? (
          <>
            <dt className="text-muted-foreground">Brand</dt>
            <dd className="text-right font-medium">{product.brand}</dd>
          </>
        ) : null}
      </dl>

      {/* Tags */}
      {product.tags && product.tags.length > 0 ? (
        <div className="space-y-2.5 border-t border-border pt-5">
          <p className="text-sm font-semibold">Tags</p>
          <div className="flex flex-wrap gap-2">
            {product.tags.map((tag) => (
              <Badge key={tag} variant="secondary" className="h-6 px-2.5">
                {tag}
              </Badge>
            ))}
          </div>
        </div>
      ) : null}

      {loginPrompt ? (
        <LoginRequiredDialog
          open={loginPrompt !== null}
          onOpenChange={(open) => !open && setLoginPrompt(null)}
          action={loginPrompt}
        />
      ) : null}
    </div>
  );
}
