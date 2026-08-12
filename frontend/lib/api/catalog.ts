/**
 * The catalog hierarchy, as the API describes it.
 *
 *   Category → Company → Product Type → Model → Product
 *
 * The four upper levels are structurally identical: same fields, same CRUD,
 * same validation. Everything here is therefore written once and parameterised
 * by level, which is what lets one list screen and one form serve all four.
 *
 * See backend/src/catalog/catalog.constants.ts — this file mirrors the shape
 * `GET /admin/catalog/levels` returns.
 */

export type CatalogLevelKey = "CATEGORY" | "COMPANY" | "PRODUCT_TYPE" | "MODEL";

/** URL segment for a level, in both the API path and our own routes. */
export type CatalogSegment =
  | "categories"
  | "companies"
  | "product-types"
  | "models";

export type CatalogStatus = "ACTIVE" | "ARCHIVED";
export type CatalogVisibility = "VISIBLE" | "HIDDEN";

export const catalogStatusLabel: Record<CatalogStatus, string> = {
  ACTIVE: "Active",
  ARCHIVED: "Archived",
};

export const catalogVisibilityLabel: Record<CatalogVisibility, string> = {
  VISIBLE: "Visible",
  HIDDEN: "Hidden",
};

/** One entry of `GET /admin/catalog/levels`. */
export type CatalogLevelSpec = {
  key: CatalogLevelKey;
  label: string;
  labelPlural: string;
  segment: CatalogSegment;
  /** 0 for Category … 3 for Model. */
  depth: number;
  parent: { key: CatalogLevelKey; label: string; segment: CatalogSegment } | null;
  child: {
    key: CatalogLevelKey;
    label: string;
    labelPlural: string;
    segment: CatalogSegment;
  } | null;
  /** True only for Model: products attach there and nowhere else. */
  holdsProducts: boolean;
};

/**
 * A crumb as it arrives on every node, every list row and every product.
 * Root first, and it includes the node itself.
 */
export type BreadcrumbEntry = {
  id: string;
  name: string;
  slug: string;
  level: CatalogLevelKey;
  levelLabel: string;
  segment: CatalogSegment;
};

/** A node at any of the four levels. */
export type CatalogNode = {
  id: string;
  level: CatalogLevelKey;
  levelLabel: string;
  depth: number;
  tenantId: string;

  name: string;
  slug: string;
  description: string;
  imageUrl: string | null;

  status: CatalogStatus;
  visibility: CatalogVisibility;
  position: number;
  metaTitle: string | null;
  metaDescription: string | null;

  parentId: string | null;
  parentLevel: CatalogLevelKey | null;
  parent: { id: string; name: string; slug: string } | null;
  breadcrumb: BreadcrumbEntry[];

  /** null on a Model, whose children are products rather than a level. */
  childLevel: CatalogLevelKey | null;
  /** "Companies", "Product Types", … and "Products" for a Model. */
  childLevelLabel: string;
  /** Direct children only. Always counted. */
  childCount: number;
  /**
   * Products anywhere beneath, or `null` when the list was fetched with
   * `withCounts=false` and the roll-up was skipped.
   *
   * A Model is the exception: its products are a direct relation rather than a
   * roll-up, so it reports a real number either way. Don't rely on that —
   * treat null as "not asked for" at every level.
   */
  productCount: number | null;

  /**
   * A node the migration invented so every product had somewhere to hang —
   * the "General" product types and models. Not a naming convention: an admin
   * may legitimately call something General, so this is a real column.
   */
  isPlaceholder: boolean;

  createdAt: string;
  updatedAt: string;

  /* Level-specific extras — present only on the level that declares them. */
  /** Category only. A lucide icon key, for tiles and nav with no artwork. */
  icon?: string | null;
  /** @deprecated Category only, legacy upload metadata. Backfilled into `imageUrl`; do not write. */
  thumbnailName?: string | null;
  /** @deprecated As above. */
  thumbnailSize?: string | null;
  /** Model only. */
  releaseYear?: number | null;
};

/** A node inside `GET /admin/catalog/tree`. Lighter than a full node. */
export type CatalogTreeNode = {
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
  productCount: number;
  children: CatalogTreeNode[];
};

export type CatalogStats = {
  categories: number;
  companies: number;
  productTypes: number;
  models: number;
  products: number;
  /**
   * Models with no products. A different set from the placeholders below — it
   * includes genuine models an admin created but hasn't stocked yet, so
   * neither figure is a proxy for the other.
   */
  emptyModels: number;
  /** Nodes the migration invented, per level. The clean-up list. */
  placeholders: {
    categories: number;
    companies: number;
    productTypes: number;
    models: number;
    total: number;
  };
};

/** Create/update body. One shape for all four levels; extras are ignored by
 *  the levels that don't declare them, rather than rejected. */
