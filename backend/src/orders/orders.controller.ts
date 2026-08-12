import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Roles } from '../common/decorators/roles.decorator';
import {
  ADMIN_ROLES,
  OWNER_ROLES,
  WRITE_ROLES,
} from '../common/constants/roles.constants';
import { CurrentTenant } from '../tenancy/decorators/current-tenant.decorator';
import { OrdersService } from './orders.service';
import {
  CreateOrderDto,
  OrderQueryDto,
  UpdateOrderStatusDto,
} from './dto/order.dto';

@ApiTags('admin/orders')
@ApiBearerAuth()
@Controller('admin/orders')
@Roles(...ADMIN_ROLES)
export class OrdersController {
  constructor(private readonly orders: OrdersService) {}

  @Get()
  @ApiOperation({ summary: 'List orders (paginated, filterable by status/date)' })
  findAll(
    @CurrentTenant('id') tenantId: string,
    @Query() query: OrderQueryDto,
  ) {
    return this.orders.findAll(tenantId, query);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Aggregate order figures' })
  stats(@CurrentTenant('id') tenantId: string) {
    return this.orders.stats(tenantId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get an order by id or order number' })
  findOne(@CurrentTenant('id') tenantId: string, @Param('id') id: string) {
    return this.orders.findOne(tenantId, id);
  }

  @Post()
  @Roles(...WRITE_ROLES)
  @ApiOperation({ summary: 'Create an order' })
  create(
    @CurrentTenant('id') tenantId: string,
    @Body() dto: CreateOrderDto,
  ) {
    return this.orders.create(tenantId, dto);
  }

  @Patch(':id/status')
  @Roles(...WRITE_ROLES)
  @ApiOperation({ summary: 'Update order/payment status or tracking number' })
  updateStatus(
    @CurrentTenant('id') tenantId: string,
    @Param('id') id: string,
    @Body() dto: UpdateOrderStatusDto,
  ) {
    return this.orders.updateStatus(tenantId, id, dto);
  }

  @Delete(':id')
  @Roles(...OWNER_ROLES)
  @ApiOperation({ summary: 'Delete an order' })
  remove(@CurrentTenant('id') tenantId: string, @Param('id') id: string) {
    return this.orders.remove(tenantId, id);
  }
}
