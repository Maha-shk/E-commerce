import { post, get } from "@/lib/api/request";
import type { AuthUser, LoginResponse, PaginatedResponse } from "@/lib/api/types";

/** Thin, typed wrappers over the backend's /auth endpoints. */

export type RegisterPayload = {
  fullName: string;
  email: string;
  password: string;
};

export type MessageResponse = { message: string };

export type Order = {
  id: string;
  orderNumber: string;
  placedAt: string;
  status: string;
  paymentStatus: string;
  shippingMethod: string;
  shippingCost: number;
  discount: number;
  totals: {
    subtotal: number;
    shipping: number;
    discount: number;
    total: number;
  };
  items: Array<{
    id: string;
    name: string;
    sku: string;
    quantity: number;
    unitPrice: number;
    lineTotal: number;
  }>;
  customer?: {
    id: string;
    fullName: string;
    email: string;
  };
};

export const authApi = {
  register: (payload: RegisterPayload) =>
    post<{ message: string; user: AuthUser }>("/auth/register", payload),

  login: (payload: { email: string; password: string }) =>
    post<LoginResponse>("/auth/login", payload),

  verifyOtp: (payload: { email: string; code: string }) =>
    post<MessageResponse & LoginResponse>("/auth/verify-otp", payload),

  resendOtp: (payload: { email: string }) =>
    post<MessageResponse>("/auth/resend-otp", payload),

  forgotPassword: (payload: { email: string }) =>
    post<MessageResponse>("/auth/forgot-password", payload),

  resetPassword: (payload: {
    email: string;
    code: string;
    newPassword: string;
  }) => post<MessageResponse>("/auth/reset-password", payload),

  changePassword: (payload: {
    currentPassword: string;
    newPassword: string;
  }) => post<MessageResponse>("/auth/change-password", payload),

  logout: (refreshToken: string) =>
    post<MessageResponse>("/auth/logout", { refreshToken }),

  me: () => get<AuthUser>("/auth/me"),

  getOrders: (params?: {
    page?: number;
    limit?: number;
    status?: string;
    from?: string;
    to?: string;
  }) => get<PaginatedResponse<Order>>("/auth/orders", params),
};
