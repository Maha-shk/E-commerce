import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { OrderStatus, PaymentStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { paginate } from '../common/dto/paginated-response';
import {
  CreateOrderDto,
  OrderQueryDto,
  UpdateOrderStatusDto,
} from './dto/order.dto';

const ORDER_INCLUDE = {
  items: true,
  customer: {
    select: { id: true, fullName: true, email: true, phone: true },
  },
} satisfies Prisma.OrderInclude;

/**
 * Allowed order status transitions. Prevents nonsense moves such as
 * reviving a delivered order back to pending.
 */
const STATUS_FLOW: Record<OrderStatus, OrderStatus[]> = {
  PENDING: ['PROCESSING', 'CANCELLED'],
  PROCESSING: ['SHIPPED', 'CANCELLED'],
  SHIPPED: ['DELIVERED', 'RETURNED'],
  DELIVERED: ['RETURNED'],
  CANCELLED: [],
  RETURNED: [],
};

@Injectable()
export class OrdersService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: OrderQueryDto) {
    const where: Prisma.OrderWhereInput = {
      ...(query.status && { status: query.status }),
      ...(query.paymentStatus && { paymentStatus: query.paymentStatus }),
      ...(query.customerId && { customerId: query.customerId }),
      ...((query.from || query.to) && {
        placedAt: {
          ...(query.from && { gte: new Date(query.from) }),
          ...(query.to && { lte: new Date(query.to) }),
        },
      }),
      ...(query.search && {
        OR: [
          { orderNumber: { contains: query.search, mode: 'insensitive' } },
          { customer: { fullName: { contains: query.search, mode: 'insensitive' } } },
          { customer: { email: { contains: query.search, mode: 'insensitive' } } },
        ],
      }),
    };

    const [rows, total] = await this.prisma.$transaction([
      this.prisma.order.findMany({
        where,
        skip: query.skip,
        take: query.limit,
        orderBy: { placedAt: 'desc' },
        include: ORDER_INCLUDE,
      }),
      this.prisma.order.count({ where }),
    ]);

