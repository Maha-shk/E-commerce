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
  findAll(@Query() query: OrderQueryDto) {
    return this.orders.findAll(query);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Aggregate order figures' })
  stats() {
    return this.orders.stats();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get an order by id or order number' })
  findOne(@Param('id') id: string) {
    return this.orders.findOne(id);
  }

  @Post()
  @Roles(...WRITE_ROLES)
  @ApiOperation({ summary: 'Create an order' })
  create(@Body() dto: CreateOrderDto) {
    return this.orders.create(dto);
  }

  @Patch(':id/status')
  @Roles(...WRITE_ROLES)
  @ApiOperation({ summary: 'Update order/payment status or tracking number' })
  updateStatus(@Param('id') id: string, @Body() dto: UpdateOrderStatusDto) {
    return this.orders.updateStatus(id, dto);
  }

  @Delete(':id')
  @Roles(...OWNER_ROLES)
  @ApiOperation({ summary: 'Delete an order' })
  remove(@Param('id') id: string) {
    return this.orders.remove(id);
  }
}
