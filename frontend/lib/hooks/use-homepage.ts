import { useQuery } from '@tanstack/react-query';
import { publicService } from '@/lib/api/services/public';
import type { Banner, Category, Product } from '@/lib/api/services/public';

// Query keys
export const homepageKeys = {
  all: ['homepage'] as const,
  banners: (type?: string) => [...homepageKeys.all, 'banners', type] as const,
  categories: () => [...homepageKeys.all, 'categories'] as const,
  bestSellers: () => [...homepageKeys.all, 'bestSellers'] as const,
  newArrivals: () => [...homepageKeys.all, 'newArrivals'] as const,
  saleProducts: () => [...homepageKeys.all, 'saleProducts'] as const,
} as const;

/**
 * Hook to get hero banners for homepage
 */
export function useHeroBanners() {
  return useQuery({
    queryKey: homepageKeys.banners('HERO'),
    queryFn: () => publicService.getBanners({ type: 'HERO', isActive: true }),
    select: (data) => data.data,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook to get promotional banners
 */
export function usePromotionalBanners() {
  return useQuery({
    queryKey: homepageKeys.banners('PROMOTIONAL'),
    queryFn: () =>
      publicService.getBanners({ type: 'PROMOTIONAL', isActive: true }),
    select: (data) => data.data,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook to get categories for homepage
 */
export function useHomepageCategories(limit = 10) {
  return useQuery({
    queryKey: homepageKeys.categories(),
    queryFn: () => publicService.getCategories({ limit }),
    select: (data) => data.data,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

/**
 * Hook to get best sellers for homepage
 */
export function useBestSellers(limit = 5) {
  return useQuery({
    queryKey: homepageKeys.bestSellers(),
    queryFn: () =>
      publicService.getFeaturedProducts({ section: 'BEST_SELLERS', limit }),
    select: (data) => data.data,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

/**
 * Hook to get new arrivals for homepage
 */
export function useNewArrivals(limit = 3) {
  return useQuery({
    queryKey: homepageKeys.newArrivals(),
    queryFn: () =>
      publicService.getFeaturedProducts({ section: 'NEW_ARRIVALS', limit }),
    select: (data) => data.data,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

/**
 * Hook to get sale products for homepage
 */
export function useSaleProducts(limit = 5) {
  return useQuery({
    queryKey: homepageKeys.saleProducts(),
    queryFn: () =>
      publicService.getFeaturedProducts({ section: 'SALE', limit }),
    select: (data) => data.data,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}
