import { Controller, Get, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Roles } from '../common/decorators/roles.decorator';
import { ADMIN_ROLES } from '../common/constants/roles.constants';
import { CurrentTenant } from '../tenancy/decorators/current-tenant.decorator';
import { ReportsService } from './reports.service';
import { ReportQueryDto } from './dto/report.dto';

@ApiTags('admin/reports')
@ApiBearerAuth()
@Controller('admin/reports')
@Roles(...ADMIN_ROLES)
export class ReportsController {
  constructor(private readonly reports: ReportsService) {}

  @Get()
  @ApiOperation({
    summary: 'Build a report view (orders | sales | products) for a date window',
  })
  build(
    @CurrentTenant('id') tenantId: string,
    @Query() query: ReportQueryDto,
  ) {
    return this.reports.build(tenantId, query);
  }
}
