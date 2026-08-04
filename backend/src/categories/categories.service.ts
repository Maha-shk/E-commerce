import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { paginate } from '../common/dto/paginated-response';
import { slugify } from '../common/utils/stock.util';
import {
  CategoryQueryDto,
  CreateCategoryDto,
  UpdateCategoryDto,
} from './dto/category.dto';

@Injectable()
export class CategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: CategoryQueryDto) {
    const where: Prisma.CategoryWhereInput = {
      ...(query.status && { status: query.status }),
      ...(query.visibility && { visibility: query.visibility }),
      ...(query.search && {
        OR: [
          { name: { contains: query.search, mode: 'insensitive' } },
          { slug: { contains: query.search, mode: 'insensitive' } },
          { description: { contains: query.search, mode: 'insensitive' } },
        ],
      }),
    };

    const [rows, total] = await this.prisma.$transaction([
      this.prisma.category.findMany({
        where,
        skip: query.skip,
        take: query.limit,
        orderBy: { createdAt: 'asc' },
        include: {
          _count: { select: { products: true } },
        },
      }),
      this.prisma.category.count({ where }),
    ]);

    return paginate(rows.map(toCategoryView), total, query.page, query.limit);
  }

  async findOne(id: string) {
    const category = await this.prisma.category.findUnique({
      where: { id },
      include: { _count: { select: { products: true } } },
    });
    if (!category) throw new NotFoundException(`Category ${id} not found`);
    return toCategoryView(category);
  }

  async create(dto: CreateCategoryDto) {
    const slug = dto.slug?.trim() ? slugify(dto.slug) : slugify(dto.name);
    await this.assertSlugFree(slug);

    const category = await this.prisma.category.create({
      data: {
        name: dto.name.trim(),
        slug,
        description: dto.description ?? '',
        icon: dto.icon ?? 'home',
        ...(dto.status && { status: dto.status }),
        ...(dto.visibility && { visibility: dto.visibility }),
        thumbnailName: dto.thumbnailName,
        thumbnailSize: dto.thumbnailSize,
      },
      include: { _count: { select: { products: true } } },
    });
    return toCategoryView(category);
  }

  async update(id: string, dto: UpdateCategoryDto) {
    await this.assertCategoryExists(id);

    let slug: string | undefined;
    if (dto.slug?.trim()) {
      slug = slugify(dto.slug);
      await this.assertSlugFree(slug, id);
    } else if (dto.name) {
      slug = slugify(dto.name);
      await this.assertSlugFree(slug, id);
    }

    const category = await this.prisma.category.update({
      where: { id },
      data: {
        ...(dto.name && { name: dto.name.trim() }),
        ...(slug && { slug }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.icon && { icon: dto.icon }),
        ...(dto.status && { status: dto.status }),
        ...(dto.visibility && { visibility: dto.visibility }),
        ...(dto.thumbnailName !== undefined && { thumbnailName: dto.thumbnailName }),
        ...(dto.thumbnailSize !== undefined && { thumbnailSize: dto.thumbnailSize }),
      },
      include: { _count: { select: { products: true } } },
    });
    return toCategoryView(category);
  }

  async remove(id: string) {
    const category = await this.prisma.category.findUnique({
      where: { id },
      include: { _count: { select: { products: true } } },
    });
    if (!category) throw new NotFoundException(`Category ${id} not found`);

    // Refuse to orphan products.
    if (category._count.products > 0) {
      throw new BadRequestException(
        `Cannot delete: ${category._count.products} product(s) still belong to this category. Reassign them first.`,
      );
    }

    await this.prisma.category.delete({ where: { id } });
    return { message: 'Category deleted' };
  }

  private async assertCategoryExists(id: string) {
    const exists = await this.prisma.category.count({ where: { id } });
    if (!exists) throw new NotFoundException(`Category ${id} not found`);
  }

  private async assertSlugFree(slug: string, exceptId?: string) {
    const clash = await this.prisma.category.findFirst({
      where: { slug, ...(exceptId && { NOT: { id: exceptId } }) },
      select: { id: true },
    });
    if (clash) {
      throw new BadRequestException(`The slug "${slug}" is already in use`);
    }
  }
}

type CategoryWithCounts = Prisma.CategoryGetPayload<{
  include: { _count: { select: { products: true } } };
}>;

/** Flattens Prisma's `_count` into the shape the frontend table expects. */
function toCategoryView(category: CategoryWithCounts) {
  const { _count, ...rest } = category;
  return {
    ...rest,
    products: _count.products,
  };
}
