"use client";

import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { authApi, type RegisterPayload } from "@/lib/api/services/auth";
import { getApiErrorMessage } from "@/lib/api/client";
import { queryKeys } from "@/lib/api/query-keys";
import { useAuthStore } from "@/lib/stores/auth-store";
import { isAdminRole } from "@/lib/api/types";

/** Reactive view of the current session. */
export function useSession() {
  const user = useAuthStore((s) => s.user);
  const accessToken = useAuthStore((s) => s.accessToken);
  const refreshToken = useAuthStore((s) => s.refreshToken);
  const hydrated = useAuthStore((s) => s.hydrated);

  return {
    user,
    hydrated,
    /** A persisted refresh token is enough to re-mint an access token. */
    isAuthenticated: Boolean(refreshToken || accessToken),
    isAdmin: isAdminRole(user?.role),
  };
}

/**
 * Re-validates the session against the server. Runs once a refresh token
 * exists, and repopulates the user after a reload.
 */
export function useCurrentUser() {
  const refreshToken = useAuthStore((s) => s.refreshToken);
  const hydrated = useAuthStore((s) => s.hydrated);
  const setUser = useAuthStore((s) => s.setUser);

  return useQuery({
    queryKey: queryKeys.auth.me,
    queryFn: async () => {
      const user = await authApi.me();
      setUser(user);
      return user;
    },
    enabled: hydrated && Boolean(refreshToken),
    staleTime: 5 * 60_000,
    retry: false,
  });
}

export function useLogin() {
  const router = useRouter();
  const setSession = useAuthStore((s) => s.setSession);

  return useMutation({
    mutationFn: authApi.login,
    onSuccess: (data) => {
      setSession(data);
      toast.success(`Welcome back, ${data.user.fullName.split(" ")[0]}!`);
      // Staff land in the admin console, customers in their portal.
      router.push(isAdminRole(data.user.role) ? "/admin/dashboard" : "/account");
    },
    onError: (error) => toast.error(getApiErrorMessage(error)),
  });
}

export function useRegister() {
  const router = useRouter();

  return useMutation({
    mutationFn: (payload: RegisterPayload) => authApi.register(payload),
    onSuccess: (data, variables) => {
      toast.success(data.message);
      router.push(`/verify-otp?email=${encodeURIComponent(variables.email)}`);
    },
    onError: (error) => toast.error(getApiErrorMessage(error)),
  });
}

export function useVerifyOtp() {
  const router = useRouter();

  return useMutation({
    mutationFn: authApi.verifyOtp,
    onSuccess: (data) => {
      toast.success(data.message);
      router.push("/verified");
    },
    onError: (error) => toast.error(getApiErrorMessage(error)),
  });
}

export function useResendOtp() {
  return useMutation({
    mutationFn: authApi.resendOtp,
    onSuccess: (data) => toast.success(data.message),
    onError: (error) => toast.error(getApiErrorMessage(error)),
  });
}

export function useForgotPassword() {
  const router = useRouter();

  return useMutation({
    mutationFn: authApi.forgotPassword,
    onSuccess: (data, variables) => {
      toast.success(data.message);
      router.push(`/reset-password?email=${encodeURIComponent(variables.email)}`);
    },
    onError: (error) => toast.error(getApiErrorMessage(error)),
  });
}

export function useResetPassword() {
  const router = useRouter();

  return useMutation({
    mutationFn: authApi.resetPassword,
    onSuccess: (data) => {
      toast.success(data.message);
      router.push("/login");
    },
    onError: (error) => toast.error(getApiErrorMessage(error)),
  });
}

export function useChangePassword() {
  return useMutation({
    mutationFn: authApi.changePassword,
    onSuccess: (data) => toast.success(data.message),
    onError: (error) => toast.error(getApiErrorMessage(error)),
  });
}

export function useLogout() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const clearSession = useAuthStore((s) => s.clearSession);

  return useMutation({
    mutationFn: async () => {
      const token = useAuthStore.getState().refreshToken;
      // Best-effort server-side revocation; the local session clears regardless.
      if (token) {
        try {
          await authApi.logout(token);
        } catch {
          /* ignore */
        }
      }
    },
    onSettled: () => {
      clearSession();
      queryClient.clear();
      router.push("/login");
    },
  });
}
