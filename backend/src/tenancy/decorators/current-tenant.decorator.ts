import {
  createParamDecorator,
  ExecutionContext,
  InternalServerErrorException,
} from '@nestjs/common';
import { TenantContext } from '../tenant.types';

/**
 * Injects the resolved tenant.
 *
 * `@CurrentTenant() tenant: TenantContext` gives the whole context;
 * `@CurrentTenant('id') tenantId: string` gives one field — the common case,
 * since services take a tenant id as their first argument.
 *
 * Throws rather than returning undefined: reaching a handler that asks for a
 * tenant without one means TenantGuard was bypassed, and silently continuing
 * would run a query with `tenantId: undefined`, which Prisma reads as "no
 * filter" — the exact shape of a cross-tenant data leak.
 */
export const CurrentTenant = createParamDecorator(
  (field: keyof TenantContext | undefined, ctx: ExecutionContext) => {
    const request = ctx
      .switchToHttp()
      .getRequest<{ tenant?: TenantContext }>();

    if (!request.tenant) {
      throw new InternalServerErrorException(
        'No tenant resolved for this request. Route is missing tenant resolution.',
      );
    }

    return field ? request.tenant[field] : request.tenant;
  },
);
