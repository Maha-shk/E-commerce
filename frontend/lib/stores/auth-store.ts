import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { AuthUser, LoginResponse } from "@/lib/api/types";

type AuthState = {
  /**
   * Kept in memory only — never persisted. A short-lived token in localStorage
   * is the easiest thing for an XSS payload to steal, and it is cheap to
   * re-mint from the refresh token on reload.
   */
  accessToken: string | null;
  /** Persisted so a page reload can restore the session silently. */
  refreshToken: string | null;
  user: AuthUser | null;
  /** False until the persisted state has been read from storage. */
  hydrated: boolean;

  setSession: (session: LoginResponse) => void;
  setAccessToken: (token: string | null) => void;
  /** Stores a rotated token pair, leaving the current user untouched. */
  setTokens: (tokens: { accessToken: string; refreshToken: string }) => void;
  setUser: (user: AuthUser) => void;
  clearSession: () => void;
  setHydrated: (value: boolean) => void;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      refreshToken: null,
      user: null,
      hydrated: false,

      setSession: ({ accessToken, refreshToken, user }) =>
        set({ accessToken, refreshToken, user }),

      setAccessToken: (accessToken) => set({ accessToken }),

      setTokens: ({ accessToken, refreshToken }) =>
        set({ accessToken, refreshToken }),

      setUser: (user) => set({ user }),

      clearSession: () =>
        set({ accessToken: null, refreshToken: null, user: null }),

      setHydrated: (hydrated) => set({ hydrated }),
    }),
    {
      name: "cento-auth",
      storage: createJSONStorage(() => localStorage),
      // accessToken is deliberately excluded from persistence.
      partialize: (state) => ({
        refreshToken: state.refreshToken,
        user: state.user,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated(true);
      },
    },
  ),
);

/* ---- Non-reactive accessors, for use outside React (e.g. axios interceptors) ---- */

export const authStorage = {
  getAccessToken: () => useAuthStore.getState().accessToken,
  getRefreshToken: () => useAuthStore.getState().refreshToken,
  getUser: () => useAuthStore.getState().user,
  setAccessToken: (token: string | null) =>
    useAuthStore.getState().setAccessToken(token),
  setTokens: (tokens: { accessToken: string; refreshToken: string }) =>
    useAuthStore.getState().setTokens(tokens),
  setSession: (session: LoginResponse) =>
    useAuthStore.getState().setSession(session),
  setUser: (user: AuthUser) => useAuthStore.getState().setUser(user),
  clear: () => useAuthStore.getState().clearSession(),
};
