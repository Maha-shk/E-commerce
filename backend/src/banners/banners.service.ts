import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { paginate } from '../common/dto/paginated-response';
import {
  BannerQueryDto,
  CreateBannerDto,
  ReorderBannersDto,
  UpdateBannerDto,
} from './dto/banner.dto';

/**
 * Admin management for storefront banners.
 *
 * The `Banner` model and the public read endpoint already existed, but nothing
 * could create a row — the hero was effectively hardcoded because the table was
 * permanently empty. These are the write operations behind it.
 *
 * Ordering contract, shared with `PublicService.getBanners`: `displayOrder`
 * ascending decides which banner the storefront shows first, ties broken by
 * newest. The storefront additionally honours `isActive` and the
 * `startDate`/`endDate` window; nothing here filters, so the admin list shows
 * scheduled and inactive banners too.
 */
@Injectable()
export class BannersService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(tenantId: string, query: BannerQueryDto) {
    const where: Prisma.BannerWhereInput = {
      tenantId,
      ...(query.type && { type: query.type }),
      ...(query.isActive !== undefined && { isActive: query.isActive }),
      ...(query.search && {
        OR: [
          { title: { contains: query.search, mode: 'insensitive' } },
          { description: { contains: query.search, mode: 'insensitive' } },
        ],
      }),
    };

    const [rows, total] = await this.prisma.$transaction([
      this.prisma.banner.findMany({
        where,
        skip: query.skip,
        take: query.limit,
        orderBy: [{ displayOrder: 'asc' }, { createdAt: 'desc' }],
      }),
      this.prisma.banner.count({ where }),
    ]);

    return paginate(rows, total, query.page, query.limit);
  }

  async findOne(tenantId: string, id: string) {
    const banner = await this.prisma.banner.findFirst({ where: { id, tenantId } });
    if (!banner) throw new NotFoundException(`Banner ${id} not found`);
    return banner;
  }

  async create(tenantId: string, dto: CreateBannerDto) {
    assertScheduleValid(dto.startDate, dto.endDate);

    return this.prisma.banner.create({
      data: {
        tenantId,
        type: dto.type,
        title: dto.title.trim(),
        description: dto.description?.trim() || null,
        imageUrl: dto.imageUrl.trim(),
        mobileImageUrl: dto.mobileImageUrl?.trim() || null,
        linkUrl: dto.linkUrl?.trim() || null,
        linkText: dto.linkText?.trim() || null,
        isActive: dto.isActive ?? true,
        // Appended to the end of its slot unless the caller places it.
        displayOrder:
          dto.displayOrder ?? (await this.nextDisplayOrder(tenantId, dto.type)),
        startDate: dto.startDate ? new Date(dto.startDate) : null,
        endDate: dto.endDate ? new Date(dto.endDate) : null,
      },
    });
  }

  async update(tenantId: string, id: string, dto: UpdateBannerDto) {
    const existing = await this.findOne(tenantId, id);

    // Validate against the merged result: a PATCH that sets only `endDate`
    // still has to be checked against the stored `startDate`.
    assertScheduleValid(
      dto.startDate ?? existing.startDate?.toISOString(),
      dto.endDate ?? existing.endDate?.toISOString(),
    );

    return this.prisma.banner.update({
      where: { id },
      data: {
        ...(dto.type && { type: dto.type }),
        ...(dto.title !== undefined && { title: dto.title.trim() }),
        ...(dto.description !== undefined && {
          description: dto.description?.trim() || null,
        }),
        ...(dto.imageUrl !== undefined && { imageUrl: dto.imageUrl.trim() }),
        ...(dto.mobileImageUrl !== undefined && {
          mobileImageUrl: dto.mobileImageUrl?.trim() || null,
        }),
        ...(dto.linkUrl !== undefined && { linkUrl: dto.linkUrl?.trim() || null }),
        ...(dto.linkText !== undefined && {
          linkText: dto.linkText?.trim() || null,
        }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
        ...(dto.displayOrder !== undefined && { displayOrder: dto.displayOrder }),
        ...(dto.startDate !== undefined && {
          startDate: dto.startDate ? new Date(dto.startDate) : null,
        }),
        ...(dto.endDate !== undefined && {
          endDate: dto.endDate ? new Date(dto.endDate) : null,
        }),
      },
    });
  }

  /** Flips `isActive` — the usual way to pull a banner without deleting it. */
  async setActive(tenantId: string, id: string, isActive: boolean) {
    await this.findOne(tenantId, id);
    return this.prisma.banner.update({ where: { id }, data: { isActive } });
  }

  /**
   * Rewrites `displayOrder` to match the given id sequence.
   *
   * One transaction so a half-applied reorder can't leave two banners fighting
   * for first place.
   */
  async reorder(tenantId: string, dto: ReorderBannersDto) {
    const found = await this.prisma.banner.findMany({
      where: { tenantId, id: { in: dto.ids } },
      select: { id: true },
    });

    if (found.length !== dto.ids.length) {
      const known = new Set(found.map((b) => b.id));
      const missing = dto.ids.filter((id) => !known.has(id));
      throw new NotFoundException(`Unknown banner ids: ${missing.join(', ')}`);
    }

    await this.prisma.$transaction(
      dto.ids.map((id, index) =>
        this.prisma.banner.update({
          where: { id },
          data: { displayOrder: index },
        }),
      ),
    );

    return { message: 'Banner order updated' };
  }

  async remove(tenantId: string, id: string) {
    await this.findOne(tenantId, id);
    await this.prisma.banner.delete({ where: { id } });
    return { message: 'Banner deleted' };
  }

  /** Places a new banner after the last one in its slot. */
  private async nextDisplayOrder(
    tenantId: string,
    type: CreateBannerDto['type'],
  ): Promise<number> {
    const last = await this.prisma.banner.findFirst({
      where: { tenantId, type },
      orderBy: { displayOrder: 'desc' },
      select: { displayOrder: true },
    });
    return last ? last.displayOrder + 1 : 0;
  }
}

/** A window that ends before it starts would silently never display. */
function assertScheduleValid(startDate?: string | null, endDate?: string | null) {
  if (!startDate || !endDate) return;
  if (new Date(endDate).getTime() < new Date(startDate).getTime()) {
    throw new BadRequestException('endDate must be on or after startDate');
  }
}
