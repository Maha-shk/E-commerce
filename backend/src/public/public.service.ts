import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ProductsService } from '../products/products.service';
import { CatalogService } from '../catalog/catalog.service';
import { CATEGORY_SPEC } from '../catalog/catalog.constants';
import { MessagesService } from '../messages/messages.service';
import { DiscountsService } from '../discounts/discounts.service';
import { PrismaService } from '../prisma/prisma.service';
import {
  BannerType,
  CatalogStatus,
  CatalogVisibility,
  FeaturedSection,
  MessageDirection,
  NotificationCategory,
  NotificationType,
  ProductVisibility,
  Role,
  OrderStatus,
  PaymentStatus,
  Prisma,
} from '@prisma/client';
import { ContactFormDto } from './dto/contact.dto';
import { UNCLAIMED_PASSWORD_HASH } from '../common/constants/account.constants';
import { NotificationsService } from '../notifications/notifications.service';
import {
  CreatePublicOrderDto,
  OrderAddressDto,
  OrderContactDto,
} from './dto/create-order.dto';

/**
 * How many products to pull before ranking or filtering a storefront section.
 *
 * Sections order the whole catalogue (best sellers by units sold, sale by
 * discount), so slicing to the requested limit first would rank only the newest
 * few rows. Wide enough for this catalogue; if it grows past this, these
 * sections should move into SQL.
 */
const SECTION_SCAN_LIMIT = 200;

/** At or below this stock level a product triggers a low-stock notification. */
const LOW_STOCK_THRESHOLD = 10;

/** How many of the newest products the "New Arrivals" browse surfaces. */
const NEW_ARRIVALS_WINDOW = 24;

/**
 * Shipping rules, mirroring `CartService` so the price quoted in the cart is
 * the price charged at checkout.
 */
const FREE_SHIPPING_THRESHOLD = 100;
const STANDARD_SHIPPING_RATE = 10;
const EXPRESS_SHIPPING_RATE = 25;

/** Money is stored as Decimal(12,2); keep intermediate maths to the same scale. */
function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

/**
 * Express is always charged — the free-shipping threshold is a standard-
 * delivery perk, not a free upgrade.
 */
function resolveShippingCost(subtotal: number, deliveryMethod?: string): number {
  if (deliveryMethod === 'express') return EXPRESS_SHIPPING_RATE;
  return subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : STANDARD_SHIPPING_RATE;
}

/**
 * Validates a checkout line's variant choice against the product.
 *
 * Mirrors `CartService.resolveVariantId` so an order can't slip through with a
 * missing or foreign variant just because it skipped the cart. Returns the
 * matched variant, or null for products that have none.
 */
function resolveOrderVariant(
  product: { name: string; variants: { id: string; name: string }[] },
  variantId?: string,
): { id: string; name: string } | null {
  if (product.variants.length === 0) {
    if (variantId) {
      throw new BadRequestException(
        `"${product.name}" has no variants to choose from`,
      );
    }
    return null;
  }

  if (!variantId) {
    const options = product.variants.map((v) => v.name).join(', ');
    throw new BadRequestException(
      `Select a variant for "${product.name}" (${options})`,
    );
  }

  const match = product.variants.find((v) => v.id === variantId);
  if (!match) {
    throw new BadRequestException(
      `"${variantId}" is not a variant of "${product.name}"`,
    );
  }

  return match;
}

/**
 * Next sequential order number, e.g. "ORD-2026-0007".
 *
 * `orderNumber` is unique, and the previous implementation picked a random
 * 4-digit suffix — with only 9000 values a collision (and a 500) was a matter
 * of time. Runs inside the order transaction so the read and the insert can't
 * interleave with another checkout.
 */
async function nextOrderNumber(
  tx: Prisma.TransactionClient,
  tenantId: string,
): Promise<string> {
  const prefix = `ORD-${new Date().getFullYear()}-`;

  const latest = await tx.order.findFirst({
    where: { tenantId, orderNumber: { startsWith: prefix } },
    orderBy: { orderNumber: 'desc' },
    select: { orderNumber: true },
  });

  const lastSequence = latest
    ? Number.parseInt(latest.orderNumber.slice(prefix.length), 10) || 0
    : 0;

  return `${prefix}${String(lastSequence + 1).padStart(4, '0')}`;
}

@Injectable()
export class PublicService {
  private readonly logger = new Logger(PublicService.name);

  constructor(
    private readonly productsService: ProductsService,
    private readonly catalog: CatalogService,
    private readonly messagesService: MessagesService,
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
    private readonly discounts: DiscountsService,
  ) {}

