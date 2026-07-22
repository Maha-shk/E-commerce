import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Discount, DiscountType, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { paginate } from '../common/dto/paginated-response';
import {
  CreateDiscountDto,
  DiscountQueryDto,
  UpdateDiscountDto,
} from './dto/discount.dto';

/** Badge shown in the campaign table, computed from the date window. */
export type DiscountStatus = 'Active' | 'Scheduled' | 'Expired';

@Injectable()
export class DiscountsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: DiscountQueryDto) {
    const where: Prisma.DiscountWhereInput = {
      ...(query.category && { category: query.category }),
      ...(query.type && { type: query.type }),
      ...(query.search && {
        OR: [
          { name: { contains: query.search, mode: 'insensitive' } },
          { code: { contains: query.search, mode: 'insensitive' } },
        ],
      }),
    };

    const [rows, total] = await this.prisma.$transaction([
      this.prisma.discount.findMany({
        where,
        skip: query.skip,
        take: query.limit,
        orderBy: { startDate: 'desc' },
      }),
      this.prisma.discount.count({ where }),
    ]);

    return paginate(rows.map(toDiscountView), total, query.page, query.limit);
  }

  async findOne(id: string) {
    const discount = await this.prisma.discount.findUnique({ where: { id } });
    if (!discount) throw new NotFoundException(`Discount ${id} not found`);
    return toDiscountView(discount);
  }

  async create(dto: CreateDiscountDto) {
    const code = dto.code.trim().toUpperCase();
    this.assertValid(dto);

    const clash = await this.prisma.discount.findUnique({ where: { code } });
    if (clash) {
      throw new BadRequestException(`The code "${code}" is already in use`);
    }

    const discount = await this.prisma.discount.create({
      data: {
        name: dto.name.trim(),
        code,
        type: dto.type,
        value: new Prisma.Decimal(dto.value),
        usageLimit: dto.usageLimit ?? 0,
        startDate: new Date(dto.startDate),
        endDate: new Date(dto.endDate),
        icon: dto.icon,
        ...(dto.category && { category: dto.category }),
      },
    });
    return toDiscountView(discount);
  }

  async update(id: string, dto: UpdateDiscountDto) {
    const existing = await this.prisma.discount.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException(`Discount ${id} not found`);

    this.assertValid({
      type: dto.type ?? existing.type,
      value: dto.value ?? Number(existing.value),
      startDate: dto.startDate ?? existing.startDate.toISOString(),
      endDate: dto.endDate ?? existing.endDate.toISOString(),
    });

    let code: string | undefined;
    if (dto.code) {
      code = dto.code.trim().toUpperCase();
      const clash = await this.prisma.discount.findFirst({
        where: { code, NOT: { id } },
        select: { id: true },
      });
      if (clash) {
        throw new BadRequestException(`The code "${code}" is already in use`);
      }
    }

    const discount = await this.prisma.discount.update({
      where: { id },
      data: {
        ...(dto.name && { name: dto.name.trim() }),
        ...(code && { code }),
        ...(dto.type && { type: dto.type }),
        ...(dto.value !== undefined && { value: new Prisma.Decimal(dto.value) }),
        ...(dto.usageLimit !== undefined && { usageLimit: dto.usageLimit }),
        ...(dto.startDate && { startDate: new Date(dto.startDate) }),
        ...(dto.endDate && { endDate: new Date(dto.endDate) }),
        ...(dto.icon !== undefined && { icon: dto.icon }),
        ...(dto.category && { category: dto.category }),
      },
    });
    return toDiscountView(discount);
  }

  async remove(id: string) {
    const exists = await this.prisma.discount.count({ where: { id } });
    if (!exists) throw new NotFoundException(`Discount ${id} not found`);
    await this.prisma.discount.delete({ where: { id } });
    return { message: 'Discount deleted' };
  }

  /** Validates a code at checkout time and reports why it is unusable. */
  async validateCode(code: string) {
    const discount = await this.prisma.discount.findUnique({
      where: { code: code.trim().toUpperCase() },
    });
    if (!discount) return { valid: false, reason: 'Unknown discount code' };

    const status = deriveStatus(discount);
    if (status === 'Scheduled') {
      return { valid: false, reason: 'This campaign has not started yet' };
    }
    if (status === 'Expired') {
      return { valid: false, reason: 'This campaign has ended' };
    }
    if (discount.usageLimit > 0 && discount.usageCount >= discount.usageLimit) {
      return { valid: false, reason: 'This code has reached its usage limit' };
    }

    return { valid: true, discount: toDiscountView(discount) };
  }

  private assertValid(dto: {
    type: DiscountType;
    value: number;
    startDate: string;
    endDate: string;
  }) {
    if (new Date(dto.endDate) < new Date(dto.startDate)) {
      throw new BadRequestException('endDate must be on or after startDate');
    }
    if (dto.type === DiscountType.PERCENTAGE && dto.value > 100) {
      throw new BadRequestException('A percentage discount cannot exceed 100');
    }
  }
}

/** Active / Scheduled / Expired, derived from the campaign date window. */
export function deriveStatus(discount: Discount): DiscountStatus {
  const now = new Date();
  if (now < discount.startDate) return 'Scheduled';
  if (now > discount.endDate) return 'Expired';
  return 'Active';
}

function toDiscountView(discount: Discount) {
  return {
    ...discount,
    value: Number(discount.value),
    status: deriveStatus(discount),
    remainingUses:
      discount.usageLimit > 0
        ? Math.max(0, discount.usageLimit - discount.usageCount)
        : null,
  };
}
