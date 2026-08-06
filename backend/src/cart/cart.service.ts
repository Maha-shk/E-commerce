import {
  Injectable,
  NotFoundException,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateCartItemDto,
  UpdateCartItemDto,
  CartResponseDto,
  CartItemResponseDto,
} from './dto/cart-item.dto';
import { CartCountResponseDto } from './dto/cart.dto';

/** Calculate prices for cart response */
interface CartTotals {
  totalItems: number;
  subtotal: number;
  shipping: number;
  tax: number;
  total: number;
}

@Injectable()
export class CartService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get or create cart for user or guest session (internal method)
   */
  private async getCartForUser(userId?: string, sessionId?: string) {
    if (userId) {
      // Authenticated user cart
      let cart = await this.prisma.cart.findFirst({
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
          },
        },
      });

      if (!cart) {
        cart = await this.prisma.cart.create({
          data: { userId },
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
            },
          },
        });
      }

      return cart;
    } else if (sessionId) {
      // Guest cart
      let cart = await this.prisma.cart.findFirst({
        where: { sessionId },
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
          },
        },
      });

      if (!cart) {
        cart = await this.prisma.cart.create({
          data: { sessionId },
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
            },
          },
        });
      }

      return cart;
    }

    throw new BadRequestException('Either userId or sessionId is required');
  }

  /**
   * Get user's cart or guest cart
   */
  async getCart(userId?: string, sessionId?: string): Promise<CartResponseDto> {
    const cart = await this.getCartForUser(userId, sessionId);
    return this.toCartResponse(cart);
  }

  /**
   * Add item to cart
   */
  async addItem(
    dto: CreateCartItemDto,
    userId?: string,
    sessionId?: string,
  ): Promise<CartResponseDto> {
    // Verify product exists and is in stock
    const product = await this.prisma.product.findUnique({
      where: { id: dto.productId },
    });

    if (!product) {
      throw new NotFoundException(`Product ${dto.productId} not found`);
    }

    if (product.status === 'OUT_OF_STOCK') {
      throw new BadRequestException('Product is out of stock');
    }

    // Check stock availability
    const currentStock = product.stock;
    if (dto.quantity > currentStock) {
      throw new BadRequestException(
        `Only ${currentStock} items available in stock`,
      );
    }

    const cart = await this.getCartForUser(userId, sessionId);

    // Check if item already exists in cart
    const existingItem = cart.items.find(
      (item) =>
        item.productId === dto.productId &&
        (item.color || null) === (dto.color || null) &&
        (item.size || null) === (dto.size || null),
    );

    if (existingItem) {
      // Update quantity if item exists
      const newQuantity = existingItem.quantity + dto.quantity;
      if (newQuantity > currentStock) {
        throw new BadRequestException(
          `Only ${currentStock} items available in stock`,
        );
      }

      await this.prisma.cartItem.update({
        where: { id: existingItem.id },
        data: {
          quantity: newQuantity,
          unitPrice: product.price,
        },
      });
    } else {
      // Add new item to cart
      await this.prisma.cartItem.create({
        data: {
          cartId: cart.id,
          productId: dto.productId,
          quantity: dto.quantity,
          unitPrice: product.price,
          color: dto.color,
          size: dto.size,
        },
      });
    }

    // Return updated cart
    const updatedCart = await this.prisma.cart.findUnique({
      where: { id: cart.id },
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
        },
      },
    });

    return this.toCartResponse(updatedCart!);
  }

  /**
   * Update cart item quantity
   */
  async updateItem(
    itemId: string,
    dto: UpdateCartItemDto,
    userId?: string,
    sessionId?: string,
  ): Promise<CartResponseDto> {
    const cart = await this.getCartForUser(userId, sessionId);

    // Verify item belongs to user's cart
    const cartItem = await this.prisma.cartItem.findUnique({
      where: { id: itemId },
      include: { product: true },
    });

    if (!cartItem) {
      throw new NotFoundException(`Cart item ${itemId} not found`);
    }

    if (cartItem.cartId !== cart.id) {
      throw new UnauthorizedException('Item does not belong to your cart');
    }

    // Check stock availability
    if (dto.quantity > cartItem.product.stock) {
      throw new BadRequestException(
        `Only ${cartItem.product.stock} items available in stock`,
      );
    }

    // Update quantity
    await this.prisma.cartItem.update({
      where: { id: itemId },
      data: { quantity: dto.quantity },
    });

    // Return updated cart
    const updatedCart = await this.prisma.cart.findUnique({
      where: { id: cart.id },
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
        },
      },
    });

    return this.toCartResponse(updatedCart!);
  }

  /**
   * Remove item from cart
   */
  async removeItem(
    itemId: string,
    userId?: string,
    sessionId?: string,
  ): Promise<CartResponseDto> {
    const cart = await this.getCartForUser(userId, sessionId);

    // Verify item belongs to user's cart
    const cartItem = await this.prisma.cartItem.findUnique({
      where: { id: itemId },
    });

    if (!cartItem) {
      throw new NotFoundException(`Cart item ${itemId} not found`);
    }

    if (cartItem.cartId !== cart.id) {
      throw new UnauthorizedException('Item does not belong to your cart');
    }

    // Delete item
    await this.prisma.cartItem.delete({
      where: { id: itemId },
    });

    // Return updated cart
    const updatedCart = await this.prisma.cart.findUnique({
      where: { id: cart.id },
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
        },
      },
    });

    return this.toCartResponse(updatedCart!);
  }

  /**
   * Clear entire cart
   */
  async clearCart(userId?: string, sessionId?: string): Promise<void> {
    const cart = await this.getCartForUser(userId, sessionId);

    await this.prisma.cartItem.deleteMany({
      where: { cartId: cart.id },
    });
  }

  /**
   * Get cart item count
   */
  async getCartCount(userId?: string, sessionId?: string): Promise<CartCountResponseDto> {
    try {
      const cart = await this.getCartForUser(userId, sessionId);
      const count = cart.items.reduce((sum, item) => sum + item.quantity, 0);
      return { count };
    } catch {
      return { count: 0 };
    }
  }

  /**
   * Merge guest cart into user cart after login
   */
  async mergeGuestCart(
    userId: string,
    sessionId: string,
  ): Promise<CartResponseDto> {
    // Get both carts
    const userCart = await this.getCartForUser(userId);
    const guestCart = await this.prisma.cart.findFirst({
      where: { sessionId },
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
        },
      },
    });

    if (!guestCart || guestCart.items.length === 0) {
      return this.toCartResponse(userCart);
    }

    // Merge items from guest cart to user cart
    for (const guestItem of guestCart.items) {
      const existingItem = userCart.items.find(
        (item) =>
          item.productId === guestItem.productId &&
          (item.color || null) === (guestItem.color || null) &&
          (item.size || null) === (guestItem.size || null),
      );

      if (existingItem) {
        // Update quantity if item exists
        const product = await this.prisma.product.findUnique({
          where: { id: guestItem.productId },
        });

        if (product) {
          const newQuantity = existingItem.quantity + guestItem.quantity;
          const finalQuantity = Math.min(newQuantity, product.stock);

          await this.prisma.cartItem.update({
            where: { id: existingItem.id },
            data: {
              quantity: finalQuantity,
              unitPrice: product.price,
            },
          });
        }
      } else {
        // Add item to user cart
        await this.prisma.cartItem.create({
          data: {
            cartId: userCart.id,
            productId: guestItem.productId,
            quantity: guestItem.quantity,
            unitPrice: guestItem.unitPrice,
            color: guestItem.color,
            size: guestItem.size,
          },
        });
      }
    }

    // Delete guest cart
    await this.prisma.cart.delete({
      where: { id: guestCart.id },
    });

    // Return merged cart
    const mergedCart = await this.prisma.cart.findUnique({
      where: { id: userCart.id },
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
        },
      },
    });

    return this.toCartResponse(mergedCart!);
  }

  /**
   * Calculate cart totals
   */
  private calculateTotals(cart: any): CartTotals {
    const totalItems = cart.items.reduce((sum: number, item: any) => sum + item.quantity, 0);

    // Calculate subtotal using sale price (with discounts applied)
    const subtotal = cart.items.reduce(
      (sum: number, item: any) => {
        const product = item.product;
        const salePrice = this.calculateSalePrice(product);
        return sum + salePrice * item.quantity;
      },
      0,
    );

    // Free shipping for orders over €100
    const shipping = subtotal >= 100 ? 0 : 10;

    // 8.5% tax
    const tax = subtotal * 0.085;

    const total = subtotal + shipping + tax;

    return {
      totalItems,
      subtotal,
      shipping,
      tax,
      total,
    };
  }

  /**
   * Convert cart to response DTO
   */
  private toCartResponse(cart: any): CartResponseDto {
    const totals = this.calculateTotals(cart);

    return {
      id: cart.id,
      items: cart.items.map((item: any) => this.toCartItemResponse(item)),
      ...totals,
      createdAt: cart.createdAt.toISOString(),
      updatedAt: cart.updatedAt.toISOString(),
    };
  }

  /**
   * Convert cart item to response DTO
   */
  private toCartItemResponse(item: any): CartItemResponseDto {
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
      quantity: item.quantity,
      unitPrice: Number(item.unitPrice),
      color: item.color || undefined,
      size: item.size || undefined,
      inStock: product.status !== 'OUT_OF_STOCK',
      lowStock: product.status === 'LOW_STOCK',
      stock: product.stock,
    };
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
}