  /**
   * Active storefront banners for a given slot (HERO / PROMOTIONAL / SIDEBAR).
   *
   * Honours the `startDate`/`endDate` scheduling window: a banner with no dates
   * runs indefinitely, otherwise it only appears inside its window. Ordering is
   * `displayOrder` first — the homepage takes `[0]` as the hero, so that column
   * is what decides which one wins.
   */
  async getBanners(
    tenantId: string,
    params?: {
      type?: string;
      isActive?: boolean;
      limit?: number;
    },
  ) {
    const now = new Date();

    const banners = await this.prisma.banner.findMany({
      where: {
        tenantId,
        ...(params?.type && { type: params.type as BannerType }),
        ...(params?.isActive !== undefined && { isActive: params.isActive }),
        // `null` means "no bound", so each side is an OR against null.
        AND: [
          { OR: [{ startDate: null }, { startDate: { lte: now } }] },
          { OR: [{ endDate: null }, { endDate: { gte: now } }] },
        ],
      },
      orderBy: [{ displayOrder: 'asc' }, { createdAt: 'desc' }],
      ...(params?.limit && { take: Number(params.limit) }),
    });

    return {
      success: true,
      data: banners.map((banner) => ({
        id: banner.id,
        type: banner.type,
        title: banner.title,
        description: banner.description ?? undefined,
        imageUrl: banner.imageUrl,
        mobileImageUrl: banner.mobileImageUrl ?? undefined,
        linkUrl: banner.linkUrl ?? undefined,
        linkText: banner.linkText ?? undefined,
      })),
    };
  }

  async getCategories(tenantId: string, params?: any) {
    const result = await this.catalog.list(tenantId, CATEGORY_SPEC, {
      page: Number(params?.page) || 1,
      limit: Number(params?.limit) || 100,
      sortBy: 'position',
      sortOrder: 'asc',
      withCounts: true,
      // Same rule as products: an archived or hidden category is an admin-side
      // state and must never reach the storefront. Not caller controlled.
      status: CatalogStatus.ACTIVE,
      visibility: CatalogVisibility.VISIBLE,
    });

    return {
      success: true,
      data: result.data.map((cat: any) => ({
        id: cat.id,
        name: cat.name,
        slug: cat.slug,
        description: cat.description || '',
        icon: cat.icon || null,
        imageUrl: cat.imageUrl || null,
        thumbnailName: cat.thumbnailName || null,
        companyCount: cat.childCount ?? 0,
        productCount: cat.productCount ?? 0,
      })),
    };
  }

  async getProducts(tenantId: string, params?: any) {
    // Ensure pagination params have defaults
    const page = params?.page ? Number(params.page) : 1;
    const limit = params?.limit ? Number(params.limit) : 20;

    // `bestsellers` / `newArrivals` / `sale` rank or filter across the whole
    // catalogue, so the ordering has to be applied before the page is cut.
    // Fetch a wide slice, narrow it, then paginate in memory.
    const isSection = Boolean(
      params?.bestsellers || params?.newArrivals || params?.sale,
    );

    const queryParams = {
      page: isSection ? 1 : page,
      limit: isSection ? SECTION_SCAN_LIMIT : limit,
      skip: isSection ? 0 : (page - 1) * limit,
      sortBy: 'createdAt' as const,
      sortOrder: 'desc' as const,
      ...(params?.categoryId && { categoryId: params.categoryId }),
      ...(params?.companyId && { companyId: params.companyId }),
      ...(params?.productTypeId && { productTypeId: params.productTypeId }),
      ...(params?.modelId && { modelId: params.modelId }),
      ...(params?.search && { search: params.search }),
      // The storefront only ever shows PUBLIC products. This is not caller
      // controlled: the admin's PRIVATE and SCHEDULED products were previously
      // served to anonymous shoppers because no visibility filter was applied.
      visibility: ProductVisibility.PUBLIC,
    };

    const products = await this.productsService.findAll(tenantId, queryParams);
    let rows = products.data;
    let total = products.meta?.total ?? rows.length;

    if (isSection) {
      if (params?.sale) {
        rows = rows.filter((p: any) => (p.discount || 0) > 0);
      }
      if (params?.newArrivals) {
        // Already sorted newest-first by the query above.
        rows = rows.slice(0, NEW_ARRIVALS_WINDOW);
      }
      if (params?.bestsellers) {
        rows = await this.rankBySalesVolume(tenantId, rows);
      }

      total = rows.length;
      rows = rows.slice((page - 1) * limit, page * limit);
    }

    rows = await this.withVariantRows(rows);

    return {
      success: true,
      data: rows.map((product: any) => this.toStorefrontProduct(product)),
      meta: { ...products.meta, total },
    };
  }

