import { post, get } from "@/lib/api/request";
import type { AuthUser, LoginResponse } from "@/lib/api/types";

/** Thin, typed wrappers over the backend's /auth endpoints. */

export type RegisterPayload = {
  fullName: string;
  email: string;
  password: string;
};

export type MessageResponse = { message: string };

export const authApi = {
  register: (payload: RegisterPayload) =>
    post<{ message: string; user: AuthUser }>("/auth/register", payload),

  login: (payload: { email: string; password: string }) =>
    post<LoginResponse>("/auth/login", payload),

  verifyOtp: (payload: { email: string; code: string }) =>
    post<MessageResponse>("/auth/verify-otp", payload),

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
};
