import { del, get, getPaginated, patch, post, put } from "@/lib/api/request";
import { api } from "@/lib/api/client";
import type { ApiResponse, PaginationQuery } from "@/lib/api/types";

/**
 * Typed wrappers over every /admin endpoint.
 * Domain types live in `lib/api/models.ts`.
 */
import type {
  AdminProfile,
  Conversation,
  ConversationDetail,
  CustomerDetail,
  CustomerListItem,
  DashboardStats,
  Discount,
  InventoryItem,
  InventoryStats,
  MonthlyPoint,
  Notification,
  NotificationGroup,
  Order,
  OrderStats,
  Product,
  RecentOrder,
  ReportView,
  SessionInfo,
  StaffMember,
  TopProduct,
} from "@/lib/api/models";

/* ---- Dashboard ---- */
export const dashboardApi = {
  stats: () => get<DashboardStats>("/admin/dashboard/stats"),
  monthly: (months = 6) =>
    get<MonthlyPoint[]>("/admin/dashboard/monthly-performance", { months }),
  recentOrders: (limit = 5) =>
    get<RecentOrder[]>("/admin/dashboard/recent-orders", { limit }),
  topProducts: (limit = 5) =>
    get<TopProduct[]>("/admin/dashboard/top-products", { limit }),
};

/* ---- Products ----
 *
 * A product hangs off a Model. Filtering by any ancestor pulls everything
 * beneath it, so one endpoint serves "this model's parts" and "everything
 * Samsung makes" alike.
 */
export type ProductQuery = PaginationQuery & {
  /** The direct parent. */
  modelId?: string;
  /** Ancestor filters — everything beneath the given node. */
  productTypeId?: string;
  companyId?: string;
  categoryId?: string;
  status?: string;
  visibility?: string;
  sortBy?: "name" | "price" | "stock" | "createdAt";
  sortOrder?: "asc" | "desc";
};

/** Server-enforced cap on one `reassign` call. Beyond it the request 400s. */
export const REASSIGN_MAX_IDS = 200;

export const productsApi = {
  list: (params?: ProductQuery) => getPaginated<Product>("/admin/products", params),
  detail: (id: string) => get<Product>(`/admin/products/${id}`),
  create: (body: unknown) => post<Product>("/admin/products", body),
  update: (id: string, body: unknown) => patch<Product>(`/admin/products/${id}`, body),
  /**
   * Bulk move to another model — the way to clear a node before deleting it.
   *
   * All-or-nothing, in one transaction: a 200 means every id moved. Duplicates
   * are ignored rather than rejected, and a missing id rolls the whole move
   * back with a 404 naming the offenders. Capped at
   * {@link REASSIGN_MAX_IDS} per call.
   */
  reassign: (productIds: string[], modelId: string) =>
    post<{ message: string; count: number; modelId: string }>(
      "/admin/products/reassign",
      { productIds, modelId },
    ),
  remove: (id: string) => del<{ message: string }>(`/admin/products/${id}`),
};

/* ---- Inventory ---- */
export type InventoryQuery = PaginationQuery & {
  categoryId?: string;
  status?: string;
};

export const inventoryApi = {
  list: (params?: InventoryQuery) => getPaginated<InventoryItem>("/admin/inventory", params),
  stats: () => get<InventoryStats>("/admin/inventory/stats"),
  adjust: (productId: string, body: { delta?: number; setTo?: number; reason?: string }) =>
    patch<InventoryItem>(`/admin/inventory/${productId}/adjust`, body),
};

/* ---- Orders ---- */
export type OrderQuery = PaginationQuery & {
  status?: string;
  paymentStatus?: string;
  customerId?: string;
  from?: string;
  to?: string;
};

export const ordersApi = {
  list: (params?: OrderQuery) => getPaginated<Order>("/admin/orders", params),
  detail: (id: string) => get<Order>(`/admin/orders/${id}`),
  stats: () => get<OrderStats>("/admin/orders/stats"),
  updateStatus: (
    id: string,
    body: { status?: string; paymentStatus?: string; shippingTracking?: string },
  ) => patch<Order>(`/admin/orders/${id}/status`, body),
  remove: (id: string) => del<{ message: string }>(`/admin/orders/${id}`),
};

/* ---- Customers ---- */
export type CustomerQuery = PaginationQuery & { status?: string };

export const customersApi = {
  list: (params?: CustomerQuery) =>
    getPaginated<CustomerListItem>("/admin/customers", params),
  detail: (id: string) => get<CustomerDetail>(`/admin/customers/${id}`),
  stats: () =>
    get<{ total: number; active: number; inactive: number; suspended: number }>(
      "/admin/customers/stats",
    ),
  update: (id: string, body: unknown) => patch<CustomerListItem>(`/admin/customers/${id}`, body),
};

/* ---- Discounts ---- */
export type DiscountQuery = PaginationQuery & {
  /** Derived from the date window — matches the badge shown in the table. */
  status?: "Active" | "Scheduled" | "Expired";
  category?: string;
  type?: string;
};

