/**
 * Shared API types mirroring the backend's response envelopes.
 * See backend/src/common/interceptors/transform.interceptor.ts and
 * backend/src/common/filters/all-exceptions.filter.ts.
 */

/** Every successful non-list response: `{ success: true, data: T }`. */
export type ApiResponse<T> = {
  success: true;
  data: T;
};

/** Pagination metadata returned by every list endpoint. */
export type PaginationMeta = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

/** Successful list response: data plus pagination metadata. */
export type PaginatedResponse<T> = {
  success: true;
  data: T[];
  meta: PaginationMeta;
};

/** Error body produced by the backend's global exception filter. */
export type ApiErrorBody = {
  statusCode: number;
  error: string;
  /** A single message, or an array when DTO validation fails. */
  message: string | string[];
  path: string;
  timestamp: string;
};

/** Query params accepted by every paginated list endpoint. */
export type PaginationQuery = {
  page?: number;
  limit?: number;
  search?: string;
};

/* ---- Auth ---- */

export type Role = "SUPER_ADMIN" | "ADMIN" | "MANAGER" | "SUPPORT" | "CUSTOMER";
export type UserStatus = "ACTIVE" | "INACTIVE" | "SUSPENDED";

export type AuthUser = {
  id: string;
  email: string;
  fullName: string;
  phone: string | null;
  role: Role;
  status: UserStatus;
  emailVerified: boolean;
  avatarUrl: string | null;
  createdAt: string;
};

export type AuthTokens = {
  accessToken: string;
  refreshToken: string;
};

export type LoginResponse = AuthTokens & { user: AuthUser };

/** Staff roles that may access the admin console. */
export const ADMIN_ROLES: Role[] = [
  "SUPER_ADMIN",
  "ADMIN",
  "MANAGER",
  "SUPPORT",
];

export function isAdminRole(role: Role | undefined): boolean {
  return !!role && ADMIN_ROLES.includes(role);
}
