"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
  type QueryKey,
} from "@tanstack/react-query";
import { toast } from "sonner";
import { getApiErrorMessage } from "@/lib/api/client";
import { queryKeys } from "@/lib/api/query-keys";
import {
  bannersApi,
  categoriesApi,
  customersApi,
  dashboardApi,
  discountsApi,
  inventoryApi,
  messagesApi,
  notificationsApi,
  ordersApi,
  productsApi,
  profileApi,
  reportsApi,
  settingsApi,
  type BannerQuery,
  type CategoryQuery,
  type CustomerQuery,
  type DiscountQuery,
  type InventoryQuery,
  type NotificationQuery,
  type OrderQuery,
  type ProductQuery,
} from "@/lib/api/services/admin";
import type { PaginationQuery } from "@/lib/api/types";

/**
 * Shared mutation wrapper: shows a toast and invalidates the affected caches.
 */
function useAdminMutation<TArgs, TResult>(
  mutationFn: (args: TArgs) => Promise<TResult>,
  options: { successMessage: string; invalidate: QueryKey[] },
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn,
    onSuccess: () => {
      toast.success(options.successMessage);
      options.invalidate.forEach((key) =>
        queryClient.invalidateQueries({ queryKey: key }),
      );
    },
    onError: (error) => toast.error(getApiErrorMessage(error)),
  });
}

/* ---- Dashboard ---- */

export function useDashboardStats() {
  return useQuery({
    queryKey: queryKeys.dashboard.stats(),
    queryFn: dashboardApi.stats,
  });
}

export function useMonthlyPerformance(months = 6) {
  return useQuery({
    queryKey: queryKeys.dashboard.monthly(months),
    queryFn: () => dashboardApi.monthly(months),
  });
}

export function useRecentOrders(limit = 5) {
  return useQuery({
    queryKey: queryKeys.dashboard.recentOrders(limit),
    queryFn: () => dashboardApi.recentOrders(limit),
  });
}

/* ---- Products ---- */

export function useProducts(
  params?: ProductQuery,
  options?: { enabled?: boolean },
) {
  return useQuery({
    queryKey: queryKeys.products.list(params),
    queryFn: () => productsApi.list(params),
    // Lets the global search hold the query until the term is long enough.
    enabled: options?.enabled ?? true,
    // Keeps the current rows on screen while the next page/filter loads.
    // Without it the table unmounts to skeletons on every keystroke, which is
    // most of why the admin "felt slow" even when the request was fast.
    placeholderData: (previous) => previous,
  });
}

export function useProduct(id: string) {
  return useQuery({
    queryKey: queryKeys.products.detail(id),
    queryFn: () => productsApi.detail(id),
    enabled: Boolean(id),
  });
}

export function useCreateProduct() {
  return useAdminMutation(productsApi.create, {
    successMessage: "Product created",
    invalidate: [queryKeys.products.all, queryKeys.inventory.all, queryKeys.dashboard.all],
  });
}

export function useUpdateProduct(id: string) {
  return useAdminMutation((body: unknown) => productsApi.update(id, body), {
    successMessage: "Product updated",
    invalidate: [queryKeys.products.all, queryKeys.inventory.all, queryKeys.dashboard.all],
  });
}

export function useDeleteProduct() {
  return useAdminMutation((id: string) => productsApi.remove(id), {
    successMessage: "Product deleted",
    invalidate: [queryKeys.products.all, queryKeys.inventory.all, queryKeys.dashboard.all],
  });
}

/* ---- Categories ---- */

export function useCategories(params?: CategoryQuery) {
  return useQuery({
    queryKey: queryKeys.categories.list(params),
    queryFn: () => categoriesApi.list(params),
    placeholderData: (previous) => previous,
  });
}

export function useCreateCategory() {
  return useAdminMutation(categoriesApi.create, {
    successMessage: "Category created",
    invalidate: [queryKeys.categories.all],
  });
}

export function useUpdateCategory() {
  return useAdminMutation(
    ({ id, body }: { id: string; body: unknown }) => categoriesApi.update(id, body),
    { successMessage: "Category updated", invalidate: [queryKeys.categories.all] },
  );
}

export function useDeleteCategory() {
  return useAdminMutation((id: string) => categoriesApi.remove(id), {
    successMessage: "Category deleted",
    invalidate: [queryKeys.categories.all],
  });
}