  /**
   * Products that have actually sold, ranked by units sold (best first).
   *
   * Products with **no** sales are excluded, not merely pushed to the bottom.
   * Ranking alone still returned the whole catalogue, so a brand-new product
   * appeared under a "Best Sellers" heading purely because nothing outranked
   * it. A best seller is something people bought; zero sales disqualifies.
   *
   * Consequence worth knowing: a catalogue with no order history yields an
   * empty rail. That is the honest answer — the storefront renders its empty
   * state rather than passing newest-first off as best-selling.
   *
   * `OrderItem` records the SKU rather than a product relation, so the join is
   * on SKU. Only PAID-or-later orders count, so an abandoned PENDING order
   * can't inflate a ranking.
   */
  private async rankBySalesVolume<T extends { sku?: string }>(
    tenantId: string,
    rows: T[],
  ): Promise<T[]> {
    const skus = rows.map((r) => r.sku).filter(Boolean) as string[];
    if (skus.length === 0) return [];

    const grouped = await this.prisma.orderItem.groupBy({
      by: ['sku'],
      where: {
        sku: { in: skus },
        // A cancelled or unpaid order is not a sale.
        order: {
          tenantId,
          paymentStatus: PaymentStatus.PAID,
          status: { notIn: [OrderStatus.CANCELLED, OrderStatus.RETURNED] },
        },
      },
      _sum: { quantity: true },
    });

    const unitsBySku = new Map(
      grouped
        .filter((g) => (g._sum.quantity ?? 0) > 0)
        .map((g) => [g.sku, g._sum.quantity ?? 0]),
    );

    return rows
      .map((row, index) => ({
        row,
        index, // preserves newest-first ordering within an equal-sales group
        units: unitsBySku.get(row.sku ?? '') ?? 0,
      }))
      .filter((entry) => entry.units > 0)
      .sort((a, b) => b.units - a.units || a.index - b.index)
      .map((entry) => entry.row);
  }

  async getProduct(tenantId: string, params: { id?: string; slug?: string }) {
    if (!params.id) {
      // Was a bare Error, which surfaced as a 500 for what is a client mistake.
      throw new BadRequestException('Product ID is required');
    }

    const found = await this.productsService.findOne(tenantId, params.id);

    // findOne is the admin lookup and ignores visibility. Without this check a
    // PRIVATE or SCHEDULED product's detail page is reachable by guessing an id.
    if (found.visibility !== ProductVisibility.PUBLIC) {
      throw new NotFoundException(`Product ${params.id} not found`);
    }

    // The detail page is what feeds the variant picker, so it above all needs
    // ids rather than the flattened names.
    const [product] = await this.withVariantRows([found]);

    return { success: true, data: this.toStorefrontProduct(product) };
  }

  /**
   * Products for a homepage rail.
   *
   * Every section used to fall through to "newest N", which made BEST_SELLERS
   * and NEW_ARRIVALS return byte-identical lists. Each one now means what its
   * name says:
   *
   *   BEST_SELLERS - ranked by units actually sold (OrderItem quantities)
   *   NEW_ARRIVALS - newest by createdAt
   *   SALE         - discounted only, newest first
   *
   * An admin can override any rail through the `FeaturedProduct` table; when a
   * section has no curated rows the automatic ranking above is used, so the
   * homepage is never empty.
   */
  async getFeaturedProducts(
    tenantId: string,
    params: { section: string; limit?: number },
  ) {
    const limit = Number(params.limit) || 4;
    const section = params.section as FeaturedSection;

    const curated = await this.getCuratedSection(tenantId, section, limit);
    if (curated.length > 0) {
      return { success: true, data: curated.map((p) => this.toStorefrontProduct(p)) };
    }

    const products = await this.productsService.findAll(tenantId, {
      page: 1,
      // Scan wide, then rank/filter — the interesting product may not be in
      // the newest `limit` rows.
      limit: SECTION_SCAN_LIMIT,
      skip: 0,
      sortBy: 'createdAt' as const,
      sortOrder: 'desc' as const,
      visibility: ProductVisibility.PUBLIC,
    });

    let filteredProducts = products.data;

    if (section === 'SALE') {
      filteredProducts = filteredProducts.filter((p: any) => (p.discount || 0) > 0);
    } else if (section === 'BEST_SELLERS') {
      filteredProducts = await this.rankBySalesVolume(tenantId, filteredProducts);
    }
    // NEW_ARRIVALS needs no extra work: the query is already newest-first.

    filteredProducts = filteredProducts.slice(0, limit);

    return {
      success: true,
      data: (await this.withVariantRows(filteredProducts)).map((product: any) =>
        this.toStorefrontProduct(product),
      ),
    };
  }

