import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CatalogStatus, CatalogVisibility, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { paginate } from '../common/dto/paginated-response';
import { slugify } from '../common/utils/stock.util';
import {
  CATALOG_INCLUDE,
  CATALOG_LEVELS,
  CatalogDelegateName,
  CatalogLevelKey,
  CatalogLevelSpec,
  nestedWhere,
  specForKey,
} from './catalog.constants';
import {
  CatalogNodeQueryDto,
  CatalogTreeQueryDto,
  CreateCatalogNodeDto,
  ReorderCatalogNodesDto,
  UpdateCatalogNodeDto,
} from './dto/catalog.dto';

/**
 * The subset of a Prisma delegate this service needs. The four level tables
 * have identical operations but no common generated type, so they are reached
 * through this one narrow interface — a single cast at the boundary instead of
 * four copies of the same logic.
 */
interface CatalogDelegate {
  findFirst(args: unknown): Promise<Record<string, unknown> | null>;
  findMany(args: unknown): Promise<Record<string, unknown>[]>;
  count(args: unknown): Promise<number>;
  create(args: unknown): Promise<Record<string, unknown>>;
  update(args: unknown): Promise<Record<string, unknown>>;
  delete(args: unknown): Promise<unknown>;
  deleteMany(args: unknown): Promise<{ count: number }>;
  aggregate(args: unknown): Promise<{ _max: { position: number | null } }>;
}

type Row = Record<string, any>;

export interface BreadcrumbEntry {
  id: string;
  name: string;
  slug: string;
  level: CatalogLevelKey;
  levelLabel: string;
  segment: string;
}

export interface CatalogTreeNode {
  id: string;
  level: CatalogLevelKey;
  levelLabel: string;
  depth: number;
  name: string;
  slug: string;
  imageUrl: string | null;
  icon: string | null;
  status: CatalogStatus;
  visibility: CatalogVisibility;
  position: number;
  isPlaceholder: boolean;
  /** null when the request opted out of counting via withCounts=false. */
  productCount: number | null;
  children: CatalogTreeNode[];
}

/**
 * List queries as the service sees them: `skip` is derived here rather than
 * read off the DTO getter, so callers can hand over a plain object (the
 * `/children` route passes a modified copy of the request query).
 */
export type CatalogListQuery = Omit<CatalogNodeQueryDto, 'skip'>;

/** Product totals for every node of a tenant's catalog, built in four queries. */
interface ProductRollup {
  byModel: Map<string, number>;
  byProductType: Map<string, number>;
  byCompany: Map<string, number>;
  byCategory: Map<string, number>;
}

/**
 * Empty maps, so every lookup answers a truthful zero. Used for a node that was
 * just created and therefore provably has nothing beneath it — distinct from
 * `null`, which means "not counted".
 */
const ZERO_ROLLUP: ProductRollup = {
  byModel: new Map(),
  byProductType: new Map(),
  byCompany: new Map(),
  byCategory: new Map(),
};

@Injectable()
export class CatalogService {
  constructor(private readonly prisma: PrismaService) {}

  // ===========================================================================
  // Reads
  // ===========================================================================

  async list(tenantId: string, spec: CatalogLevelSpec, query: CatalogListQuery) {
    const where = this.buildWhere(tenantId, spec, query);
    const skip = (query.page - 1) * query.limit;

    const [rows, total] = await Promise.all([
      this.delegate(spec).findMany({
        where,
        skip,
        take: query.limit,
        orderBy: this.buildOrderBy(query),
        include: CATALOG_INCLUDE[spec.key],
      }),
      this.delegate(spec).count({ where }),
    ]);

    const rollup =
      query.withCounts === false ? null : await this.productRollup(tenantId);

    return paginate(
      (rows as Row[]).map((row) => this.toView(spec, row, rollup)),
      total,
      query.page,
      query.limit,
    );
  }

  async findOne(tenantId: string, spec: CatalogLevelSpec, id: string) {
    const row = await this.requireRow(tenantId, spec, id);
    const rollup = await this.productRollup(tenantId);
    return this.toView(spec, row, rollup);
  }

  async breadcrumb(tenantId: string, spec: CatalogLevelSpec, id: string) {
    const row = await this.requireRow(tenantId, spec, id);
    return this.buildBreadcrumb(spec, row);
  }

