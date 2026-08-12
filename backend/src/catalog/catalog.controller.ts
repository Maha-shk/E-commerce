import { Controller, Get, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Roles } from '../common/decorators/roles.decorator';
import { ADMIN_ROLES } from '../common/constants/roles.constants';
import { CurrentTenant } from '../tenancy/decorators/current-tenant.decorator';
import { CatalogService } from './catalog.service';
import { CATALOG_LEVELS } from './catalog.constants';
import { CatalogTreeQueryDto } from './dto/catalog.dto';

/**
 * Whole-catalog reads.
 *
 * Registered before CatalogLevelsController in the module so these static paths
 * win over that controller's `/:level` pattern.
 */
@ApiTags('admin/catalog')
@ApiBearerAuth()
@Controller('admin/catalog')
@Roles(...ADMIN_ROLES)
export class CatalogController {
  constructor(private readonly catalog: CatalogService) {}

  @Get('levels')
  @ApiOperation({
    summary: 'Describe the hierarchy',
    description:
      'The levels in order, with their URL segments, labels and parent/child ' +
      'relationships. Lets the frontend build the navigation generically ' +
      'instead of hard-coding four screens.',
  })
  levels() {
    return CATALOG_LEVELS.map((spec) => ({
      key: spec.key,
      label: spec.label,
      labelPlural: spec.labelPlural,
      segment: spec.segment,
      depth: spec.depth,
      parent: spec.parent
        ? { key: spec.parent.key, label: spec.parent.label, segment: spec.parent.segment }
        : null,
      child: spec.child
        ? {
            key: spec.child.key,
            label: spec.child.label,
            labelPlural: spec.child.labelPlural,
            segment: spec.child.segment,
          }
        : null,
      holdsProducts: spec.holdsProducts,
    }));
  }

  @Get('tree')
  @ApiOperation({
    summary: 'The full nested hierarchy for the current store',
    description:
      'Category → Company → Product Type → Model, each with a product count. ' +
      'Use `depth` to fetch only as deep as the screen needs.',
  })
  tree(
    @CurrentTenant('id') tenantId: string,
    @Query() query: CatalogTreeQueryDto,
  ) {
    return this.catalog.tree(tenantId, query);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Row counts per level, for the catalog dashboard' })
  stats(@CurrentTenant('id') tenantId: string) {
    return this.catalog.stats(tenantId);
  }
}
