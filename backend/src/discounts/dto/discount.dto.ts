import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { DiscountCategory, DiscountType } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsDateString,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';

export class CreateDiscountDto {
  @ApiProperty({ example: 'Summer Solstice Sale' })
  @IsString()
  @MinLength(2)
  @MaxLength(150)
  name!: string;

  @ApiProperty({ example: 'SUMMER24', description: 'Redeemed at checkout' })
  @IsString()
  @MinLength(3)
  @MaxLength(40)
  @Matches(/^[A-Za-z0-9_-]+$/, {
    message: 'Code may only contain letters, numbers, hyphens and underscores',
  })
  code!: string;

  @ApiProperty({ enum: DiscountType })
  @IsEnum(DiscountType)
  type!: DiscountType;

  @ApiProperty({
    example: 20,
    description: 'Percentage (0-100) or a fixed euro amount, per `type`',
  })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  value!: number;

  @ApiPropertyOptional({ default: 0, description: '0 means unlimited' })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @IsOptional()
  usageLimit?: number;

  @ApiProperty({ description: 'ISO date the campaign starts' })
  @IsDateString()
  startDate!: string;

  @ApiProperty({ description: 'ISO date the campaign ends' })
  @IsDateString()
  endDate!: string;

  @ApiPropertyOptional({ description: 'Icon key rendered by the frontend' })
  @IsString()
  @IsOptional()
  icon?: string;

  @ApiPropertyOptional({ enum: DiscountCategory })
  @IsEnum(DiscountCategory)
  @IsOptional()
  category?: DiscountCategory;
}

export class UpdateDiscountDto extends PartialType(CreateDiscountDto) {}

export class DiscountQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    enum: DiscountCategory,
    description: 'Active / Scheduled / Archived tab',
  })
  @IsEnum(DiscountCategory)
  @IsOptional()
  category?: DiscountCategory;

  @ApiPropertyOptional({ enum: DiscountType })
  @IsEnum(DiscountType)
  @IsOptional()
  type?: DiscountType;
}
