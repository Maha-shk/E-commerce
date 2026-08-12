import { Injectable } from '@nestjs/common';
import { OrderStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { initialsOf } from '../customers/customers.service';
import { ReportQueryDto, ReportTab } from './dto/report.dto';

/** Row status shown in the reports table. */
type ReportStatus = 'Completed' | 'Processing' | 'Returned';

function statusOf(status: OrderStatus): ReportStatus {
  if (status === OrderStatus.DELIVERED) return 'Completed';
  if (status === OrderStatus.RETURNED || status === OrderStatus.CANCELLED)
    return 'Returned';
  return 'Processing';
}

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  /** Builds the view (metrics + columns + rows) for the requested tab. */
  async build(tenantId: string, query: ReportQueryDto) {
    const window: Prisma.OrderWhereInput = {
      tenantId,
      ...((query.from || query.to) && {
        placedAt: {
          ...(query.from && { gte: new Date(query.from) }),
          ...(query.to && { lte: new Date(query.to) }),
        },
      }),
    };

    switch (query.tab) {
      case ReportTab.SALES:
        return this.salesReport(window);
      case ReportTab.PRODUCTS:
        return this.productsReport(window, query.category);
      default:
        return this.ordersReport(window, query.category);
    }
  }

  /** One row per order. */
  private async ordersReport(where: Prisma.OrderWhereInput, category?: string) {
    const orders = await this.prisma.order.findMany({
      where,
      orderBy: { placedAt: 'desc' },
      take: 200,
      include: {
        customer: { select: { fullName: true } },
        items: {
          // The classification snapshot taken at checkout, not a live join:
          // re-filing a product must not restate last quarter's figures.
          select: {
            quantity: true,
            unitPrice: true,
            categoryName: true,
          },
        },
      },
    });

    let rows = orders.map((o) => {
      const amount = total(o.items, o.shippingCost, o.discount);
      const name = o.customer?.fullName ?? 'Guest';
      // An order's "category" is that of its first line item.
      const detail = o.items[0]?.categoryName ?? 'Uncategorised';
      return {
        id: o.orderNumber,
        initials: initialsOf(name),
        title: name,
        subtitle: o.placedAt.toISOString(),
        reference: o.orderNumber,
        detail,
        amount,
        status: statusOf(o.status),
      };
    });

    if (category) rows = rows.filter((r) => r.detail === category);

    const revenue = rows.reduce((s, r) => s + r.amount, 0);
    const completed = rows.filter((r) => r.status === 'Completed').length;

    return {
      key: ReportTab.ORDERS,
      label: 'Orders Report',
      columns: {
        primary: 'Customer Name',
        reference: 'Transaction ID',
        detail: 'Product Category',
        amount: 'Amount',
      },
      metrics: [
        metric('Total Revenue', round(revenue)),
        metric('Total Orders', rows.length),
        metric('Average Order Value', rows.length ? round(revenue / rows.length) : 0),
        metric('Completed Orders', completed),
      ],
      totalEntries: rows.length,
      rows,
    };
  }

  /** Aggregated by order status, used as a stand-in for sales channels. */
  private async salesReport(where: Prisma.OrderWhereInput) {
    const orders = await this.prisma.order.findMany({
      where,
      select: {
        status: true,
        placedAt: true,
        shippingCost: true,
        discount: true,
        items: { select: { quantity: true, unitPrice: true } },
      },
    });

    const buckets = new Map<
      OrderStatus,
      { revenue: number; orders: number; units: number }
    >();
    for (const o of orders) {
      const bucket = buckets.get(o.status) ?? { revenue: 0, orders: 0, units: 0 };
      bucket.revenue += total(o.items, o.shippingCost, o.discount);
      bucket.orders += 1;
      bucket.units += o.items.reduce((s, i) => s + i.quantity, 0);
      buckets.set(o.status, bucket);
    }

    const rows = [...buckets.entries()].map(([status, b]) => ({
      id: `SLS-${status}`,
      initials: status.slice(0, 2),
      title: titleCase(status),
      subtitle: `${b.orders} order(s)`,
      reference: `SLS-${status}`,
      detail: `${b.units} units`,
      amount: round(b.revenue),
      status: statusOf(status),
    }));

    const gross = rows.reduce((s, r) => s + r.amount, 0);
    const returned = buckets.get(OrderStatus.RETURNED)?.revenue ?? 0;
    const units = [...buckets.values()].reduce((s, b) => s + b.units, 0);

    return {
      key: ReportTab.SALES,
      label: 'Sales Report',
      columns: {
        primary: 'Sales Channel',
        reference: 'Channel Code',
        detail: 'Period',
        amount: 'Revenue',
      },
      metrics: [
        metric('Gross Sales', round(gross)),
        metric('Net Sales', round(gross - returned)),
        metric('Units Sold', units),
        metric('Refund Rate', gross ? round((returned / gross) * 100) : 0),
      ],
      totalEntries: rows.length,
      rows,
    };
  }

  /** One row per product, ranked by revenue. */
  private async productsReport(where: Prisma.OrderWhereInput, category?: string) {
    const items = await this.prisma.orderItem.findMany({
      where: { order: where },
      select: {
        sku: true,
        name: true,
        quantity: true,
        unitPrice: true,
        order: { select: { status: true } },
        categoryName: true,
      },
    });

    const bySku = new Map<
      string,
      { name: string; units: number; revenue: number; category: string; returned: boolean }
    >();

    for (const i of items) {
      const entry =
        bySku.get(i.sku) ??
        {
          name: i.name,
          units: 0,
          revenue: 0,
          category: i.categoryName ?? 'Uncategorised',
          returned: false,
        };
      const isReturn =
        i.order.status === OrderStatus.RETURNED ||
        i.order.status === OrderStatus.CANCELLED;
      const lineTotal = i.quantity * Number(i.unitPrice);

      entry.units += i.quantity;
      // Returns subtract from revenue.
      entry.revenue += isReturn ? -lineTotal : lineTotal;
      if (isReturn) entry.returned = true;
      bySku.set(i.sku, entry);
    }

    let rows = [...bySku.entries()]
      .map(([sku, e]) => ({
        id: sku,
        initials: initialsOf(e.name),
        title: e.name,
        subtitle: `${e.units} units sold`,
        reference: sku,
        detail: e.category,
        amount: round(e.revenue),
        status: (e.revenue < 0 ? 'Returned' : 'Completed') as ReportStatus,
      }))
      .sort((a, b) => b.amount - a.amount);

    if (category) rows = rows.filter((r) => r.detail === category);

    const units = [...bySku.values()].reduce((s, e) => s + e.units, 0);
    const outOfStock = await this.prisma.product.count({
      where: { status: 'OUT_OF_STOCK' },
    });
    const topCategory =
      rows.length > 0
        ? [...rows].sort((a, b) => b.amount - a.amount)[0].detail
        : '—';

    return {
      key: ReportTab.PRODUCTS,
      label: 'Products Report',
      columns: {
        primary: 'Product Name',
        reference: 'SKU',
        detail: 'Category',
        amount: 'Revenue',
      },
      metrics: [
        metric('Products Sold', units),
        metric('Top Category', topCategory),
        metric('Out of Stock', outOfStock),
        metric('Distinct Products', rows.length),
      ],
      totalEntries: rows.length,
      rows,
    };
  }
}

function total(
  items: { quantity: number; unitPrice: Prisma.Decimal }[],
  shippingCost: Prisma.Decimal,
  discount: Prisma.Decimal,
): number {
  const subtotal = items.reduce((s, i) => s + i.quantity * Number(i.unitPrice), 0);
  return round(subtotal + Number(shippingCost) - Number(discount));
}

function metric(label: string, value: number | string) {
  return { label, value };
}

function titleCase(value: string): string {
  return value.charAt(0) + value.slice(1).toLowerCase();
}

function round(value: number): number {
  return Number(value.toFixed(2));
}
