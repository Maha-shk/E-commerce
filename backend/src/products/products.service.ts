import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { paginate } from '../common/dto/paginated-response';
import { deriveStockStatus } from '../common/utils/stock.util';
import {
  CreateProductDto,
  ProductQueryDto,
  UpdateProductDto,
} from './dto/product.dto';

/** Relations always loaded with a product. */
const PRODUCT_INCLUDE = {
  category: { select: { id: true, name: true, slug: true } },
  images: { orderBy: { position: 'asc' } },
  variants: true,
} satisfies Prisma.ProductInclude;

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: ProductQueryDto) {
    const where: Prisma.ProductWhereInput = {
      ...(query.categoryId && { categoryId: query.categoryId }),
      ...(query.status && { status: query.status }),
      ...(query.visibility && { visibility: query.visibility }),
      ...(query.search && {
        OR: [
          { name: { contains: query.search, mode: 'insensitive' } },
          { sku: { contains: query.search, mode: 'insensitive' } },
          { brand: { contains: query.search, mode: 'insensitive' } },
        ],
      }),
    };

    const [rows, total] = await this.prisma.$transaction([
      this.prisma.product.findMany({
        where,
        skip: query.skip,
        take: query.limit,
        orderBy: { [query.sortBy ?? 'createdAt']: query.sortOrder ?? 'desc' },
        include: PRODUCT_INCLUDE,
      }),
      this.prisma.product.count({ where }),
    ]);

    return paginate(rows.map(toProductView), total, query.page, query.limit);
  }

  async findOne(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: PRODUCT_INCLUDE,
    });
    if (!product) throw new NotFoundException(`Product ${id} not found`);
    return toProductView(product);
  }

  async create(dto: CreateProductDto) {
    await this.assertSkuFree(dto.sku);
    if (dto.categoryId) await this.assertCategoryExists(dto.categoryId);
    this.assertScheduleValid(dto);

    const stock = dto.stock ?? 0;

    const product = await this.prisma.product.create({
      data: {
        name: dto.name.trim(),
        brand: dto.brand ?? '',
        categoryId: dto.categoryId,
        description: dto.description ?? '',
        sku: dto.sku.trim(),
        stock,
        status: deriveStockStatus(stock),
        price: new Prisma.Decimal(dto.price),
        discount: dto.discount ?? 0,
        ...(dto.visibility && { visibility: dto.visibility }),
        scheduledDate: dto.scheduledDate ? new Date(dto.scheduledDate) : null,
        tags: dto.tags ?? [],
        unitValue:
          dto.unitValue !== undefined ? new Prisma.Decimal(dto.unitValue) : null,
        images: {
          create: (dto.images ?? []).map((url, position) => ({ url, position })),
        },
        variants: { create: (dto.variants ?? []).map((name) => ({ name })) },
      },
      include: PRODUCT_INCLUDE,
    });

    return toProductView(product);
  }

  async update(id: string, dto: UpdateProductDto) {
    const existing = await this.prisma.product.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException(`Product ${id} not found`);

    if (dto.sku && dto.sku !== existing.sku) await this.assertSkuFree(dto.sku);
    if (dto.categoryId) await this.assertCategoryExists(dto.categoryId);
    this.assertScheduleValid({ ...existing, ...dto } as CreateProductDto);

    const stock = dto.stock ?? existing.stock;

    const product = await this.prisma.product.update({
      where: { id },
      data: {
        ...(dto.name && { name: dto.name.trim() }),
        ...(dto.brand !== undefined && { brand: dto.brand }),
        ...(dto.categoryId !== undefined && { categoryId: dto.categoryId }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.sku && { sku: dto.sku.trim() }),
        ...(dto.stock !== undefined && {
          stock,
          status: deriveStockStatus(stock),
        }),
        ...(dto.price !== undefined && { price: new Prisma.Decimal(dto.price) }),
        ...(dto.discount !== undefined && { discount: dto.discount }),
        ...(dto.visibility && { visibility: dto.visibility }),
        ...(dto.scheduledDate !== undefined && {
          scheduledDate: dto.scheduledDate ? new Date(dto.scheduledDate) : null,
        }),
        ...(dto.tags && { tags: dto.tags }),
        ...(dto.unitValue !== undefined && {
          unitValue: new Prisma.Decimal(dto.unitValue),
        }),
        // Images/variants are replaced wholesale when supplied.
        ...(dto.images && {
          images: {
            deleteMany: {},
            create: dto.images.map((url, position) => ({ url, position })),
          },
        }),
        ...(dto.variants && {
          variants: {
            deleteMany: {},
            create: dto.variants.map((name) => ({ name })),
          },
        }),
      },
      include: PRODUCT_INCLUDE,
    });

    return toProductView(product);
  }

  async remove(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: { _count: { select: { orderItems: true } } },
    });
    if (!product) throw new NotFoundException(`Product ${id} not found`);

    // Keep order history intact: detach rather than block, since OrderItem
    // stores its own name/sku/price snapshot.
    if (product._count.orderItems > 0) {
      await this.prisma.orderItem.updateMany({
        where: { productId: id },
        data: { productId: null },
      });
    }

    await this.prisma.product.delete({ where: { id } });
    return { message: 'Product deleted' };
  }

  private assertScheduleValid(dto: Partial<CreateProductDto>) {
    if (dto.visibility === 'SCHEDULED' && !dto.scheduledDate) {
      throw new BadRequestException(
        'scheduledDate is required when visibility is SCHEDULED',
      );
    }
  }

  private async assertSkuFree(sku: string) {
    const clash = await this.prisma.product.findUnique({
      where: { sku: sku.trim() },
      select: { id: true },
    });
    if (clash) throw new BadRequestException(`SKU "${sku}" is already in use`);
  }

  private async assertCategoryExists(id: string) {
    const exists = await this.prisma.category.count({ where: { id } });
    if (!exists) throw new NotFoundException(`Category ${id} not found`);
  }
}

type ProductWithRelations = Prisma.ProductGetPayload<{
  include: typeof PRODUCT_INCLUDE;
}>;

/**
 * Serialises a product for the API: Decimals become numbers and the
 * image/variant relations flatten to string arrays, matching the frontend types.
 */
export function toProductView(product: ProductWithRelations) {
  return {
    ...product,
    price: Number(product.price),
    unitValue: product.unitValue === null ? null : Number(product.unitValue),
    images: product.images.map((i) => i.url),
    variants: product.variants.map((v) => v.name),
  };
}