  /**
   * Admin-curated rows for a rail, newest curation first within display order.
   * Returns `[]` when the section has not been curated, which is the signal to
   * fall back to the automatic ranking.
   */
  private async getCuratedSection(
    tenantId: string,
    section: FeaturedSection,
    limit: number,
  ) {
    if (!Object.values(FeaturedSection).includes(section)) return [];

    const featured = await this.prisma.featuredProduct.findMany({
      where: {
        tenantId,
        section,
        isActive: true,
        // A curated pick still has to be publicly visible, or the admin could
        // pin a PRIVATE product onto the homepage.
        product: { visibility: ProductVisibility.PUBLIC },
      },
      orderBy: [{ displayOrder: 'asc' }, { createdAt: 'desc' }],
      take: limit,
      include: {
        product: {
          include: {
            images: true,
            variants: true,
            model: {
              include: {
                productType: {
                  include: { company: { include: { category: true } } },
                },
              },
            },
          },
        },
      },
    });

    return featured.map((row) => row.product);
  }

  /**
   * Replaces the flattened variant names with real `{ id, name }` rows.
   *
   * `ProductsService.toProductView` maps variants down to `string[]` because
   * the admin product form edits them as plain text. The storefront needs the
   * id — without it every chip rendered `variant.id === undefined`, so
   * selecting one appeared to select ALL of them (undefined === undefined) and
   * the chosen name came out blank. Add-to-cart also can't identify a variant
   * by name.
   *
   * One query for the whole page of products, then attached in memory.
   */
  private async withVariantRows<T extends { id: string; variants?: unknown }>(
    products: T[],
  ): Promise<T[]> {
    if (products.length === 0) return products;

    const rows = await this.prisma.productVariant.findMany({
      where: { productId: { in: products.map((p) => p.id) } },
      select: { id: true, name: true, productId: true },
      orderBy: { name: 'asc' },
    });

    const byProduct = new Map<string, { id: string; name: string }[]>();
    for (const row of rows) {
      const list = byProduct.get(row.productId) ?? [];
      list.push({ id: row.id, name: row.name });
      byProduct.set(row.productId, list);
    }

    return products.map((product) => ({
      ...product,
      variants: byProduct.get(product.id) ?? [],
    }));
  }

  /**
   * Single shape for every storefront product payload.
   *
   * Accepts both shapes a product arrives in: the flattened view from
   * `ProductsService.toProductView` (which already splits the chain into
   * `model` / `productType` / `company` / `category`) and a raw Prisma row with
   * the `model.productType.company.category` relation loaded, which is what the
   * curated-rail query returns.
   */
  private toStorefrontProduct(product: any) {
    const discount = product.discount || 0;
    const price = Number(product.price) || 0;
    const stock = product.stock || 0;
    const images = (product.images || []).map((image: any) =>
      typeof image === 'string' ? image : image.url,
    );
    const variants = product.variants || [];

    const model = product.model ?? null;
    const productType = product.productType ?? model?.productType ?? null;
    const company = product.company ?? productType?.company ?? null;
    const category = product.category ?? company?.category ?? null;

    const ref = (node: any) =>
      node ? { id: node.id, name: node.name, slug: node.slug } : null;

    return {
      id: product.id,
      name: product.name,
      // The Company is the brand now; kept under the old key so the storefront
      // filter and product cards keep working unchanged.
      brand: company?.name ?? '',
      description: product.description || '',
      sku: product.sku || '',
      stock,
      status: product.status || 'IN_STOCK',
      price,
      discount,
      visibility: product.visibility || 'PUBLIC',
      scheduledDate: product.scheduledDate || null,
      tags: product.tags || [],

      // The full classification, so a product card can link back up the tree.
      categoryId: category?.id ?? null,
      category: ref(category),
      company: company
        ? { ...ref(company), imageUrl: company.imageUrl ?? null }
        : null,
      productType: ref(productType),
      model: ref(model),
      breadcrumb: [
        category && { level: 'CATEGORY', segment: 'categories', ...ref(category) },
        company && { level: 'COMPANY', segment: 'companies', ...ref(company) },
        productType && {
          level: 'PRODUCT_TYPE',
          segment: 'product-types',
          ...ref(productType),
        },
        model && { level: 'MODEL', segment: 'models', ...ref(model) },
      ].filter(Boolean),

      images,
      variants,
      variantCount: variants.length,
      inStock: stock > 0,
      lowStock: stock > 0 && stock <= 10,
      salePrice: price - price * (discount / 100),
      discountPercent: discount,
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
    };
  }

