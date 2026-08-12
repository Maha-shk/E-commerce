import { api } from '../client';
import type { ApiResponse, PaginatedResponse } from '../types';
import type { PublicOrder } from '../order-types';

// Types
export interface Banner {
  id: string;
  type: 'HERO' | 'PROMOTIONAL' | 'SIDEBAR';
  title: string;
  description?: string;
  imageUrl: string;
  mobileImageUrl?: string;
  linkUrl?: string;
  linkText?: string;
}

/** A node of the storefront hierarchy: Category → Company → Product Type → Model. */
export interface CatalogNodeRef {
  id: string;
  name: string;
  slug: string;
}

export interface StorefrontCrumb extends CatalogNodeRef {
  level: 'CATEGORY' | 'COMPANY' | 'PRODUCT_TYPE' | 'MODEL';
  segment: 'categories' | 'companies' | 'product-types' | 'models';
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  /** A lucide icon key, for tiles and nav where there is no artwork. */
  icon: string | null;
  /** The shared image field across all four levels. Backfilled from thumbnailName. */
  imageUrl: string | null;
  /** @deprecated Legacy upload metadata, backfilled into `imageUrl`. Do not read. */
  thumbnailName: string | null;
  /** Brands inside this category. */
  companyCount: number;
  productCount: number;
}

/** A brand. `/public/brands` returns Company rows now, not bare strings. */
export interface Brand {
  id: string;
  name: string;
  slug: string;
  imageUrl: string | null;
  categoryId: string;
}

/** One level of the storefront tree, as returned by /public/catalog/tree. */
export interface PublicCatalogNode {
  id: string;
  level: StorefrontCrumb['level'];
  levelLabel: string;
  depth: number;
  name: string;
  slug: string;
  imageUrl: string | null;
  icon: string | null;
  productCount: number;
  children: PublicCatalogNode[];
}

