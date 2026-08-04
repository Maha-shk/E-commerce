import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { CategoryStatus, CategoryVisibility } from '@prisma/client';
import {
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';

export class CreateCategoryDto {
  @ApiProperty({ example: 'Fashion & Apparel' })
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  name!: string;

  @ApiPropertyOptional({
    description: 'URL-safe identifier. Derived from the name when omitted.',
  })
  @IsString()
  @IsOptional()
  slug?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  @MaxLength(500)
  description?: string;

  @ApiPropertyOptional({ description: 'Icon key rendered by the frontend' })
  @IsString()
  @IsOptional()
  icon?: string;

  @ApiPropertyOptional({ enum: CategoryStatus })
  @IsEnum(CategoryStatus)
  @IsOptional()
  status?: CategoryStatus;

  @ApiPropertyOptional({ enum: CategoryVisibility })
  @IsEnum(CategoryVisibility)
  @IsOptional()
  visibility?: CategoryVisibility;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  thumbnailName?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  thumbnailSize?: string;
}

export class UpdateCategoryDto extends PartialType(CreateCategoryDto) {}

export class CategoryQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ enum: CategoryStatus })
  @IsEnum(CategoryStatus)
  @IsOptional()
  status?: CategoryStatus;

  @ApiPropertyOptional({ enum: CategoryVisibility })
  @IsEnum(CategoryVisibility)
  @IsOptional()
  visibility?: CategoryVisibility;
}
