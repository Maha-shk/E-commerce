import axios, {
  AxiosError,
  type AxiosInstance,
  type InternalAxiosRequestConfig,
} from "axios";
import { authStorage } from "@/lib/stores/auth-store";
import type { ApiErrorBody, AuthUser } from "@/lib/api/types";

export const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";

/** Endpoints that must never trigger the refresh-and-retry flow. */
const AUTH_FREE_PATHS = [
  "/auth/login",
  "/auth/register",
  "/auth/refresh",
  "/auth/forgot-password",
  "/auth/reset-password",
  "/auth/verify-otp",
  "/auth/resend-otp",
];

export const api: AxiosInstance = axios.create({
  baseURL: API_URL,
  headers: { "Content-Type": "application/json" },
  // Enables cookie-based auth later without touching call sites.
  withCredentials: true,
});

/* ---- Request: attach the access token ---- */

api.interceptors.request.use((config) => {
  const token = authStorage.getAccessToken();
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

/* ---- Response: refresh once on 401, then retry ---- */

/**
 * The single in-flight refresh for the whole app.
 *
 * Refresh tokens rotate: presenting one revokes it. Anything that refreshes
 * independently is therefore a race — two callers read the same token, the
 * first rotates it, and the second gets a 401 on a token that was valid when
 * it was read. That is what made a page reload bounce an authenticated admin
 * to /login: this interceptor and `useCurrentUser` each ran their own refresh.
 *
 * Everyone now goes through `refreshSession`, so concurrent callers await the
 * same request and receive the same rotated pair.
 */
let refreshPromise: Promise<RefreshResult | null> | null = null;

export type RefreshResult = { accessToken: string; refreshToken: string; user?: AuthUser };

async function performRefresh(): Promise<RefreshResult | null> {
  const refreshToken = authStorage.getRefreshToken();
  if (!refreshToken) return null;

  try {
    // A bare axios call: the instance's interceptors must not recurse here.
    const { data } = await axios.post<{ success: true; data: RefreshResult }>(
      `${API_URL}/auth/refresh`,
      { refreshToken },
      { headers: { "Content-Type": "application/json" } },
    );
    // Refresh tokens rotate server-side, so store the new pair.
    authStorage.setTokens(data.data);
    if (data.data.user) authStorage.setUser(data.data.user);
    return data.data;
  } catch {
    authStorage.clear();
    return null;
  }
}

/**
 * Refreshes the session, collapsing concurrent callers onto one request.
 * Returns null when there is no usable session.
 */
export function refreshSession(): Promise<RefreshResult | null> {
  refreshPromise ??= performRefresh().finally(() => {
    refreshPromise = null;
  });
  return refreshPromise;
}

async function refreshAccessToken(): Promise<string | null> {
  const result = await refreshSession();
  return result?.accessToken ?? null;
}

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ApiErrorBody>) => {
    const original = error.config as
      | (InternalAxiosRequestConfig & { _retried?: boolean })
      | undefined;

    const isAuthFree = AUTH_FREE_PATHS.some((p) => original?.url?.includes(p));

    if (
      error.response?.status === 401 &&
      original &&
      !original._retried &&
      !isAuthFree
    ) {
      original._retried = true;

      // Shared with useCurrentUser — see refreshSession.
      const newToken = await refreshAccessToken();
      if (newToken) {
        original.headers.Authorization = `Bearer ${newToken}`;
        return api(original);
      }
      // Refresh failed: session is gone. Let the caller/route guard react.
    }

    return Promise.reject(error);
  },
);

/**
 * Normalises any thrown error into a human-readable message, flattening the
 * backend's validation-error arrays.
 */
export function getApiErrorMessage(
  error: unknown,
  fallback = "Something went wrong. Please try again.",
): string {
  if (axios.isAxiosError<ApiErrorBody>(error)) {
    if (!error.response) {
      return "Cannot reach the server. Check that the backend is running.";
    }
    const { message } = error.response.data ?? {};
    if (Array.isArray(message)) return message.join(", ");
    if (typeof message === "string") return message;
  }
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}
