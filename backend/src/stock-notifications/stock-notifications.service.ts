import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ProductVisibility } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationCategory, NotificationType } from '@prisma/client';
import { paginate } from '../common/dto/paginated-response';
import { StockNotificationQueryDto } from './dto/stock-notification.dto';

/**
 * The back-in-stock waiting list.
 *
 * A shopper who finds a product out of stock can leave an address; the list is
 * discharged the moment stock rises above zero. Notifying is deliberately
 * driven by the *stock write* rather than by a scheduled sweep, so the mail
 * goes out as part of the restock instead of up to an hour later.
 */
@Injectable()
export class StockNotificationsService {
  private readonly logger = new Logger(StockNotificationsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly mail: MailService,
    private readonly notifications: NotificationsService,
  ) {}

  /**
   * Registers interest in a product that is currently unavailable.
   *
   * Idempotent: asking twice re-arms the one row rather than queuing a second
   * copy of the same promise. Someone who was notified for an earlier restock
   * and is asking again has their row cleared back to "waiting".
   */
  async subscribe(
    tenantId: string,
    productId: string,
    email: string,
    userId?: string,
  ) {
    const product = await this.prisma.product.findFirst({
      where: { id: productId, tenantId, visibility: ProductVisibility.PUBLIC },
      select: { id: true, name: true, stock: true },
    });
    if (!product) throw new NotFoundException(`Product ${productId} not found`);

    // Nothing to wait for. Told plainly rather than accepted and never sent,
    // which would leave the shopper expecting a mail that can never arrive.
    if (product.stock > 0) {
      throw new BadRequestException(
        `"${product.name}" is in stock — no need to wait.`,
      );
    }

    const normalised = email.toLowerCase().trim();

    const existing = await this.prisma.stockNotification.findUnique({
      where: { productId_email: { productId, email: normalised } },
      select: { id: true, notifiedAt: true },
    });

    await this.prisma.stockNotification.upsert({
      where: { productId_email: { productId, email: normalised } },
      update: { notifiedAt: null, ...(userId && { userId }) },
      create: {
        tenantId,
        productId,
        email: normalised,
        userId: userId ?? null,
      },
    });

    return {
      subscribed: true,
      // Lets the storefront say "you're already on the list" rather than
      // showing a success toast for something that changed nothing.
      alreadyWaiting: Boolean(existing && existing.notifiedAt === null),
      productId,
      message: `We'll email ${normalised} when "${product.name}" is back in stock.`,
    };
  }

  /** Whether this address is currently waiting on this product. */
  async status(tenantId: string, productId: string, email: string) {
    const row = await this.prisma.stockNotification.findFirst({
      where: {
        tenantId,
        productId,
        email: email.toLowerCase().trim(),
        notifiedAt: null,
      },
      select: { id: true, createdAt: true },
    });
    return { waiting: Boolean(row), since: row?.createdAt ?? null };
  }

  /** Removes a pending request — the unsubscribe path. */
  async unsubscribe(tenantId: string, productId: string, email: string) {
    const { count } = await this.prisma.stockNotification.deleteMany({
      where: { tenantId, productId, email: email.toLowerCase().trim() },
    });
    return { removed: count > 0 };
  }

  /**
   * Fires when a product's stock rises above zero.
   *
   * Called from every path that writes stock upward. Swallows its own failures:
   * a dead SMTP server must not roll back a restock the warehouse has already
   * done, and the rows stay un-notified so the next attempt still catches them.
   */
  async onStockReplenished(
    tenantId: string,
    productId: string,
    previousStock: number,
    newStock: number,
  ): Promise<void> {
    if (previousStock > 0 || newStock <= 0) return;

    try {
      const waiting = await this.prisma.stockNotification.findMany({
        where: { tenantId, productId, notifiedAt: null },
        select: { id: true, email: true },
      });
      if (waiting.length === 0) return;

      const product = await this.prisma.product.findFirst({
        where: { id: productId, tenantId },
        select: { id: true, name: true, sku: true, stock: true },
      });
      if (!product) return;

      // Marked before sending, not after: a transport that hangs halfway
      // through should under-deliver rather than mail the same person twice on
      // a retry. The rows are the record of the promise, not of the delivery.
      await this.prisma.stockNotification.updateMany({
        where: { id: { in: waiting.map((w) => w.id) } },
        data: { notifiedAt: new Date() },
      });

      await Promise.all(
        waiting.map((w) =>
          this.mail.sendBackInStock(w.email, product.name, product.stock),
        ),
      );

      this.logger.log(
        `Back-in-stock: notified ${waiting.length} shopper(s) about ${product.sku}`,
      );

      await this.notifications.emit(tenantId, {
        type: NotificationType.INFO,
        category: NotificationCategory.INVENTORY,
        title: `${product.name} is back in stock`,
        description: `${waiting.length} shopper(s) waiting on it have been emailed.`,
      });
    } catch (error) {
      this.logger.error(
        `Failed to process back-in-stock for product ${productId}`,
        error as Error,
      );
    }
  }

  // ---------------------------------------------------------------------------
  // Admin
  // ---------------------------------------------------------------------------

  /** Who is waiting, newest first. Demand signal for restocking decisions. */
  async findAll(tenantId: string, query: StockNotificationQueryDto) {
    const where = {
      tenantId,
      ...(query.productId && { productId: query.productId }),
      ...(query.waitingOnly !== false && { notifiedAt: null }),
      ...(query.search && {
        OR: [
          { email: { contains: query.search, mode: 'insensitive' as const } },
          {
            product: {
              name: { contains: query.search, mode: 'insensitive' as const },
            },
          },
        ],
      }),
    };

    const [rows, total] = await Promise.all([
      this.prisma.stockNotification.findMany({
        where,
        skip: (query.page - 1) * query.limit,
        take: query.limit,
        orderBy: { createdAt: 'desc' },
        include: {
          product: {
            select: { id: true, name: true, sku: true, stock: true, status: true },
          },
        },
      }),
      this.prisma.stockNotification.count({ where }),
    ]);

    return paginate(rows, total, query.page, query.limit);
  }

  /**
   * Products with people waiting, most-wanted first — the restock priority
   * list, which is the question an admin actually has.
   */
  async demand(tenantId: string, limit = 20) {
    const grouped = await this.prisma.stockNotification.groupBy({
      by: ['productId'],
      where: { tenantId, notifiedAt: null },
      _count: { _all: true },
      orderBy: { _count: { productId: 'desc' } },
      take: limit,
    });

    if (grouped.length === 0) return [];

    const products = await this.prisma.product.findMany({
      where: { tenantId, id: { in: grouped.map((g) => g.productId) } },
      select: {
        id: true,
        name: true,
        sku: true,
        stock: true,
        status: true,
        model: {
          select: {
            name: true,
            productType: {
              select: { name: true, company: { select: { name: true } } },
            },
          },
        },
      },
    });
    const byId = new Map(products.map((p) => [p.id, p]));

    return grouped
      .map((g) => {
        const product = byId.get(g.productId);
        if (!product) return null;
        return {
          productId: g.productId,
          waiting: g._count._all,
          name: product.name,
          sku: product.sku,
          stock: product.stock,
          status: product.status,
          model: product.model.name,
          productType: product.model.productType.name,
          company: product.model.productType.company.name,
        };
      })
      .filter((row): row is NonNullable<typeof row> => row !== null);
  }
}
