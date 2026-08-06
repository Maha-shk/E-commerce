import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
} from '@nestjs/common';
import { ApiOperation, ApiTags, ApiBearerAuth } from '@nestjs/swagger';
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
  async getWishlist(@CurrentUser('id') userId: string): Promise<WishlistResponseDto> {
    return this.wishlistService.getWishlist(userId);
  }

  /**
   * Add product to wishlist
   */
  @Post('items')
  @ApiOperation({ summary: 'Add product to wishlist' })
  async addItem(
    @CurrentUser('id') userId: string,
    @Body() dto: AddToWishlistDto,
  ): Promise<WishlistResponseDto> {
    return this.wishlistService.addItem(userId, dto);
  }

  /**
   * Remove item from wishlist
   */
  @Delete('items/:id')
  @ApiOperation({ summary: 'Remove item from wishlist' })
  async removeItem(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
  ): Promise<WishlistResponseDto> {
    return this.wishlistService.removeItem(userId, id);
  }

  /**
   * Clear entire wishlist
   */
  @Delete()
  @ApiOperation({ summary: 'Clear entire wishlist' })
  async clearWishlist(@CurrentUser('id') userId: string): Promise<WishlistResponseDto> {
    return this.wishlistService.clearWishlist(userId);
  }

  /**
   * Get wishlist item count
   */
  @Get('count')
  @ApiOperation({ summary: 'Get wishlist item count' })
  async getWishlistCount(@CurrentUser('id') userId: string): Promise<{ count: number }> {
    return this.wishlistService.getWishlistCount(userId);
  }
}