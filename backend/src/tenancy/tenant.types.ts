import { TenantStatus } from '@prisma/client';

/**
 * The tenant a request is acting on, resolved once per request by
 * {@link TenantGuard} and attached to `request.tenant`.
 *
 * Services never take a tenant id from the request body or a query param —
 * only from here — which is what makes cross-tenant access impossible to
 * request by hand.
 */
export interface TenantContext {
  id: string;
  slug: string;
  name: string;
  status: TenantStatus;
  /** How the tenant was identified, for logging and debugging. */
  source: 'user' | 'header' | 'host' | 'query' | 'sole-tenant';
}

/** Request shape once authentication and tenant resolution have run. */
export interface TenantRequest {
  tenant?: TenantContext;
}

export const TENANT_ID_HEADER = 'x-tenant-id';
export const TENANT_SLUG_HEADER = 'x-tenant-slug';
