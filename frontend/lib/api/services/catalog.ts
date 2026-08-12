import { del, get, getPaginated, patch, post } from "@/lib/api/request";
import type {
  CatalogLevelSpec,
  CatalogNode,
  CatalogNodeBody,
  CatalogNodeQuery,
  CatalogSegment,
  CatalogStats,
  CatalogTreeNode,
  BreadcrumbEntry,
} from "@/lib/api/catalog";

/**
 * `/admin/catalog` — one CRUD surface for all four levels.
 *
 * Every call takes the level's URL segment, so a screen written once works for
 * categories, companies, product types and models without branching.
 */

export type CatalogTreeQuery = {
  categoryId?: string;
  /** 0 = categories only … 3 = down to models. */
  depth?: number;
  status?: string;
  visibility?: string;
  search?: string;
  withCounts?: boolean;
};

export const catalogApi = {
  /** The hierarchy as data. Effectively static — cache it hard. */
  levels: () => get<CatalogLevelSpec[]>("/admin/catalog/levels"),

  tree: (params?: CatalogTreeQuery) =>
    get<CatalogTreeNode[]>("/admin/catalog/tree", params),

  stats: () => get<CatalogStats>("/admin/catalog/stats"),

  list: (segment: CatalogSegment, params?: CatalogNodeQuery) =>
    getPaginated<CatalogNode>(`/admin/catalog/${segment}`, params),

  detail: (segment: CatalogSegment, id: string) =>
    get<CatalogNode>(`/admin/catalog/${segment}/${id}`),

  /**
   * A node's children, already at the right level — saves the caller from
   * having to know which level comes next. 404s on a Model, which has none.
   */
  children: (segment: CatalogSegment, id: string, params?: CatalogNodeQuery) =>
    getPaginated<CatalogNode>(`/admin/catalog/${segment}/${id}/children`, params),

  breadcrumb: (segment: CatalogSegment, id: string) =>
    get<BreadcrumbEntry[]>(`/admin/catalog/${segment}/${id}/breadcrumb`),

  create: (segment: CatalogSegment, body: CatalogNodeBody) =>
    post<CatalogNode>(`/admin/catalog/${segment}`, body),

  /** Partial update. A new `parentId` re-files the node and its subtree. */
  update: (segment: CatalogSegment, id: string, body: CatalogNodeBody) =>
    patch<CatalogNode>(`/admin/catalog/${segment}/${id}`, body),

  /**
   * `orderedIds` become positions 0..n among their siblings.
   *
   * Send the complete sibling set: positions are assigned by array index, so
   * omitting a row leaves it on an old position that now collides.
   */
  reorder: (
    segment: CatalogSegment,
    body: { parentId?: string; orderedIds: string[] },
  ) =>
    patch<{ message: string; count: number }>(
      `/admin/catalog/${segment}/reorder`,
      body,
    ),

  /**
   * 409 while children exist — `cascade` removes the descendant levels too.
   * Never deletes products: a node with products beneath always refuses.
   *
   * `deletedDescendants` counts what went with it, which is worth repeating
   * back: "deleted" alone understates a cascade that took 3 product types and
   * 11 models along.
   */
  remove: (segment: CatalogSegment, id: string, cascade = false) =>
    del<{ message: string; deletedDescendants?: number }>(
      `/admin/catalog/${segment}/${id}${cascade ? "?cascade=true" : ""}`,
    ),
};