  /**
   * Public promo-code check for the checkout page.
   *
   * Returns only what the shopper needs — never the campaign's internal record.
   */
  async validateDiscountCode(tenantId: string, code: string) {
    const result = await this.discounts.validateCode(tenantId, code);

    if (!result.valid || !result.discount) {
      return {
        success: true,
        data: { valid: false as const, reason: result.reason ?? 'Invalid code' },
      };
    }

    return {
      success: true,
      data: {
        valid: true as const,
        code: result.discount.code,
        type: result.discount.type,
        value: Number(result.discount.value),
      },
    };
  }

  /**
   * Resolves a promo code into a cash discount for an order subtotal.
   *
   * Pricing stays server-side: the checkout sends only the code, never an
   * amount. An unusable code is a hard error rather than a silent zero, so a
   * shopper who saw a discount applied is never charged the full price.
   */
  private async resolveDiscount(
    tenantId: string,
    couponCode: string | undefined,
    subtotal: number,
  ): Promise<{ amount: number; code: string | null }> {
    if (!couponCode?.trim()) return { amount: 0, code: null };

    const result = await this.discounts.validateCode(tenantId, couponCode);
    if (!result.valid || !result.discount) {
      throw new BadRequestException(result.reason ?? 'That promo code is not valid');
    }

    const { type, value, code } = result.discount;
    const raw =
      type === 'PERCENTAGE' ? (subtotal * Number(value)) / 100 : Number(value);

    // Never let a discount exceed the goods total and turn into a refund.
    return { amount: round2(Math.min(raw, subtotal)), code };
  }

  /**
   * Admin-edited body for one legal page.
   *
   * The Settings screen stores these under the `legal` key as
   * `{ [documentId]: { body, updatedAt } }`. Anything else in that key is
   * ignored, and a missing document returns null so the storefront falls back
   * to its own built-in copy rather than rendering an empty page.
   */
  async getLegalDocument(id: string) {
    const row = await this.prisma.setting.findUnique({ where: { key: 'legal' } });
    const group = (row?.value ?? {}) as Record<string, unknown>;
    const doc = group[id];

    if (
      !doc ||
      typeof doc !== 'object' ||
      typeof (doc as { body?: unknown }).body !== 'string' ||
      !(doc as { body: string }).body.trim()
    ) {
      return { success: true, data: null };
    }

    const { body, updatedAt } = doc as { body: string; updatedAt?: string };
    return { success: true, data: { body, updatedAt: updatedAt ?? null } };
  }

  /**
   * Brands, which are now first-class Company rows rather than a free-text
   * column scraped off every product.
   *
   * Only companies that actually have something to sell are returned, so the
   * storefront filter never offers a brand that yields an empty result.
   */
  async getBrands(tenantId: string, params?: { categoryId?: string }) {
    const companies = await this.prisma.company.findMany({
      where: {
        tenantId,
        status: CatalogStatus.ACTIVE,
        visibility: CatalogVisibility.VISIBLE,
        ...(params?.categoryId && { categoryId: params.categoryId }),
        productTypes: {
          some: {
            models: {
              some: {
                products: { some: { visibility: ProductVisibility.PUBLIC } },
              },
            },
          },
        },
      },
      orderBy: [{ position: 'asc' }, { name: 'asc' }],
      select: {
        id: true,
        name: true,
        slug: true,
        imageUrl: true,
        categoryId: true,
      },
    });

    return { success: true, data: companies };
  }

  async submitContactForm(tenantId: string, data: ContactFormDto) {
    // `Conversation.customerId` is required, so a contact submission from a
    // stranger has to be attached to a User row. That placeholder is NOT a
    // registered account: it has no usable password and has never accepted
    // terms, which is exactly how `AuthService.register` recognises it and
    // lets the real owner claim the address later.
    //
    // Normalised to lowercase to match `register`, which does the same. Without
    // it, "Foo@x.com" here and "foo@x.com" there produce two accounts for one
    // person.
    const email = data.email.toLowerCase().trim();

    // Check if a customer with this email already exists
    let customer = await this.prisma.user.findFirst({
      where: {
        tenantId,
        email,
        role: Role.CUSTOMER,
      },
      select: { id: true },
    });

    // If no customer exists, create a new guest customer
    if (!customer) {
      customer = await this.prisma.user.create({
        data: {
          tenantId,
          email,
          fullName: data.name,
          role: Role.CUSTOMER,
          status: 'ACTIVE',
          // Not a bcrypt hash, so it can never match in `bcrypt.compare` and
          // the placeholder cannot be signed into. The owner claims the address
          // by registering (which verifies by OTP) or via password reset.
          passwordHash: UNCLAIMED_PASSWORD_HASH,
          // Left null deliberately — it is the marker that nobody has accepted
          // terms for this address yet. See `AuthService.register`.
          termsAcceptedAt: null,
        },
        select: { id: true },
      });
    }

    // Check if there's an existing conversation for this customer
    const existingConversation = await this.prisma.conversation.findFirst({
      where: { tenantId, customerId: customer.id },
      select: { id: true },
    });

    // Prepare the message text with subject
    const messageText = `[${data.subject}]\n\n${data.message}`;

    if (existingConversation) {
      // Add message to existing conversation
      await this.prisma.message.create({
        data: {
          conversationId: existingConversation.id,
          direction: MessageDirection.INCOMING,
          text: messageText,
        },
      });

      // Update conversation's last message time and unread count
      await this.prisma.conversation.update({
        where: { id: existingConversation.id },
        data: {
          lastMessageAt: new Date(),
          unreadCount: { increment: 1 },
        },
      });

      return {
        success: true,
        data: {
          conversationId: existingConversation.id,
          message: 'Your message has been sent successfully!',
        },
      };
    } else {
      // Create new conversation with the message
      const conversation = await this.prisma.conversation.create({
        data: {
          tenantId,
          customerId: customer.id,
          messages: {
            create: {
              direction: MessageDirection.INCOMING,
              text: messageText,
            },
          },
          unreadCount: 1,
        },
      });

      return {
        success: true,
        data: {
          conversationId: conversation.id,
          message: 'Your message has been sent successfully!',
        },
      };
    }
  }

