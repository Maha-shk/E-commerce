import { Body, Controller, Get, Param, Patch, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ADMIN_ROLES, WRITE_ROLES } from '../common/constants/roles.constants';
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
  findAll(@Query() query: InventoryQueryDto) {
    return this.inventory.findAll(query);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Aggregate inventory figures for the stat cards' })
  stats() {
    return this.inventory.stats();
  }

  @Get(':productId/history')
  @ApiOperation({ summary: 'Stock adjustment history for a product' })
  history(
    @Param('productId') productId: string,
    @Query() query: InventoryQueryDto,
  ) {
    return this.inventory.history(productId, query);
  }

  @Patch(':productId/adjust')
  @Roles(...WRITE_ROLES)
  @ApiOperation({ summary: 'Adjust stock (relative `delta` or absolute `setTo`)' })
  adjust(
    @Param('productId') productId: string,
    @Body() dto: AdjustStockDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.inventory.adjust(productId, dto, userId);
  }
}
