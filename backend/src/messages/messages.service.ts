import { Injectable, NotFoundException } from '@nestjs/common';
import { MessageDirection, OrderStatus, Prisma, Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { paginate } from '../common/dto/paginated-response';
import { initialsOf } from '../customers/customers.service';
import {
  ConversationQueryDto,
  SendMessageDto,
  StartConversationDto,
} from './dto/message.dto';

@Injectable()
export class MessagesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: ConversationQueryDto) {
    const where: Prisma.ConversationWhereInput = {
      ...(query.search && {
        customer: {
          OR: [
            { fullName: { contains: query.search, mode: 'insensitive' } },
            { email: { contains: query.search, mode: 'insensitive' } },
          ],
        },
      }),
    };

    const [rows, total] = await this.prisma.$transaction([
      this.prisma.conversation.findMany({
        where,
        skip: query.skip,
        take: query.limit,
        orderBy: { lastMessageAt: 'desc' },
        include: {
          customer: {
            select: { id: true, fullName: true, email: true, phone: true },
          },
          // Only the latest message is needed for the list preview.
          messages: { orderBy: { createdAt: 'desc' }, take: 1 },
        },
      }),
      this.prisma.conversation.count({ where }),
    ]);

    const items = rows.map((c) => ({
      id: c.id,
      customer: { ...c.customer, initials: initialsOf(c.customer.fullName) },
      lastMessage: c.messages[0]?.text ?? '',
      lastMessageAt: c.lastMessageAt,
      unread: c.unreadCount,
    }));

    return paginate(items, total, query.page, query.limit);
  }

  /** Full thread plus the customer context panel shown beside it. */
  async findOne(id: string) {
    const conversation = await this.prisma.conversation.findUnique({
      where: { id },
      include: {
        customer: {
          select: {
            id: true,
            fullName: true,
            email: true,
            phone: true,
            status: true,
            createdAt: true,
          },
        },
        messages: { orderBy: { createdAt: 'asc' } },
      },
    });
    if (!conversation) throw new NotFoundException(`Conversation ${id} not found`);

    const orders = await this.prisma.order.findMany({
      where: { customerId: conversation.customerId },
      orderBy: { placedAt: 'desc' },
      take: 5,
      include: { items: { select: { quantity: true, unitPrice: true } } },
    });

    const recentOrders = orders.map((o) => ({
      id: o.id,
      orderNumber: o.orderNumber,
      date: o.placedAt,
      status: o.status,
      amount: total(o.items, o.shippingCost, o.discount),
    }));

    const spend = orders
      .filter((o) => o.status !== OrderStatus.CANCELLED)
      .reduce((s, o) => s + total(o.items, o.shippingCost, o.discount), 0);

    return {
      ...conversation,
      customer: {
        ...conversation.customer,
        initials: initialsOf(conversation.customer.fullName),
      },
      totalOrders: orders.length,
      totalSpent: Number(spend.toFixed(2)),
      recentOrders,
    };
  }

  async start(dto: StartConversationDto) {
    const customer = await this.prisma.user.findFirst({
      where: { id: dto.customerId, role: Role.CUSTOMER },
      select: { id: true },
    });
    if (!customer) {
      throw new NotFoundException(`Customer ${dto.customerId} not found`);
    }

    // One open conversation per customer keeps the inbox tidy.
    const existing = await this.prisma.conversation.findFirst({
      where: { customerId: dto.customerId },
      select: { id: true },
    });
    if (existing) {
      if (dto.text) await this.reply(existing.id, { text: dto.text });
      return this.findOne(existing.id);
    }

    const conversation = await this.prisma.conversation.create({
      data: {
        customerId: dto.customerId,
        ...(dto.text && {
          messages: {
            create: { direction: MessageDirection.OUTGOING, text: dto.text },
          },
        }),
      },
    });

    return this.findOne(conversation.id);
  }

  /** Admin reply. Sending also clears the unread counter. */
  async reply(id: string, dto: SendMessageDto) {
    const exists = await this.prisma.conversation.count({ where: { id } });
    if (!exists) throw new NotFoundException(`Conversation ${id} not found`);

    const [message] = await this.prisma.$transaction([
      this.prisma.message.create({
        data: {
          conversationId: id,
          direction: MessageDirection.OUTGOING,
          text: dto.text,
        },
      }),
      this.prisma.conversation.update({
        where: { id },
        data: { lastMessageAt: new Date(), unreadCount: 0 },
      }),
    ]);

    return message;
  }

  async markRead(id: string) {
    const { count } = await this.prisma.conversation.updateMany({
      where: { id },
      data: { unreadCount: 0 },
    });
    if (!count) throw new NotFoundException(`Conversation ${id} not found`);
    return { message: 'Conversation marked as read' };
  }

  async remove(id: string) {
    const exists = await this.prisma.conversation.count({ where: { id } });
    if (!exists) throw new NotFoundException(`Conversation ${id} not found`);
    await this.prisma.conversation.delete({ where: { id } });
    return { message: 'Conversation deleted' };
  }
}

function total(
  items: { quantity: number; unitPrice: Prisma.Decimal }[],
  shippingCost: Prisma.Decimal,
  discount: Prisma.Decimal,
): number {
  const subtotal = items.reduce((s, i) => s + i.quantity * Number(i.unitPrice), 0);
  return Number((subtotal + Number(shippingCost) - Number(discount)).toFixed(2));
}