    return paginate(rows.map(toOrderView), total, query.page, query.limit);
  }

  async findOne(id: string) {
    const order = await this.prisma.order.findFirst({
      // Accept either the internal id or the human-facing order number.
      where: { OR: [{ id }, { orderNumber: id }] },
      include: ORDER_INCLUDE,
    });
    if (!order) throw new NotFoundException(`Order ${id} not found`);
    return toOrderView(order);
  }

  /** Headline figures for the orders screen. */
  async stats() {
    const [byStatus, byPayment, revenue, total] = await this.prisma.$transaction([
      this.prisma.order.groupBy({
        by: ['status'],
        _count: true,
        orderBy: { status: 'asc' },
      }),
      this.prisma.order.groupBy({
        by: ['paymentStatus'],
        _count: true,
        orderBy: { paymentStatus: 'asc' },
      }),
      this.prisma.order.aggregate({
        where: { paymentStatus: PaymentStatus.PAID },
        _sum: { shippingCost: true, discount: true },
      }),
      this.prisma.order.count(),
    ]);

    // Line-item revenue has to be summed separately (no direct aggregate on a relation).
    const items = await this.prisma.orderItem.findMany({
      where: { order: { paymentStatus: PaymentStatus.PAID } },
      select: { quantity: true, unitPrice: true },
    });
    const gross = items.reduce((s, i) => s + i.quantity * Number(i.unitPrice), 0);
    const netRevenue =
      gross + Number(revenue._sum.shippingCost ?? 0) - Number(revenue._sum.discount ?? 0);

    return {
      total,
      byStatus: Object.fromEntries(byStatus.map((r) => [r.status, r._count])),
      byPaymentStatus: Object.fromEntries(
        byPayment.map((r) => [r.paymentStatus, r._count]),
      ),
      revenue: Number(netRevenue.toFixed(2)),
      averageOrderValue: total > 0 ? Number((netRevenue / total).toFixed(2)) : 0,
    };
  }

  async create(dto: CreateOrderDto) {
    if (dto.customerId) {
      const exists = await this.prisma.user.count({ where: { id: dto.customerId } });
      if (!exists) throw new NotFoundException(`Customer ${dto.customerId} not found`);
    }

    const order = await this.prisma.order.create({
      data: {
        orderNumber: await this.nextOrderNumber(),
        customerId: dto.customerId,
        ...(dto.status && { status: dto.status }),
        ...(dto.paymentStatus && { paymentStatus: dto.paymentStatus }),
        paymentMethod: dto.paymentMethod,
        shippingMethod: dto.shippingMethod,
        shippingTracking: dto.shippingTracking,
        shippingAddress: dto.shippingAddress ?? [],
        shippingCost: new Prisma.Decimal(dto.shippingCost ?? 0),
        discount: new Prisma.Decimal(dto.discount ?? 0),
        items: {
          create: dto.items.map((i) => ({
            productId: i.productId,
            name: i.name,
            sku: i.sku,
            quantity: i.quantity,
            unitPrice: new Prisma.Decimal(i.unitPrice),
          })),
        },
      },
      include: ORDER_INCLUDE,
    });

    return toOrderView(order);
  }

  async updateStatus(id: string, dto: UpdateOrderStatusDto) {
    const order = await this.prisma.order.findFirst({
      where: { OR: [{ id }, { orderNumber: id }] },
    });
    if (!order) throw new NotFoundException(`Order ${id} not found`);

    if (dto.status && dto.status !== order.status) {
      const allowed = STATUS_FLOW[order.status];
      if (!allowed.includes(dto.status)) {
        throw new BadRequestException(
          `Cannot change status from ${order.status} to ${dto.status}` +
            (allowed.length
              ? `. Allowed: ${allowed.join(', ')}`
              : ` — ${order.status} is a final state.`),
        );
      }
    }

    const updated = await this.prisma.order.update({
      where: { id: order.id },
      data: {
        ...(dto.status && { status: dto.status }),
        ...(dto.paymentStatus && { paymentStatus: dto.paymentStatus }),
        ...(dto.shippingTracking !== undefined && {
          shippingTracking: dto.shippingTracking,
        }),
      },
      include: ORDER_INCLUDE,
    });

    return toOrderView(updated);
  }

  async remove(id: string) {
    const order = await this.prisma.order.findFirst({
      where: { OR: [{ id }, { orderNumber: id }] },
      select: { id: true },
    });
    if (!order) throw new NotFoundException(`Order ${id} not found`);
    await this.prisma.order.delete({ where: { id: order.id } });
    return { message: 'Order deleted' };
  }

  /** Sequential, human-readable order number: ORD-<year>-<counter>. */
  private async nextOrderNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = `ORD-${year}-`;
    const latest = await this.prisma.order.findFirst({
      where: { orderNumber: { startsWith: prefix } },
      orderBy: { orderNumber: 'desc' },
      select: { orderNumber: true },
    });
    const next = latest
      ? Number(latest.orderNumber.slice(prefix.length)) + 1
      : 1000;
    return `${prefix}${next}`;
  }
}

type OrderWithRelations = Prisma.OrderGetPayload<{ include: typeof ORDER_INCLUDE }>;

/** Adds computed totals and converts Decimals to numbers for the API. */
export function toOrderView(order: OrderWithRelations) {
  const items = order.items.map((i) => ({
    ...i,
    unitPrice: Number(i.unitPrice),
    lineTotal: Number((i.quantity * Number(i.unitPrice)).toFixed(2)),
  }));

  const subtotal = items.reduce((sum, i) => sum + i.lineTotal, 0);
  const shipping = Number(order.shippingCost);
  const discount = Number(order.discount);

  return {
    ...order,
    items,
    shippingCost: shipping,
    discount,
    totals: {
      subtotal: Number(subtotal.toFixed(2)),
      shipping,
      discount,
      total: Number((subtotal + shipping - discount).toFixed(2)),
    },
  };
}