  /**
   * Places a customer order.
   *
   * Every figure is computed here from the product records. The checkout still
   * posts `subtotal`, `shippingCost` and `total`, and they are all discarded —
   * previously `unitPrice` came straight from `item.price`, so a crafted
   * request could buy anything for a cent.
   *
   * Also fixed here: line items used to store a fabricated `SKU-<productId>`
   * instead of the product's real SKU. Sales reporting and the Best Sellers
   * rail both group by SKU, so no order placed through checkout ever counted.
   *
   * Runs in one transaction: stock is re-checked and decremented alongside the
   * insert so two shoppers can't both buy the last unit.
   */
  async createOrder(tenantId: string, dto: CreatePublicOrderDto) {
    const { contactInfo, shippingAddress, deliveryMethod, items } = dto;

    // A line is identified by (product, variant): two variants of the same
    // product are two lines. Duplicates of the same pair are collapsed first,
    // otherwise the stock check passes per line while the total draw exceeds
    // what's on the shelf.
    const requested = new Map<
      string,
      { productId: string; variantId?: string; quantity: number }
    >();
    for (const item of items) {
      const key = `${item.productId}::${item.variantId ?? ''}`;
      const existing = requested.get(key);
      if (existing) {
        existing.quantity += item.quantity;
      } else {
        requested.set(key, {
          productId: item.productId,
          variantId: item.variantId,
          quantity: item.quantity,
        });
      }
    }

    const productIds = [...new Set([...requested.values()].map((r) => r.productId))];
    const products = await this.prisma.product.findMany({
      where: {
        tenantId,
        id: { in: productIds },
        visibility: ProductVisibility.PUBLIC,
      },
      include: {
        variants: true,
        // Loaded so each order line can snapshot where the product sat in
        // the catalog at the time of sale.
        model: {
          include: {
            productType: {
              include: { company: { include: { category: true } } },
            },
          },
        },
      },
    });

    if (products.length !== productIds.length) {
      const found = new Set(products.map((p) => p.id));
      const missing = productIds.filter((id) => !found.has(id));
      throw new BadRequestException(
        `These products are no longer available: ${missing.join(', ')}`,
      );
    }

    const productById = new Map(products.map((p) => [p.id, p]));

    // Stock is held per product, not per variant, so all lines of one product
    // are summed before the check.
    const drawByProductId = new Map<string, number>();
    for (const row of requested.values()) {
      drawByProductId.set(
        row.productId,
        (drawByProductId.get(row.productId) ?? 0) + row.quantity,
      );
    }
    for (const [productId, draw] of drawByProductId) {
      const product = productById.get(productId)!;
      if (product.stock < draw) {
        throw new BadRequestException(
          `Only ${product.stock} × "${product.name}" left in stock`,
        );
      }
    }

    // Price each line from the database record.
    const lines = [...requested.values()].map((row) => {
      const product = productById.get(row.productId)!;
      const variant = resolveOrderVariant(product, row.variantId);

      const price = Number(product.price);
      const discount = product.discount ?? 0;
      // Same formula the storefront displays, so the shopper is charged the
      // price they saw.
      const unitPrice = round2(price - price * (discount / 100));

      return {
        product,
        variantName: variant?.name ?? null,
        quantity: row.quantity,
        unitPrice,
        lineTotal: round2(unitPrice * row.quantity),
      };
    });

    const subtotal = round2(lines.reduce((sum, l) => sum + l.lineTotal, 0));
    const shippingCost = resolveShippingCost(subtotal, deliveryMethod);
    // Re-validated and re-priced here; the client only ever sends the code.
    const discount = await this.resolveDiscount(tenantId, dto.couponCode, subtotal);
    const total = round2(subtotal + shippingCost - discount.amount);

    const customer = await this.resolveOrderCustomer(
      tenantId,
      contactInfo,
      shippingAddress,
    );

    const addressLines = [
      `${shippingAddress.firstName} ${shippingAddress.lastName}`,
      shippingAddress.address,
      shippingAddress.apartment ?? '',
      [shippingAddress.city, shippingAddress.state, shippingAddress.postalCode]
        .filter(Boolean)
        .join(', '),
      shippingAddress.country,
    ].filter((line): line is string => Boolean(line && line.trim() !== ''));

    const estimatedDelivery = new Date();
    estimatedDelivery.setDate(
      estimatedDelivery.getDate() + (deliveryMethod === 'express' ? 3 : 7),
    );

    const order = await this.prisma.$transaction(async (tx) => {
      const created = await tx.order.create({
        data: {
          tenantId,
          orderNumber: await nextOrderNumber(tx, tenantId),
          customerId: customer.id,
          status: OrderStatus.PENDING,
          shippingAddress: addressLines,
          shippingMethod:
            deliveryMethod === 'express'
              ? 'Express Delivery (DHL)'
              : 'Standard Delivery (BRT)',
          shippingCost: new Prisma.Decimal(shippingCost),
          discount: new Prisma.Decimal(discount.amount),
          items: {
            create: lines.map((l) => ({
              productId: l.product.id,
              name: l.product.name,
              // The real SKU — this is the join key for all sales reporting.
              sku: l.product.sku,
              variantName: l.variantName,
              // Classification frozen at the moment of sale, so reports stay
              // truthful even if the catalog is reorganised afterwards.
              modelName: l.product.model.name,
              productTypeName: l.product.model.productType.name,
              companyName: l.product.model.productType.company.name,
              categoryName: l.product.model.productType.company.category.name,
              quantity: l.quantity,
              unitPrice: new Prisma.Decimal(l.unitPrice),
            })),
          },
        },
      });

      // Conditional decrement: `stock: { gte: quantity }` makes a concurrent
      // order that already took the last unit fail here rather than oversell.
      for (const line of lines) {
        const claimed = await tx.product.updateMany({
          where: { id: line.product.id, tenantId, stock: { gte: line.quantity } },
          data: { stock: { decrement: line.quantity } },
        });
        if (claimed.count === 0) {
          throw new BadRequestException(
            `"${line.product.name}" sold out while you were checking out`,
          );
        }
      }

      return created;
    });

    // `NotificationsService.emit` existed with a doc comment naming "new order"
    // as its trigger, but nothing ever called it — which is why the admin
    // console showed no activity for orders placed by customers.
    await this.notifyNewOrder(tenantId, order.orderNumber, customer.fullName, total);
    await this.notifyLowStock(tenantId, lines);

    return {
      success: true,
      data: {
        id: order.id,
        orderNumber: order.orderNumber,
        customerEmail: customer.email,
        customerName: customer.fullName,
        shippingAddress: addressLines,
        paymentMethod: 'Credit Card',
        items: lines.map((l) => ({
          productId: l.product.id,
          name: l.product.name,
          sku: l.product.sku,
          variantName: l.variantName,
          quantity: l.quantity,
          unitPrice: l.unitPrice,
          lineTotal: l.lineTotal,
        })),
        subtotal,
        shippingCost,
        discount: discount.amount,
        discountCode: discount.code,
        total,
        estimatedDelivery,
        createdAt: order.createdAt,
      },
    };
  }

