import {
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { Roles } from '../common/decorators/roles.decorator';
import { ADMIN_ROLES, WRITE_ROLES } from '../common/constants/roles.constants';
import { ParseOptionalBooleanPipe } from '../common/pipes/parse-optional-boolean.pipe';
import { CurrentTenant } from '../tenancy/decorators/current-tenant.decorator';
import { CatalogService } from './catalog.service';
import { CatalogLevelPipe } from './catalog-level.pipe';
import { specForKey } from './catalog.constants';
// `import type` is required: these appear in decorated parameter signatures,
// and emitDecoratorMetadata would otherwise emit a runtime import for a type.
import type { CatalogLevelSpec } from './catalog.constants';
import {
  CatalogNodeQueryDto,
  CreateCatalogNodeDto,
  MoveCatalogNodeDto,
  ReorderCatalogNodesDto,
  UpdateCatalogNodeDto,
} from './dto/catalog.dto';

/**
 * One CRUD surface for all four levels:
 *
 *   /admin/catalog/categories
 *   /admin/catalog/companies?parentId=<categoryId>
 *   /admin/catalog/product-types?parentId=<companyId>
 *   /admin/catalog/models?parentId=<productTypeId>
 *
 * The levels behave identically, so giving them four hand-written controllers
 * would be four chances for their validation and tenant scoping to drift apart.
 */
@ApiTags('admin/catalog')
@ApiBearerAuth()
@Controller('admin/catalog')
@Roles(...ADMIN_ROLES)
@ApiParam({
  name: 'level',
  enum: ['categories', 'companies', 'product-types', 'models'],
})
export class CatalogLevelsController {
  constructor(private readonly catalog: CatalogService) {}

  @Get(':level')
  @ApiOperation({
    summary: 'List one level',
    description:
      'Filter by `parentId` for direct children, or by any ancestor id ' +
      '(`categoryId`, `companyId`, `productTypeId`). Supports search, ' +
      'pagination and sorting.',
  })
  findAll(
    @CurrentTenant('id') tenantId: string,
    @Param('level', CatalogLevelPipe) spec: CatalogLevelSpec,
    @Query() query: CatalogNodeQueryDto,
  ) {
    return this.catalog.list(tenantId, spec, query);
  }

  @Post(':level')
  @Roles(...WRITE_ROLES)
  @ApiOperation({
    summary: 'Create a node at this level',
    description: '`parentId` is required for every level except categories.',
  })
  create(
    @CurrentTenant('id') tenantId: string,
    @Param('level', CatalogLevelPipe) spec: CatalogLevelSpec,
    @Body() dto: CreateCatalogNodeDto,
  ) {
    return this.catalog.create(tenantId, spec, dto);
  }

  // Declared before `:id` so "reorder" is not read as a node id.
  @Patch(':level/reorder')
  @Roles(...WRITE_ROLES)
  @ApiOperation({ summary: 'Reorder siblings (drag & drop)' })
  reorder(
    @CurrentTenant('id') tenantId: string,
    @Param('level', CatalogLevelPipe) spec: CatalogLevelSpec,
    @Body() dto: ReorderCatalogNodesDto,
  ) {
    return this.catalog.reorder(tenantId, spec, dto);
  }

  @Get(':level/:id')
  @ApiOperation({ summary: 'Get one node, including its breadcrumb' })
  findOne(
    @CurrentTenant('id') tenantId: string,
    @Param('level', CatalogLevelPipe) spec: CatalogLevelSpec,
    @Param('id') id: string,
  ) {
    return this.catalog.findOne(tenantId, spec, id);
  }

  @Get(':level/:id/breadcrumb')
  @ApiOperation({ summary: 'Ancestor trail for a node, root first' })
  breadcrumb(
    @CurrentTenant('id') tenantId: string,
    @Param('level', CatalogLevelPipe) spec: CatalogLevelSpec,
    @Param('id') id: string,
  ) {
    return this.catalog.breadcrumb(tenantId, spec, id);
  }

  @Get(':level/:id/children')
  @ApiOperation({
    summary: "List a node's children",
    description:
      'Equivalent to listing the child level with `parentId`, but saves the ' +
      'frontend from having to know which level comes next. Models have no ' +
      'child level — read their products from /admin/products?modelId=…',
  })
  async children(
    @CurrentTenant('id') tenantId: string,
    @Param('level', CatalogLevelPipe) spec: CatalogLevelSpec,
    @Param('id') id: string,
    @Query() query: CatalogNodeQueryDto,
  ) {
    if (!spec.child) {
      throw new NotFoundException(
        `A ${spec.label} has no child level — its products live at /admin/products?modelId=${id}`,
      );
    }
    // Confirms the parent exists in this tenant before listing under it.
    await this.catalog.findOne(tenantId, spec, id);
    return this.catalog.list(tenantId, specForKey(spec.child.key), {
      ...query,
      parentId: id,
    });
  }

  @Patch(':level/:id/move')
  @Roles(...WRITE_ROLES)
  @ApiOperation({
    summary: 'Move one node among its siblings',
    description:
      'Give exactly one of `position`, `beforeId` or `afterId`. Unlike ' +
      '`reorder`, this needs no complete sibling list, so it works from a ' +
      'single page of a parent with any number of children.',
  })
  move(
    @CurrentTenant('id') tenantId: string,
    @Param('level', CatalogLevelPipe) spec: CatalogLevelSpec,
    @Param('id') id: string,
    @Body() dto: MoveCatalogNodeDto,
  ) {
    return this.catalog.move(tenantId, spec, id, dto);
  }

  @Patch(':level/:id')
  @Roles(...WRITE_ROLES)
  @ApiOperation({
    summary: 'Update a node',
    description:
      'Passing a different `parentId` re-files the node; its own descendants ' +
      'travel with it.',
  })
  update(
    @CurrentTenant('id') tenantId: string,
    @Param('level', CatalogLevelPipe) spec: CatalogLevelSpec,
    @Param('id') id: string,
    @Body() dto: UpdateCatalogNodeDto,
  ) {
    return this.catalog.update(tenantId, spec, id, dto);
  }

  @Delete(':level/:id')
  @Roles(...WRITE_ROLES)
  @ApiOperation({
    summary: 'Delete a node',
    description:
      'Refuses (409) while children exist; `?cascade=true` removes the ' +
      'descendant levels too. Always refuses while any product sits beneath.',
  })
  remove(
    @CurrentTenant('id') tenantId: string,
    @Param('level', CatalogLevelPipe) spec: CatalogLevelSpec,
    @Param('id') id: string,
    @Query('cascade', ParseOptionalBooleanPipe) cascade: boolean,
  ) {
    return this.catalog.remove(tenantId, spec, id, cascade);
  }
}
