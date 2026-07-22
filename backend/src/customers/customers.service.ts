import { Injectable, NotFoundException } from '@nestjs/common';
import { OrderStatus, Prisma, Role, UserStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { paginate } from '../common/dto/paginated-response';
import { CustomerQueryDto, UpdateCustomerDto } from './dto/customer.dto';

/** Orders that count toward lifetime spend (cancelled ones don't). */
const SPEND_STATUSES: OrderStatus[] = [
  OrderStatus.PENDING,
  OrderStatus.PROCESSING,
  OrderStatus.SHIPPED,
  OrderStatus.DELIVERED,
];

@Injectable()
export class CustomersService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: CustomerQueryDto) {
    const where: Prisma.UserWhereInput = {
      role: Role.CUSTOMER,
      ...(query.status && { status: query.status }),
      ...(query.search && {
        OR: [
          { fullName: { contains: query.search, mode: 'insensitive' } },
          { email: { contains: query.search, mode: 'insensitive' } },
          { phone: { contains: query.search, mode: 'insensitive' } },
        ],
      }),
    };

    const [rows, total] = await this.prisma.$transaction([
      this.prisma.user.findMany({
        where,
        skip: query.skip,
        take: query.limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          fullName: true,
          email: true,
          phone: true,
          status: true,
          createdAt: true,
          avatarUrl: true,
        },
      }),
      this.prisma.user.count({ where }),
    ]);

    // Aggregate order totals for the listed customers in one round-trip.
    const totals = await this.spendByCustomer(rows.map((r) => r.id));

    const items = rows.map((c) => ({
      ...c,
      initials: initialsOf(c.fullName),
      joinedAt: c.createdAt,
      totalOrders: totals.get(c.id)?.orders ?? 0,
      totalSpent: totals.get(c.id)?.spent ?? 0,
    }));

    return paginate(items, total, query.page, query.limit);
  }

  async findOne(id: string) {
    const customer = await this.prisma.user.findFirst({
      where: { id, role: Role.CUSTOMER },
      select: {
        id: true,
        fullName: true,
        email: true,
        phone: true,
        status: true,
        emailVerified: true,
        createdAt: true,
        avatarUrl: true,
        addresses: true,
      },
    });
    if (!customer) throw new NotFoundException(`Customer ${id} not found`);

    const recentOrders = await this.prisma.order.findMany({
      where: { customerId: id },
      orderBy: { placedAt: 'desc' },
      take: 10,
      include: { items: { select: { quantity: true, unitPrice: true } } },
    });

    const totals = await this.spendByCustomer([id]);
    const summary = totals.get(id) ?? { orders: 0, spent: 0 };

    return {
      ...customer,
      initials: initialsOf(customer.fullName),
      joinedAt: customer.createdAt,
      totalOrders: summary.orders,
      totalSpent: summary.spent,
      averageOrderValue:
        summary.orders > 0
          ? Number((summary.spent / summary.orders).toFixed(2))
          : 0,
      recentOrders: recentOrders.map((o) => ({
        id: o.id,
        orderNumber: o.orderNumber,
        date: o.placedAt,
        status: o.status,
        total: orderTotal(o.items, o.shippingCost, o.discount),
      })),
    };
  }

  async update(id: string, dto: UpdateCustomerDto) {
    const customer = await this.prisma.user.findFirst({
      where: { id, role: Role.CUSTOMER },
      select: { id: true },
    });
    if (!customer) throw new NotFoundException(`Customer ${id} not found`);

    const updated = await this.prisma.user.update({
      where: { id },
      data: {
        ...(dto.fullName && { fullName: dto.fullName.trim() }),
        ...(dto.phone !== undefined && { phone: dto.phone }),
        ...(dto.status && { status: dto.status }),
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        phone: true,
        status: true,
        createdAt: true,
      },
    });

    // Replace the default address when a new one is supplied.
    if (dto.address) {
      await this.prisma.$transaction([
        this.prisma.address.deleteMany({ where: { userId: id, isDefault: true } }),
        this.prisma.address.create({
          data: { userId: id, lines: dto.address, isDefault: true },
        }),
      ]);
    }

    return { ...updated, initials: initialsOf(updated.fullName) };
  }

  /** Headline figures for the customers screen. */
  async stats() {
    const [total, active, inactive, suspended] = await this.prisma.$transaction([
      this.prisma.user.count({ where: { role: Role.CUSTOMER } }),
      this.prisma.user.count({
        where: { role: Role.CUSTOMER, status: UserStatus.ACTIVE },
      }),
      this.prisma.user.count({
        where: { role: Role.CUSTOMER, status: UserStatus.INACTIVE },
      }),
      this.prisma.user.count({
        where: { role: Role.CUSTOMER, status: UserStatus.SUSPENDED },
      }),
    ]);
    return { total, active, inactive, suspended };
  }

  /**
   * Returns order count and lifetime spend per customer id.
   * Done in two queries rather than N+1 per customer.
   */
  private async spendByCustomer(ids: string[]) {
    const result = new Map<string, { orders: number; spent: number }>();
    if (ids.length === 0) return result;

    const orders = await this.prisma.order.findMany({
      where: { customerId: { in: ids }, status: { in: SPEND_STATUSES } },
      select: {
        customerId: true,
        shippingCost: true,
        discount: true,
        items: { select: { quantity: true, unitPrice: true } },
      },
    });

    for (const order of orders) {
      if (!order.customerId) continue;
      const current = result.get(order.customerId) ?? { orders: 0, spent: 0 };
      current.orders += 1;
      current.spent += orderTotal(order.items, order.shippingCost, order.discount);
      result.set(order.customerId, current);
    }

    for (const [key, value] of result) {
      result.set(key, { ...value, spent: Number(value.spent.toFixed(2)) });
    }
    return result;
  }
}

function orderTotal(
  items: { quantity: number; unitPrice: Prisma.Decimal }[],
  shippingCost: Prisma.Decimal,
  discount: Prisma.Decimal,
): number {
  const subtotal = items.reduce((s, i) => s + i.quantity * Number(i.unitPrice), 0);
  return Number((subtotal + Number(shippingCost) - Number(discount)).toFixed(2));
}

/** "Elena Bianchi" -> "EB" */
export function initialsOf(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]!.toUpperCase())
    .join('');
}
