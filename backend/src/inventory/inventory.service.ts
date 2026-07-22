import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, StockStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { paginate } from '../common/dto/paginated-response';
import { deriveStockStatus, LOW_STOCK_THRESHOLD } from '../common/utils/stock.util';
import { AdjustStockDto, InventoryQueryDto } from './dto/inventory.dto';

@Injectable()
export class InventoryService {
  constructor(private readonly prisma: PrismaService) {}

  /** Inventory is a view over products, keyed by SKU. */
  async findAll(query: InventoryQueryDto) {
    const where: Prisma.ProductWhereInput = {
      ...(query.categoryId && { categoryId: query.categoryId }),
      ...(query.status && { status: query.status }),
      ...(query.search && {
        OR: [
          { name: { contains: query.search, mode: 'insensitive' } },
          { sku: { contains: query.search, mode: 'insensitive' } },
        ],
      }),
    };

    const [rows, total] = await this.prisma.$transaction([
      this.prisma.product.findMany({
        where,
        skip: query.skip,
        take: query.limit,
        orderBy: { updatedAt: 'desc' },
        select: {
          id: true,
          name: true,
          sku: true,
          stock: true,
          status: true,
          updatedAt: true,
          price: true,
          unitValue: true,
          category: { select: { id: true, name: true } },
        },
      }),
      this.prisma.product.count({ where }),
    ]);

    const items = rows.map((p) => ({
      id: p.id,
      name: p.name,
      sku: p.sku,
      category: p.category?.name ?? null,
      categoryId: p.category?.id ?? null,
      stock: p.stock,
      status: p.status,
      lastUpdated: p.updatedAt,
      // Fall back to the sale price when no explicit unit value is set.
      unitValue: Number(p.unitValue ?? p.price),
    }));

    return paginate(items, total, query.page, query.limit);
  }

  /** Headline figures for the inventory screen's stat cards. */
  async stats() {
    const [totals, lowStock, outOfStock, products] = await this.prisma.$transaction([
      this.prisma.product.aggregate({ _count: true, _sum: { stock: true } }),
      this.prisma.product.count({ where: { status: StockStatus.LOW_STOCK } }),
      this.prisma.product.count({ where: { status: StockStatus.OUT_OF_STOCK } }),
      this.prisma.product.findMany({
        select: { stock: true, price: true, unitValue: true },
      }),
    ]);

    const totalValue = products.reduce(
      (sum, p) => sum + p.stock * Number(p.unitValue ?? p.price),
      0,
    );

    return {
      totalProducts: totals._count,
      totalUnits: totals._sum.stock ?? 0,
      totalValue: Number(totalValue.toFixed(2)),
      lowStock,
      outOfStock,
      lowStockThreshold: LOW_STOCK_THRESHOLD,
    };
  }

  /**
   * Adjusts stock either relatively (`delta`) or absolutely (`setTo`), writing
   * an audit row. Runs in a transaction so the log can never drift from stock.
   */
  async adjust(productId: string, dto: AdjustStockDto, byUserId: string) {
    if ((dto.delta === undefined) === (dto.setTo === undefined)) {
      throw new BadRequestException('Provide exactly one of `delta` or `setTo`');
    }

    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      select: { id: true, stock: true },
    });
    if (!product) throw new NotFoundException(`Product ${productId} not found`);

    const newStock = dto.setTo ?? product.stock + dto.delta!;
    if (newStock < 0) {
      throw new BadRequestException(
        `Adjustment would drop stock below zero (current: ${product.stock})`,
      );
    }

    const delta = newStock - product.stock;

    const [updated] = await this.prisma.$transaction([
      this.prisma.product.update({
        where: { id: productId },
        data: { stock: newStock, status: deriveStockStatus(newStock) },
        select: { id: true, name: true, sku: true, stock: true, status: true },
      }),
      this.prisma.inventoryAdjustment.create({
        data: { productId, delta, reason: dto.reason, byUserId },
      }),
    ]);

    return { ...updated, delta };
  }

  /** Audit trail for a single product. */
  async history(productId: string, query: InventoryQueryDto) {
    const exists = await this.prisma.product.count({ where: { id: productId } });
    if (!exists) throw new NotFoundException(`Product ${productId} not found`);

    const where: Prisma.InventoryAdjustmentWhereInput = { productId };

    const [rows, total] = await this.prisma.$transaction([
      this.prisma.inventoryAdjustment.findMany({
        where,
        skip: query.skip,
        take: query.limit,
        orderBy: { createdAt: 'desc' },
        include: { byUser: { select: { id: true, fullName: true, email: true } } },
      }),
      this.prisma.inventoryAdjustment.count({ where }),
    ]);

    return paginate(rows, total, query.page, query.limit);
  }
}