export const discountsApi = {
  list: (params?: DiscountQuery) => getPaginated<Discount>("/admin/discounts", params),
  detail: (id: string) => get<Discount>(`/admin/discounts/${id}`),
  create: (body: unknown) => post<Discount>("/admin/discounts", body),
  update: (id: string, body: unknown) => patch<Discount>(`/admin/discounts/${id}`, body),
  remove: (id: string) => del<{ message: string }>(`/admin/discounts/${id}`),
};

/* ---- Reports ---- */
export const reportsApi = {
  build: (params: { tab?: string; from?: string; to?: string; category?: string }) =>
    get<ReportView>("/admin/reports", params),
};

/* ---- Notifications ---- */
export type NotificationQuery = PaginationQuery & {
  category?: string;
  unreadOnly?: boolean;
};

export const notificationsApi = {
  list: (params?: NotificationQuery) =>
    getPaginated<Notification>("/admin/notifications", params),
  grouped: (params?: NotificationQuery) =>
    getPaginated<NotificationGroup>("/admin/notifications/grouped", params),
  unreadCount: () => get<{ unread: number }>("/admin/notifications/unread-count"),
  markRead: (id: string) => patch<{ message: string }>(`/admin/notifications/${id}/read`),
  markAllRead: () => patch<{ message: string }>("/admin/notifications/read-all"),
  remove: (id: string) => del<{ message: string }>(`/admin/notifications/${id}`),
};

/* ---- Messages ---- */
export const messagesApi = {
  list: (params?: PaginationQuery) => getPaginated<Conversation>("/admin/messages", params),
  detail: (id: string) => get<ConversationDetail>(`/admin/messages/${id}`),
  reply: (id: string, text: string) => post<unknown>(`/admin/messages/${id}/reply`, { text }),
  markRead: (id: string) => patch<{ message: string }>(`/admin/messages/${id}/read`),
  remove: (id: string) => del<{ message: string }>(`/admin/messages/${id}`),
};

/* ---- Settings ---- */
export const settingsApi = {
  all: () => get<Record<string, unknown>>("/admin/settings"),
  updateMany: (body: Record<string, unknown>) =>
    put<Record<string, unknown>>("/admin/settings", body),
  reset: (key: string) => del<unknown>(`/admin/settings/${key}`),
};

/* ---- Profile & staff ---- */
export const profileApi = {
  me: () => get<AdminProfile>("/admin/profile"),
  update: (body: unknown) => patch<AdminProfile>("/admin/profile", body),
  sessions: () => get<SessionInfo[]>("/admin/profile/sessions"),
  revokeSession: (id: string) => del<{ message: string }>(`/admin/profile/sessions/${id}`),
};

export const staffApi = {
  list: (params?: PaginationQuery) => getPaginated<StaffMember>("/admin/staff", params),
  create: (body: unknown) => post<StaffMember>("/admin/staff", body),
  update: (id: string, body: unknown) => patch<StaffMember>(`/admin/staff/${id}`, body),
  remove: (id: string) => del<{ message: string }>(`/admin/staff/${id}`),
};

/* ---- Banners ---- */

/** Mirrors the backend `Banner` model. */
export type Banner = {
  id: string;
  type: "HERO" | "PROMOTIONAL" | "SIDEBAR";
  title: string;
  description: string | null;
  imageUrl: string;
  mobileImageUrl: string | null;
  linkUrl: string | null;
  linkText: string | null;
  isActive: boolean;
  displayOrder: number;
  startDate: string | null;
  endDate: string | null;
  createdAt: string;
  updatedAt: string;
};

export type BannerQuery = PaginationQuery & {
  type?: string;
  isActive?: boolean;
};

export const bannersApi = {
  list: (params?: BannerQuery) => getPaginated<Banner>("/admin/banners", params),
  detail: (id: string) => get<Banner>(`/admin/banners/${id}`),
  create: (body: unknown) => post<Banner>("/admin/banners", body),
  update: (id: string, body: unknown) => patch<Banner>(`/admin/banners/${id}`, body),
  setActive: (id: string, isActive: boolean) =>
    patch<Banner>(`/admin/banners/${id}/active`, { isActive }),
  /** `ids` in display order — index becomes `displayOrder`. */
  reorder: (ids: string[]) =>
    patch<{ message: string }>("/admin/banners/reorder", { ids }),
  remove: (id: string) => del<{ message: string }>(`/admin/banners/${id}`),
};

/* ---- Uploads ---- */

export type UploadedImageResult = {
  url: string;
  publicId: string;
  width?: number;
  height?: number;
  bytes?: number;
  format?: string;
};

export const uploadsApi = {
  /**
   * Uploads an image and returns its CDN URL.
   *
   * `Content-Type` is explicitly cleared: the shared axios instance defaults
   * every request to `application/json`, and axios only generates the
   * `multipart/form-data` boundary when the header is unset.
   */
  image: async (
    file: File,
    folder: "banners" | "products" | "categories" = "banners",
  ): Promise<UploadedImageResult> => {
    const body = new FormData();
    body.append("file", file);

    const { data } = await api.post<ApiResponse<UploadedImageResult>>(
      `/admin/uploads/image?folder=${folder}`,
      body,
      { headers: { "Content-Type": undefined } },
    );
    return data.data;
  },
};
