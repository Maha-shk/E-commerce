/**
 * The catalog hierarchy, described once.
 *
 *   Category → Company → ProductType → Model → Product
 *
 * Every rule that depends on the shape of the tree — which parent a level
 * requires, which table to query, how to reach an ancestor, what to cascade on
 * delete — is read off this registry rather than written out four times. Adding
 * a level means adding an entry here and a Prisma model; no service or
 * controller changes.
 */

export type CatalogLevelKey = 'CATEGORY' | 'COMPANY' | 'PRODUCT_TYPE' | 'MODEL';

/** Prisma delegate names for the four level tables. */
export type CatalogDelegateName = 'category' | 'company' | 'productType' | 'model';

/** URL segment for each level under /admin/catalog. */
export type CatalogSegment =
  | 'categories'
  | 'companies'
  | 'product-types'
  | 'models';

export interface CatalogLevelSpec {
  key: CatalogLevelKey;
  delegate: CatalogDelegateName;
  segment: CatalogSegment;
  label: string;
  labelPlural: string;
  /** 0 for CATEGORY … 3 for MODEL. */
  depth: number;

  /** Absent only for CATEGORY, which is the root of the tree. */
  parent?: {
    key: CatalogLevelKey;
    label: string;
    segment: CatalogSegment;
    /** Column on this level holding the parent id. */
    foreignKey: 'categoryId' | 'companyId' | 'productTypeId';
    /** Relation field on this level pointing at the parent row. */
    relation: 'category' | 'company' | 'productType';
  };

  /** Absent only for MODEL, whose children are Products rather than a level. */
  child?: {
    key: CatalogLevelKey;
    label: string;
    labelPlural: string;
    segment: CatalogSegment;
    /** Collection field on this level, used for `_count`. */
    relation: 'companies' | 'productTypes' | 'models';
  };

  /** True for MODEL: products attach here and nowhere else. */
  holdsProducts: boolean;

  /**
   * Relation path from this level to each ancestor's foreign key, used to build
   * nested `where` clauses for ancestor filters. For MODEL:
   *   categoryId → ['productType', 'company', 'categoryId']
   * becomes `{ productType: { company: { categoryId: <value> } } }`.
   */
  ancestorPaths: Partial<
    Record<'categoryId' | 'companyId' | 'productTypeId', string[]>
  >;

  /**
   * Level-specific writable fields on top of the shared set (name, slug,
   * description, imageUrl, status, visibility, position, SEO).
   */
  extraFields: readonly string[];
}

export const CATEGORY_SPEC: CatalogLevelSpec = {
  key: 'CATEGORY',
  delegate: 'category',
  segment: 'categories',
  label: 'Category',
  labelPlural: 'Categories',
  depth: 0,
  child: {
    key: 'COMPANY',
    label: 'Company',
    labelPlural: 'Companies',
    segment: 'companies',
    relation: 'companies',
  },
  holdsProducts: false,
  ancestorPaths: {},
  extraFields: ['icon', 'thumbnailName', 'thumbnailSize'],
};

export const COMPANY_SPEC: CatalogLevelSpec = {
  key: 'COMPANY',
  delegate: 'company',
  segment: 'companies',
  label: 'Company',
  labelPlural: 'Companies',
  depth: 1,
  parent: {
    key: 'CATEGORY',
    label: 'Category',
    segment: 'categories',
    foreignKey: 'categoryId',
    relation: 'category',
  },
  child: {
    key: 'PRODUCT_TYPE',
    label: 'Product Type',
    labelPlural: 'Product Types',
    segment: 'product-types',
    relation: 'productTypes',
  },
  holdsProducts: false,
  ancestorPaths: { categoryId: ['categoryId'] },
  extraFields: [],
};

export const PRODUCT_TYPE_SPEC: CatalogLevelSpec = {
  key: 'PRODUCT_TYPE',
  delegate: 'productType',
  segment: 'product-types',
  label: 'Product Type',
  labelPlural: 'Product Types',
  depth: 2,
  parent: {
    key: 'COMPANY',
    label: 'Company',
    segment: 'companies',
    foreignKey: 'companyId',
    relation: 'company',
  },
  child: {
    key: 'MODEL',
    label: 'Model',
    labelPlural: 'Models',
    segment: 'models',
    relation: 'models',
  },
  holdsProducts: false,
  ancestorPaths: {
    companyId: ['companyId'],
    categoryId: ['company', 'categoryId'],
  },
  extraFields: [],
};

export const MODEL_SPEC: CatalogLevelSpec = {
  key: 'MODEL',
  delegate: 'model',
  segment: 'models',
  label: 'Model',
  labelPlural: 'Models',
  depth: 3,
  parent: {
    key: 'PRODUCT_TYPE',
    label: 'Product Type',
    segment: 'product-types',
    foreignKey: 'productTypeId',
    relation: 'productType',
  },
  holdsProducts: true,
  ancestorPaths: {
    productTypeId: ['productTypeId'],
    companyId: ['productType', 'companyId'],
    categoryId: ['productType', 'company', 'categoryId'],
  },
  extraFields: ['releaseYear'],
};

/** Root-to-leaf, the canonical order. */
export const CATALOG_LEVELS: readonly CatalogLevelSpec[] = [
  CATEGORY_SPEC,
  COMPANY_SPEC,
  PRODUCT_TYPE_SPEC,
  MODEL_SPEC,
] as const;

const BY_SEGMENT = new Map(CATALOG_LEVELS.map((s) => [s.segment, s]));
const BY_KEY = new Map(CATALOG_LEVELS.map((s) => [s.key, s]));

/** Spec for a URL segment ("companies"), or undefined if it is not a level. */
export function specForSegment(segment: string): CatalogLevelSpec | undefined {
  return BY_SEGMENT.get(segment as CatalogSegment);
}

export function specForKey(key: CatalogLevelKey): CatalogLevelSpec {
  const spec = BY_KEY.get(key);
  if (!spec) throw new Error(`Unknown catalog level: ${key}`);
  return spec;
}

/**
 * Prisma `include` for each level: the full ancestor chain (so every response
 * can carry a breadcrumb without a second round-trip) plus a count of the
 * level's own children.
 */
export const CATALOG_INCLUDE: Record<CatalogLevelKey, object> = {
  CATEGORY: {
    _count: { select: { companies: true } },
  },
  COMPANY: {
    category: { select: { id: true, name: true, slug: true } },
    _count: { select: { productTypes: true } },
  },
  PRODUCT_TYPE: {
    company: {
      select: {
        id: true,
        name: true,
        slug: true,
        category: { select: { id: true, name: true, slug: true } },
      },
    },
    _count: { select: { models: true } },
  },
  MODEL: {
    productType: {
      select: {
        id: true,
        name: true,
        slug: true,
        company: {
          select: {
            id: true,
            name: true,
            slug: true,
            category: { select: { id: true, name: true, slug: true } },
          },
        },
      },
    },
    _count: { select: { products: true } },
  },
};

/**
 * Turns a relation path plus a value into a nested Prisma `where`.
 * `['productType', 'company', 'categoryId'], 'abc'`
 *   → `{ productType: { company: { categoryId: 'abc' } } }`
 */
export function nestedWhere(
  path: string[],
  value: string,
): Record<string, unknown> {
  let where: Record<string, unknown> = { [path[path.length - 1]]: value };
  for (let i = path.length - 2; i >= 0; i--) {
    where = { [path[i]]: where };
  }
  return where;
}