export type CatalogNodeBody = {
  name?: string;
  parentId?: string;
  slug?: string;
  description?: string;
  imageUrl?: string;
  status?: CatalogStatus;
  visibility?: CatalogVisibility;
  position?: number;
  metaTitle?: string;
  metaDescription?: string;
  /** Clearing this is how a placeholder node is marked as filed. */
  isPlaceholder?: boolean;
  /** Category only. A lucide icon key. */
  icon?: string;
  /** Model only. */
  releaseYear?: number;
};

export type CatalogNodeQuery = {
  parentId?: string;
  categoryId?: string;
  companyId?: string;
  productTypeId?: string;
  search?: string;
  status?: CatalogStatus;
  visibility?: CatalogVisibility;
  /** true = the needs-filing list, false = genuine catalogue only. */
  isPlaceholder?: boolean;
  page?: number;
  limit?: number;
  sortBy?: "position" | "name" | "createdAt" | "updatedAt";
  sortOrder?: "asc" | "desc";
  /**
   * Skip the product roll-up — worth it on pickers. Nodes then report
   * `productCount: null` rather than a number.
   */
  withCounts?: boolean;
};

/* ---- Static mirror of the registry ---------------------------------------
 *
 * `GET /admin/catalog/levels` is the source of truth and the UI reads it, but
 * a route also has to validate its own `[level]` segment before any request is
 * made, and labels should not pop in after a round-trip. This is the same data,
 * used for the first paint and for routing; the fetched copy takes over.
 */

export const CATALOG_LEVELS: readonly CatalogLevelSpec[] = [
  {
    key: "CATEGORY",
    label: "Category",
    labelPlural: "Categories",
    segment: "categories",
    depth: 0,
    parent: null,
    child: {
      key: "COMPANY",
      label: "Company",
      labelPlural: "Companies",
      segment: "companies",
    },
    holdsProducts: false,
  },
  {
    key: "COMPANY",
    label: "Company",
    labelPlural: "Companies",
    segment: "companies",
    depth: 1,
    parent: { key: "CATEGORY", label: "Category", segment: "categories" },
    child: {
      key: "PRODUCT_TYPE",
      label: "Product Type",
      labelPlural: "Product Types",
      segment: "product-types",
    },
    holdsProducts: false,
  },
  {
    key: "PRODUCT_TYPE",
    label: "Product Type",
    labelPlural: "Product Types",
    segment: "product-types",
    depth: 2,
    parent: { key: "COMPANY", label: "Company", segment: "companies" },
    child: {
      key: "MODEL",
      label: "Model",
      labelPlural: "Models",
      segment: "models",
    },
    holdsProducts: false,
  },
  {
    key: "MODEL",
    label: "Model",
    labelPlural: "Models",
    segment: "models",
    depth: 3,
    parent: { key: "PRODUCT_TYPE", label: "Product Type", segment: "product-types" },
    child: null,
    holdsProducts: true,
  },
] as const;

export const CATALOG_SEGMENTS = CATALOG_LEVELS.map((l) => l.segment);

const BY_SEGMENT = new Map(CATALOG_LEVELS.map((l) => [l.segment, l]));
const BY_KEY = new Map(CATALOG_LEVELS.map((l) => [l.key, l]));

export function isCatalogSegment(value: string): value is CatalogSegment {
  return BY_SEGMENT.has(value as CatalogSegment);
}

/** Spec for a URL segment, or undefined when the segment is not a level. */
export function levelForSegment(
  segment: string,
): CatalogLevelSpec | undefined {
  return BY_SEGMENT.get(segment as CatalogSegment);
}

export function levelForKey(key: CatalogLevelKey): CatalogLevelSpec {
  return BY_KEY.get(key)!;
}

/** The admin route for a node. Every crumb carries its own `segment`. */
export function catalogNodeHref(segment: CatalogSegment, id: string): string {
  return `/admin/catalog/${segment}/${id}`;
}

export function catalogLevelHref(segment: CatalogSegment): string {
  return `/admin/catalog/${segment}`;
}

/** The href for a breadcrumb entry, from a node response or a product. */
export function crumbHref(crumb: BreadcrumbEntry): string {
  return catalogNodeHref(crumb.segment, crumb.id);
}

/**
 * The `/admin/products` query param that selects everything beneath a node.
 *
 * Only a Model owns products directly; the three levels above filter through
 * their descendants. The products endpoint accepts all four, so "show me
 * everything Samsung makes" is one request rather than a walk down the tree.
 */
export const PRODUCT_FILTER_PARAM: Record<CatalogLevelKey, string> = {
  CATEGORY: "categoryId",
  COMPANY: "companyId",
  PRODUCT_TYPE: "productTypeId",
  MODEL: "modelId",
};

/** Link to the products table, filtered to everything beneath a node. */
export function productsBeneathHref(level: CatalogLevelKey, id: string): string {
  return `/admin/products?${PRODUCT_FILTER_PARAM[level]}=${encodeURIComponent(id)}`;
}
