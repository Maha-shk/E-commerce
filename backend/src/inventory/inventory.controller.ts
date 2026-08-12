import { Body, Controller, Get, Param, Patch, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ADMIN_ROLES, WRITE_ROLES } from '../common/constants/roles.constants';
import { CurrentTenant } from '../tenancy/decorators/current-tenant.decorator';
import { InventoryService } from './inventory.service';
import { AdjustStockDto, InventoryQueryDto } from './dto/inventory.dto';

@ApiTags('admin/inventory')
@ApiBearerAuth()
@Controller('admin/inventory')
@Roles(...ADMIN_ROLES)
export class InventoryController {
  constructor(private readonly inventory: InventoryService) {}

  @Get()
  @ApiOperation({ summary: 'List inventory items (paginated, filterable)' })
  findAll(
    @CurrentTenant('id') tenantId: string,
    @Query() query: InventoryQueryDto,
  ) {
    return this.inventory.findAll(tenantId, query);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Aggregate inventory figures for the stat cards' })
  stats(@CurrentTenant('id') tenantId: string) {
    return this.inventory.stats(tenantId);
  }

  @Get(':productId/history')
  @ApiOperation({ summary: 'Stock adjustment history for a product' })
  history(
    @CurrentTenant('id') tenantId: string,
    @Param('productId') productId: string,
    @Query() query: InventoryQueryDto,
  ) {
    return this.inventory.history(tenantId, productId, query);
  }

  @Patch(':productId/adjust')
  @Roles(...WRITE_ROLES)
  @ApiOperation({ summary: 'Adjust stock (relative `delta` or absolute `setTo`)' })
  adjust(
    @CurrentTenant('id') tenantId: string,
    @Param('productId') productId: string,
    @Body() dto: AdjustStockDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.inventory.adjust(tenantId, productId, dto, userId);
  }
}
