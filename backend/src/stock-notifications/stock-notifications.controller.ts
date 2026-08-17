import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Roles } from '../common/decorators/roles.decorator';
import { ADMIN_ROLES } from '../common/constants/roles.constants';
import { Public } from '../common/decorators/public.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { CurrentTenant } from '../tenancy/decorators/current-tenant.decorator';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard';
import { UseGuards } from '@nestjs/common';
import { StockNotificationsService } from './stock-notifications.service';
import {
  StockNotificationQueryDto,
  SubscribeStockNotificationDto,
} from './dto/stock-notification.dto';
import type { AuthenticatedUser } from '../auth/types/jwt-payload.interface';

/**
 * Storefront side of the back-in-stock waiting list.
 *
 * Behind OptionalJwtAuthGuard so a signed-in shopper is recognised — their
 * account address is used and the row is linked to them — while a guest can
 * still leave an address.
 */
@ApiTags('public')
@Controller('public/products/:productId/notify-me')
@UseGuards(OptionalJwtAuthGuard)
export class PublicStockNotificationsController {
  constructor(private readonly stockNotifications: StockNotificationsService) {}

  @Post()
  @Public()
  @ApiOperation({
    summary: 'Ask to be emailed when an out-of-stock product returns',
    description:
      'Idempotent. 400 if the product is already in stock, since there would ' +
      'be nothing to wait for.',
  })
  subscribe(
    @CurrentTenant('id') tenantId: string,
    @Param('productId') productId: string,
    @Body() dto: SubscribeStockNotificationDto,
    @CurrentUser() user?: AuthenticatedUser,
  ) {
    const email = dto.email ?? user?.email;
    if (!email) {
      throw new BadRequestException(
        'An email address is required when you are not signed in',
      );
    }
    return this.stockNotifications.subscribe(tenantId, productId, email, user?.id);
  }

  @Get()
  @Public()
  @ApiOperation({
    summary: 'Whether an address is already waiting on this product',
    description: 'Lets the button render its state on load rather than guessing.',
  })
  status(
    @CurrentTenant('id') tenantId: string,
    @Param('productId') productId: string,
    @Query('email') email?: string,
    @CurrentUser() user?: AuthenticatedUser,
  ) {
    const target = email ?? user?.email;
    if (!target) return { waiting: false, since: null };
    return this.stockNotifications.status(tenantId, productId, target);
  }

  @Delete()
  @Public()
  @ApiOperation({ summary: 'Stop waiting for this product' })
  unsubscribe(
    @CurrentTenant('id') tenantId: string,
    @Param('productId') productId: string,
    @Query('email') email?: string,
    @CurrentUser() user?: AuthenticatedUser,
  ) {
    const target = email ?? user?.email;
    if (!target) {
      throw new BadRequestException('An email address is required');
    }
    return this.stockNotifications.unsubscribe(tenantId, productId, target);
  }
}

/** Admin view of who is waiting, and for what. */
@ApiTags('admin/stock-notifications')
@ApiBearerAuth()
@Controller('admin/stock-notifications')
@Roles(...ADMIN_ROLES)
export class AdminStockNotificationsController {
  constructor(private readonly stockNotifications: StockNotificationsService) {}

  @Get('demand')
  @ApiOperation({
    summary: 'Products with people waiting, most-wanted first',
    description: 'The restock priority list.',
  })
  demand(
    @CurrentTenant('id') tenantId: string,
    @Query('limit') limit?: number,
  ) {
    return this.stockNotifications.demand(tenantId, Number(limit) || 20);
  }

  @Get()
  @ApiOperation({ summary: 'Individual back-in-stock requests (paginated)' })
  findAll(
    @CurrentTenant('id') tenantId: string,
    @Query() query: StockNotificationQueryDto,
  ) {
    return this.stockNotifications.findAll(tenantId, query);
  }
}
