import { useQuery } from '@tanstack/react-query';
import { publicService } from '@/lib/api/services/public';

// Query keys
export const customerKeys = {
  all: ['customer'] as const,
  products: (params?: unknown) => [...customerKeys.all, 'products', params] as const,
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
 * The brands on offer, optionally within one category.
 *
 * These are Company rows now rather than strings, so each carries an id the
 * products endpoint accepts as `companyId`.
 */
export function useBrands(params?: { categoryId?: string }) {
  return useQuery({
    queryKey: [...customerKeys.brands, params ?? null],
    queryFn: () => publicService.getBrands(params),
    select: (data) => data.data,
    staleTime: 10 * 60 * 1000, // 10 minutes - brands don't change often
  });
}

/**
 * The storefront navigation tree.
 *
 * Depth 2 is Category → Company → Product Type: enough for a drop-down menu
 * without pulling every model in the catalogue into the header.
 */
export function useCatalogTree(depth = 2) {
  return useQuery({
    queryKey: [...customerKeys.all, 'catalog-tree', depth],
    queryFn: () => publicService.getCatalogTree({ depth }),
    select: (data) => data.data,
    staleTime: 10 * 60 * 1000,
  });
}
