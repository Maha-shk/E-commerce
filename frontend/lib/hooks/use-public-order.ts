"use client";

import { useQuery } from "@tanstack/react-query";
import { publicService } from "@/lib/api/services/public";
import type { PublicOrder } from "@/lib/api/order-types";

/**
 * Fetch a single order by its order number.
 *
 * Both order screens hand-rolled this with `useEffect` + `fetch` + three
 * pieces of local state. React Query gives retry/caching for free and, more
 * importantly, removes the stale-closure bugs those effects had — the access
 * check read `isAuthenticated` captured on the first render, before the auth
 * store had hydrated.
 */
export function usePublicOrder(orderNumber: string | undefined) {
  return useQuery<PublicOrder>({
    queryKey: ["public-order", orderNumber],
    queryFn: async () => {
      const response = await publicService.getOrder(orderNumber!);
      if (!response?.success || !response.data) {
        throw new Error("Order not found");
      }
      return response.data as PublicOrder;
    },
    enabled: Boolean(orderNumber),
    staleTime: 30_000,
  });
}
