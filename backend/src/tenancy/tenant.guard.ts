import {
  BadRequestException,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import { Role, TenantStatus } from '@prisma/client';
import { AuthenticatedUser } from '../auth/types/jwt-payload.interface';
import { PLATFORM_SCOPE_KEY } from './decorators/platform-scope.decorator';
import { TenantsService } from './tenants.service';
import {
  TENANT_ID_HEADER,
  TENANT_SLUG_HEADER,
  TenantContext,
} from './tenant.types';

/**
 * Resolves the tenant for every request and attaches it to `request.tenant`.
 *
 * Runs after JwtAuthGuard, so an authenticated request already knows who is
 * calling. The order of strategies is deliberate — the trustworthy source wins:
 *
 *  1. The signed JWT. A logged-in user's tenant comes from their own account,
 *     so no header or body field can move them into someone else's data.
 *  2. An explicit header, but *only* for a platform SUPER_ADMIN (an account
 *     with no tenant of its own) or an unauthenticated storefront request.
 *  3. The request Host, for storefronts served on a per-tenant domain.
 *  4. The sole tenant, when the installation only has one.
 */
@Injectable()
export class TenantGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly tenants: TenantsService,
    private readonly config: ConfigService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPlatformScope = this.reflector.getAllAndOverride<boolean>(
      PLATFORM_SCOPE_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (isPlatformScope) return true;

    const request = context
      .switchToHttp()
      .getRequest<Request & { user?: AuthenticatedUser; tenant?: TenantContext }>();

    const tenant = await this.resolve(request);

    if (!tenant) {
      throw new BadRequestException(
        'Could not determine which store this request belongs to. ' +
          `Send an ${TENANT_SLUG_HEADER} header or use a tenant domain.`,
      );
    }

    if (tenant.status === TenantStatus.SUSPENDED) {
      throw new ForbiddenException(`Store "${tenant.name}" is suspended`);
    }

    request.tenant = tenant;
    return true;
  }

  private async resolve(
    request: Request & { user?: AuthenticatedUser },
  ): Promise<TenantContext | null> {
    const user = request.user;

    // 1. A signed-in user carries their tenant in the access token.
    if (user?.tenantId) {
      return this.tenants.resolveById(user.tenantId, 'user');
    }

    // 2. Headers. Only honoured when nobody is signed in (a storefront visitor)
    //    or when the caller is a platform operator with no tenant of their own,
    //    which is what stops a tenant admin from reaching across.
    const mayUseHeader = !user || user.role === Role.SUPER_ADMIN;
    if (mayUseHeader) {
      const headerId = headerValue(request, TENANT_ID_HEADER);
      if (headerId) {
        const byId = await this.tenants.resolveById(headerId, 'header');
        if (byId) return byId;
        throw new BadRequestException(`Unknown tenant "${headerId}"`);
      }

      const headerSlug = headerValue(request, TENANT_SLUG_HEADER);
      if (headerSlug) {
        const bySlug = await this.tenants.resolveBySlug(headerSlug, 'header');
        if (bySlug) return bySlug;
        throw new BadRequestException(`Unknown store "${headerSlug}"`);
      }
    }

    // A signed-in user without a tenant is a platform operator; they must say
    // which store they are administering rather than getting a silent default.
    if (user && !user.tenantId) {
      throw new BadRequestException(
        `Platform accounts must target a store: send an ${TENANT_SLUG_HEADER} header.`,
      );
    }

    // 3. The storefront's own domain.
    const host = request.headers.host;
    if (host) {
      const byHost = await this.tenants.resolveByHost(host);
      if (byHost) return byHost;
    }

    // 4. `?tenant=slug`, handy for previews and local development.
    const querySlug = request.query?.tenant;
    if (typeof querySlug === 'string' && querySlug) {
      const byQuery = await this.tenants.resolveBySlug(querySlug, 'query');
      if (byQuery) return byQuery;
    }

    // 5. Single-tenant installations have nothing to disambiguate.
    const sole = await this.tenants.resolveSoleTenant();
    if (sole) return sole;

    // 6. Configured fallback. Keeps unmapped hosts (localhost, previews)
    //    working once a second tenant exists and step 5 stops matching.
    const fallback = this.config.get<string>('tenancy.fallbackSlug');
    if (fallback) {
      return this.tenants.resolveBySlug(fallback, 'sole-tenant');
    }

    return null;
  }
}

function headerValue(request: Request, name: string): string | undefined {
  const raw = request.headers[name];
  const value = Array.isArray(raw) ? raw[0] : raw;
  return value?.trim() || undefined;
}
