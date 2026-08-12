import { Controller, Get, NotFoundException, Param, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { CatalogStatus, CatalogVisibility } from '@prisma/client';
import { Public } from '../common/decorators/public.decorator';
import { CurrentTenant } from '../tenancy/decorators/current-tenant.decorator';
import { CatalogService } from '../catalog/catalog.service';
import { CatalogLevelPipe } from '../catalog/catalog-level.pipe';
import { specForKey } from '../catalog/catalog.constants';
import type { CatalogLevelSpec } from '../catalog/catalog.constants';
import { CatalogNodeQueryDto, CatalogTreeQueryDto } from '../catalog/dto/catalog.dto';

/**
 * Storefront navigation: the same hierarchy the admin manages, filtered down to
 * what shoppers may see.
 *
 * `status` and `visibility` are forced to ACTIVE/VISIBLE on every route rather
 * than being accepted from the caller — an archived or hidden branch is an
 * internal state, and letting a query string override it would publish the
 * admin's unfinished work.
 */
@ApiTags('public/catalog')
@Public()
@Controller('public/catalog')
export class PublicCatalogController {
  constructor(private readonly catalog: CatalogService) {}

  @Get('tree')
  @ApiOperation({
    summary: 'Nested menu tree for the storefront navigation',
    description:
      'Category → Company → Product Type → Model. Use `depth=1` for a top-level ' +
      'menu, `depth=3` for the full drill-down.',
  })
  tree(
    @CurrentTenant('id') tenantId: string,
    @Query() query: CatalogTreeQueryDto,
  ) {
    return this.catalog.tree(tenantId, {
      ...query,
      status: CatalogStatus.ACTIVE,
      visibility: CatalogVisibility.VISIBLE,
    });
  }

  @Get('breadcrumb/:level/:id')
  @ApiOperation({ summary: 'Ancestor trail for a node, root first' })
  breadcrumb(
    @CurrentTenant('id') tenantId: string,
    @Param('level', CatalogLevelPipe) spec: CatalogLevelSpec,
    @Param('id') id: string,
  ) {
    return this.catalog.breadcrumb(tenantId, spec, id);
  }

  @Get(':level')
  @ApiOperation({
    summary: 'List one level of the hierarchy',
    description:
      'e.g. /public/catalog/companies?parentId=<categoryId> for the brands in ' +
      'a category, or /public/catalog/models?companyId=<id> for every model a ' +
      'brand makes.',
  })
  findAll(
    @CurrentTenant('id') tenantId: string,
    @Param('level', CatalogLevelPipe) spec: CatalogLevelSpec,
    @Query() query: CatalogNodeQueryDto,
  ) {
    return this.catalog.list(tenantId, spec, {
      ...query,
      status: CatalogStatus.ACTIVE,
      visibility: CatalogVisibility.VISIBLE,
    });
  }

  @Get(':level/:id')
  @ApiOperation({
    summary: 'One node with its breadcrumb and immediate children',
    description:
      'Everything a category/brand/type/model landing page needs in one call. ' +
      'A model has no child level — read its products from ' +
      '/public/products?modelId=…',
  })
  async findOne(
    @CurrentTenant('id') tenantId: string,
    @Param('level', CatalogLevelPipe) spec: CatalogLevelSpec,
    @Param('id') id: string,
  ) {
    const node = await this.catalog.findOne(tenantId, spec, id);

    // A hidden or archived node is not reachable from the storefront menu, so
    // it must not be reachable by guessing its id either.
    if (
      node.status !== CatalogStatus.ACTIVE ||
      node.visibility !== CatalogVisibility.VISIBLE
    ) {
      throw new NotFoundException(`${spec.label} ${id} not found`);
    }

    const children = spec.child
      ? await this.catalog.list(tenantId, specForKey(spec.child.key), {
          page: 1,
          limit: 100,
          parentId: id,
          sortBy: 'position',
          sortOrder: 'asc',
          withCounts: true,
          status: CatalogStatus.ACTIVE,
          visibility: CatalogVisibility.VISIBLE,
        })
      : null;

    return {
      ...node,
      children: children?.data ?? [],
    };
  }
}
