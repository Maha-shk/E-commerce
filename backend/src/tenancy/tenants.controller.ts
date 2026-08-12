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
import { Role } from '@prisma/client';
import { Roles } from '../common/decorators/roles.decorator';
import { PlatformScope } from './decorators/platform-scope.decorator';
import { TenantsService } from './tenants.service';
import {
  CreateTenantDto,
  TenantQueryDto,
  UpdateTenantDto,
} from './dto/tenant.dto';

/**
 * Tenant administration. Deliberately the only controller in the application
 * marked @PlatformScope, and restricted to SUPER_ADMIN: creating stores is a
 * platform operation, not something a store's own admin can do.
 */
@ApiTags('platform/tenants')
@ApiBearerAuth()
@Controller('platform/tenants')
@PlatformScope()
@Roles(Role.SUPER_ADMIN)
export class TenantsController {
  constructor(private readonly tenants: TenantsService) {}

  @Get()
  @ApiOperation({ summary: 'List tenants (paginated, searchable)' })
  findAll(@Query() query: TenantQueryDto) {
    return this.tenants.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single tenant' })
  findOne(@Param('id') id: string) {
    return this.tenants.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a tenant (store)' })
  create(@Body() dto: CreateTenantDto) {
    return this.tenants.create(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a tenant' })
  update(@Param('id') id: string, @Body() dto: UpdateTenantDto) {
    return this.tenants.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Delete a tenant and everything it owns',
    description: 'Requires ?confirm=<tenant slug> as an explicit acknowledgement.',
  })
  remove(@Param('id') id: string, @Query('confirm') confirm?: string) {
    return this.tenants.remove(id, confirm);
  }
}
