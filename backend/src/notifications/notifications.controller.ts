import {
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ADMIN_ROLES } from '../common/constants/roles.constants';
import { CurrentTenant } from '../tenancy/decorators/current-tenant.decorator';
import { NotificationsService } from './notifications.service';
import { NotificationQueryDto } from './dto/notification.dto';

@ApiTags('admin/notifications')
@ApiBearerAuth()
@Controller('admin/notifications')
@Roles(...ADMIN_ROLES)
export class NotificationsController {
  constructor(private readonly notifications: NotificationsService) {}

  @Get()
  @ApiOperation({ summary: 'List notifications (paginated, filterable)' })
  findAll(
    @CurrentTenant('id') tenantId: string,
    @CurrentUser('id') userId: string,
    @Query() query: NotificationQueryDto,
  ) {
    return this.notifications.findAll(tenantId, userId, query);
  }

  @Get('grouped')
  @ApiOperation({ summary: 'Notifications bucketed into Today/Yesterday/Earlier' })
  grouped(
    @CurrentTenant('id') tenantId: string,
    @CurrentUser('id') userId: string,
    @Query() query: NotificationQueryDto,
  ) {
    return this.notifications.grouped(tenantId, userId, query);
  }

  @Get('unread-count')
  @ApiOperation({ summary: 'Number of unread notifications' })
  unreadCount(
    @CurrentTenant('id') tenantId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.notifications.unreadCount(tenantId, userId);
  }

  @Patch('read-all')
  @ApiOperation({ summary: 'Mark every notification as read' })
  markAllRead(
    @CurrentTenant('id') tenantId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.notifications.markAllRead(tenantId, userId);
  }

  @Patch(':id/read')
  @ApiOperation({ summary: 'Mark one notification as read' })
  markRead(
    @CurrentTenant('id') tenantId: string,
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
  ) {
    return this.notifications.markRead(tenantId, userId, id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a notification' })
  remove(
    @CurrentTenant('id') tenantId: string,
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
  ) {
    return this.notifications.remove(tenantId, userId, id);
  }
}
