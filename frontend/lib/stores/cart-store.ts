import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { cartApi, clearCartSessionId, getCartSessionId } from "@/lib/api/services/cart";
import { getApiErrorMessage } from "@/lib/api/client";

// Cart types matching the backend DTOs
export interface CartItem {
  id: string;
  productId: string;
  name: string;
  brand: string;
  sku: string;
  price: number;
  discount: number;
  salePrice: number;
  image: string | null;
  quantity: number;
  unitPrice: number;
  /** Selected variant, when the product has any. */
  variantId?: string;
  variantName?: string;
  /** Every variant the product offers, so the cart can show a switcher. */
  availableVariants?: { id: string; name: string }[];
  color?: string;
  size?: string;
  inStock: boolean;
  lowStock: boolean;
  stock: number;
}

export interface Cart {
  id: string;
  items: CartItem[];
  totalItems: number;
  subtotal: number;
  shipping: number;
  tax: number;
  total: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * Pricing rules, mirrored from `CartService.toCartResponse` in the backend.
 *
 * The server is the source of truth — every mutation returns a freshly priced
 * cart and we overwrite with it. These exist only so the optimistic render
 * between click and response shows the same numbers the server will return.
 * If the backend rules change, change them here too or the UI will flicker to
 * a different total.
 */
const FREE_SHIPPING_THRESHOLD = 100;
const FLAT_SHIPPING_RATE = 10;
const TAX_RATE = 0.085;

/** Recomputes totals for an optimistic item list, matching the server formula. */
function priceCart(cart: Cart, items: CartItem[]): Cart {
  const subtotal = items.reduce((sum, item) => sum + item.salePrice * item.quantity, 0);
  const shipping = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : FLAT_SHIPPING_RATE;
  const tax = subtotal * TAX_RATE;

  return {
    ...cart,
    items,
    totalItems: items.reduce((sum, item) => sum + item.quantity, 0),
    subtotal,
    shipping,
    tax,
    total: subtotal + shipping + tax,
  };
}

interface CartState {
  cart: Cart | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchCart: () => Promise<void>;
  addItem: (productId: string, quantity: number, variantId?: string) => Promise<void>;
  updateItem: (itemId: string, quantity: number) => Promise<void>;
  removeItem: (itemId: string) => Promise<void>;
  clearCart: () => Promise<void>;
  getCartCount: () => Promise<number>;
  mergeGuestCart: () => Promise<void>;
  reset: () => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      cart: null,
      isLoading: false,
      error: null,

      setLoading: (loading) => set({ isLoading: loading }),
      setError: (error) => set({ error }),

      /** Clears local cart state without touching the server (used on logout). */
      reset: () => set({ cart: null, error: null, isLoading: false }),

      fetchCart: async () => {
        set({ isLoading: true, error: null });
        try {
          const cart = await cartApi.getCart();
          set({ cart, isLoading: false });
        } catch (error) {
          set({ error: getApiErrorMessage(error), isLoading: false });
        }
      },

      addItem: async (productId, quantity, variantId) => {
        set({ isLoading: true, error: null });
        try {
          const cart = await cartApi.addItem({ productId, quantity, variantId });
          set({ cart, isLoading: false });
        } catch (error) {
          set({ error: getApiErrorMessage(error), isLoading: false });
          throw error;
        }
      },

      updateItem: async (itemId, quantity) => {
        const currentCart = get().cart;
        if (!currentCart) return;

        const item = currentCart.items.find((i) => i.id === itemId);
        if (!item) return;

        // Optimistic: repaint immediately, then reconcile with the server.
        const previousCart = currentCart;
        set({
          cart: priceCart(
            currentCart,
            currentCart.items.map((i) => (i.id === itemId ? { ...i, quantity } : i)),
          ),
        });

        try {
          set({ cart: await cartApi.updateItem(itemId, quantity), error: null });
        } catch (error) {
          set({ cart: previousCart, error: getApiErrorMessage(error) });
          throw error;
        }
      },

      removeItem: async (itemId) => {
        const currentCart = get().cart;
        if (!currentCart) return;

        const previousCart = currentCart;
        const remaining = currentCart.items.filter((i) => i.id !== itemId);

        // Keep the (now empty) cart object rather than nulling it — null is the
        // "not loaded yet" state and would flip the page back to a spinner.
        set({ cart: priceCart(currentCart, remaining) });

        try {
          set({ cart: await cartApi.removeItem(itemId), error: null });
        } catch (error) {
          set({ cart: previousCart, error: getApiErrorMessage(error) });
          throw error;
        }
      },

      clearCart: async () => {
        const previousCart = get().cart;
        set({ isLoading: true, error: null });
        try {
          await cartApi.clearCart();
          // Re-read rather than assuming: the server returns the emptied cart
          // shell, which the page needs in order to render its empty state.
          const cart = await cartApi.getCart();
          set({ cart, isLoading: false });
        } catch (error) {
          set({ cart: previousCart, error: getApiErrorMessage(error), isLoading: false });
          throw error;
        }
      },

      getCartCount: async () => {
        try {
          return await cartApi.getCount();
        } catch {
          return 0;
        }
      },

      /**
       * Folds the guest cart into the user's cart after login. Without this a
       * shopper who fills a cart while logged out loses it the moment they sign
       * in, because the server switches them to their (empty) account cart.
       */
      mergeGuestCart: async () => {
        const sessionId = getCartSessionId();
        if (!sessionId) return;

        try {
          const cart = await cartApi.mergeGuestCart(sessionId);
          // The guest cart is consumed; a fresh id is minted on next guest use.
          clearCartSessionId();
          set({ cart, error: null });
        } catch {
          // A merge failure must not block login — fall back to the user cart.
          await get().fetchCart();
        }
      },
    }),
    {
      name: "cento-cart",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        cart: state.cart,
      }),
    },
  ),
);

// Non-reactive accessors
export const cartStorage = {
  getCart: () => useCartStore.getState().cart,
  // Was returning the function itself rather than invoking it.
  getCartCount: () => useCartStore.getState().getCartCount(),
  addItem: (productId: string, quantity: number, variantId?: string) =>
    useCartStore.getState().addItem(productId, quantity, variantId),
  updateItem: (itemId: string, quantity: number) =>
    useCartStore.getState().updateItem(itemId, quantity),
  removeItem: (itemId: string) => useCartStore.getState().removeItem(itemId),
  clearCart: () => useCartStore.getState().clearCart(),
  mergeGuestCart: () => useCartStore.getState().mergeGuestCart(),
  reset: () => useCartStore.getState().reset(),
};
