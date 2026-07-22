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

  categories: {
    all: ["categories"] as const,
    list: (params?: unknown) => [...queryKeys.categories.all, "list", params] as const,
    detail: (id: string) => [...queryKeys.categories.all, "detail", id] as const,
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