  /**
   * Broadcast (userId: null) so every admin sees it — a customer order isn't
   * owned by one staff member.
   *
   * Emitted outside the order transaction on purpose: a notification failure
   * must never roll back a paid order. Both helpers swallow their own errors
   * for the same reason.
   */
  private async notifyNewOrder(
    tenantId: string,
    orderNumber: string,
    customerName: string,
    total: number,
  ) {
    try {
      await this.notifications.emit(tenantId, {
        type: NotificationType.SUCCESS,
        category: NotificationCategory.ORDERS,
        title: `New order ${orderNumber}`,
        description: `${customerName} placed an order totalling €${total.toFixed(2)}.`,
      });
    } catch (error) {
      this.logger.error(
        `Failed to emit new-order notification for ${orderNumber}`,
        error as Error,
      );
    }
  }

  /**
   * Flags stock that the order just pushed to a low or empty level, so the
   * admin finds out from the console rather than from the inventory screen.
   */
  private async notifyLowStock(
    tenantId: string,
    lines: { product: { id: string; name: string }; quantity: number }[],
  ) {
    try {
      const affected = await this.prisma.product.findMany({
        where: { tenantId, id: { in: lines.map((l) => l.product.id) } },
        select: { name: true, stock: true },
      });

      for (const product of affected) {
        if (product.stock > LOW_STOCK_THRESHOLD) continue;

        await this.notifications.emit(tenantId, {
          type:
            product.stock === 0
              ? NotificationType.ERROR
              : NotificationType.WARNING,
          category: NotificationCategory.INVENTORY,
          title:
            product.stock === 0
              ? `${product.name} is out of stock`
              : `${product.name} is running low`,
          description:
            product.stock === 0
              ? 'The last unit has just been sold. Restock to keep it on sale.'
              : `Only ${product.stock} left after the latest order.`,
        });
      }
    } catch (error) {
      this.logger.error('Failed to emit low-stock notification', error as Error);
    }
  }