/* ---- Inventory ---- */

export function useInventory(params?: InventoryQuery) {
  return useQuery({
    queryKey: queryKeys.inventory.list(params),
    queryFn: () => inventoryApi.list(params),
    placeholderData: (previous) => previous,
  });
}

export function useInventoryStats() {
  return useQuery({
    queryKey: queryKeys.inventory.stats(),
    queryFn: inventoryApi.stats,
  });
}

export function useAdjustStock() {
  return useAdminMutation(
    ({
      productId,
      ...body
    }: { productId: string; delta?: number; setTo?: number; reason?: string }) =>
      inventoryApi.adjust(productId, body),
    {
      successMessage: "Stock updated",
      invalidate: [queryKeys.inventory.all, queryKeys.products.all, queryKeys.dashboard.all],
    },
  );
}

/* ---- Orders ---- */

export function useOrders(params?: OrderQuery, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: queryKeys.orders.list(params),
    queryFn: () => ordersApi.list(params),
    enabled: options?.enabled ?? true,
    placeholderData: (previous) => previous,
  });
}

export function useOrderStats() {
  return useQuery({ queryKey: queryKeys.orders.stats(), queryFn: ordersApi.stats });
}

export function useUpdateOrderStatus() {
  return useAdminMutation(
    ({
      id,
      ...body
    }: {
      id: string;
      status?: string;
      paymentStatus?: string;
      shippingTracking?: string;
    }) => ordersApi.updateStatus(id, body),
    {
      successMessage: "Order updated",
      invalidate: [queryKeys.orders.all, queryKeys.dashboard.all, queryKeys.customers.all],
    },
  );
}

/* ---- Customers ---- */

export function useCustomers(params?: CustomerQuery) {
  return useQuery({
    queryKey: queryKeys.customers.list(params),
    queryFn: () => customersApi.list(params),
    placeholderData: (previous) => previous,
  });
}

export function useCustomer(id: string | null) {
  return useQuery({
    queryKey: queryKeys.customers.detail(id ?? ""),
    queryFn: () => customersApi.detail(id!),
    enabled: Boolean(id),
  });
}

export function useUpdateCustomer() {
  return useAdminMutation(
    ({ id, body }: { id: string; body: unknown }) => customersApi.update(id, body),
    { successMessage: "Customer updated", invalidate: [queryKeys.customers.all] },
  );
}

/* ---- Discounts ---- */

export function useDiscounts(params?: DiscountQuery) {
  return useQuery({
    queryKey: queryKeys.discounts.list(params),
    queryFn: () => discountsApi.list(params),
    placeholderData: (previous) => previous,
  });
}

export function useCreateDiscount() {
  return useAdminMutation(discountsApi.create, {
    successMessage: "Discount created",
    invalidate: [queryKeys.discounts.all],
  });
}

export function useUpdateDiscount() {
  return useAdminMutation(
    ({ id, body }: { id: string; body: unknown }) => discountsApi.update(id, body),
    { successMessage: "Discount updated", invalidate: [queryKeys.discounts.all] },
  );
}

export function useDeleteDiscount() {
  return useAdminMutation((id: string) => discountsApi.remove(id), {
    successMessage: "Discount deleted",
    invalidate: [queryKeys.discounts.all],
  });
}

/* ---- Reports ---- */

export function useReport(params: {
  tab?: string;
  from?: string;
  to?: string;
  category?: string;
}) {
  return useQuery({
    queryKey: queryKeys.reports.view(params),
    queryFn: () => reportsApi.build(params),
  });
}

/* ---- Notifications ---- */

export function useNotificationGroups(params?: NotificationQuery) {
  return useQuery({
    queryKey: queryKeys.notifications.grouped(params),
    queryFn: () => notificationsApi.grouped(params),
  });
}

export function useUnreadCount() {
  return useQuery({
    queryKey: queryKeys.notifications.unreadCount(),
    queryFn: notificationsApi.unreadCount,
    // Keeps the topbar badge reasonably live.
    refetchInterval: 60_000,
  });
}

export function useMarkNotificationRead() {
  return useAdminMutation((id: string) => notificationsApi.markRead(id), {
    successMessage: "Marked as read",
    invalidate: [queryKeys.notifications.all],
  });
}