  /**
   * The whole tree for a tenant, nested and ready to render as a menu or an
   * expandable admin table.
   *
   * Four flat queries then assembled in memory — one query per level rather
   * than one per node, so the cost does not grow with how bushy the tree is.
   */
  async tree(tenantId: string, query: CatalogTreeQueryDto) {
    const depth = query.depth ?? 3;
    const statusFilter = {
      ...(query.status && { status: query.status }),
      ...(query.visibility && { visibility: query.visibility }),
    };

    const [categories, companies, productTypes, models] = await Promise.all([
      this.prisma.category.findMany({
        where: {
          tenantId,
          ...statusFilter,
          ...(query.categoryId && { id: query.categoryId }),
        },
        orderBy: [{ position: 'asc' }, { name: 'asc' }],
      }),
      depth >= 1
        ? this.prisma.company.findMany({
            where: {
              tenantId,
              ...statusFilter,
              ...(query.categoryId && { categoryId: query.categoryId }),
            },
            orderBy: [{ position: 'asc' }, { name: 'asc' }],
          })
        : Promise.resolve([]),
      depth >= 2
        ? this.prisma.productType.findMany({
            where: {
              tenantId,
              ...statusFilter,
              ...(query.categoryId && { company: { categoryId: query.categoryId } }),
            },
            orderBy: [{ position: 'asc' }, { name: 'asc' }],
          })
        : Promise.resolve([]),
      depth >= 3
        ? this.prisma.model.findMany({
            where: {
              tenantId,
              ...statusFilter,
              ...(query.categoryId && {
                productType: { company: { categoryId: query.categoryId } },
              }),
            },
            orderBy: [{ position: 'asc' }, { name: 'asc' }],
          })
        : Promise.resolve([]),
    ]);

    const rollup =
      query.withCounts === false ? null : await this.productRollup(tenantId);

    const modelsByType = groupBy(models, (m) => m.productTypeId);
    const typesByCompany = groupBy(productTypes, (t) => t.companyId);
    const companiesByCategory = groupBy(companies, (c) => c.categoryId);

    const count = (map: Map<string, number> | undefined, id: string) =>
      rollup ? (map?.get(id) ?? 0) : null;

    const tree: CatalogTreeNode[] = categories.map((category) => ({
      ...this.treeNode('CATEGORY', category, count(rollup?.byCategory, category.id)),
      children: (companiesByCategory.get(category.id) ?? []).map((company) => ({
        ...this.treeNode('COMPANY', company, count(rollup?.byCompany, company.id)),
        children: (typesByCompany.get(company.id) ?? []).map((productType) => ({
          ...this.treeNode(
            'PRODUCT_TYPE',
            productType,
            count(rollup?.byProductType, productType.id),
          ),
          children: (modelsByType.get(productType.id) ?? []).map((model) => ({
            ...this.treeNode('MODEL', model, count(rollup?.byModel, model.id)),
            children: [],
          })),
        })),
      })),
    }));

    // A name search filters the flat levels above, which would leave a matching
    // model stranded under a non-matching company. Pruning afterwards keeps any
    // branch that contains a match, together with the ancestors that lead to it.
    return query.search ? pruneTree(tree, query.search.toLowerCase()) : tree;
  }

  /** Headline counts for the catalog landing screen. */
  async stats(tenantId: string) {
    const placeholder = { tenantId, isPlaceholder: true };

    const [
      categories,
      companies,
      productTypes,
      models,
      products,
      emptyModels,
      placeholderCategories,
      placeholderCompanies,
      placeholderProductTypes,
      placeholderModels,
    ] = await Promise.all([
      this.prisma.category.count({ where: { tenantId } }),
      this.prisma.company.count({ where: { tenantId } }),
      this.prisma.productType.count({ where: { tenantId } }),
      this.prisma.model.count({ where: { tenantId } }),
      this.prisma.product.count({ where: { tenantId } }),
      this.prisma.model.count({ where: { tenantId, products: { none: {} } } }),
      this.prisma.category.count({ where: placeholder }),
      this.prisma.company.count({ where: placeholder }),
      this.prisma.productType.count({ where: placeholder }),
      this.prisma.model.count({ where: placeholder }),
    ]);

    return {
      categories,
      companies,
      productTypes,
      models,
      products,
      /** Models with nothing to sell yet. */
      emptyModels,
      /**
       * Nodes the hierarchy migration invented, per level, plus the total.
       * Drives the "needs filing" banner; list them with ?isPlaceholder=true.
       */
      placeholders: {
        categories: placeholderCategories,
        companies: placeholderCompanies,
        productTypes: placeholderProductTypes,
        models: placeholderModels,
        total:
          placeholderCategories +
          placeholderCompanies +
          placeholderProductTypes +
          placeholderModels,
      },
    };
  }

