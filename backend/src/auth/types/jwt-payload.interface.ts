import { Role } from '@prisma/client';

/** Claims carried by the access token. */
export interface JwtPayload {
  /** User id. */
  sub: string;
  email: string;
  role: Role;
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
}
