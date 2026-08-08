"use client";

import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { authApi, type RegisterPayload } from "@/lib/api/services/auth";
import { getApiErrorMessage } from "@/lib/api/client";
import { queryKeys } from "@/lib/api/query-keys";
import { useAuthStore } from "@/lib/stores/auth-store";
import { cartStorage } from "@/lib/stores/cart-store";
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
  const setSession = useAuthStore((s) => s.setSession);
  const setUser = useAuthStore((s) => s.setUser);

  return useQuery({
    queryKey: queryKeys.auth.me,
    queryFn: async () => {
      // Use refresh endpoint to get both user AND new access token
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });

      if (!response.ok) {
        throw new Error('Failed to refresh session');
      }

      const data = await response.json();

      // Store the full session including new access token
      if (data.success && data.data) {
        setSession(data.data);
        return data.data.user;
      }

      throw new Error('Invalid refresh response');
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
      // Fold anything added while logged out into the account cart. Must run
      // after setSession so the request carries the new access token.
      void cartStorage.mergeGuestCart();
      toast.success(`Welcome back, ${data.user.fullName.split(" ")[0]}!`);
      // Staff land in the admin console, customers in their portal.
      router.push(isAdminRole(data.user.role) ? "/admin/dashboard" : "/account");
    },
    onError: (error) => toast.error(getApiErrorMessage(error)),
  });
}

export function useRegister() {
  const router = useRouter();
  const clearSession = useAuthStore((s) => s.clearSession);

  return useMutation({
    mutationFn: (payload: RegisterPayload) => authApi.register(payload),
    onSuccess: (data, variables) => {
      // Clear any existing session before starting registration flow
      clearSession();
      toast.success(data.message);
      router.push(`/verify-otp?email=${encodeURIComponent(variables.email)}`);
    },
    onError: (error) => toast.error(getApiErrorMessage(error)),
  });
}

export function useVerifyOtp() {
  const router = useRouter();
  const setSession = useAuthStore((s) => s.setSession);

  return useMutation({
    mutationFn: authApi.verifyOtp,
    onSuccess: (data) => {
      setSession(data); // Store tokens and user data after verification
      // Verification also establishes a session, so the guest cart built up
      // before signing up has to follow the shopper here too.
      void cartStorage.mergeGuestCart();
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

/**
 * Self-service profile update. Writes the server's response back into the auth
 * store so the sidebar, avatar and header pick up the new name without a
 * reload, and invalidates the cached session query.
 */
export function useUpdateProfile() {
  const queryClient = useQueryClient();
  const setUser = useAuthStore((s) => s.setUser);

  return useMutation({
    mutationFn: authApi.updateProfile,
    onSuccess: (user) => {
      setUser(user);
      queryClient.invalidateQueries({ queryKey: queryKeys.auth.me });
      toast.success("Profile updated");
    },
    onError: (error) => toast.error(getApiErrorMessage(error)),
  });
}

/**
 * Uploads a new profile picture. Shares `useUpdateProfile`'s pattern of writing
 * the server's user back into the store so the avatar changes everywhere at
 * once — sidebar, header and profile card all read from the same session.
 */
export function useUploadAvatar() {
  const queryClient = useQueryClient();
  const setUser = useAuthStore((s) => s.setUser);

  return useMutation({
    mutationFn: authApi.uploadAvatar,
    onSuccess: (user) => {
      setUser(user);
      queryClient.invalidateQueries({ queryKey: queryKeys.auth.me });
      toast.success("Profile picture updated");
    },
    onError: (error) => toast.error(getApiErrorMessage(error)),
  });
}

export function useRemoveAvatar() {
  const queryClient = useQueryClient();
  const setUser = useAuthStore((s) => s.setUser);

  return useMutation({
    mutationFn: authApi.removeAvatar,
    onSuccess: (user) => {
      setUser(user);
      queryClient.invalidateQueries({ queryKey: queryKeys.auth.me });
      toast.success("Profile picture removed");
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
      // The cart is persisted to localStorage, so without this the next person
      // to use the browser would see the previous user's items.
      cartStorage.reset();
      queryClient.clear();
      router.push("/login");
    },
  });
}
