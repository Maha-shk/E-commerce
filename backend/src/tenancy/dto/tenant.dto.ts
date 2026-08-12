import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { TenantStatus } from '@prisma/client';
import {
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';

export class CreateTenantDto {
  @ApiProperty({ example: 'Utopya Spare Parts' })
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  name!: string;

  @ApiPropertyOptional({
    description: 'URL-safe identifier. Derived from the name when omitted.',
    example: 'utopya',
  })
  @IsString()
  @IsOptional()
  slug?: string;

  @ApiPropertyOptional({
    description: 'Host that maps to this tenant, e.g. "parts.example.com".',
  })
  @IsString()
  @IsOptional()
  @MaxLength(255)
  domain?: string;

  @ApiPropertyOptional()
  @IsEmail()
  @IsOptional()
  contactEmail?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  logoUrl?: string;

  @ApiPropertyOptional({ enum: TenantStatus })
  @IsEnum(TenantStatus)
  @IsOptional()
  status?: TenantStatus;
}

export class UpdateTenantDto extends PartialType(CreateTenantDto) {}

export class TenantQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ enum: TenantStatus })
  @IsEnum(TenantStatus)
  @IsOptional()
  status?: TenantStatus;
}
