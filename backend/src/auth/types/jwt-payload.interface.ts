import { Role } from '@prisma/client';

/** Claims carried by the access token. */
export interface JwtPayload {
  /** User id. */
  sub: string;
  email: string;
  role: Role;
  /**
   * The tenant this session acts on. Null only for a platform SUPER_ADMIN,
   * who selects a tenant per request via the X-Tenant-Slug header.
   *
   * Carried in the signed token so tenant scoping cannot be altered by the
   * caller — the whole isolation model rests on this claim.
   */
  tenantId: string | null;
}

/** Refresh token claims: includes the stored-token id so it can be rotated. */
export interface JwtRefreshPayload extends JwtPayload {
  tokenId: string;
}

/** Shape attached to `request.user` once a request is authenticated. */
export interface AuthenticatedUser {
  id: string;
  email: string;
  role: Role;
  tenantId: string | null;
}
