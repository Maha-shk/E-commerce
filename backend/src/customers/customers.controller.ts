import { Body, Controller, Get, Param, Patch, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Roles } from '../common/decorators/roles.decorator';
import { ADMIN_ROLES, WRITE_ROLES } from '../common/constants/roles.constants';
import { CurrentTenant } from '../tenancy/decorators/current-tenant.decorator';
import { CustomersService } from './customers.service';
import { CustomerQueryDto, UpdateCustomerDto } from './dto/customer.dto';

@ApiTags('admin/customers')
@ApiBearerAuth()
@Controller('admin/customers')
@Roles(...ADMIN_ROLES)
export class CustomersController {
  constructor(private readonly customers: CustomersService) {}

  @Get()
  @ApiOperation({ summary: 'List customers with order totals (paginated)' })
  findAll(
    @CurrentTenant('id') tenantId: string,
    @Query() query: CustomerQueryDto,
  ) {
    return this.customers.findAll(tenantId, query);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Customer counts by status' })
  stats(@CurrentTenant('id') tenantId: string) {
    return this.customers.stats(tenantId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Customer detail with recent order history' })
  findOne(@CurrentTenant('id') tenantId: string, @Param('id') id: string) {
    return this.customers.findOne(tenantId, id);
  }

  @Patch(':id')
  @Roles(...WRITE_ROLES)
  @ApiOperation({ summary: 'Update a customer (details, status, address)' })
  update(
    @CurrentTenant('id') tenantId: string,
    @Param('id') id: string,
    @Body() dto: UpdateCustomerDto,
  ) {
    return this.customers.update(tenantId, id, dto);
  }
}
