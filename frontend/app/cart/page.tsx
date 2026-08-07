"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Loader2,
  Lock,
  RotateCw,
  ShoppingBag,
  Trash2,
  TriangleAlert,
  X,
} from "lucide-react";
import { CustomerPageShell } from "@/components/customer/CustomerPageShell";
import { ProductImage } from "@/components/customer/ProductImage";
import { QuantityStepper } from "@/components/customer/QuantityStepper";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useCart } from "@/lib/hooks/use-cart";
import { formatMoney } from "@/lib/format";
import type { CartItem } from "@/lib/stores/cart-store";

/** Stock line under the product name. */
function StockNote({ item }: { item: CartItem }) {
  if (!item.inStock) {
    return <span className="text-xs font-medium text-destructive">Out of stock</span>;
  }
  if (item.lowStock) {
    return (
      <span className="text-xs font-medium text-warning">Only {item.stock} left</span>
    );
  }
  return <span className="text-xs font-medium text-success">In stock</span>;
}

export default function CartPage() {
  const [itemToRemove, setItemToRemove] = useState<CartItem | null>(null);
  const [showClearDialog, setShowClearDialog] = useState(false);
  // Per-item so updating one row doesn't freeze the whole cart.
  const [pendingItemId, setPendingItemId] = useState<string | null>(null);

  const {
    cart,
    isLoading,
    error,
    fetchCart,
    updateItem,
    removeItem,
    clearCart,
    isEmpty,
    totalItems,
    subtotal,
    shipping,
    tax,
    total,
  } = useCart();

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  const handleQuantityChange = async (item: CartItem, next: number) => {
    // Clamp to available stock: the server rejects anything above it, and
    // letting the click through would just bounce back with an error toast.
    const quantity = Math.min(Math.max(1, next), item.stock);
    if (quantity === item.quantity) return;

    setPendingItemId(item.id);
    try {
      await updateItem(item.id, quantity);
    } catch {
      // useCart surfaced the reason; the store already rolled the value back.
    } finally {
      setPendingItemId(null);
    }
  };

  // ConfirmDialog closes itself after onConfirm, so neither of these clears the
  // dialog state — doing it here too would blank the item name mid-animation.
  const confirmRemove = async () => {
    if (!itemToRemove) return;
    try {
      await removeItem(itemToRemove.id);
    } catch {
      // Toast already shown.
    }
  };

  const handleClearCart = async () => {
    try {
      await clearCart();
    } catch {
      // Toast already shown.
    }
  };

  const itemCountLabel = `${totalItems} ${totalItems === 1 ? "item" : "items"}`;

  return (
    <CustomerPageShell>
      <>
        {/* Page header */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Your Cart</h1>
            <p className="mt-1.5 text-sm text-muted-foreground">
              {isEmpty
                ? "Review your selections before checking out."
                : `${itemCountLabel} ready for checkout.`}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {!isEmpty ? (
              <Button
                variant="ghost"
                className="text-muted-foreground hover:text-destructive"
                onClick={() => setShowClearDialog(true)}
              >
                <Trash2 className="size-4" aria-hidden />
                Clear cart
              </Button>
            ) : null}
            <Button asChild variant="outline">
              <Link href="/products">
                Continue Shopping
                <ArrowRight className="size-4" aria-hidden />
              </Link>
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-3">
          {/* Items */}
          <div className="space-y-4 lg:col-span-2">
            {isLoading && !cart ? (
              <Card className="gap-0 py-0">
                <div className="flex flex-col items-center gap-3 py-16">
                  <Loader2 className="size-6 animate-spin text-primary" aria-hidden />
                  <p className="text-sm text-muted-foreground">Loading your cart…</p>
                </div>
              </Card>
            ) : error && isEmpty ? (
              /* Without this branch a failed load is indistinguishable from a
                 genuinely empty cart, so the shopper is told their items are
                 gone when the request merely failed. */
              <Card className="gap-0 py-0">
                <div className="flex flex-col items-center px-6 py-14 text-center">
                  <span className="mb-4 flex size-12 items-center justify-center rounded-full bg-warning-muted text-warning">
                    <TriangleAlert className="size-6" aria-hidden />
                  </span>
                  <h2 className="text-base font-semibold tracking-tight">
                    Couldn&apos;t load your cart
                  </h2>
                  <p className="mt-1 max-w-sm text-sm text-muted-foreground">{error}</p>
                  <Button className="mt-5" variant="outline" onClick={() => fetchCart()}>
                    <RotateCw className="size-4" aria-hidden />
                    Try Again
                  </Button>
                </div>
              </Card>
            ) : isEmpty ? (
              <Card className="gap-0 py-0">
                <div className="flex flex-col items-center px-6 py-14 text-center">
                  <span className="mb-4 flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
                    <ShoppingBag className="size-6" aria-hidden />
                  </span>
                  <h2 className="text-base font-semibold tracking-tight">
                    Your cart is empty
                  </h2>
                  <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                    Browse the catalogue and add something you like.
                  </p>
                  <Button asChild className="mt-5" size="lg">
                    <Link href="/products">Start Shopping</Link>
                  </Button>
                </div>
              </Card>
            ) : (
              cart?.items.map((item) => {
                const isPending = pendingItemId === item.id;

                return (
                  <Card key={item.id} className="gap-0 py-0">
                    <div className="flex gap-4 p-4 sm:gap-5 sm:p-5">
                      {/* Image */}
                      <div className="relative size-24 shrink-0 overflow-hidden rounded-lg bg-muted sm:size-28">
                        <ProductImage src={item.image} sizes="112px" />
                      </div>

                      {/* Details */}
                      <div className="flex min-w-0 flex-1 flex-col">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <h3 className="truncate text-base font-semibold tracking-tight">
                              {item.name}
                            </h3>
                            {item.brand ? (
                              <p className="mt-0.5 truncate text-sm text-muted-foreground">
                                {item.brand}
                              </p>
                            ) : null}
                          </div>

                          <Button
                            size="icon-sm"
                            variant="ghost"
                            onClick={() => setItemToRemove(item)}
                            aria-label={`Remove ${item.name} from cart`}
                            className="-mt-1 -mr-1 shrink-0 text-muted-foreground hover:text-destructive"
                          >
                            <X className="size-4" aria-hidden />
                          </Button>
                        </div>

                        {/* Variant chips + stock, on one wrapping line */}
                        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
                          {item.color ? (
                            <span>
                              Colour:{" "}
                              <span className="font-medium text-foreground">{item.color}</span>
                            </span>
                          ) : null}
                          {item.size ? (
                            <span>
                              Size:{" "}
                              <span className="font-medium text-foreground">{item.size}</span>
                            </span>
                          ) : null}
                          <StockNote item={item} />
                        </div>

                        {/* Stepper + line total, pinned to the bottom of the row */}
                        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                          <div className="flex items-center gap-2">
                            <QuantityStepper
                              value={item.quantity}
                              max={Math.max(1, item.stock)}
                              disabled={!item.inStock || isPending}
                              onChange={(next) => handleQuantityChange(item, next)}
                            />
                            {isPending ? (
                              <Loader2
                                className="size-4 animate-spin text-muted-foreground"
                                aria-hidden
                              />
                            ) : null}
                          </div>

                          <div className="text-right">
                            <p className="text-lg font-semibold tabular-nums text-foreground">
                              {formatMoney(item.salePrice * item.quantity)}
                            </p>
                            {item.quantity > 1 ? (
                              <p className="text-xs text-muted-foreground tabular-nums">
                                {formatMoney(item.salePrice)} each
                              </p>
                            ) : null}
                          </div>
                        </div>
                      </div>
                    </div>
                  </Card>
                );
              })
            )}
          </div>

          {/* Summary */}
          {!isEmpty && cart ? (
            <div className="lg:sticky lg:top-24 lg:col-span-1 lg:self-start">
              <Card className="gap-0 py-0">
                <div className="border-b border-border px-5 pt-5 pb-4">
                  <h2 className="text-base font-semibold tracking-tight">Order Summary</h2>
                </div>

                <div className="space-y-3 px-5 py-5 text-sm">
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-muted-foreground">Subtotal ({itemCountLabel})</span>
                    <span className="font-medium tabular-nums">{formatMoney(subtotal)}</span>
                  </div>

                  <div className="flex items-center justify-between gap-4">
                    <span className="text-muted-foreground">Estimated shipping</span>
                    <span
                      className={
                        shipping === 0
                          ? "font-medium text-success"
                          : "font-medium tabular-nums"
                      }
                    >
                      {shipping === 0 ? "Complimentary" : formatMoney(shipping)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-4">
                    <span className="text-muted-foreground">Estimated tax</span>
                    <span className="font-medium tabular-nums">{formatMoney(tax)}</span>
                  </div>

                  <div className="mt-1 flex items-center justify-between gap-4 border-t border-border pt-4">
                    <span className="text-base font-semibold tracking-tight">Total</span>
                    <span className="text-xl font-semibold tabular-nums">
                      {formatMoney(total)}
                    </span>
                  </div>
                </div>

                <div className="px-5 pb-5">
                  <Button asChild size="xl" className="w-full">
                    <Link href="/checkout">
                      Proceed to Checkout
                      <ArrowRight className="size-4" aria-hidden />
                    </Link>
                  </Button>

                  <p className="mt-3 flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
                    <Lock className="size-3.5" aria-hidden />
                    Secure checkout
                  </p>
                </div>
              </Card>
            </div>
          ) : null}
        </div>
      </>

      {/* Both dialogs now use the shared ConfirmDialog: the hand-rolled ones
          had no focus trap, no Escape handling and no scroll lock. */}
      <ConfirmDialog
        open={itemToRemove !== null}
        onOpenChange={(open) => !open && setItemToRemove(null)}
        title="Remove this item?"
        description={
          <span>
            <span className="font-semibold text-foreground">{itemToRemove?.name}</span> will
            be removed from your cart.
          </span>
        }
        confirmLabel="Remove"
        onConfirm={confirmRemove}
      />

      <ConfirmDialog
        open={showClearDialog}
        onOpenChange={setShowClearDialog}
        title="Clear your entire cart?"
        description={`This removes all ${itemCountLabel} from your cart. This can't be undone.`}
        confirmLabel="Clear cart"
        onConfirm={handleClearCart}
      />
    </CustomerPageShell>
  );
}