  // ===========================================================================
  // Writes
  // ===========================================================================

  async create(tenantId: string, spec: CatalogLevelSpec, dto: CreateCatalogNodeDto) {
    const parentId = await this.resolveParent(tenantId, spec, dto.parentId);
    const slug = this.deriveSlug(dto.slug, dto.name);
    await this.assertSlugFree(tenantId, spec, slug, parentId);

    const position =
      dto.position ?? (await this.nextPosition(tenantId, spec, parentId));

    const row = await this.delegate(spec).create({
      data: {
        tenantId,
        ...(spec.parent && { [spec.parent.foreignKey]: parentId }),
        name: dto.name.trim(),
        slug,
        description: dto.description?.trim() ?? '',
        imageUrl: dto.imageUrl?.trim() || null,
        ...(dto.status && { status: dto.status }),
        ...(dto.visibility && { visibility: dto.visibility }),
        position,
        metaTitle: dto.metaTitle?.trim() || null,
        metaDescription: dto.metaDescription?.trim() || null,
        ...(dto.isPlaceholder !== undefined && { isPlaceholder: dto.isPlaceholder }),
        ...this.extraFieldData(spec, dto),
      },
      include: CATALOG_INCLUDE[spec.key],
    });

    // A node created a moment ago has nothing beneath it; that is a known
    // zero, not an uncomputed count, so no roll-up query is needed.
    return this.toView(spec, row as Row, ZERO_ROLLUP);
  }

  async update(
    tenantId: string,
    spec: CatalogLevelSpec,
    id: string,
    dto: UpdateCatalogNodeDto,
  ) {
    const existing = await this.requireRow(tenantId, spec, id);

    // Re-filing under a different parent moves the whole subtree with it: the
    // descendants point at this node, not at its parent, so nothing else has
    // to be rewritten.
    let parentId: string | undefined;
    if (spec.parent && dto.parentId !== undefined) {
      parentId = await this.resolveParent(tenantId, spec, dto.parentId);
    }
    const effectiveParentId =
      parentId ?? (spec.parent ? (existing[spec.parent.foreignKey] as string) : undefined);

    let slug: string | undefined;
    if (dto.slug !== undefined || dto.name !== undefined) {
      slug = this.deriveSlug(dto.slug, dto.name ?? (existing.name as string));
      if (slug !== existing.slug || parentId) {
        await this.assertSlugFree(tenantId, spec, slug, effectiveParentId, id);
      }
    }

    const row = await this.delegate(spec).update({
      where: { id },
      data: {
        ...(parentId && spec.parent && { [spec.parent.foreignKey]: parentId }),
        ...(dto.name !== undefined && { name: dto.name.trim() }),
        ...(slug && { slug }),
        ...(dto.description !== undefined && { description: dto.description.trim() }),
        ...(dto.imageUrl !== undefined && { imageUrl: dto.imageUrl?.trim() || null }),
        ...(dto.status && { status: dto.status }),
        ...(dto.visibility && { visibility: dto.visibility }),
        ...(dto.position !== undefined && { position: dto.position }),
        ...(dto.metaTitle !== undefined && { metaTitle: dto.metaTitle?.trim() || null }),
        ...(dto.metaDescription !== undefined && {
          metaDescription: dto.metaDescription?.trim() || null,
        }),
        ...(dto.isPlaceholder !== undefined && { isPlaceholder: dto.isPlaceholder }),
        ...this.extraFieldData(spec, dto),
      },
      include: CATALOG_INCLUDE[spec.key],
    });

    const rollup = await this.productRollup(tenantId);
    return this.toView(spec, row as Row, rollup);
  }

