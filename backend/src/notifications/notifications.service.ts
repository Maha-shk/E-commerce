import { Injectable, NotFoundException } from '@nestjs/common';
import {
  NotificationCategory,
  NotificationType,
  Prisma,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { paginate } from '../common/dto/paginated-response';
import { NotificationQueryDto } from './dto/notification.dto';

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  /** Notifications targeted at this admin plus broadcasts (userId = null). */
  private scope(userId: string): Prisma.NotificationWhereInput {
    return { OR: [{ userId }, { userId: null }] };
  }

  async findAll(userId: string, query: NotificationQueryDto) {
    const where: Prisma.NotificationWhereInput = {
      AND: [
        this.scope(userId),
        ...(query.category ? [{ category: query.category }] : []),
        ...(query.unreadOnly ? [{ read: false }] : []),
        ...(query.search
          ? [
              {
                OR: [
                  { title: { contains: query.search, mode: 'insensitive' as const } },
                  {
                    description: {
                      contains: query.search,
                      mode: 'insensitive' as const,
                    },
                  },
                ],
              },
            ]
          : []),
      ],
    };

    const [rows, total] = await this.prisma.$transaction([
      this.prisma.notification.findMany({
        where,
        skip: query.skip,
        take: query.limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.notification.count({ where }),
    ]);

    return paginate(rows, total, query.page, query.limit);
  }

  /** Same records as findAll, bucketed into Today / Yesterday / Earlier. */
  async grouped(userId: string, query: NotificationQueryDto) {
    const page = await this.findAll(userId, query);

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const startOfYesterday = new Date(startOfToday);
    startOfYesterday.setDate(startOfYesterday.getDate() - 1);

    const groups: Record<string, typeof page.data> = {
      Today: [],
      Yesterday: [],
      Earlier: [],
    };

    for (const item of page.data) {
      if (item.createdAt >= startOfToday) groups.Today.push(item);
      else if (item.createdAt >= startOfYesterday) groups.Yesterday.push(item);
      else groups.Earlier.push(item);
    }

    return {
      success: true as const,
      data: Object.entries(groups)
        .filter(([, items]) => items.length > 0)
        .map(([label, items]) => ({ label, items })),
      meta: page.meta,
    };
  }

  async unreadCount(userId: string) {
    const count = await this.prisma.notification.count({
      where: { AND: [this.scope(userId), { read: false }] },
    });
    return { unread: count };
  }

  async markRead(userId: string, id: string) {
    const { count } = await this.prisma.notification.updateMany({
      where: { AND: [{ id }, this.scope(userId)] },
      data: { read: true },
    });
    if (!count) throw new NotFoundException(`Notification ${id} not found`);
    return { message: 'Notification marked as read' };
  }

  async markAllRead(userId: string) {
    const { count } = await this.prisma.notification.updateMany({
      where: { AND: [this.scope(userId), { read: false }] },
      data: { read: true },
    });
    return { message: `${count} notification(s) marked as read` };
  }

  async remove(userId: string, id: string) {
    const { count } = await this.prisma.notification.deleteMany({
      where: { AND: [{ id }, this.scope(userId)] },
    });
    if (!count) throw new NotFoundException(`Notification ${id} not found`);
    return { message: 'Notification deleted' };
  }

  /**
   * Emits a notification. Called by other services when domain events happen
   * (new order, low stock, ...). `userId: null` broadcasts to all admins.
   */
  async emit(input: {
    type: NotificationType;
    category: NotificationCategory;
    title: string;
    description: string;
    userId?: string | null;
  }) {
    return this.prisma.notification.create({
      data: {
        type: input.type,
        category: input.category,
        title: input.title,
        description: input.description,
        userId: input.userId ?? null,
      },
    });
  }
}
