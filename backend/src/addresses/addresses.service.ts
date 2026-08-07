import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAddressDto, UpdateAddressDto } from './dto/address.dto';

@Injectable()
export class AddressesService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get all addresses for a user
   */
  async findAll(userId: string) {
    const addresses = await this.prisma.address.findMany({
      where: { userId },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
    });

    return {
      success: true,
      data: addresses,
    };
  }

  /**
   * Get a single address by ID
   */
  async findOne(id: string, userId: string) {
    const address = await this.prisma.address.findUnique({
      where: { id },
    });

    if (!address) {
      throw new NotFoundException('Address not found');
    }

    if (address.userId !== userId) {
      throw new ForbiddenException('Access denied to this address');
    }

    return {
      success: true,
      data: address,
    };
  }

  /**
   * Create a new address for user
   */
  async create(userId: string, dto: CreateAddressDto) {
    // If this is set as default, unset all other default addresses for this user
    if (dto.isDefault) {
      await this.prisma.address.updateMany({
        where: { userId, isDefault: true },
        data: { isDefault: false },
      });
    }

    // If user has no addresses yet, make this the default
    const existingAddresses = await this.prisma.address.count({
      where: { userId },
    });

    const address = await this.prisma.address.create({
      data: {
        userId,
        label: dto.label,
        lines: dto.lines,
        isDefault: dto.isDefault || existingAddresses === 0,
      },
    });

    return {
      success: true,
      data: address,
      message: 'Address added successfully',
    };
  }

  /**
   * Update an existing address
   */
  async update(id: string, userId: string, dto: UpdateAddressDto) {
    // Verify address exists and belongs to user
    const existing = await this.prisma.address.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException('Address not found');
    }

    if (existing.userId !== userId) {
      throw new ForbiddenException('Access denied to this address');
    }

    // If setting as default, unset all other defaults
    if (dto.isDefault === true) {
      await this.prisma.address.updateMany({
        where: { userId, id: { not: id }, isDefault: true },
        data: { isDefault: false },
      });
    }

    const address = await this.prisma.address.update({
      where: { id },
      data: {
        ...(dto.label !== undefined && { label: dto.label }),
        ...(dto.lines !== undefined && { lines: dto.lines }),
        ...(dto.isDefault !== undefined && { isDefault: dto.isDefault }),
      },
    });

    return {
      success: true,
      data: address,
      message: 'Address updated successfully',
    };
  }

  /**
   * Set an address as default
   */
  async setDefault(id: string, userId: string) {
    // Verify address exists and belongs to user
    const existing = await this.prisma.address.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException('Address not found');
    }

    if (existing.userId !== userId) {
      throw new ForbiddenException('Access denied to this address');
    }

    // Use transaction to ensure atomicity
    await this.prisma.$transaction([
      // Unset all other defaults
      this.prisma.address.updateMany({
        where: { userId, id: { not: id }, isDefault: true },
        data: { isDefault: false },
      }),
      // Set this as default
      this.prisma.address.update({
        where: { id },
        data: { isDefault: true },
      }),
    ]);

    return {
      success: true,
      message: 'Default address updated successfully',
    };
  }

  /**
   * Delete an address
   */
  async remove(id: string, userId: string) {
    // Verify address exists and belongs to user
    const existing = await this.prisma.address.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException('Address not found');
    }

    if (existing.userId !== userId) {
      throw new ForbiddenException('Access denied to this address');
    }

    // Deleting the default would otherwise leave the account with addresses but
    // no default at all — `getDefaultAddress` returns null, the account overview
    // reads "No address set", and checkout has nothing to preselect. Promote the
    // most recently added survivor in the same transaction so that can't happen.
    await this.prisma.$transaction(async (tx) => {
      await tx.address.delete({ where: { id } });

      if (!existing.isDefault) return;

      const next = await tx.address.findFirst({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        select: { id: true },
      });

      if (next) {
        await tx.address.update({
          where: { id: next.id },
          data: { isDefault: true },
        });
      }
    });

    return {
      success: true,
      message: 'Address deleted successfully',
    };
  }

  /**
   * Get default address for a user
   */
  async getDefaultAddress(userId: string) {
    const address = await this.prisma.address.findFirst({
      where: { userId, isDefault: true },
    });

    if (!address) {
      // Return null if no default address exists
      return {
        success: true,
        data: null,
      };
    }

    return {
      success: true,
      data: address,
    };
  }
}
