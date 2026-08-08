"use client";

import { useCallback } from "react";
import { toast } from "sonner";
import { useCartStore } from "@/lib/stores/cart-store";
import type { Cart, CartItem } from "@/lib/stores/cart-store";

/**
 * Cart state plus user-facing feedback.
 *
 * The store deliberately stays silent — it holds state and talks to the API.
 * Toasts live here so every caller (product cards, the homepage, the cart page)
 * reports the same way instead of each one deciding on its own, which is how
 * failures previously ended up in `console.error` where nobody saw them.
 */
export function useCart() {
  const cart = useCartStore((s) => s.cart);
  const isLoading = useCartStore((s) => s.isLoading);
  const error = useCartStore((s) => s.error);

  const fetchCart = useCartStore((s) => s.fetchCart);
  const storeAddItem = useCartStore((s) => s.addItem);
  const storeUpdateItem = useCartStore((s) => s.updateItem);
  const storeRemoveItem = useCartStore((s) => s.removeItem);
  const storeClearCart = useCartStore((s) => s.clearCart);
  const getCartCount = useCartStore((s) => s.getCartCount);
  const mergeGuestCart = useCartStore((s) => s.mergeGuestCart);

  const addItem = useCallback(
    async (productId: string, quantity = 1, variantId?: string) => {
      try {
        await storeAddItem(productId, quantity, variantId);
        toast.success("Added to cart");
      } catch (err) {
        // The store already normalised the message onto `error`.
        toast.error(useCartStore.getState().error ?? "Couldn't add to cart");
        throw err;
      }
    },
    [storeAddItem],
  );

  const updateItem = useCallback(
    async (itemId: string, quantity: number) => {
      try {
        await storeUpdateItem(itemId, quantity);
      } catch (err) {
        // Surfaces the server's stock message, e.g. "Only 3 items available".
        toast.error(useCartStore.getState().error ?? "Couldn't update quantity");
        throw err;
      }
    },
    [storeUpdateItem],
  );

  const removeItem = useCallback(
    async (itemId: string) => {
      try {
        await storeRemoveItem(itemId);
        toast.success("Item removed");
      } catch (err) {
        toast.error(useCartStore.getState().error ?? "Couldn't remove item");
        throw err;
      }
    },
    [storeRemoveItem],
  );

  const clearCart = useCallback(async () => {
    try {
      await storeClearCart();
      toast.success("Cart cleared");
    } catch (err) {
      toast.error(useCartStore.getState().error ?? "Couldn't clear cart");
      throw err;
    }
  }, [storeClearCart]);

  return {
    cart,
    isLoading,
    error,
    fetchCart,
    addItem,
    updateItem,
    removeItem,
    clearCart,
    getCartCount,
    mergeGuestCart,

    // Computed values
    totalItems: cart?.totalItems ?? 0,
    isEmpty: !cart || cart.items.length === 0,
    subtotal: cart?.subtotal ?? 0,
    shipping: cart?.shipping ?? 0,
    tax: cart?.tax ?? 0,
    total: cart?.total ?? 0,
  };
}

export type { Cart, CartItem };