  /**
   * Deletes a node.
   *
   * Refuses while anything still hangs off it, so a stray click can never take
   * a branch of the catalog with it. `cascade` removes the descendant *levels*
   * but still refuses if any Product lives underneath — products carry stock,
   * pricing and order history, and dropping them has to be a deliberate act in
   * the Products screen rather than a side effect of tidying the tree.
   */
  async remove(
    tenantId: string,
    spec: CatalogLevelSpec,
    id: string,
    cascade = false,
  ) {
    const row = await this.requireRow(tenantId, spec, id);

    const productCount = await this.prisma.product.count({
      where: { tenantId, ...this.productsBeneathWhere(spec, id) },
    });
    if (productCount > 0) {
      throw new ConflictException(
        `Cannot delete "${row.name as string}": ${productCount} product(s) still sit beneath it. ` +
          `Move or delete those products first.`,
      );
    }

    const childCount = this.childCountOf(spec, row);
    if (childCount > 0 && !cascade) {
      throw new ConflictException(
        `Cannot delete "${row.name as string}": it still contains ${childCount} ` +
          `${childCount === 1 ? spec.child!.label : spec.child!.labelPlural}. ` +
          `Delete them first, or repeat this request with ?cascade=true.`,
      );
    }

    await this.prisma.$transaction(async (tx) => {
      if (cascade) {
        // Deepest level first — every foreign key here is Restrict, so a parent
        // cannot go before its children.
        for (const step of this.cascadeSteps(spec, id)) {
          await (tx[step.delegate] as unknown as CatalogDelegate).deleteMany({
            where: { tenantId, ...step.where },
          });
        }
      }
      await (tx[spec.delegate] as unknown as CatalogDelegate).delete({ where: { id } });
    });

    return {
      message: `${spec.label} deleted`,
      deletedDescendants: cascade ? childCount : 0,
    };
  }

  /** Applies a new sibling order; position becomes the index in `orderedIds`. */
  async reorder(
    tenantId: string,
    spec: CatalogLevelSpec,
    dto: ReorderCatalogNodesDto,
  ) {
    const scope: Record<string, unknown> = { tenantId };
    if (spec.parent) {
      if (!dto.parentId) {
        throw new BadRequestException(
          `parentId is required when reordering ${spec.labelPlural.toLowerCase()}`,
        );
      }
      scope[spec.parent.foreignKey] = dto.parentId;
    }

    const siblings = await this.delegate(spec).findMany({
      where: scope,
      select: { id: true },
    });
    const validIds = new Set(siblings.map((s) => s.id as string));

    const unknownIds = dto.orderedIds.filter((id) => !validIds.has(id));
    if (unknownIds.length > 0) {
      throw new BadRequestException(
        `These ids are not ${spec.labelPlural.toLowerCase()} of the given parent: ${unknownIds.join(', ')}`,
      );
    }

    await this.prisma.$transaction(async (tx) => {
      for (const [index, id] of dto.orderedIds.entries()) {
        await this.delegate(spec, tx).update({
          where: { id },
          data: { position: index },
        });
      }
    });

    return { message: 'Order updated', count: dto.orderedIds.length };
  }

  // ===========================================================================
  // Shared helpers (also used by ProductsService and the storefront)
  // ===========================================================================

  /**
   * Confirms a model belongs to this tenant and returns it with its ancestry.
   * Every product write goes through here — it is the single point that stops
   * a product being filed into another tenant's catalog.
   */
  async requireModel(tenantId: string, modelId: string) {
    const model = await this.prisma.model.findFirst({
      where: { id: modelId, tenantId },
      include: {
        productType: {
          include: { company: { include: { category: true } } },
        },
      },
    });
    if (!model) {
      throw new NotFoundException(`Model ${modelId} not found in this store`);
    }
    return model;
  }

  // ===========================================================================
  // Internals
  // ===========================================================================

  private delegate(
    spec: CatalogLevelSpec,
    client: Pick<PrismaService, CatalogDelegateName> = this.prisma,
  ): CatalogDelegate {
    return client[spec.delegate] as unknown as CatalogDelegate;
  }

  private async requireRow(
    tenantId: string,
    spec: CatalogLevelSpec,
    id: string,
  ): Promise<Row> {
    // Scoped by tenant, so a node belonging to another store reads as missing
    // rather than forbidden — no probing for which ids exist elsewhere.
    const row = await this.delegate(spec).findFirst({
      where: { id, tenantId },
      include: CATALOG_INCLUDE[spec.key],
    });
    if (!row) throw new NotFoundException(`${spec.label} ${id} not found`);
    return row as Row;
  }

