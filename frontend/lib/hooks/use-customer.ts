import { useQuery } from '@tanstack/react-query';
import { publicService } from '@/lib/api/services/public';
import type { Product } from '@/lib/api/services/public';

// Query keys
export const customerKeys = {
  all: ['customer'] as const,
  products: (params?: any) => [...customerKeys.all, 'products', params] as const,
  product: (id: string) => [...customerKeys.all, 'products', id] as const,
  relatedProducts: (categoryId: string | null, productId: string) =>
    [...customerKeys.all, 'products', 'related', categoryId, productId] as const,
  brands: ['brands'] as const,
} as const;

/**
 * Hook to get single product by ID
 */
export function useProduct(id: string) {
  return useQuery({
    queryKey: customerKeys.product(id),
    queryFn: () => publicService.getProduct({ id }),
    select: (data) => data.data,
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook to get products with filters
 */
export function useProducts(params?: {
  categoryId?: string;
  search?: string;
  bestsellers?: boolean;
  newArrivals?: boolean;
  sale?: boolean;
  page?: number;
  limit?: number;
}, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: customerKeys.products(params),
    queryFn: () => publicService.getProducts(params),
    select: (data) => data.data,
    staleTime: 2 * 60 * 1000, // 2 minutes
    enabled: options?.enabled ?? true,
  });
}

/**
 * Hook to get related products (same category, excluding current product)
 */
export function useRelatedProducts(categoryId: string | null, productId: string, limit = 4) {
  return useQuery({
    queryKey: customerKeys.relatedProducts(categoryId, productId),
    queryFn: () => publicService.getProducts({
      categoryId: categoryId || undefined,
      limit
    }),
    enabled: !!categoryId,
    select: (data) => data.data.filter((p) => p.id !== productId),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook to get all unique brands
 */
export function useBrands() {
  return useQuery({
    queryKey: customerKeys.brands,
    queryFn: () => publicService.getBrands(),
    select: (data) => data.data,
    staleTime: 10 * 60 * 1000, // 10 minutes - brands don't change often
  });
}
