import { api } from '../client';
import type { ApiResponse, PaginatedResponse } from '../types';

// Types
export interface Banner {
  id: string;
  type: 'HERO' | 'PROMOTIONAL' | 'SIDEBAR';
  title: string;
  description?: string;
  imageUrl: string;
  mobileImageUrl?: string;
  linkUrl?: string;
  linkText?: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  icon: string;
  thumbnailName: string | null;
  parentId: string | null;
  productCount: number;
  subcategoryCount: number;
}

export interface Product {
  id: string;
  name: string;
  brand: string;
  description: string;
  sku: string;
  stock: number;
  status: 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK';
  price: number;
  salePrice: number;
  discountPercent: number;
  visibility: 'PUBLIC' | 'PRIVATE' | 'SCHEDULED';
  tags: string[];
  categoryId: string | null;
  category: {
    id: string;
    name: string;
    slug: string;
  } | null;
  images: Array<{
    id: string;
    url: string;
    position: number;
  }>;
  variantCount: number;
  inStock: boolean;
  lowStock: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface FeaturedProductResponse {
  success: true;
  data: Product[];
}

// Service methods
export const publicService = {
  /**
   * Get banners for homepage
   */
  async getBanners(params?: {
    type?: 'HERO' | 'PROMOTIONAL' | 'SIDEBAR';
    isActive?: boolean;
    limit?: number;
  }): Promise<ApiResponse<Banner[]>> {
    const { data } = await api.get<ApiResponse<Banner[]>>('/public/banners', {
      params,
    });
    return data;
  },

  /**
   * Get categories for storefront
   */
  async getCategories(params?: {
    parentId?: string;
    limit?: number;
  }): Promise<ApiResponse<Category[]>> {
    const { data } = await api.get<ApiResponse<Category[]>>(
      '/public/categories',
      { params },
    );
    return data;
  },

  /**
   * Get products with filters
   */
  async getProducts(params?: {
    categoryId?: string;
    search?: string;
    bestsellers?: boolean;
    newArrivals?: boolean;
    sale?: boolean;
    page?: number;
    limit?: number;
  }): Promise<PaginatedResponse<Product>> {
    const { data } = await api.get<PaginatedResponse<Product>>(
      '/public/products',
      { params },
    );
    return data;
  },

  /**
   * Get single product by ID or slug
   */
  async getProduct(params: {
    id?: string;
    slug?: string;
  }): Promise<ApiResponse<Product>> {
    const { data } = await api.get<ApiResponse<Product>>(
      '/public/products/detail',
      { params },
    );
    return data;
  },

  /**
   * Get featured products by section
   */
  async getFeaturedProducts(params: {
    section: 'BEST_SELLERS' | 'NEW_ARRIVALS' | 'SALE';
    limit?: number;
  }): Promise<FeaturedProductResponse> {
    const { data } = await api.get<FeaturedProductResponse>(
      '/public/featured-products',
      { params },
    );
    return data;
  },
};