  private buildWhere(
    tenantId: string,
    spec: CatalogLevelSpec,
    query: CatalogListQuery,
  ): Record<string, unknown> {
    const and: Record<string, unknown>[] = [];

    if (spec.parent && query.parentId) {
      and.push({ [spec.parent.foreignKey]: query.parentId });
    }

    // Ancestor filters, e.g. all models under a category.
    for (const key of ['categoryId', 'companyId', 'productTypeId'] as const) {
      const value = query[key];
      const path = spec.ancestorPaths[key];
      if (value && path) and.push(nestedWhere(path, value));
    }

    if (query.search) {
      and.push({
        OR: [
          { name: { contains: query.search, mode: 'insensitive' } },
          { slug: { contains: query.search, mode: 'insensitive' } },
          { description: { contains: query.search, mode: 'insensitive' } },
        ],
      });
    }

    return {
      tenantId,
      ...(query.status && { status: query.status }),
      ...(query.visibility && { visibility: query.visibility }),
      ...(query.isPlaceholder !== undefined && {
        isPlaceholder: query.isPlaceholder,
      }),
      ...(and.length > 0 && { AND: and }),
    };
  }

  private buildOrderBy(query: CatalogListQuery) {
    const field = query.sortBy ?? 'position';
    const direction = query.sortOrder ?? 'asc';
    // Position ties are common (everything defaults to 0 before a first drag),
    // so fall back to name for a stable, readable order.
    return field === 'position'
      ? [{ position: direction }, { name: 'asc' as const }]
      : [{ [field]: direction }];
  }

  /** Validates and returns the parent id, or undefined for a root level. */
  private async resolveParent(
    tenantId: string,
    spec: CatalogLevelSpec,
    parentId: string | undefined,
  ): Promise<string | undefined> {
    if (!spec.parent) {
      if (parentId) {
        throw new BadRequestException(
          `A ${spec.label} is top-level and cannot have a parent`,
        );
      }
      return undefined;
    }

    if (!parentId) {
      throw new BadRequestException(
        `parentId is required: every ${spec.label} belongs to a ${spec.parent.label}`,
      );
    }

    const parentSpec = specForKey(spec.parent.key);
    const parent = await this.delegate(parentSpec).findFirst({
      where: { id: parentId, tenantId },
      select: { id: true },
    });
    if (!parent) {
      throw new NotFoundException(
        `${spec.parent.label} ${parentId} not found in this store`,
      );
    }
    return parentId;
  }

  private deriveSlug(slug: string | undefined, name: string): string {
    const value = slugify(slug?.trim() || name);
    if (!value) {
      throw new BadRequestException(
        'Could not derive a URL slug — provide one explicitly',
      );
    }
    return value;
  }

  /**
   * Slugs are unique among siblings, not globally: "chairs" may sit under both
   * IKEA and WoodCraft, and two tenants may each have "electronics".
   */
  private async assertSlugFree(
    tenantId: string,
    spec: CatalogLevelSpec,
    slug: string,
    parentId: string | undefined,
    exceptId?: string,
  ): Promise<void> {
    const clash = await this.delegate(spec).findFirst({
      where: {
        slug,
        tenantId,
        ...(spec.parent && parentId && { [spec.parent.foreignKey]: parentId }),
        ...(exceptId && { NOT: { id: exceptId } }),
      },
      select: { id: true },
    });
    if (clash) {
      throw new ConflictException(
        `Another ${spec.label.toLowerCase()} here already uses the slug "${slug}"`,
      );
    }
  }

  private async nextPosition(
    tenantId: string,
    spec: CatalogLevelSpec,
    parentId: string | undefined,
  ): Promise<number> {
    const result = await this.delegate(spec).aggregate({
      where: {
        tenantId,
        ...(spec.parent && parentId && { [spec.parent.foreignKey]: parentId }),
      },
      _max: { position: true },
    });
    return (result._max.position ?? -1) + 1;
  }

  /** Picks the level-specific fields the spec declares, ignoring the rest. */
  private extraFieldData(
    spec: CatalogLevelSpec,
    dto: CreateCatalogNodeDto | UpdateCatalogNodeDto,
  ): Record<string, unknown> {
    const data: Record<string, unknown> = {};
    for (const field of spec.extraFields) {
      const value = (dto as Record<string, unknown>)[field];
      if (value === undefined) continue;
      data[field] = typeof value === 'string' ? value.trim() || null : value;
    }
    return data;
  }

