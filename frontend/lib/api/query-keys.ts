/**
 * Centralised TanStack Query keys.
 *
 * Keys are hierarchical so a broad invalidation cascades:
 * invalidating `products.all` also clears every filtered product list.
 */
export const queryKeys = {
  auth: {
    me: ["auth", "me"] as const,
  },

  dashboard: {
    all: ["dashboard"] as const,
    stats: () => [...queryKeys.dashboard.all, "stats"] as const,
    monthly: (months?: number) =>
      [...queryKeys.dashboard.all, "monthly", months ?? 6] as const,
    recentOrders: (limit?: number) =>
      [...queryKeys.dashboard.all, "recent-orders", limit ?? 5] as const,
    topProducts: (limit?: number) =>
      [...queryKeys.dashboard.all, "top-products", limit ?? 5] as const,
  },

  products: {
    all: ["products"] as const,
    list: (params?: unknown) => [...queryKeys.products.all, "list", params] as const,
    detail: (id: string) => [...queryKeys.products.all, "detail", id] as const,
  },

  /**
   * The catalog hierarchy. Keyed by level segment so invalidating
   * `catalog.all` after any write refreshes every level, the tree and the
   * stats at once — a create at one level changes the counts at every level
   * above it.
   */
  catalog: {
    all: ["catalog"] as const,
    levels: () => [...queryKeys.catalog.all, "levels"] as const,
    tree: (params?: unknown) => [...queryKeys.catalog.all, "tree", params] as const,
    stats: () => [...queryKeys.catalog.all, "stats"] as const,
    list: (segment: string, params?: unknown) =>
      [...queryKeys.catalog.all, segment, "list", params] as const,
    detail: (segment: string, id: string) =>
      [...queryKeys.catalog.all, segment, "detail", id] as const,
    children: (segment: string, id: string, params?: unknown) =>
      [...queryKeys.catalog.all, segment, "children", id, params] as const,
  },

  banners: {
    all: ["banners"] as const,
    list: (params?: unknown) => [...queryKeys.banners.all, "list", params] as const,
    detail: (id: string) => [...queryKeys.banners.all, "detail", id] as const,
  },

  inventory: {
    all: ["inventory"] as const,
    list: (params?: unknown) => [...queryKeys.inventory.all, "list", params] as const,
    stats: () => [...queryKeys.inventory.all, "stats"] as const,
    history: (productId: string) =>
      [...queryKeys.inventory.all, "history", productId] as const,
  },

  orders: {
    all: ["orders"] as const,
    list: (params?: unknown) => [...queryKeys.orders.all, "list", params] as const,
    detail: (id: string) => [...queryKeys.orders.all, "detail", id] as const,
    stats: () => [...queryKeys.orders.all, "stats"] as const,
  },

  customers: {
    all: ["customers"] as const,
    list: (params?: unknown) => [...queryKeys.customers.all, "list", params] as const,
    detail: (id: string) => [...queryKeys.customers.all, "detail", id] as const,
    stats: () => [...queryKeys.customers.all, "stats"] as const,
  },

  discounts: {
    all: ["discounts"] as const,
    list: (params?: unknown) => [...queryKeys.discounts.all, "list", params] as const,
    detail: (id: string) => [...queryKeys.discounts.all, "detail", id] as const,
  },

  reports: {
    all: ["reports"] as const,
    view: (params?: unknown) => [...queryKeys.reports.all, "view", params] as const,
  },

  notifications: {
    all: ["notifications"] as const,
    list: (params?: unknown) =>
      [...queryKeys.notifications.all, "list", params] as const,
    grouped: (params?: unknown) =>
      [...queryKeys.notifications.all, "grouped", params] as const,
    unreadCount: () => [...queryKeys.notifications.all, "unread-count"] as const,
  },

  messages: {
    all: ["messages"] as const,
    list: (params?: unknown) => [...queryKeys.messages.all, "list", params] as const,
    detail: (id: string) => [...queryKeys.messages.all, "detail", id] as const,
  },

  settings: {
    all: ["settings"] as const,
    detail: (key: string) => [...queryKeys.settings.all, key] as const,
  },

  profile: {
    all: ["profile"] as const,
    me: () => [...queryKeys.profile.all, "me"] as const,
    sessions: () => [...queryKeys.profile.all, "sessions"] as const,
  },

  staff: {
    all: ["staff"] as const,
    list: (params?: unknown) => [...queryKeys.staff.all, "list", params] as const,
  },
} as const;
