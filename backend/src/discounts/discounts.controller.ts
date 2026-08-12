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
import { ADMIN_ROLES, WRITE_ROLES } from '../common/constants/roles.constants';
import { CurrentTenant } from '../tenancy/decorators/current-tenant.decorator';
import { DiscountsService } from './discounts.service';
import {
  CreateDiscountDto,
  DiscountQueryDto,
  UpdateDiscountDto,
} from './dto/discount.dto';

@ApiTags('admin/discounts')
@ApiBearerAuth()
@Controller('admin/discounts')
@Roles(...ADMIN_ROLES)
export class DiscountsController {
  constructor(private readonly discounts: DiscountsService) {}

  @Get()
  @ApiOperation({ summary: 'List discount campaigns (paginated, filterable)' })
  findAll(
    @CurrentTenant('id') tenantId: string,
    @Query() query: DiscountQueryDto,
  ) {
    return this.discounts.findAll(tenantId, query);
  }

  @Get('validate/:code')
  @ApiOperation({ summary: 'Check whether a discount code is currently usable' })
  validate(
    @CurrentTenant('id') tenantId: string,
    @Param('code') code: string,
  ) {
    return this.discounts.validateCode(tenantId, code);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single discount' })
  findOne(@CurrentTenant('id') tenantId: string, @Param('id') id: string) {
    return this.discounts.findOne(tenantId, id);
  }

  @Post()
  @Roles(...WRITE_ROLES)
  @ApiOperation({ summary: 'Create a discount campaign' })
  create(
    @CurrentTenant('id') tenantId: string,
    @Body() dto: CreateDiscountDto,
  ) {
    return this.discounts.create(tenantId, dto);
  }

  @Patch(':id')
  @Roles(...WRITE_ROLES)
  @ApiOperation({ summary: 'Update a discount campaign' })
  update(
    @CurrentTenant('id') tenantId: string,
    @Param('id') id: string,
    @Body() dto: UpdateDiscountDto,
  ) {
    return this.discounts.update(tenantId, id, dto);
  }

  @Delete(':id')
  @Roles(...WRITE_ROLES)
  @ApiOperation({ summary: 'Delete a discount campaign' })
  remove(@CurrentTenant('id') tenantId: string, @Param('id') id: string) {
    return this.discounts.remove(tenantId, id);
  }
}