  /** Where-clause matching every product beneath a node, at any depth. */
  private productsBeneathWhere(
    spec: CatalogLevelSpec,
    id: string,
  ): Prisma.ProductWhereInput {
    switch (spec.key) {
      case 'CATEGORY':
        return { model: { productType: { company: { categoryId: id } } } };
      case 'COMPANY':
        return { model: { productType: { companyId: id } } };
      case 'PRODUCT_TYPE':
        return { model: { productTypeId: id } };
      case 'MODEL':
        return { modelId: id };
    }
  }

  /** Descendant deletions, ordered deepest level first. */
  private cascadeSteps(
    spec: CatalogLevelSpec,
    id: string,
  ): { delegate: CatalogDelegateName; where: Record<string, unknown> }[] {
    switch (spec.key) {
      case 'CATEGORY':
        return [
          { delegate: 'model', where: { productType: { company: { categoryId: id } } } },
          { delegate: 'productType', where: { company: { categoryId: id } } },
          { delegate: 'company', where: { categoryId: id } },
        ];
      case 'COMPANY':
        return [
          { delegate: 'model', where: { productType: { companyId: id } } },
          { delegate: 'productType', where: { companyId: id } },
        ];
      case 'PRODUCT_TYPE':
        return [{ delegate: 'model', where: { productTypeId: id } }];
      case 'MODEL':
        return [];
    }
  }

  private childCountOf(spec: CatalogLevelSpec, row: Row): number {
    const counts = (row._count ?? {}) as Record<string, number>;
    return spec.child ? (counts[spec.child.relation] ?? 0) : (counts.products ?? 0);
  }

  /**
   * Product totals for every node in the tenant's catalog.
   *
   * Four flat queries plus an in-memory roll-up, instead of one COUNT per row.
   * Only the parent-id chain is fetched, so the payload stays small even for a
   * large catalog.
   */
  private async productRollup(tenantId: string): Promise<ProductRollup> {
    const [models, productTypes, companies, grouped] = await Promise.all([
      this.prisma.model.findMany({
        where: { tenantId },
        select: { id: true, productTypeId: true },
      }),
      this.prisma.productType.findMany({
        where: { tenantId },
        select: { id: true, companyId: true },
      }),
      this.prisma.company.findMany({
        where: { tenantId },
        select: { id: true, categoryId: true },
      }),
      this.prisma.product.groupBy({
        by: ['modelId'],
        where: { tenantId },
        _count: { _all: true },
      }),
    ]);

    const productTypeOfModel = new Map(models.map((m) => [m.id, m.productTypeId]));
    const companyOfProductType = new Map(productTypes.map((t) => [t.id, t.companyId]));
    const categoryOfCompany = new Map(companies.map((c) => [c.id, c.categoryId]));

    const rollup: ProductRollup = {
      byModel: new Map(models.map((m) => [m.id, 0])),
      byProductType: new Map(productTypes.map((t) => [t.id, 0])),
      byCompany: new Map(companies.map((c) => [c.id, 0])),
      byCategory: new Map(),
    };

    for (const group of grouped) {
      const count = group._count._all;
      const modelId = group.modelId;
      rollup.byModel.set(modelId, count);

      const productTypeId = productTypeOfModel.get(modelId);
      if (!productTypeId) continue;
      bump(rollup.byProductType, productTypeId, count);

      const companyId = companyOfProductType.get(productTypeId);
      if (!companyId) continue;
      bump(rollup.byCompany, companyId, count);

      const categoryId = categoryOfCompany.get(companyId);
      if (!categoryId) continue;
      bump(rollup.byCategory, categoryId, count);
    }

    return rollup;
  }

  /**
   * Products beneath a node, or `null` when the caller opted out of counting.
   *
   * `null` rather than `0`: a picker that skipped the roll-up would otherwise
   * be told every category has no products, which is indistinguishable from
   * the truth about a genuinely empty one.
   *
   * A MODEL is the exception — its count rides along in the same query as the
   * row itself, so it costs nothing and is always accurate.
   */
  private productCountOf(
    spec: CatalogLevelSpec,
    row: Row,
    rollup: ProductRollup | null,
  ): number | null {
    if (spec.key === 'MODEL') {
      return (row._count as Record<string, number>)?.products ?? 0;
    }
    if (!rollup) return null;

    switch (spec.key) {
      case 'CATEGORY':
        return rollup.byCategory.get(row.id as string) ?? 0;
      case 'COMPANY':
        return rollup.byCompany.get(row.id as string) ?? 0;
      case 'PRODUCT_TYPE':
        return rollup.byProductType.get(row.id as string) ?? 0;
    }
  }