export interface Product {
  id: string;
  name: string;
  /**
   * The Company's name, flattened onto the product.
   *
   * Permanent, not a shim: a product card genuinely wants the brand inline,
   * and making every consumer walk `product.company.name` would be worse.
   */
  brand: string;
  description: string;
  sku: string;
  stock: number;
  status: 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK';
  price: number;
  salePrice: number;
  discountPercent: number;
  visibility: 'PUBLIC' | 'PRIVATE' | 'SCHEDULED';
  tags: string[];
  /** @deprecated Duplicates `category.id`; kept so the old filter kept working. */
  categoryId: string | null;
  category: CatalogNodeRef | null;
  /** The rest of the classification, for linking back up the tree. */
  company: (CatalogNodeRef & { imageUrl: string | null }) | null;
  productType: CatalogNodeRef | null;
  model: CatalogNodeRef | null;
  breadcrumb: StorefrontCrumb[];
  images: Array<{
    id: string;
    url: string;
    position: number;
  }>;
  /**
   * Admin-configured options for this product (Prisma `ProductVariant`).
   * The API has always returned these — the type just never declared them, so
   * the product page fell back to hardcoded fake "Color"/"Size" lists.
   */
  variants?: Array<{
    id: string;
    productId: string;
    name: string;
  }>;
  variantCount: number;
  inStock: boolean;
  lowStock: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface FeaturedProductResponse {
  success: true;
  data: Product[];
}

// Service methods
export const publicService = {
  /**
   * Get banners for homepage
   */
  async getBanners(params?: {
    type?: 'HERO' | 'PROMOTIONAL' | 'SIDEBAR';
    isActive?: boolean;
    limit?: number;
  }): Promise<ApiResponse<Banner[]>> {
    const { data } = await api.get<ApiResponse<Banner[]>>('/public/banners', {
      params,
    });
    return data;
  },

  /**
   * Get categories for storefront
   */
  async getCategories(params?: {
    parentId?: string;
    limit?: number;
  }): Promise<ApiResponse<Category[]>> {
    const { data } = await api.get<ApiResponse<Category[]>>(
      '/public/categories',
      { params },
    );
    return data;
  },

  /**
   * Get products with filters.
   *
   * Any level of the hierarchy narrows the list, and the deeper ones pull
   * everything beneath them — `companyId` is "everything this brand makes".
   */
  async getProducts(params?: {
    categoryId?: string;
    companyId?: string;
    productTypeId?: string;
    modelId?: string;
    search?: string;
    bestsellers?: boolean;
    newArrivals?: boolean;
    sale?: boolean;
    page?: number;
    limit?: number;
  }): Promise<PaginatedResponse<Product>> {
    const { data } = await api.get<PaginatedResponse<Product>>(
      '/public/products',
      { params },
    );
    return data;
  },

  /**
   * Get single product by ID or slug
   */
  async getProduct(params: {
    id?: string;
    slug?: string;
  }): Promise<ApiResponse<Product>> {
    const { data } = await api.get<ApiResponse<Product>>(
      '/public/products/detail',
      { params },
    );
    return data;
  },

  /**
   * Get featured products by section
   */
  async getFeaturedProducts(params: {
    section: 'BEST_SELLERS' | 'NEW_ARRIVALS' | 'SALE';
    limit?: number;
  }): Promise<FeaturedProductResponse> {
    const { data } = await api.get<FeaturedProductResponse>(
      '/public/featured-products',
      { params },
    );
    return data;
  },
  /**
   * Sends a contact-form message. Creates (or appends to) the customer's
   * support conversation, which the admin console reads.
   */
  /**
   * Checks a promo code before checkout. Returns the campaign terms so the
   * summary can preview the reduction; the server re-applies it on the order.
   */
  async validateDiscount(code: string): Promise<
    | { valid: true; code: string; type: "PERCENTAGE" | "FIXED_AMOUNT"; value: number }
    | { valid: false; reason: string }
  > {
    const { data } = await api.get<ApiResponse<any>>(
      `/public/discounts/validate/${encodeURIComponent(code)}`,
    );
    return data.data;
  },

  /** Admin-edited body for a legal page, or null to use the built-in copy. */
  async getLegalDocument(
    id: string,
  ): Promise<{ body: string; updatedAt: string | null } | null> {
    const { data } = await api.get<
      ApiResponse<{ body: string; updatedAt: string | null } | null>
    >(`/public/legal/${encodeURIComponent(id)}`);
    return data.data;
  },

  async submitContact(payload: {
    name: string;
    email: string;
    subject: string;
    message: string;
  }): Promise<{ conversationId: string; message: string }> {
    const { data } = await api.post<
      ApiResponse<{ conversationId: string; message: string }>
    >("/public/contact", payload);
    return data.data;
  },


  /**
   * Get the brands that have something to sell.
   *
   * Returns Company objects, not strings — a brand is a real node now, so it
   * has an id to filter by, a slug to link to and a logo. Only companies with
   * at least one public product are listed, so a filter never offers a choice
   * that yields nothing.
   */
  async getBrands(params?: { categoryId?: string }): Promise<ApiResponse<Brand[]>> {
    const { data } = await api.get<ApiResponse<Brand[]>>('/public/brands', {
      params,
    });
    return data;
  },

  /**
   * The storefront navigation tree.
   *
   * Archived and hidden branches are stripped server-side, so whatever comes
   * back is safe to render as a menu. `depth=1` is a top-level menu, `depth=3`
   * the full drill-down.
   */
  async getCatalogTree(params?: {
    depth?: number;
    categoryId?: string;
    search?: string;
  }): Promise<ApiResponse<PublicCatalogNode[]>> {
    const { data } = await api.get<ApiResponse<PublicCatalogNode[]>>(
      '/public/catalog/tree',
      { params },
    );
    return data;
  },

  // `/public/catalog/:level` and `/public/catalog/:level/:id` are available and
  // would back brand and product-type landing pages, which the storefront does
  // not have yet. Left unwrapped rather than shipping a client for a screen
  // that doesn't exist — see the handover notes.

  /**
   * Get order details by order number
   */
  async getOrder(orderNumber: string): Promise<ApiResponse<PublicOrder>> {
    const { data } = await api.get<ApiResponse<PublicOrder>>(
      `/public/orders/${orderNumber}`
    );
    return data;
  },
};
