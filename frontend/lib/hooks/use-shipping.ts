import { useQuery } from "@tanstack/react-query";
import { publicService } from "@/lib/api/services/public";

export const shippingKeys = {
  all: ["shipping-methods"] as const,
  forSubtotal: (subtotal: number) => [...shippingKeys.all, subtotal] as const,
};

/**
 * Delivery options priced for the current basket.
 *
 * Keyed on the subtotal because the free-shipping threshold makes the answer
 * depend on it — the same two methods cost different amounts at €40 and €150,
 * so caching them under one key would show a stale price after the basket
 * changes.
 *
 * `staleTime` is long: rates are configuration, not live data. What changes is
 * the subtotal, and that changes the key.
 */
export function useShippingMethods(subtotal: number) {
  return useQuery({
    queryKey: shippingKeys.forSubtotal(subtotal),
    queryFn: () => publicService.getShippingMethods(subtotal),
    select: (data) => data.data,
    staleTime: 5 * 60 * 1000,
  });
}
