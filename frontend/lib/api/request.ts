import { api } from "@/lib/api/client";
import type { ApiResponse, PaginatedResponse } from "@/lib/api/types";

/**
 * Typed request helpers that unwrap the backend's `{ success, data }` envelope,
 * so callers work with the payload directly.
 *
 * Use `getPaginated` for list endpoints — it preserves the `meta` block that
 * the plain `get` helper would discard.
 */

/** Strips query params that are undefined/null/"" so they aren't serialised. */
function clean(params?: Record<string, unknown>) {
  if (!params) return undefined;
  return Object.fromEntries(
    Object.entries(params).filter(
      ([, v]) => v !== undefined && v !== null && v !== "",
    ),
  );
}

export async function get<T>(
  url: string,
  params?: Record<string, unknown>,
): Promise<T> {
  const { data } = await api.get<ApiResponse<T>>(url, { params: clean(params) });
  return data.data;
}

/** For list endpoints: returns both the rows and the pagination metadata. */
export async function getPaginated<T>(
  url: string,
  params?: Record<string, unknown>,
): Promise<PaginatedResponse<T>> {
  const { data } = await api.get<PaginatedResponse<T>>(url, {
    params: clean(params),
  });
  return data;
}

export async function post<T>(url: string, body?: unknown): Promise<T> {
  const { data } = await api.post<ApiResponse<T>>(url, body);
  return data.data;
}

export async function patch<T>(url: string, body?: unknown): Promise<T> {
  const { data } = await api.patch<ApiResponse<T>>(url, body);
  return data.data;
}

export async function put<T>(url: string, body?: unknown): Promise<T> {
  const { data } = await api.put<ApiResponse<T>>(url, body);
  return data.data;
}

export async function del<T>(url: string): Promise<T> {
  const { data } = await api.delete<ApiResponse<T>>(url);
  return data.data;
}
