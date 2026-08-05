import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

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

interface CartState {
  cart: Cart | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchCart: () => Promise<void>;
  addItem: (productId: string, quantity: number, color?: string, size?: string) => Promise<void>;
  updateItem: (itemId: string, quantity: number) => Promise<void>;
  removeItem: (itemId: string) => Promise<void>;
  clearCart: () => Promise<void>;
  getCartCount: () => Promise<number>;
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

      fetchCart: async () => {
        set({ isLoading: true, error: null });
        try {
          const sessionId = localStorage.getItem('cart_session_id') ||
                           generateSessionId();
          localStorage.setItem('cart_session_id', sessionId);

          const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/cart`, {
            headers: {
              'x-session-id': sessionId,
            },
          });

          if (!response.ok) {
            throw new Error('Failed to fetch cart');
          }

          const result = await response.json();
          set({ cart: result.data, isLoading: false });
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to fetch cart',
            isLoading: false
          });
        }
      },

      addItem: async (productId, quantity, color, size) => {
        set({ isLoading: true, error: null });
        try {
          const sessionId = localStorage.getItem('cart_session_id') ||
                           generateSessionId();
          localStorage.setItem('cart_session_id', sessionId);

          const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/cart/items`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-session-id': sessionId,
            },
            body: JSON.stringify({
              productId,
              quantity,
              color,
              size,
            }),
          });

          if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to add item to cart');
          }

          const result = await response.json();
          set({ cart: result.data, isLoading: false });
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to add item to cart',
            isLoading: false
          });
          throw error;
        }
      },

      updateItem: async (itemId, quantity) => {
        // Optimistic update - update UI immediately
        const currentCart = get().cart;
        if (!currentCart) return;

        const previousCart = { ...currentCart };
        const itemToUpdate = currentCart.items.find(item => item.id === itemId);
        if (!itemToUpdate) return;

        // Calculate new cart state optimistically
        const updatedItems = currentCart.items.map(item =>
          item.id === itemId
            ? { ...item, quantity }
            : item
        );

        const updatedCart = {
          ...currentCart,
          items: updatedItems,
          totalItems: updatedItems.reduce((sum, item) => sum + item.quantity, 0),
          subtotal: updatedItems.reduce((sum, item) => sum + item.salePrice * item.quantity, 0),
          tax: updatedItems.reduce((sum, item) => sum + item.salePrice * item.quantity, 0) * 0.085,
          shipping: updatedItems.reduce((sum, item) => sum + item.salePrice * item.quantity, 0) >= 100 ? 0 : 10,
          total: 0,
        };
        updatedCart.total = updatedCart.subtotal + updatedCart.shipping + updatedCart.tax;

        // Update UI immediately
        set({ cart: updatedCart });

        try {
          const sessionId = localStorage.getItem('cart_session_id');
          if (!sessionId) throw new Error('No session found');

          const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/cart/items/${itemId}`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              'x-session-id': sessionId,
            },
            body: JSON.stringify({ quantity }),
          });

          if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to update item');
          }

          const result = await response.json();
          // Update with server response to ensure consistency
          set({ cart: result.data });
        } catch (error) {
          // Revert to previous state on error
          set({ cart: previousCart });
          set({
            error: error instanceof Error ? error.message : 'Failed to update item'
          });
          throw error;
        }
      },

      removeItem: async (itemId) => {
        // Optimistic update - update UI immediately
        const currentCart = get().cart;
        if (!currentCart) return;

        const previousCart = { ...currentCart };

        // Remove item from cart optimistically
        const updatedItems = currentCart.items.filter(item => item.id !== itemId);

        const updatedCart = {
          ...currentCart,
          items: updatedItems,
          totalItems: updatedItems.reduce((sum, item) => sum + item.quantity, 0),
          subtotal: updatedItems.reduce((sum, item) => sum + item.salePrice * item.quantity, 0),
          tax: updatedItems.reduce((sum, item) => sum + item.salePrice * item.quantity, 0) * 0.085,
          shipping: updatedItems.reduce((sum, item) => sum + item.salePrice * item.quantity, 0) >= 100 ? 0 : 10,
          total: 0,
        };
        updatedCart.total = updatedCart.subtotal + updatedCart.shipping + updatedCart.tax;

        // Update UI immediately
        set({ cart: updatedItems.length > 0 ? updatedCart : null });

        try {
          const sessionId = localStorage.getItem('cart_session_id');
          if (!sessionId) throw new Error('No session found');

          const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/cart/items/${itemId}`, {
            method: 'DELETE',
            headers: {
              'x-session-id': sessionId,
            },
          });

          if (!response.ok) {
            throw new Error('Failed to remove item');
          }

          const result = await response.json();
          // Update with server response to ensure consistency
          set({ cart: result.data });
        } catch (error) {
          // Revert to previous state on error
          set({ cart: previousCart });
          set({
            error: error instanceof Error ? error.message : 'Failed to remove item'
          });
          throw error;
        }
      },

      clearCart: async () => {
        set({ isLoading: true, error: null });
        try {
          const sessionId = localStorage.getItem('cart_session_id');
          if (!sessionId) throw new Error('No session found');

          const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/cart`, {
            method: 'DELETE',
            headers: {
              'x-session-id': sessionId,
            },
          });

          if (!response.ok) {
            throw new Error('Failed to clear cart');
          }

          set({ cart: null, isLoading: false });
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to clear cart',
            isLoading: false
          });
          throw error;
        }
      },

      getCartCount: async () => {
        try {
          const sessionId = localStorage.getItem('cart_session_id') ||
                           generateSessionId();
          localStorage.setItem('cart_session_id', sessionId);

          const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/cart/count`, {
            headers: {
              'x-session-id': sessionId,
            },
          });

          if (!response.ok) {
            return 0;
          }

          const result = await response.json();
          return result.data.count;
        } catch {
          return 0;
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

// Helper function to generate a session ID for guest carts
function generateSessionId(): string {
  return `session_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
}

// Non-reactive accessors
export const cartStorage = {
  getCart: () => useCartStore.getState().cart,
  getCartCount: () => useCartStore.getState().getCartCount,
  addItem: (productId: string, quantity: number, color?: string, size?: string) =>
    useCartStore.getState().addItem(productId, quantity, color, size),
  updateItem: (itemId: string, quantity: number) =>
    useCartStore.getState().updateItem(itemId, quantity),
  removeItem: (itemId: string) => useCartStore.getState().removeItem(itemId),
  clearCart: () => useCartStore.getState().clearCart(),
};
