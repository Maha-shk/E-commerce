import { Injectable } from '@nestjs/common';
import { OrderStatus, PaymentStatus, Prisma, Role, StockStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

/** Orders that represent committed revenue. */
const REVENUE_STATUSES: OrderStatus[] = [
  OrderStatus.PROCESSING,
  OrderStatus.SHIPPED,
  OrderStatus.DELIVERED,
];

/** Orders still moving through fulfilment. */
const ACTIVE_STATUSES: OrderStatus[] = [
  OrderStatus.PENDING,
  OrderStatus.PROCESSING,
  OrderStatus.SHIPPED,
];

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  /** Stat cards at the top of the admin dashboard. */
  async stats() {
    const [activeOrders, pendingOrders, customers, paidOrders, outOfStock] =
      await this.prisma.$transaction([
        this.prisma.order.count({ where: { status: { in: ACTIVE_STATUSES } } }),
        this.prisma.order.count({ where: { status: OrderStatus.PENDING } }),
        this.prisma.user.count({ where: { role: Role.CUSTOMER } }),
        this.prisma.order.findMany({
          where: { status: OrderStatus.DELIVERED },
          select: {
            shippingCost: true,
            discount: true,
            items: { select: { quantity: true, unitPrice: true } },
          },
        }),
        this.prisma.product.count({
          where: { status: StockStatus.OUT_OF_STOCK },
        }),
      ]);

    const totalSales = paidOrders.reduce((sum, o) => sum + orderTotal(o), 0);
    const orderCount = paidOrders.length;

    return {
      totalSales: round(totalSales),
      activeOrders,
      pendingOrders,
      totalCustomers: customers,
      averageOrderValue: orderCount ? round(totalSales / orderCount) : 0,
      // Sales that converted, relative to the customer base.
      conversionRate: customers ? round((orderCount / customers) * 100) : 0,
      outOfStockProducts: outOfStock,
    };
  }

  /**
   * Revenue and order counts for the last `months` calendar months,
   * oldest first — feeds the dashboard bar chart.
   */
  async monthlyPerformance(months = 6) {
    const start = new Date();
    start.setUTCDate(1);
    start.setUTCHours(0, 0, 0, 0);
    start.setUTCMonth(start.getUTCMonth() - (months - 1));

    const orders = await this.prisma.order.findMany({
      where: {
        placedAt: { gte: start },
        status: { in: REVENUE_STATUSES },
      },
      select: {
        placedAt: true,
        shippingCost: true,
        discount: true,
        items: { select: { quantity: true, unitPrice: true } },
      },
    });

    // Pre-seed every bucket so months without orders still render.
    const buckets = new Map<string, { month: string; revenue: number; orders: number }>();
    for (let i = 0; i < months; i++) {
      const d = new Date(start);
      d.setUTCMonth(start.getUTCMonth() + i);
      buckets.set(monthKey(d), {
        month: d.toLocaleString('en-US', { month: 'short', timeZone: 'UTC' }),
        revenue: 0,
        orders: 0,
      });
    }

    for (const order of orders) {
      const bucket = buckets.get(monthKey(order.placedAt));
      if (!bucket) continue;
      bucket.revenue += orderTotal(order);
      bucket.orders += 1;
    }

    return [...buckets.values()].map((b) => ({ ...b, revenue: round(b.revenue) }));
  }

  /** Most recent orders shown in the dashboard side panel. */
  async recentOrders(limit = 5) {
    const orders = await this.prisma.order.findMany({
      orderBy: { placedAt: 'desc' },
      take: limit,
      select: {
        id: true,
        orderNumber: true,
        status: true,
        placedAt: true,
        shippingCost: true,
        discount: true,
        customer: { select: { id: true, fullName: true } },
        items: { select: { quantity: true, unitPrice: true } },
      },
    });

    return orders.map((o) => ({
      id: o.id,
      orderNumber: o.orderNumber,
      customer: o.customer?.fullName ?? 'Guest',
      status: o.status,
      placedAt: o.placedAt,
      total: round(orderTotal(o)),
    }));
  }

  /** Best sellers by units sold. */
  async topProducts(limit = 5) {
    const grouped = await this.prisma.orderItem.groupBy({
      by: ['sku'],
      _sum: { quantity: true },
      orderBy: { _sum: { quantity: 'desc' } },
      take: limit,
    });

    const skus = grouped.map((g) => g.sku);
    const products = await this.prisma.product.findMany({
      where: { sku: { in: skus } },
      select: { id: true, name: true, sku: true, price: true },
    });
    const bySku = new Map(products.map((p) => [p.sku, p]));

    return grouped.map((g) => ({
      sku: g.sku,
      unitsSold: g._sum.quantity ?? 0,
      product: bySku.get(g.sku)
        ? { ...bySku.get(g.sku)!, price: Number(bySku.get(g.sku)!.price) }
        : null,
    }));
  }
}

type OrderTotalInput = {
  shippingCost: Prisma.Decimal;
  discount: Prisma.Decimal;
  items: { quantity: number; unitPrice: Prisma.Decimal }[];
};

function orderTotal(order: OrderTotalInput): number {
  const subtotal = order.items.reduce(
    (sum, i) => sum + i.quantity * Number(i.unitPrice),
    0,
  );
  return subtotal + Number(order.shippingCost) - Number(order.discount);
}

function monthKey(date: Date): string {
  return `${date.getUTCFullYear()}-${date.getUTCMonth()}`;
}

function round(value: number): number {
  return Number(value.toFixed(2));
}
