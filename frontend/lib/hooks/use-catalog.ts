"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { getApiErrorMessage } from "@/lib/api/client";
import { queryKeys } from "@/lib/api/query-keys";
import { catalogApi, type CatalogTreeQuery } from "@/lib/api/services/catalog";
import { CATALOG_LEVELS } from "@/lib/api/catalog";
import type {
  CatalogNodeBody,
  CatalogNodeQuery,
  CatalogSegment,
} from "@/lib/api/catalog";

/**
 * Anything that changes the tree changes more than the level it happened on:
 * a new company alters its category's child count, and moving a node alters
 * the product roll-up of both its old and its new ancestors. Rather than track
 * which counts went stale, every write drops the whole catalog cache — plus
 * products and inventory, which carry a copy of the classification on each row.
 */
const CATALOG_WRITE_INVALIDATIONS = [
  queryKeys.catalog.all,
  queryKeys.products.all,
  queryKeys.inventory.all,
];

function useCatalogMutation<TArgs, TResult>(
  mutationFn: (args: TArgs) => Promise<TResult>,
  successMessage: string,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn,
    onSuccess: () => {
      toast.success(successMessage);
      CATALOG_WRITE_INVALIDATIONS.forEach((queryKey) =>
        queryClient.invalidateQueries({ queryKey }),
      );
    },
    onError: (error) => toast.error(getApiErrorMessage(error)),
  });
}

/* ---- Reads ---- */

/**
 * The hierarchy as data: order, labels, segments, parent/child links.
 *
 * It describes the shape of the schema, so it only changes when a level is
 * added — fetched once per session and never refetched.
 *
 * `placeholderData`, not `initialData`: the static copy renders immediately so
 * labels don't pop in after a round-trip, while the real request still runs
 * and takes over. Seeding it as `initialData` would satisfy `staleTime:
 * Infinity` and mean the server's copy was never read at all.
 */
export function useCatalogLevels() {
  return useQuery({
    queryKey: queryKeys.catalog.levels(),
    queryFn: catalogApi.levels,
    placeholderData: [...CATALOG_LEVELS],
    staleTime: Infinity,
    gcTime: Infinity,
  });
}

export function useCatalogTree(params?: CatalogTreeQuery) {
  return useQuery({
    queryKey: queryKeys.catalog.tree(params),
    queryFn: () => catalogApi.tree(params),
    placeholderData: (previous) => previous,
  });
}

export function useCatalogStats() {
  return useQuery({
    queryKey: queryKeys.catalog.stats(),
    queryFn: catalogApi.stats,
  });
}

export function useCatalogList(
  segment: CatalogSegment,
  params?: CatalogNodeQuery,
  options?: { enabled?: boolean },
) {
  return useQuery({
    queryKey: queryKeys.catalog.list(segment, params),
    queryFn: () => catalogApi.list(segment, params),
    enabled: options?.enabled ?? true,
    // Keeps the rows on screen while the next page or filter loads, rather
    // than collapsing the table to skeletons on every keystroke.
    placeholderData: (previous) => previous,
  });
}

export function useCatalogNode(segment: CatalogSegment, id: string) {
  return useQuery({
    queryKey: queryKeys.catalog.detail(segment, id),
    queryFn: () => catalogApi.detail(segment, id),
    enabled: Boolean(id),
    // An id from another store answers 404, and so does a deleted one. Neither
    // becomes true by asking again.
    retry: false,
  });
}

/**
 * A node's children, already resolved to the next level down.
 *
 * Disabled for a Model: it has no child level, and the endpoint answers 404 by
 * design. Read its products from `useProducts({ modelId })` instead.
 */
export function useCatalogChildren(
  segment: CatalogSegment,
  id: string,
  params?: CatalogNodeQuery,
  options?: { enabled?: boolean },
) {
  return useQuery({
    queryKey: queryKeys.catalog.children(segment, id, params),
    queryFn: () => catalogApi.children(segment, id, params),
    enabled: Boolean(id) && (options?.enabled ?? true),
    placeholderData: (previous) => previous,
  });
}

/* ---- Writes ---- */

export function useCreateCatalogNode(segment: CatalogSegment) {
  return useCatalogMutation(
    (body: CatalogNodeBody) => catalogApi.create(segment, body),
    "Created",
  );
}

export function useUpdateCatalogNode(segment: CatalogSegment) {
  return useCatalogMutation(
    ({ id, body }: { id: string; body: CatalogNodeBody }) =>
      catalogApi.update(segment, id, body),
    "Saved",
  );
}

export function useReorderCatalogNodes(segment: CatalogSegment) {
  return useCatalogMutation(
    (body: { parentId?: string; orderedIds: string[] }) =>
      catalogApi.reorder(segment, body),
    "Order saved",
  );
}

/**
 * Delete, with the 409 left for the caller to handle.
 *
 * A refusal here is not a failure to report and forget — the message names
 * what is blocking the delete, and there is an action that clears it
 * (`cascade`, or moving the products). Routing it to a toast like every other
 * error would throw away the only thing that makes it actionable, so this one
 * deliberately does not share `useCatalogMutation`'s error handling.
 */
export function useDeleteCatalogNode(segment: CatalogSegment) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, cascade }: { id: string; cascade?: boolean }) =>
      catalogApi.remove(segment, id, cascade),
    onSuccess: (result) => {
      // A cascade can take a lot with it — say how much rather than just
      // "Deleted", which reads the same whether it removed one node or twelve.
      const swept = result.deletedDescendants ?? 0;
      toast.success(
        swept > 0
          ? `${result.message}, along with ${swept} item${swept === 1 ? "" : "s"} inside it`
          : result.message,
      );
      CATALOG_WRITE_INVALIDATIONS.forEach((queryKey) =>
        queryClient.invalidateQueries({ queryKey }),
      );
    },
  });
}
