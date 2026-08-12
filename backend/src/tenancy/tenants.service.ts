import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, TenantStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { paginate } from '../common/dto/paginated-response';
import { slugify } from '../common/utils/stock.util';
import { TenantContext } from './tenant.types';
import {
  CreateTenantDto,
  TenantQueryDto,
  UpdateTenantDto,
} from './dto/tenant.dto';

/**
 * How long a resolved host/slug lookup stays cached. Tenants change rarely and
 * every storefront request resolves one, so without this each page view would
 * add a database round-trip before it could do anything useful.
 */
const RESOLUTION_CACHE_TTL_MS = 60_000;

interface CacheEntry {
  value: TenantContext | null;
  expiresAt: number;
}

@Injectable()
export class TenantsService {
  private readonly logger = new Logger(TenantsService.name);
  private readonly cache = new Map<string, CacheEntry>();

  constructor(private readonly prisma: PrismaService) {}

  // ---------------------------------------------------------------------------
  // Resolution — used by TenantGuard
  // ---------------------------------------------------------------------------

  /** Looks a tenant up by id, returning null when it does not exist. */
  async resolveById(
    id: string,
    source: TenantContext['source'],
  ): Promise<TenantContext | null> {
    return this.cached(`id:${id}`, source, { id });
  }

  /** Looks a tenant up by its URL slug. */
  async resolveBySlug(
    slug: string,
    source: TenantContext['source'],
  ): Promise<TenantContext | null> {
    return this.cached(`slug:${slug}`, source, { slug: slug.toLowerCase() });
  }

  /**
   * Resolves the tenant that owns a request's Host header.
   *
   * Tries the full host against `Tenant.domain` first (custom domains), then
   * the leading label as a slug (`samsung-parts.example.com` → `samsung-parts`).
   * Ports and `www.` are stripped; bare hosts like `localhost` have no leading
   * label worth trying, so they fall through to the caller's next strategy.
   */
  async resolveByHost(host: string): Promise<TenantContext | null> {
    const clean = host.split(':')[0].toLowerCase().replace(/^www\./, '');
    if (!clean) return null;

    const byDomain = await this.cached(`host:${clean}`, 'host', {
      domain: clean,
    });
    if (byDomain) return byDomain;

    const labels = clean.split('.');
    if (labels.length < 2) return null;

    return this.resolveBySlug(labels[0], 'host');
  }

  /**
   * Last resort for single-tenant deployments and local development: when the
   * installation has exactly one tenant, there is nothing to disambiguate, so
   * an unidentified request belongs to it.
   */
  async resolveSoleTenant(): Promise<TenantContext | null> {
    const cacheKey = 'sole';
    const hit = this.cache.get(cacheKey);
    if (hit && hit.expiresAt > Date.now()) return hit.value;

    const tenants = await this.prisma.tenant.findMany({
      take: 2,
      select: { id: true, slug: true, name: true, status: true },
    });

    const value =
      tenants.length === 1
        ? { ...tenants[0], source: 'sole-tenant' as const }
        : null;

    this.cache.set(cacheKey, {
      value,
      expiresAt: Date.now() + RESOLUTION_CACHE_TTL_MS,
    });
    return value;
  }

  /** Drops the resolution cache. Called after any tenant write. */
  invalidateCache(): void {
    this.cache.clear();
  }

  private async cached(
    key: string,
    source: TenantContext['source'],
    where: Prisma.TenantWhereInput,
  ): Promise<TenantContext | null> {
    const hit = this.cache.get(key);
    if (hit && hit.expiresAt > Date.now()) return hit.value;

    const tenant = await this.prisma.tenant.findFirst({
      where,
      select: { id: true, slug: true, name: true, status: true },
    });

    const value = tenant ? { ...tenant, source } : null;
    this.cache.set(key, {
      value,
      expiresAt: Date.now() + RESOLUTION_CACHE_TTL_MS,
    });
    return value;
  }

  // ---------------------------------------------------------------------------
  // Platform CRUD — SUPER_ADMIN only
  // ---------------------------------------------------------------------------

