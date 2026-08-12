import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Headers,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { Public } from '../common/decorators/public.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard';
import { CurrentTenant } from '../tenancy/decorators/current-tenant.decorator';
import { CartService } from './cart.service';
import {
  CreateCartItemDto,
  UpdateCartItemDto,
  CartResponseDto,
} from './dto/cart-item.dto';
import { CartCountResponseDto, MergeCartDto } from './dto/cart.dto';

/**
 * The cart serves guests and signed-in users from the same routes.
 *
 * `@Public()` keeps the global JwtAuthGuard from rejecting anonymous callers,
 * and `OptionalJwtAuthGuard` attaches `req.user` when a token *is* present.
 * Passing that id down is what binds a cart to an account: without it every
 * request falls back to the `x-session-id` guest cart, so a signed-in user's
 * cart would live only in their current browser and vanish on logout or on a
 * second device.
 *
 * `userId` deliberately wins over `sessionId` in the service, so a signed-in
 * caller always operates on their own cart even if a stale guest session id is
 * still being sent by the client.
 */
@ApiTags('cart')
@Controller('cart')
@UseGuards(OptionalJwtAuthGuard)
export class CartController {
  constructor(private readonly cartService: CartService) {}

  /**
   * Get cart for authenticated user or guest session
   */
  @Get()
  @Public()
  @ApiOperation({ summary: 'Get user cart or guest cart' })
  async getCart(
    @CurrentTenant('id') tenantId: string,
    @CurrentUser('id') userId?: string,
    @Headers('x-session-id') sessionId?: string,
  ): Promise<CartResponseDto> {
    return this.cartService.getCart(tenantId, userId, sessionId);
  }

  /**
   * Get cart item count
   *
   * Declared before `@Get(':id')`-style routes would be — Nest matches in
   * declaration order, so a literal path must precede any parameterised one.
   */
  @Get('count')
  @Public()
  @ApiOperation({ summary: 'Get cart item count' })
  async getCartCount(
    @CurrentTenant('id') tenantId: string,
    @CurrentUser('id') userId?: string,
    @Headers('x-session-id') sessionId?: string,
  ): Promise<CartCountResponseDto> {
    return this.cartService.getCartCount(tenantId, userId, sessionId);
  }

  /**
   * Add item to cart
   */
  @Post('items')
  @Public()
  @ApiOperation({ summary: 'Add item to cart' })
  async addItem(
    @CurrentTenant('id') tenantId: string,
    @Body() dto: CreateCartItemDto,
    @CurrentUser('id') userId?: string,
    @Headers('x-session-id') sessionId?: string,
  ): Promise<CartResponseDto> {
    return this.cartService.addItem(tenantId, dto, userId, sessionId);
  }

  /**
   * Update cart item quantity
   */
  @Patch('items/:id')
  @Public()
  @ApiOperation({ summary: 'Update cart item quantity' })
  async updateItem(
    @CurrentTenant('id') tenantId: string,
    @Param('id') id: string,
    @Body() dto: UpdateCartItemDto,
    @CurrentUser('id') userId?: string,
    @Headers('x-session-id') sessionId?: string,
  ): Promise<CartResponseDto> {
    return this.cartService.updateItem(tenantId, id, dto, userId, sessionId);
  }

  /**
   * Remove item from cart
   */
  @Delete('items/:id')
  @Public()
  @ApiOperation({ summary: 'Remove item from cart' })
  async removeItem(
    @CurrentTenant('id') tenantId: string,
    @Param('id') id: string,
    @CurrentUser('id') userId?: string,
    @Headers('x-session-id') sessionId?: string,
  ): Promise<CartResponseDto> {
    return this.cartService.removeItem(tenantId, id, userId, sessionId);
  }

  /**
   * Clear entire cart
   */
  @Delete()
  @Public()
  @ApiOperation({ summary: 'Clear cart' })
  async clearCart(
    @CurrentTenant('id') tenantId: string,
    @CurrentUser('id') userId?: string,
    @Headers('x-session-id') sessionId?: string,
  ): Promise<{ message: string }> {
    await this.cartService.clearCart(tenantId, userId, sessionId);
    return { message: 'Cart cleared successfully' };
  }

  /**
   * Merge a guest cart into the signed-in user's cart after login.
   *
   * NOT `@Public()`: the target account is taken from the verified access token.
   * It used to be read from an `x-user-id` header, which let any caller merge a
   * cart into an arbitrary account.
   */
  @Post('merge')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Merge guest cart into user cart' })
  async mergeGuestCart(
    @CurrentTenant('id') tenantId: string,
    @Body() dto: MergeCartDto,
    @CurrentUser('id') userId: string,
  ): Promise<CartResponseDto> {
    return this.cartService.mergeGuestCart(tenantId, userId, dto.sessionId);
  }
}
