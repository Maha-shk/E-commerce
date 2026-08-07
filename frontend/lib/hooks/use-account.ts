"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { authApi, type Order } from "@/lib/api/services/auth";
import {
  addressesService,
  type Address,
  type CreateAddressDto,
} from "@/lib/api/services/addresses";
import { getApiErrorMessage } from "@/lib/api/client";
import { useSession } from "@/lib/hooks/use-auth";
import type { PaginationMeta } from "@/lib/api/types";

/**
 * Customer-portal data hooks.
 *
 * These used to be hand-rolled `useEffect` + `useState` fetches in each page,
 * which meant every tab switch refetched from scratch and showed a spinner.
 * Going through TanStack Query (60s default staleTime) makes moving between
 * Overview / Orders / Addresses render instantly from cache and revalidate in
 * the background.
 */
export const accountKeys = {
  all: ["account"] as const,
  orders: (params?: unknown) => [...accountKeys.all, "orders", params] as const,
  addresses: () => [...accountKeys.all, "addresses"] as const,
  defaultAddress: () => [...accountKeys.all, "addresses", "default"] as const,
};

type OrdersPage = { orders: Order[]; meta: PaginationMeta | null };

const newestFirst = (a: Order, b: Order) =>
  new Date(b.placedAt).getTime() - new Date(a.placedAt).getTime();

export function useMyOrders(params?: {
  page?: number;
  limit?: number;
  status?: string;
}) {
  const { isAuthenticated, hydrated } = useSession();

  return useQuery<OrdersPage>({
    queryKey: accountKeys.orders(params),
    queryFn: async () => {
      const response = await authApi.getOrders(params);
      // The endpoint has returned both a bare array and a paginated envelope
      // over its lifetime; tolerate either.
      const orders = Array.isArray(response) ? response : response.data ?? [];
      const meta = Array.isArray(response) ? null : response.meta ?? null;

      return { orders: [...orders].sort(newestFirst), meta };
    },
    enabled: hydrated && isAuthenticated,
    placeholderData: (previous) => previous, // keeps the table on screen while paging
  });
}

export function useAddresses() {
  const { isAuthenticated, hydrated } = useSession();

  return useQuery({
    queryKey: accountKeys.addresses(),
    queryFn: async () => (await addressesService.getAddresses()).data ?? [],
    enabled: hydrated && isAuthenticated,
  });
}

export function useDefaultAddress() {
  const { isAuthenticated, hydrated } = useSession();

  return useQuery({
    queryKey: accountKeys.defaultAddress(),
    queryFn: async () => (await addressesService.getDefaultAddress()).data,
    enabled: hydrated && isAuthenticated,
  });
}

/** Invalidate both the list and the "default" lookup after any write. */
function useRefreshAddresses() {
  const queryClient = useQueryClient();

  return () => {
    queryClient.invalidateQueries({ queryKey: accountKeys.addresses() });
    queryClient.invalidateQueries({ queryKey: accountKeys.defaultAddress() });
  };
}

export function useSaveAddress() {
  const refresh = useRefreshAddresses();

  return useMutation({
    mutationFn: ({ id, dto }: { id?: string; dto: CreateAddressDto }) =>
      id
        ? addressesService.updateAddress(id, dto)
        : addressesService.createAddress(dto),
    onSuccess: (_data, variables) => {
      refresh();
      toast.success(variables.id ? "Address updated" : "Address added");
    },
    onError: (error) => toast.error(getApiErrorMessage(error)),
  });
}

export function useDeleteAddress() {
  const refresh = useRefreshAddresses();

  return useMutation({
    mutationFn: (id: string) => addressesService.deleteAddress(id),
    onSuccess: () => {
      refresh();
      toast.success("Address deleted");
    },
    onError: (error) => toast.error(getApiErrorMessage(error)),
  });
}

export function useSetDefaultAddress() {
  const refresh = useRefreshAddresses();

  return useMutation({
    mutationFn: (id: string) => addressesService.setDefaultAddress(id),
    onSuccess: () => {
      refresh();
      toast.success("Default address updated");
    },
    onError: (error) => toast.error(getApiErrorMessage(error)),
  });
}

export type { Address };
