import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { BannerType } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';

export class CreateBannerDto {
  @ApiProperty({ enum: BannerType, example: BannerType.HERO })
  @IsEnum(BannerType, { message: 'type must be HERO, PROMOTIONAL or SIDEBAR' })
  type!: BannerType;

  @ApiProperty({ example: 'Summer Sale' })
  @IsString()
  @IsNotEmpty({ message: 'Title is required' })
  @MaxLength(200)
  title!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiProperty({ description: 'Desktop artwork URL' })
  @IsString()
  @IsNotEmpty({ message: 'Image URL is required' })
  @MaxLength(2048)
  imageUrl!: string;

  @ApiPropertyOptional({ description: 'Optional narrower crop for small screens' })
  @IsOptional()
  @IsString()
  @MaxLength(2048)
  mobileImageUrl?: string;

  @ApiPropertyOptional({ example: '/products' })
  @IsOptional()
  @IsString()
  @MaxLength(2048)
  linkUrl?: string;

  @ApiPropertyOptional({ example: 'Shop Now' })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  linkText?: string;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({
    default: 0,
    description: 'Lower sorts first; the storefront hero takes the first entry.',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  displayOrder?: number;

  @ApiPropertyOptional({ description: 'ISO date; before this the banner is hidden' })
  @IsOptional()
  @IsDateString({}, { message: 'startDate must be an ISO date string' })
  startDate?: string;

  @ApiPropertyOptional({ description: 'ISO date; after this the banner is hidden' })
  @IsOptional()
  @IsDateString({}, { message: 'endDate must be an ISO date string' })
  endDate?: string;
}

/** Every field optional — a PATCH may carry a single property. */
export class UpdateBannerDto extends PartialType(CreateBannerDto) {}

export class BannerQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ enum: BannerType })
  @IsOptional()
  @IsEnum(BannerType)
  type?: BannerType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  isActive?: boolean;
}

/** Body for the drag-to-reorder action: the ids in their new order. */
export class ReorderBannersDto {
  @ApiProperty({ type: [String], description: 'Banner ids, first = shown first' })
  @IsArray()
  @ArrayMinSize(1, { message: 'Provide at least one banner id' })
  @IsString({ each: true })
  ids!: string[];
}
