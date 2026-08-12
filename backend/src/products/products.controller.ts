import {
  ArrayMaxSize,
  ArrayNotEmpty,
  IsArray,
  IsString,
  MinLength,
} from 'class-validator';
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiProperty, ApiTags } from '@nestjs/swagger';
import { Roles } from '../common/decorators/roles.decorator';
import { ADMIN_ROLES, WRITE_ROLES } from '../common/constants/roles.constants';
import { CurrentTenant } from '../tenancy/decorators/current-tenant.decorator';
import { ProductsService } from './products.service';
import {
  CreateProductDto,
  ProductQueryDto,
  UpdateProductDto,
} from './dto/product.dto';

/** Cap on one bulk move. Bounds the `IN (…)` list and the transaction's size. */
export const REASSIGN_MAX_PRODUCTS = 200;

export class ReassignProductsDto {
  @ApiProperty({
    type: [String],
    maxItems: REASSIGN_MAX_PRODUCTS,
    description: `Up to ${REASSIGN_MAX_PRODUCTS} ids. Duplicates are ignored.`,
  })
  @IsArray()
  @ArrayNotEmpty()
  @ArrayMaxSize(REASSIGN_MAX_PRODUCTS)
  @IsString({ each: true })
  productIds!: string[];

  @ApiProperty({ description: 'Destination model' })
  @IsString()
  @MinLength(1)
  modelId!: string;
}

@ApiTags('admin/products')
@ApiBearerAuth()
@Controller('admin/products')
@Roles(...ADMIN_ROLES)
export class ProductsController {
  constructor(private readonly products: ProductsService) {}

  @Get()
  @ApiOperation({
    summary: 'List products',
    description:
      'Filter by `modelId` for one model, or by `productTypeId` / `companyId` / ' +
      '`categoryId` to pull everything beneath a higher level.',
  })
  findAll(
    @CurrentTenant('id') tenantId: string,
    @Query() query: ProductQueryDto,
  ) {
    return this.products.findAll(tenantId, query);
  }

  @Post('reassign')
  @Roles(...WRITE_ROLES)
  @ApiOperation({ summary: 'Move several products to another model' })
  reassign(
    @CurrentTenant('id') tenantId: string,
    @Body() dto: ReassignProductsDto,
  ) {
    return this.products.reassign(tenantId, dto.productIds, dto.modelId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single product with its breadcrumb' })
  findOne(@CurrentTenant('id') tenantId: string, @Param('id') id: string) {
    return this.products.findOne(tenantId, id);
  }

  @Post()
  @Roles(...WRITE_ROLES)
  @ApiOperation({ summary: 'Create a product inside a model' })
  create(
    @CurrentTenant('id') tenantId: string,
    @Body() dto: CreateProductDto,
  ) {
    return this.products.create(tenantId, dto);
  }

  @Patch(':id')
  @Roles(...WRITE_ROLES)
  @ApiOperation({ summary: 'Update a product' })
  update(
    @CurrentTenant('id') tenantId: string,
    @Param('id') id: string,
    @Body() dto: UpdateProductDto,
  ) {
    return this.products.update(tenantId, id, dto);
  }

  @Delete(':id')
  @Roles(...WRITE_ROLES)
  @ApiOperation({ summary: 'Delete a product' })
  remove(@CurrentTenant('id') tenantId: string, @Param('id') id: string) {
    return this.products.remove(tenantId, id);
  }
}