  async findAll(query: TenantQueryDto) {
    const where: Prisma.TenantWhereInput = {
      ...(query.status && { status: query.status }),
      ...(query.search && {
        OR: [
          { name: { contains: query.search, mode: 'insensitive' } },
          { slug: { contains: query.search, mode: 'insensitive' } },
          { domain: { contains: query.search, mode: 'insensitive' } },
        ],
      }),
    };

    const [rows, total] = await this.prisma.$transaction([
      this.prisma.tenant.findMany({
        where,
        skip: query.skip,
        take: query.limit,
        orderBy: { createdAt: 'asc' },
        include: {
          _count: { select: { categories: true, products: true, users: true, orders: true } },
        },
      }),
      this.prisma.tenant.count({ where }),
    ]);

    return paginate(rows.map(toTenantView), total, query.page, query.limit);
  }

  async findOne(id: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id },
      include: {
        _count: { select: { categories: true, products: true, users: true, orders: true } },
      },
    });
    if (!tenant) throw new NotFoundException(`Tenant ${id} not found`);
    return toTenantView(tenant);
  }

  async create(dto: CreateTenantDto) {
    const slug = slugify(dto.slug?.trim() || dto.name);
    if (!slug) throw new BadRequestException('Could not derive a slug from the name');

    const clash = await this.prisma.tenant.findUnique({ where: { slug } });
    if (clash) throw new BadRequestException(`The slug "${slug}" is already in use`);

    const tenant = await this.prisma.tenant.create({
      data: {
        name: dto.name.trim(),
        slug,
        domain: normaliseDomain(dto.domain),
        contactEmail: dto.contactEmail?.toLowerCase().trim(),
        logoUrl: dto.logoUrl,
        ...(dto.status && { status: dto.status }),
      },
      include: {
        _count: { select: { categories: true, products: true, users: true, orders: true } },
      },
    });

    this.invalidateCache();
    this.logger.log(`Tenant created: ${tenant.slug} (${tenant.id})`);
    return toTenantView(tenant);
  }

  async update(id: string, dto: UpdateTenantDto) {
    await this.findOne(id);

    let slug: string | undefined;
    if (dto.slug?.trim()) {
      slug = slugify(dto.slug);
      const clash = await this.prisma.tenant.findFirst({
        where: { slug, NOT: { id } },
        select: { id: true },
      });
      if (clash) throw new BadRequestException(`The slug "${slug}" is already in use`);
    }

    const tenant = await this.prisma.tenant.update({
      where: { id },
      data: {
        ...(dto.name && { name: dto.name.trim() }),
        ...(slug && { slug }),
        ...(dto.domain !== undefined && { domain: normaliseDomain(dto.domain) }),
        ...(dto.contactEmail !== undefined && {
          contactEmail: dto.contactEmail?.toLowerCase().trim() || null,
        }),
        ...(dto.logoUrl !== undefined && { logoUrl: dto.logoUrl || null }),
        ...(dto.status && { status: dto.status }),
      },
      include: {
        _count: { select: { categories: true, products: true, users: true, orders: true } },
      },
    });

    this.invalidateCache();
    return toTenantView(tenant);
  }

  /**
   * Deleting a tenant erases its entire catalog and commerce history (the
   * schema cascades from `Tenant`), so it is gated behind an explicit
   * confirmation of the slug rather than being a one-click action.
   */
  async remove(id: string, confirmSlug?: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id },
      include: { _count: { select: { products: true, orders: true, users: true } } },
    });
    if (!tenant) throw new NotFoundException(`Tenant ${id} not found`);

    if (confirmSlug !== tenant.slug) {
      throw new ForbiddenException(
        `Deleting "${tenant.name}" removes ${tenant._count.products} product(s), ` +
          `${tenant._count.orders} order(s) and ${tenant._count.users} account(s). ` +
          `Pass ?confirm=${tenant.slug} to proceed.`,
      );
    }

    await this.prisma.tenant.delete({ where: { id } });
    this.invalidateCache();
    this.logger.warn(`Tenant deleted: ${tenant.slug} (${id})`);
    return { message: 'Tenant deleted' };
  }
}

/** Strips protocol, path, port and a leading `www.` from a configured domain. */
function normaliseDomain(domain?: string | null): string | null {
  if (!domain?.trim()) return null;
  return domain
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, '')
    .replace(/^www\./, '')
    .split('/')[0]
    .split(':')[0];
}

type TenantWithCounts = Prisma.TenantGetPayload<{
  include: {
    _count: { select: { categories: true; products: true; users: true; orders: true } };
  };
}>;

function toTenantView(tenant: TenantWithCounts) {
  const { _count, ...rest } = tenant;
  return {
    ...rest,
    counts: {
      categories: _count.categories,
      products: _count.products,
      users: _count.users,
      orders: _count.orders,
    },
  };
}

export { TenantStatus };
