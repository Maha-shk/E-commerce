import { Controller, Get, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';
import { Roles } from '../common/decorators/roles.decorator';
import { ADMIN_ROLES } from '../common/constants/roles.constants';
import { DashboardService } from './dashboard.service';

class RangeQueryDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(24)
  @IsOptional()
  months = 6;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  @IsOptional()
  limit = 5;
}

@ApiTags('admin/dashboard')
@ApiBearerAuth()
@Controller('admin/dashboard')
@Roles(...ADMIN_ROLES)
export class DashboardController {
  constructor(private readonly dashboard: DashboardService) {}

  @Get('stats')
  @ApiOperation({ summary: 'Headline metrics for the dashboard stat cards' })
  stats() {
    return this.dashboard.stats();
  }

  @Get('monthly-performance')
  @ApiQuery({ name: 'months', required: false })
  @ApiOperation({ summary: 'Revenue and order counts per month' })
  monthly(@Query() query: RangeQueryDto) {
    return this.dashboard.monthlyPerformance(query.months);
  }

  @Get('recent-orders')
  @ApiQuery({ name: 'limit', required: false })
  @ApiOperation({ summary: 'Most recent orders' })
  recentOrders(@Query() query: RangeQueryDto) {
    return this.dashboard.recentOrders(query.limit);
  }

  @Get('top-products')
  @ApiQuery({ name: 'limit', required: false })
  @ApiOperation({ summary: 'Best selling products by units sold' })
  topProducts(@Query() query: RangeQueryDto) {
    return this.dashboard.topProducts(query.limit);
  }
}
