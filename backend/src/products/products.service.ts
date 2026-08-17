import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { paginate } from '../common/dto/paginated-response';
import { deriveStockStatus } from '../common/utils/stock.util';
import { CatalogService } from '../catalog/catalog.service';
import { StockNotificationsService } from '../stock-notifications/stock-notifications.service';
import {
  CATEGORY_SPEC,
  COMPANY_SPEC,
  MODEL_SPEC,
  PRODUCT_TYPE_SPEC,
} from '../catalog/catalog.constants';
import {
  CreateProductDto,
  ProductQueryDto,
  UpdateProductDto,
} from './dto/product.dto';

/**
 * Relations always loaded with a product: the full chain back to the category,
 * so every response can show where the product sits without further queries.
 */
const PRODUCT_INCLUDE = {
  model: {
    select: {
      id: true,
      name: true,
      slug: true,
      productType: {
        select: {
          id: true,
          name: true,
          slug: true,
          company: {
            select: {
              id: true,
              name: true,
              slug: true,
              imageUrl: true,
              category: { select: { id: true, name: true, slug: true } },
            },
          },
        },
      },
    },
  },
  images: { orderBy: { position: 'asc' } },
  variants: true,
} satisfies Prisma.ProductInclude;

@Injectable()
export class ProductsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly catalog: CatalogService,
    private readonly stockNotifications: StockNotificationsService,
  ) {}

  async findAll(tenantId: string, query: ProductQueryDto) {
    const where = buildProductWhere(tenantId, query);

    const [rows, total] = await Promise.all([
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

  async findOne(tenantId: string, id: string) {
    const product = await this.prisma.product.findFirst({
      where: { id, tenantId },
      include: PRODUCT_INCLUDE,
    });
    if (!product) throw new NotFoundException(`Product ${id} not found`);
    return toProductView(product);
  }

  async create(tenantId: string, dto: CreateProductDto) {
    // Resolving the model through the catalog service is what ties the product
    // to this tenant's hierarchy — a model id from another store reads as
    // "not found" rather than quietly filing the product across the boundary.
    await this.catalog.requireModel(tenantId, dto.modelId);
    await this.assertSkuFree(tenantId, dto.sku);
    assertScheduleValid(dto);

    const stock = dto.stock ?? 0;

    const product = await this.prisma.product.create({
      data: {
        tenantId,
        modelId: dto.modelId,
        name: dto.name.trim(),
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

  async update(tenantId: string, id: string, dto: UpdateProductDto) {
    const existing = await this.prisma.product.findFirst({
      where: { id, tenantId },
    });
    if (!existing) throw new NotFoundException(`Product ${id} not found`);

    if (dto.modelId && dto.modelId !== existing.modelId) {
      await this.catalog.requireModel(tenantId, dto.modelId);
    }
    if (dto.sku && dto.sku !== existing.sku) {
      await this.assertSkuFree(tenantId, dto.sku);
    }
    assertScheduleValid({ ...existing, ...dto });

    const stock = dto.stock ?? existing.stock;

    const product = await this.prisma.product.update({
      where: { id },
      data: {
        ...(dto.modelId && { modelId: dto.modelId }),
        ...(dto.name && { name: dto.name.trim() }),
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

    // The product form is the other way stock goes up, so it discharges the
    // waiting list too. No-ops unless this edit took the product from zero.
    await this.stockNotifications.onStockReplenished(
      tenantId,
      id,
      existing.stock,
      stock,
    );

    return toProductView(product);
  }

  async remove(tenantId: string, id: string) {
    const product = await this.prisma.product.findFirst({
      where: { id, tenantId },
      include: { _count: { select: { orderItems: true } } },
    });
    if (!product) throw new NotFoundException(`Product ${id} not found`);

    // Keep order history intact: detach rather than block, since OrderItem
    // stores its own name/sku/price and classification snapshot.
    if (product._count.orderItems > 0) {
      await this.prisma.orderItem.updateMany({
        where: { productId: id },
        data: { productId: null },
      });
    }

    await this.prisma.product.delete({ where: { id } });
    return { message: 'Product deleted' };
  }

  /**
   * Moves a batch of products to another model — the bulk re-filing action, and
   * the way out of a delete blocked by products underneath.
   *
   * All-or-nothing, and genuinely so: the check and the write share one
   * transaction, so a product deleted between them rolls the whole move back
   * rather than half-applying it.
   */
  async reassign(tenantId: string, productIds: string[], modelId: string) {
    await this.catalog.requireModel(tenantId, modelId);

    // A multi-select can easily hand over the same id twice; deduplicating
    // first stops that being reported as "some of those products do not exist".
    const ids = [...new Set(productIds)];

    return this.prisma.$transaction(async (tx) => {
      const found = await tx.product.findMany({
        where: { tenantId, id: { in: ids } },
        select: { id: true },
      });

      if (found.length !== ids.length) {
        const known = new Set(found.map((p) => p.id));
        const missing = ids.filter((id) => !known.has(id));
        throw new NotFoundException(
          `These products do not exist in this store: ${missing.join(', ')}`,
        );
      }

      const result = await tx.product.updateMany({
        where: { tenantId, id: { in: ids } },
        data: { modelId },
      });

      return {
        message: `${result.count} product(s) moved`,
        count: result.count,
        modelId,
      };
    });
  }

  private async assertSkuFree(tenantId: string, sku: string) {
    const clash = await this.prisma.product.findFirst({
      where: { tenantId, sku: sku.trim() },
      select: { id: true },
    });
    if (clash) throw new ConflictException(`SKU "${sku}" is already in use`);
  }
}

function assertScheduleValid(dto: {
  visibility?: string | null;
  scheduledDate?: string | Date | null;
}) {
  if (dto.visibility === 'SCHEDULED' && !dto.scheduledDate) {
    throw new BadRequestException(
      'scheduledDate is required when visibility is SCHEDULED',
    );
  }
}

/** Builds the tenant-scoped where clause, including any ancestor filter. */
export function buildProductWhere(
  tenantId: string,
  query: Pick<
    ProductQueryDto,
    | 'modelId'
    | 'productTypeId'
    | 'companyId'
    | 'categoryId'
    | 'status'
    | 'visibility'
    | 'search'
  >,
): Prisma.ProductWhereInput {
  return {
    tenantId,
    ...(query.modelId && { modelId: query.modelId }),
    ...(query.productTypeId && { model: { productTypeId: query.productTypeId } }),
    ...(query.companyId && {
      model: { productType: { companyId: query.companyId } },
    }),
    ...(query.categoryId && {
      model: { productType: { company: { categoryId: query.categoryId } } },
    }),
    ...(query.status && { status: query.status }),
    ...(query.visibility && { visibility: query.visibility }),
    ...(query.search && {
      OR: [
        { name: { contains: query.search, mode: 'insensitive' } },
        { sku: { contains: query.search, mode: 'insensitive' } },
        { model: { name: { contains: query.search, mode: 'insensitive' } } },
        {
          model: {
            productType: {
              company: { name: { contains: query.search, mode: 'insensitive' } },
            },
          },
        },
      ],
    }),
  };
}

type ProductWithRelations = Prisma.ProductGetPayload<{
  include: typeof PRODUCT_INCLUDE;
}>;

/**
 * Serialises a product for the API: Decimals become numbers, image/variant
 * relations flatten to string arrays, and the Model → Category chain is
 * flattened into named fields plus a ready-made breadcrumb.
 */
export function toProductView(product: ProductWithRelations) {
  const { model, ...rest } = product;
  const productType = model.productType;
  const company = productType.company;
  const category = company.category;

  return {
    ...rest,
    price: Number(product.price),
    unitValue: product.unitValue === null ? null : Number(product.unitValue),
    images: product.images.map((i) => i.url),
    variants: product.variants.map((v) => v.name),

    model: { id: model.id, name: model.name, slug: model.slug },
    productType: { id: productType.id, name: productType.name, slug: productType.slug },
    company: {
      id: company.id,
      name: company.name,
      slug: company.slug,
      imageUrl: company.imageUrl,
    },
    category: { id: category.id, name: category.name, slug: category.slug },

    // Same entry shape as CatalogService's breadcrumbs, `levelLabel` included —
    // two producers of the same structure disagreeing is a trap for the client.
    breadcrumb: [
      {
        level: 'CATEGORY',
        levelLabel: CATEGORY_SPEC.label,
        segment: CATEGORY_SPEC.segment,
        id: category.id,
        name: category.name,
        slug: category.slug,
      },
      {
        level: 'COMPANY',
        levelLabel: COMPANY_SPEC.label,
        segment: COMPANY_SPEC.segment,
        id: company.id,
        name: company.name,
        slug: company.slug,
      },
      {
        level: 'PRODUCT_TYPE',
        levelLabel: PRODUCT_TYPE_SPEC.label,
        segment: PRODUCT_TYPE_SPEC.segment,
        id: productType.id,
        name: productType.name,
        slug: productType.slug,
      },
      {
        level: 'MODEL',
        levelLabel: MODEL_SPEC.label,
        segment: MODEL_SPEC.segment,
        id: model.id,
        name: model.name,
        slug: model.slug,
      },
    ],
  };
}