  private buildBreadcrumb(spec: CatalogLevelSpec, row: Row): BreadcrumbEntry[] {
    const trail: BreadcrumbEntry[] = [];

    switch (spec.key) {
      case 'COMPANY':
        trail.push(entry('CATEGORY', row.category));
        break;
      case 'PRODUCT_TYPE':
        trail.push(entry('CATEGORY', row.company?.category), entry('COMPANY', row.company));
        break;
      case 'MODEL':
        trail.push(
          entry('CATEGORY', row.productType?.company?.category),
          entry('COMPANY', row.productType?.company),
          entry('PRODUCT_TYPE', row.productType),
        );
        break;
      case 'CATEGORY':
        break;
    }

    trail.push(entry(spec.key, row));
    return trail.filter(Boolean);
  }

  private toView(spec: CatalogLevelSpec, row: Row, rollup: ProductRollup | null) {
    const breadcrumb = this.buildBreadcrumb(spec, row);
    const parent = spec.parent ? (row[spec.parent.relation] as Row | undefined) : undefined;

    const view: Record<string, unknown> = {
      id: row.id,
      level: spec.key,
      levelLabel: spec.label,
      depth: spec.depth,
      tenantId: row.tenantId,

      name: row.name,
      slug: row.slug,
      description: row.description,
      imageUrl: row.imageUrl ?? null,

      status: row.status,
      visibility: row.visibility,
      position: row.position,
      isPlaceholder: row.isPlaceholder ?? false,
      metaTitle: row.metaTitle ?? null,
      metaDescription: row.metaDescription ?? null,

      parentId: spec.parent ? (row[spec.parent.foreignKey] ?? null) : null,
      parentLevel: spec.parent?.key ?? null,
      parent: parent ? { id: parent.id, name: parent.name, slug: parent.slug } : null,
      breadcrumb,

      childLevel: spec.child?.key ?? null,
      childLevelLabel: spec.child?.labelPlural ?? 'Products',
      childCount: this.childCountOf(spec, row),
      productCount: this.productCountOf(spec, row, rollup),

      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };

    for (const field of spec.extraFields) {
      view[field] = row[field] ?? null;
    }

    return view;
  }

  private treeNode(
    level: CatalogLevelKey,
    row: Row,
    productCount: number | null,
  ): Omit<CatalogTreeNode, 'children'> {
    const spec = specForKey(level);
    return {
      id: row.id as string,
      level,
      levelLabel: spec.label,
      depth: spec.depth,
      name: row.name as string,
      slug: row.slug as string,
      imageUrl: (row.imageUrl as string | null) ?? null,
      icon: (row.icon as string | null) ?? null,
      status: row.status as CatalogStatus,
      visibility: row.visibility as CatalogVisibility,
      position: row.position as number,
      isPlaceholder: (row.isPlaceholder as boolean) ?? false,
      productCount,
    };
  }
}

// -----------------------------------------------------------------------------

function bump(map: Map<string, number>, key: string, amount: number): void {
  map.set(key, (map.get(key) ?? 0) + amount);
}

function groupBy<T>(rows: T[], keyOf: (row: T) => string): Map<string, T[]> {
  const map = new Map<string, T[]>();
  for (const row of rows) {
    const key = keyOf(row);
    const bucket = map.get(key);
    if (bucket) bucket.push(row);
    else map.set(key, [row]);
  }
  return map;
}

function entry(level: CatalogLevelKey, row: Row | undefined): BreadcrumbEntry {
  const spec = specForKey(level);
  return {
    id: row?.id as string,
    name: row?.name as string,
    slug: row?.slug as string,
    level,
    levelLabel: spec.label,
    segment: spec.segment,
  };
}

/** Keeps branches containing a name match, plus the ancestors leading to them. */
function pruneTree(nodes: CatalogTreeNode[], term: string): CatalogTreeNode[] {
  const kept: CatalogTreeNode[] = [];
  for (const node of nodes) {
    const children = pruneTree(node.children ?? [], term);
    const selfMatches = node.name.toLowerCase().includes(term);
    if (selfMatches || children.length > 0) {
      kept.push({ ...node, children: selfMatches ? node.children : children });
    }
  }
  return kept;
}
