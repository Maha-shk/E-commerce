import { Body, Controller, Get, Param, Patch, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Roles } from '../common/decorators/roles.decorator';
import { ADMIN_ROLES, WRITE_ROLES } from '../common/constants/roles.constants';
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
  findAll(@Query() query: CustomerQueryDto) {
    return this.customers.findAll(query);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Customer counts by status' })
  stats() {
    return this.customers.stats();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Customer detail with recent order history' })
  findOne(@Param('id') id: string) {
    return this.customers.findOne(id);
  }

  @Patch(':id')
  @Roles(...WRITE_ROLES)
  @ApiOperation({ summary: 'Update a customer (details, status, address)' })
  update(@Param('id') id: string, @Body() dto: UpdateCustomerDto) {
    return this.customers.update(id, dto);
  }
}