export function useMarkAllNotificationsRead() {
  return useAdminMutation((_?: unknown) => notificationsApi.markAllRead(), {
    successMessage: "All notifications marked as read",
    invalidate: [queryKeys.notifications.all],
  });
}

export function useDeleteNotification() {
  return useAdminMutation((id: string) => notificationsApi.remove(id), {
    successMessage: "Notification deleted",
    invalidate: [queryKeys.notifications.all],
  });
}

/* ---- Messages ---- */

export function useConversations(params?: PaginationQuery) {
  return useQuery({
    queryKey: queryKeys.messages.list(params),
    queryFn: () => messagesApi.list(params),
  });
}

/**
 * Total unread customer messages, for the topbar badge.
 *
 * The badge was previously a hardcoded red dot that was ALWAYS on, so it
 * signalled nothing — an admin with a clean inbox still saw "you have mail".
 */
export function useUnreadMessageCount() {
  return useQuery({
    queryKey: [...queryKeys.messages.all, "unread-total"],
    queryFn: () => messagesApi.list({ limit: 100 }),
    select: (response) =>
      response.data.reduce((sum, conversation) => sum + (conversation.unread ?? 0), 0),
    staleTime: 30_000,
  });
}

export function useConversation(id: string | null) {
  return useQuery({
    queryKey: queryKeys.messages.detail(id ?? ""),
    queryFn: () => messagesApi.detail(id!),
    enabled: Boolean(id),
  });
}

export function useSendMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, text }: { id: string; text: string }) =>
      messagesApi.reply(id, text),
    onSuccess: (_data, variables) => {
      // No toast here — the new bubble appearing is feedback enough.
      queryClient.invalidateQueries({
        queryKey: queryKeys.messages.detail(variables.id),
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.messages.all });
    },
    onError: (error) => toast.error(getApiErrorMessage(error)),
  });
}

/* ---- Settings ---- */

export function useSettings() {
  return useQuery({ queryKey: queryKeys.settings.all, queryFn: settingsApi.all });
}

export function useUpdateSettings() {
  return useAdminMutation(settingsApi.updateMany, {
    successMessage: "Settings saved",
    invalidate: [queryKeys.settings.all],
  });
}

/* ---- Profile ---- */

export function useProfile() {
  return useQuery({ queryKey: queryKeys.profile.me(), queryFn: profileApi.me });
}

export function useUpdateProfile() {
  return useAdminMutation(profileApi.update, {
    successMessage: "Profile updated",
    invalidate: [queryKeys.profile.all, queryKeys.auth.me],
  });
}

export function useSessions() {
  return useQuery({
    queryKey: queryKeys.profile.sessions(),
    queryFn: profileApi.sessions,
  });
}

export function useRevokeSession() {
  return useAdminMutation((id: string) => profileApi.revokeSession(id), {
    successMessage: "Session revoked",
    invalidate: [queryKeys.profile.all],
  });
}

/* ---- Banners ---- */

export function useBanners(params?: BannerQuery) {
  return useQuery({
    queryKey: queryKeys.banners.list(params),
    queryFn: () => bannersApi.list(params),
  });
}

export function useCreateBanner() {
  return useAdminMutation(bannersApi.create, {
    successMessage: "Banner created",
    invalidate: [queryKeys.banners.all],
  });
}

export function useUpdateBanner() {
  return useAdminMutation(
    ({ id, body }: { id: string; body: unknown }) => bannersApi.update(id, body),
    { successMessage: "Banner updated", invalidate: [queryKeys.banners.all] },
  );
}

export function useSetBannerActive() {
  return useAdminMutation(
    ({ id, isActive }: { id: string; isActive: boolean }) =>
      bannersApi.setActive(id, isActive),
    { successMessage: "Banner visibility updated", invalidate: [queryKeys.banners.all] },
  );
}

/**
 * Persists a new display order. The list is reordered locally first, so the
 * rows don't jump back while the request is in flight.
 */
export function useReorderBanners() {
  return useAdminMutation((ids: string[]) => bannersApi.reorder(ids), {
    successMessage: "Order saved",
    invalidate: [queryKeys.banners.all],
  });
}

export function useDeleteBanner() {
  return useAdminMutation(bannersApi.remove, {
    successMessage: "Banner deleted",
    invalidate: [queryKeys.banners.all],
  });
}
