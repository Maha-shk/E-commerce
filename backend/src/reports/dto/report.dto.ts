import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsOptional, IsString } from 'class-validator';

export enum ReportTab {
  ORDERS = 'orders',
  SALES = 'sales',
  PRODUCTS = 'products',
}

export class ReportQueryDto {
  @ApiPropertyOptional({
    enum: ReportTab,
    default: ReportTab.ORDERS,
    description: 'Which report view to build',
  })
  @IsEnum(ReportTab)
  @IsOptional()
  tab: ReportTab = ReportTab.ORDERS;

  @ApiPropertyOptional({ description: 'Start of the reporting window (ISO)' })
  @IsDateString()
  @IsOptional()
  from?: string;

  @ApiPropertyOptional({ description: 'End of the reporting window (ISO)' })
  @IsDateString()
  @IsOptional()
  to?: string;

  @ApiPropertyOptional({ description: 'Filter rows by category name' })
  @IsString()
  @IsOptional()
  category?: string;
}
