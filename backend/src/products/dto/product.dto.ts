import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { ProductVisibility, StockStatus } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsDateString,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';

export class CreateProductDto {
  @ApiProperty({ example: 'LCD Display Assembly' })
  @IsString()
  @MinLength(2)
  @MaxLength(200)
  name!: string;

  @ApiProperty({
    description:
      'The Model this product belongs to. Required — a product cannot exist ' +
      'outside the Category → Company → Product Type → Model hierarchy. The ' +
      'model must belong to the calling store.',
  })
  @IsString()
  @MinLength(1)
  modelId!: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  @MaxLength(2000)
  description?: string;

  @ApiProperty({ example: 'SM-S25-LCD-BLK', description: 'Unique within the store' })
  @IsString()
  @MinLength(1)
  @MaxLength(60)
  sku!: string;

  @ApiPropertyOptional({ default: 0, description: 'Stock status is derived from this' })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @IsOptional()
  stock?: number;

  @ApiProperty({ example: 129.99 })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  price!: number;

  @ApiPropertyOptional({ example: 10, description: 'Discount percentage (0-100)' })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(100)
  @IsOptional()
  discount?: number;

  @ApiPropertyOptional({ enum: ProductVisibility })
  @IsEnum(ProductVisibility)
  @IsOptional()
  visibility?: ProductVisibility;

  @ApiPropertyOptional({ description: 'Go-live date when visibility is SCHEDULED' })
  @IsDateString()
  @IsOptional()
  scheduledDate?: string;

  @ApiPropertyOptional({ type: [String], example: ['NEW ARRIVAL'] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];

  @ApiPropertyOptional({ type: [String], description: 'Image URLs, in display order' })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  images?: string[];

  @ApiPropertyOptional({ type: [String], example: ['Standard', 'With Frame'] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  variants?: string[];

  @ApiPropertyOptional({ description: 'Per-unit value used for inventory valuation' })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @IsOptional()
  unitValue?: number;
}

/**
 * `modelId` is optional here: sending it moves the product to a different
 * Model, omitting it leaves the classification alone.
 */
export class UpdateProductDto extends PartialType(CreateProductDto) {}

export class ProductQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ description: 'Products of one model (the direct parent)' })
  @IsString()
  @IsOptional()
  modelId?: string;

  @ApiPropertyOptional({ description: 'Every product under a product type' })
  @IsString()
  @IsOptional()
  productTypeId?: string;

  @ApiPropertyOptional({ description: 'Every product under a company' })
  @IsString()
  @IsOptional()
  companyId?: string;

  @ApiPropertyOptional({ description: 'Every product under a category' })
  @IsString()
  @IsOptional()
  categoryId?: string;

  @ApiPropertyOptional({ enum: StockStatus })
  @IsEnum(StockStatus)
  @IsOptional()
  status?: StockStatus;

  @ApiPropertyOptional({ enum: ProductVisibility })
  @IsEnum(ProductVisibility)
  @IsOptional()
  visibility?: ProductVisibility;

  @ApiPropertyOptional({ enum: ['name', 'price', 'stock', 'createdAt'] })
  @IsEnum(['name', 'price', 'stock', 'createdAt'])
  @IsOptional()
  sortBy?: 'name' | 'price' | 'stock' | 'createdAt' = 'createdAt';

  @ApiPropertyOptional({ enum: ['asc', 'desc'] })
  @IsEnum(['asc', 'desc'])
  @IsOptional()
  sortOrder?: 'asc' | 'desc' = 'desc';
}
