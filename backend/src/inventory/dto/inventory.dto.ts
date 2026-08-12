import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { StockStatus } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, MaxLength } from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';

export class InventoryQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ description: 'Only stock for this model' })
  @IsString()
  @IsOptional()
  modelId?: string;

  @ApiPropertyOptional({ description: 'Everything under this product type' })
  @IsString()
  @IsOptional()
  productTypeId?: string;

  @ApiPropertyOptional({ description: 'Everything under this company' })
  @IsString()
  @IsOptional()
  companyId?: string;

  @ApiPropertyOptional({ description: 'Everything under this category' })
  @IsString()
  @IsOptional()
  categoryId?: string;

  @ApiPropertyOptional({ enum: StockStatus })
  @IsEnum(StockStatus)
  @IsOptional()
  status?: StockStatus;
}

export class AdjustStockDto {
  @ApiPropertyOptional({
    description:
      'Relative change, e.g. -5 or 20. Provide either `delta` or `setTo`.',
  })
  @Type(() => Number)
  @IsInt()
  @IsOptional()
  delta?: number;

  @ApiPropertyOptional({ description: 'Absolute new stock level (>= 0).' })
  @Type(() => Number)
  @IsInt()
  @IsOptional()
  setTo?: number;

  @ApiProperty({ example: 'Stock count correction' })
  @IsString()
  @IsOptional()
  @MaxLength(300)
  reason?: string;
}
