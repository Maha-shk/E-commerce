import { api } from '../client';
import type { ApiResponse } from '../types';

// Types matching backend DTOs
export interface Category {
  id: string;
  name: string;
  slug: string;
}

export interface WishlistItem {
  id: string;
  productId: string;
  name: string;
  brand: string;
  sku: string;
  price: number;
  discount: number;
  salePrice: number;
  image: string | null;
  inStock: boolean;
  lowStock: boolean;
  stock: number;
  addedAt: string;
  category: Category | null;
}

export interface Wishlist {
  id: string;
  items: WishlistItem[];
  totalItems: number;
  createdAt: string;
  updatedAt: string;
}

export const wishlistApi = {
  /**
   * Get user's wishlist
   */
  async getWishlist(): Promise<ApiResponse<Wishlist>> {
    const { data } = await api.get<ApiResponse<Wishlist>>('/wishlist');
    return data;
  },

  /**
   * Add product to wishlist
   */
  async addToWishlist(productId: string): Promise<ApiResponse<Wishlist>> {
    const { data } = await api.post<ApiResponse<Wishlist>>('/wishlist/items', { productId });
    return data;
  },

  /**
   * Remove item from wishlist
   */
  async removeFromWishlist(itemId: string): Promise<ApiResponse<Wishlist>> {
    const { data } = await api.delete<ApiResponse<Wishlist>>(`/wishlist/items/${itemId}`);
    return data;
  },

  /**
   * Clear entire wishlist
   */
  async clearWishlist(): Promise<ApiResponse<Wishlist>> {
    const { data } = await api.delete<ApiResponse<Wishlist>>('/wishlist');
    return data;
  },

  /**
   * Get wishlist item count
   */
  async getWishlistCount(): Promise<{ count: number }> {
    const { data } = await api.get<{ count: number }>('/wishlist/count');
    return data;
  },
};