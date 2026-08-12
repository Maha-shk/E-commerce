import { ApiPropertyOptional, ApiProperty, PartialType } from '@nestjs/swagger';
import { CatalogStatus, CatalogVisibility } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  ArrayNotEmpty,
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { ToBoolean } from '../../common/dto/transformers';

/**
 * One body shape for all four levels.
 *
 * The levels are structurally identical, so a single DTO keeps validation
 * rules from drifting between them. Fields that only apply to one level
 * (`icon` on a Category, `releaseYear` on a Model) are accepted here and
 * discarded by the service for levels that do not declare them, rather than
 * being rejected — which is what lets the frontend reuse one form component.
 */
export class CreateCatalogNodeDto {
  @ApiProperty({ example: 'Samsung' })
  @IsString()
  @MinLength(1)
  @MaxLength(160)
  name!: string;

  @ApiPropertyOptional({
    description:
      'Parent id. Required for every level except Category, which is top-level.',
  })
  @IsString()
  @IsOptional()
  parentId?: string;

  @ApiPropertyOptional({
    description: 'URL-safe identifier, unique among siblings. Derived from the name when omitted.',
  })
  @IsString()
  @IsOptional()
  @MaxLength(180)
  slug?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  @MaxLength(1000)
  description?: string;

  @ApiPropertyOptional({ description: 'Logo / tile image URL' })
  @IsString()
  @IsOptional()
  imageUrl?: string;

  @ApiPropertyOptional({ enum: CatalogStatus })
  @IsEnum(CatalogStatus)
  @IsOptional()
  status?: CatalogStatus;

  @ApiPropertyOptional({ enum: CatalogVisibility })
  @IsEnum(CatalogVisibility)
  @IsOptional()
  visibility?: CatalogVisibility;

  @ApiPropertyOptional({ description: 'Sort order among siblings. Appended last when omitted.' })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @IsOptional()
  position?: number;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  @MaxLength(200)
  metaTitle?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  @MaxLength(500)
  metaDescription?: string;

  // --- Category only -------------------------------------------------------

  @ApiPropertyOptional({ description: 'Icon key rendered by the frontend (Category only)' })
  @IsString()
  @IsOptional()
  icon?: string;

  @ApiPropertyOptional({ description: 'Category only' })
  @IsString()
  @IsOptional()
  thumbnailName?: string;

  @ApiPropertyOptional({ description: 'Category only' })
  @IsString()
  @IsOptional()
  thumbnailSize?: string;

  @ApiPropertyOptional({
    description:
      'Marks a node as a migration placeholder awaiting clean-up. Send false ' +
      'once a human has confirmed it is real catalog.',
  })
  @ToBoolean()
  @IsBoolean()
  @IsOptional()
  isPlaceholder?: boolean;

  // --- Model only ----------------------------------------------------------

  @ApiPropertyOptional({ example: 2025, description: 'Model only' })
  @Type(() => Number)
  @IsInt()
  @Min(1900)
  @Max(2200)
  @IsOptional()
  releaseYear?: number;
}

/**
 * `parentId` is included, so an edit can re-file a node under a different
 * parent — moving a Company to another Category carries its whole subtree with
 * it, because the descendants reference the Company, not the Category.
 */
export class UpdateCatalogNodeDto extends PartialType(CreateCatalogNodeDto) {}

export class CatalogNodeQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    description: 'Direct parent id — the main list filter (companies of a category, …)',
  })
  @IsString()
  @IsOptional()
  parentId?: string;

  @ApiPropertyOptional({ description: 'Ancestor filter: only rows under this category' })
  @IsString()
  @IsOptional()
  categoryId?: string;

  @ApiPropertyOptional({ description: 'Ancestor filter: only rows under this company' })
  @IsString()
  @IsOptional()
  companyId?: string;

  @ApiPropertyOptional({ description: 'Ancestor filter: only rows under this product type' })
  @IsString()
  @IsOptional()
  productTypeId?: string;

  @ApiPropertyOptional({ enum: CatalogStatus })
  @IsEnum(CatalogStatus)
  @IsOptional()
  status?: CatalogStatus;

  @ApiPropertyOptional({ enum: CatalogVisibility })
  @IsEnum(CatalogVisibility)
  @IsOptional()
  visibility?: CatalogVisibility;

  @ApiPropertyOptional({
    description:
      'Rows invented by the hierarchy migration. true builds a "needs filing" ' +
      'view; false lists only genuine catalog. Omit to get both.',
  })
  @ToBoolean()
  @IsBoolean()
  @IsOptional()
  isPlaceholder?: boolean;

  @ApiPropertyOptional({ enum: ['position', 'name', 'createdAt', 'updatedAt'], default: 'position' })
  @IsEnum(['position', 'name', 'createdAt', 'updatedAt'])
  @IsOptional()
  sortBy?: 'position' | 'name' | 'createdAt' | 'updatedAt' = 'position';

  @ApiPropertyOptional({ enum: ['asc', 'desc'], default: 'asc' })
  @IsEnum(['asc', 'desc'])
  @IsOptional()
  sortOrder?: 'asc' | 'desc' = 'asc';

  @ApiPropertyOptional({
    description:
      'Include the number of products beneath each row. Costs a few extra queries; skip it for pickers.',
    default: true,
  })
  @ToBoolean()
  @IsBoolean()
  @IsOptional()
  withCounts?: boolean = true;
}

export class ReorderCatalogNodesDto {
  @ApiPropertyOptional({
    description: 'Parent whose children are being reordered. Omit when reordering categories.',
  })
  @IsString()
  @IsOptional()
  parentId?: string;

  @ApiProperty({
    type: [String],
    description: 'Sibling ids in their new order. Position becomes the array index.',
  })
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  orderedIds!: string[];
}

export class CatalogTreeQueryDto {
  @ApiPropertyOptional({ description: 'Limit the tree to a single category' })
  @IsString()
  @IsOptional()
  categoryId?: string;

  @ApiPropertyOptional({
    description: '0 = categories only, 1 = + companies, 2 = + product types, 3 = + models',
    default: 3,
  })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(3)
  @IsOptional()
  depth?: number = 3;

  @ApiPropertyOptional({ enum: CatalogStatus })
  @IsEnum(CatalogStatus)
  @IsOptional()
  status?: CatalogStatus;

  @ApiPropertyOptional({ enum: CatalogVisibility })
  @IsEnum(CatalogVisibility)
  @IsOptional()
  visibility?: CatalogVisibility;

  @ApiPropertyOptional({ description: 'Free-text filter applied to node names' })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional({ default: true })
  @ToBoolean()
  @IsBoolean()
  @IsOptional()
  withCounts?: boolean = true;
}
