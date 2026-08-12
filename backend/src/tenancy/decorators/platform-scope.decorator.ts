import { SetMetadata } from '@nestjs/common';

export const PLATFORM_SCOPE_KEY = 'platformScope';

/**
 * Marks a route as operating above tenants — tenant administration itself,
 * health checks, and file uploads that are not yet attached to any record.
 *
 * {@link TenantGuard} skips resolution for these, and they must never touch a
 * tenant-scoped table without an explicit id of their own.
 */
export const PlatformScope = () => SetMetadata(PLATFORM_SCOPE_KEY, true);
