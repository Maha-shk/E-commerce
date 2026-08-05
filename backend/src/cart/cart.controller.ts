import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Headers,
} from '@nestjs/common';
import { ApiOperation, ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { Public } from '../common/decorators/public.decorator';
import { CartService } from './cart.service';
import {
  CreateCartItemDto,
  UpdateCartItemDto,
  CartResponseDto,
} from './dto/cart-item.dto';
import { CartCountResponseDto } from './dto/cart.dto';
@ApiTags('cart')
@Controller('cart')
export class CartController {
  constructor(private readonly cartService: CartService) {}

  /**
   * Get cart for authenticated user or guest session
   */
  @Get()
  @Public()
  @ApiOperation({ summary: 'Get user cart or guest cart' })
  async getCart(
    @Headers('x-session-id') sessionId?: string,
  ): Promise<CartResponseDto> {
    // In a real implementation, you'd get userId from JWT token
    // For now, we'll support guest carts via sessionId
    return this.cartService.getCart(undefined, sessionId);
  }

  /**
   * Add item to cart
   */
  @Post('items')
  @Public()
  @ApiOperation({ summary: 'Add item to cart' })
  async addItem(
    @Body() dto: CreateCartItemDto,
    @Headers('x-session-id') sessionId?: string,
  ): Promise<CartResponseDto> {
    return this.cartService.addItem(dto, undefined, sessionId);
  }

  /**
   * Update cart item quantity
   */
  @Patch('items/:id')
  @Public()
  @ApiOperation({ summary: 'Update cart item quantity' })
  async updateItem(
    @Param('id') id: string,
    @Body() dto: UpdateCartItemDto,
    @Headers('x-session-id') sessionId?: string,
  ): Promise<CartResponseDto> {
    return this.cartService.updateItem(id, dto, undefined, sessionId);
  }

  /**
   * Remove item from cart
   */
  @Delete('items/:id')
  @Public()
  @ApiOperation({ summary: 'Remove item from cart' })
  async removeItem(
    @Param('id') id: string,
    @Headers('x-session-id') sessionId?: string,
  ): Promise<CartResponseDto> {
    return this.cartService.removeItem(id, undefined, sessionId);
  }

  /**
   * Clear entire cart
   */
  @Delete()
  @Public()
  @ApiOperation({ summary: 'Clear cart' })
  async clearCart(
    @Headers('x-session-id') sessionId?: string,
  ): Promise<{ message: string }> {
    await this.cartService.clearCart(undefined, sessionId);
    return { message: 'Cart cleared successfully' };
  }

  /**
   * Get cart item count
   */
  @Get('count')
  @Public()
  @ApiOperation({ summary: 'Get cart item count' })
  async getCartCount(
    @Headers('x-session-id') sessionId?: string,
  ): Promise<CartCountResponseDto> {
    return this.cartService.getCartCount(undefined, sessionId);
  }

  /**
   * Merge guest cart into user cart after login
   */
  @Post('merge')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Merge guest cart into user cart' })
  async mergeGuestCart(
    @Body() dto: { sessionId: string },
    // In real implementation, userId would come from JWT
    @Headers('x-user-id') userId?: string,
  ): Promise<CartResponseDto> {
    if (!userId) {
      throw new Error('User authentication required');
    }
    return this.cartService.mergeGuestCart(userId, dto.sessionId);
  }
}
