import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
} from '@nestjs/common';
import { ApiOperation, ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { CurrentTenant } from '../tenancy/decorators/current-tenant.decorator';
import { WishlistService } from './wishlist.service';
import { AddToWishlistDto } from './dto/wishlist-item.dto';
import { WishlistResponseDto } from './dto/wishlist.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('wishlist')
@ApiBearerAuth()
@Controller('wishlist')
export class WishlistController {
  constructor(private readonly wishlistService: WishlistService) {}

  /**
   * Get user's wishlist
   */
  @Get()
  @ApiOperation({ summary: 'Get user wishlist' })
  async getWishlist(
    @CurrentTenant('id') tenantId: string,
    @CurrentUser('id') userId: string,
  ): Promise<WishlistResponseDto> {
    return this.wishlistService.getWishlist(tenantId, userId);
  }

  /**
   * Add product to wishlist
   */
  @Post('items')
  @ApiOperation({ summary: 'Add product to wishlist' })
  async addItem(
    @CurrentTenant('id') tenantId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: AddToWishlistDto,
  ): Promise<WishlistResponseDto> {
    return this.wishlistService.addItem(tenantId, userId, dto);
  }

  /**
   * Remove item from wishlist
   */
  @Delete('items/:id')
  @ApiOperation({ summary: 'Remove item from wishlist' })
  async removeItem(
    @CurrentTenant('id') tenantId: string,
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
  ): Promise<WishlistResponseDto> {
    return this.wishlistService.removeItem(tenantId, userId, id);
  }

  /**
   * Clear entire wishlist
   */
  @Delete()
  @ApiOperation({ summary: 'Clear entire wishlist' })
  async clearWishlist(
    @CurrentTenant('id') tenantId: string,
    @CurrentUser('id') userId: string,
  ): Promise<WishlistResponseDto> {
    return this.wishlistService.clearWishlist(tenantId, userId);
  }

  /**
   * Get wishlist item count
   */
  @Get('count')
  @ApiOperation({ summary: 'Get wishlist item count' })
  async getWishlistCount(
    @CurrentTenant('id') tenantId: string,
    @CurrentUser('id') userId: string,
  ): Promise<{ count: number }> {
    return this.wishlistService.getWishlistCount(tenantId, userId);
  }
}