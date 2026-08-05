import { useCartStore } from "@/lib/stores/cart-store";
import type { Cart, CartItem } from "@/lib/stores/cart-store";

export function useCart() {
  const {
    cart,
    isLoading,
    error,
    fetchCart,
    addItem,
    updateItem,
    removeItem,
    clearCart,
    getCartCount,
  } = useCartStore();

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

    // Computed values
    totalItems: cart?.totalItems || 0,
    isEmpty: !cart || cart.items.length === 0,
    subtotal: cart?.subtotal || 0,
    shipping: cart?.shipping || 0,
    tax: cart?.tax || 0,
    total: cart?.total || 0,
  };
}

export type { Cart, CartItem };