  /**
   * Finds or creates the account an order is attached to.
   *
   * A guest checkout creates the same kind of unclaimed placeholder the contact
   * form does — `emailVerified` stays false. The previous code set it to true,
   * which both faked a verification that never happened and permanently blocked
   * the real owner from ever registering that address.
   */
  private async resolveOrderCustomer(
    tenantId: string,
    contactInfo: OrderContactDto,
    shippingAddress: OrderAddressDto,
  ) {
    const email = contactInfo.email.toLowerCase().trim();

    const existing = await this.prisma.user.findFirst({
      where: { tenantId, email },
    });
    if (existing) {
      // Fill in a phone number we didn't have; never overwrite a real one.
      if (!existing.phone && contactInfo.phone) {
        return this.prisma.user.update({
          where: { id: existing.id },
          data: { phone: contactInfo.phone },
        });
      }
      return existing;
    }

    return this.prisma.user.create({
      data: {
        tenantId,
        email,
        fullName: `${shippingAddress.firstName} ${shippingAddress.lastName}`.trim(),
        phone: contactInfo.phone,
        role: Role.CUSTOMER,
        status: 'ACTIVE',
        emailVerified: false,
        passwordHash: UNCLAIMED_PASSWORD_HASH,
        termsAcceptedAt: null,
      },
    });
  }
  async getOrderByNumber(tenantId: string, orderNumber: string) {
    const order = await this.prisma.order.findFirst({
      where: {
        tenantId,
        orderNumber: orderNumber,
      },
      include: {
        items: {
          include: {
            product: {
              include: {
                images: true,
              },
            },
          },
        },
        customer: {
          select: {
            id: true,
            fullName: true,
            email: true,
            phone: true,
          },
        },
      },
    });

    if (!order) {
      throw new NotFoundException(`Order ${orderNumber} not found`);
    }

    // Calculate estimated delivery date
    const estimatedDelivery = new Date(order.createdAt);
    estimatedDelivery.setDate(estimatedDelivery.getDate() + (order.shippingMethod?.includes('Express') ? 3 : 7));

    // Calculate totals from items
    const subtotal = order.items.reduce((sum, item) => {
      return sum + Number(item.unitPrice) * item.quantity;
    }, 0);

    const shippingCost = Number(order.shippingCost) || 0;
    const discount = Number(order.discount) || 0;
    const total = subtotal + shippingCost - discount;

    return {
      success: true,
      data: {
        id: order.id,
        orderNumber: order.orderNumber,
        customerId: order.customerId,
        customer: order.customer ? {
          id: order.customer.id,
          fullName: order.customer.fullName,
          email: order.customer.email,
          phone: order.customer.phone,
        } : null,
        status: order.status,
        paymentMethod: order.paymentMethod,
        shippingMethod: order.shippingMethod,
        shippingTracking: order.shippingTracking,
        shippingAddress: order.shippingAddress,
        shippingCost: order.shippingCost,
        discount: order.discount,
        placedAt: order.createdAt,
        items: order.items.map((item: any) => {
          // Get product image if available, otherwise use placeholder
          let imageUrl = `https://images.unsplash.com/photo-1598300042267-174c1e13cd2c?w=400&h=400&fit=crop`;
          if (item.product && item.product.images && item.product.images.length > 0) {
            const firstImage = item.product.images[0];
            imageUrl = firstImage.url || firstImage;
          }

          return {
            id: item.id,
            productId: item.productId,
            name: item.name,
            sku: item.sku,
            quantity: item.quantity,
            unitPrice: Number(item.unitPrice),
            lineTotal: Number(item.unitPrice) * item.quantity,
            image: imageUrl,
          };
        }),
        totals: {
          subtotal,
          shipping: shippingCost,
          discount: discount,
          total,
        },
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
      },
    };
  }
}
