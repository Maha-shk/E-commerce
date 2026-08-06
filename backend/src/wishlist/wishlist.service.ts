import {
  Injectable,
  NotFoundException,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { WishlistResponseDto } from './dto/wishlist.dto';
import { AddToWishlistDto, WishlistItemResponseDto } from './dto/wishlist-item.dto';

@Injectable()
export class WishlistService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get or create wishlist for user
   */
  private async getWishlistForUser(userId: string) {
    let wishlist = await this.prisma.wishlist.findFirst({
      where: { userId },
    });

    if (!wishlist) {
      wishlist = await this.prisma.wishlist.create({
        data: { userId },
      });
    }

    return wishlist;
  }

  /**
   * Get user's wishlist with full product details
   */
  async getWishlist(userId: string): Promise<WishlistResponseDto> {
    const wishlist = await this.prisma.wishlist.findFirst({
      where: { userId },
      include: {
        items: {
          include: {
            product: {
              include: {
                images: true,
                category: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    });

    if (!wishlist) {
      // Return empty wishlist if doesn't exist
      return {
        id: '',
        items: [],
        totalItems: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    }

    return this.toWishlistResponse(wishlist);
  }

  /**
   * Add product to wishlist
   */
  async addItem(
    userId: string,
    dto: AddToWishlistDto,
  ): Promise<WishlistResponseDto> {
    // Verify product exists
    const product = await this.prisma.product.findUnique({
      where: { id: dto.productId },
    });

    if (!product) {
      throw new NotFoundException(`Product ${dto.productId} not found`);
    }

    // Get or create wishlist
    const wishlist = await this.getWishlistForUser(userId);

    // Check if product already exists in wishlist
    const existing = await this.prisma.wishlistItem.findUnique({
      where: {
        wishlistId_productId: {
          wishlistId: wishlist.id,
          productId: dto.productId,
        },
      },
    });

    if (existing) {
      throw new BadRequestException('Product already in wishlist');
    }

    // Add item to wishlist
    await this.prisma.wishlistItem.create({
      data: {
        wishlistId: wishlist.id,
        productId: dto.productId,
      },
    });

    // Return updated wishlist
    return this.getWishlist(userId);
  }

  /**
   * Remove item from wishlist
   */
  async removeItem(
    userId: string,
    itemId: string,
  ): Promise<WishlistResponseDto> {
    const wishlist = await this.prisma.wishlist.findFirst({
      where: { userId },
    });

    if (!wishlist) {
      throw new NotFoundException('Wishlist not found');
    }

    // Verify item belongs to user's wishlist
    const item = await this.prisma.wishlistItem.findUnique({
      where: { id: itemId },
    });

    if (!item) {
      throw new NotFoundException('Wishlist item not found');
    }

    if (item.wishlistId !== wishlist.id) {
      throw new UnauthorizedException('Item does not belong to your wishlist');
    }

    // Delete item
    await this.prisma.wishlistItem.delete({
      where: { id: itemId },
    });

    // Return updated wishlist
    return this.getWishlist(userId);
  }

  /**
   * Clear entire wishlist
   */
  async clearWishlist(userId: string): Promise<WishlistResponseDto> {
    const wishlist = await this.prisma.wishlist.findFirst({
      where: { userId },
    });

    if (wishlist) {
      await this.prisma.wishlistItem.deleteMany({
        where: { wishlistId: wishlist.id },
      });
    }

    return this.getWishlist(userId);
  }

  /**
   * Get wishlist item count
   */
  async getWishlistCount(userId: string): Promise<{ count: number }> {
    const wishlist = await this.prisma.wishlist.findFirst({
      where: { userId },
    });

    if (!wishlist) {
      return { count: 0 };
    }

    const count = await this.prisma.wishlistItem.count({
      where: { wishlistId: wishlist.id },
    });

    return { count };
  }

  /**
   * Calculate sale price
   */
  private calculateSalePrice(product: any): number {
    if (product.discount > 0) {
      return Number(product.price) * (1 - product.discount / 100);
    }
    return Number(product.price);
  }

  /**
   * Convert wishlist item to response DTO
   */
  private toWishlistItemResponse(item: any): WishlistItemResponseDto {
    const product = item.product;
    const salePrice = this.calculateSalePrice(product);

    return {
      id: item.id,
      productId: product.id,
      name: product.name,
      brand: product.brand,
      sku: product.sku,
      price: Number(product.price),
      discount: product.discount,
      salePrice,
      image: product.images[0]?.url || null,
      inStock: product.status !== 'OUT_OF_STOCK',
      lowStock: product.status === 'LOW_STOCK',
      stock: product.stock,
      addedAt: item.createdAt.toISOString(),
      category: product.category ? {
        id: product.category.id,
        name: product.category.name,
        slug: product.category.slug,
      } : null,
    };
  }

  /**
   * Convert wishlist to response DTO
   */
  private toWishlistResponse(wishlist: any): WishlistResponseDto {
    return {
      id: wishlist.id,
      items: wishlist.items.map((item: any) => this.toWishlistItemResponse(item)),
      totalItems: wishlist.items.length,
      createdAt: wishlist.createdAt.toISOString(),
      updatedAt: wishlist.updatedAt.toISOString(),
    };
  }
}