import { api } from "@/lib/api/client";
import type { ApiResponse } from "@/lib/api/types";
import type { Cart } from "@/lib/stores/cart-store";

/**
 * Cart endpoints.
 *
 * Deliberately routed through the shared axios instance rather than bare
 * `fetch`: that instance attaches `Authorization: Bearer <token>` on every
 * request. Without it the backend can't tell a signed-in caller from a guest,
 * so every cart resolved to the `x-session-id` guest cart and never bound to
 * the user's account.
 *
 * The session id is still sent alongside the token. The backend prefers the
 * user id when both are present, and the guest id remains the fallback for
 * anonymous shoppers and for the post-login merge.
 */

const SESSION_KEY = "cart_session_id";

/** Stable per-browser id for guest carts, created on first use. */
export function getCartSessionId(): string {
  if (typeof window === "undefined") return "";

  let sessionId = localStorage.getItem(SESSION_KEY);
  if (!sessionId) {
    sessionId = `session_${Date.now()}_${Math.random().toString(36).slice(2, 15)}`;
    localStorage.setItem(SESSION_KEY, sessionId);
  }
  return sessionId;
}

/** Drops the guest session id — call after merging it into a user cart. */
export function clearCartSessionId() {
  if (typeof window !== "undefined") localStorage.removeItem(SESSION_KEY);
}

function sessionHeaders() {
  return { headers: { "x-session-id": getCartSessionId() } };
}

export type AddCartItemPayload = {
  productId: string;
  quantity: number;
  /**
   * Which `ProductVariant` was chosen. The server rejects the request when the
   * product defines variants and this is missing, so a shopper can never end up
   * with an order line that doesn't say which version they bought.
   */
  variantId?: string;
  /** @deprecated Superseded by `variantId`. */
  color?: string;
  /** @deprecated Superseded by `variantId`. */
  size?: string;
};

export const cartApi = {
  getCart: async (): Promise<Cart> => {
    const { data } = await api.get<ApiResponse<Cart>>("/cart", sessionHeaders());
    return data.data;
  },

  addItem: async (payload: AddCartItemPayload): Promise<Cart> => {
    const { data } = await api.post<ApiResponse<Cart>>(
      "/cart/items",
      payload,
      sessionHeaders(),
    );
    return data.data;
  },

  updateItem: async (itemId: string, quantity: number): Promise<Cart> => {
    const { data } = await api.patch<ApiResponse<Cart>>(
      `/cart/items/${itemId}`,
      { quantity },
      sessionHeaders(),
    );
    return data.data;
  },

  removeItem: async (itemId: string): Promise<Cart> => {
    const { data } = await api.delete<ApiResponse<Cart>>(
      `/cart/items/${itemId}`,
      sessionHeaders(),
    );
    return data.data;
  },

  clearCart: async (): Promise<void> => {
    await api.delete("/cart", sessionHeaders());
  },

  getCount: async (): Promise<number> => {
    const { data } = await api.get<ApiResponse<{ count: number }>>(
      "/cart/count",
      sessionHeaders(),
    );
    return data.data.count;
  },

  /**
   * Folds the guest cart into the signed-in user's cart. Requires a token —
   * the target account comes from it, never from the client.
   */
  mergeGuestCart: async (sessionId: string): Promise<Cart> => {
    const { data } = await api.post<ApiResponse<Cart>>("/cart/merge", { sessionId });
    return data.data;
  },
};
