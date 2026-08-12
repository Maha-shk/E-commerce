/**
 * Database seed. Idempotent: safe to run on every container start.
 *
 * Creates the bootstrap super-admin plus a realistic demo dataset (categories,
 * products, customers, orders, discounts, notifications, conversations) so the
 * admin dashboard has content to render immediately.
 *
 * Run manually:  npx prisma db seed
 */
import {
  DiscountCategory,
  DiscountType,
  MessageDirection,
  NotificationCategory,
  NotificationType,
  OrderStatus,
  PaymentStatus,
  PrismaClient,
  Prisma,
  ProductVisibility,
  Role,
  StockStatus,
  UserStatus,
} from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

/** The store every seeded row belongs to. */
const DEFAULT_TENANT_SLUG = 'default';

const LOW_STOCK_THRESHOLD = 20;

function stockStatus(stock: number): StockStatus {
  if (stock <= 0) return StockStatus.OUT_OF_STOCK;
  if (stock <= LOW_STOCK_THRESHOLD) return StockStatus.LOW_STOCK;
  return StockStatus.IN_STOCK;
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/** Days before now, as a Date. */
function daysAgo(days: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d;
}

// ---------------------------------------------------------------------------
// Reference data (mirrors frontend/lib/admin/*)
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Catalog: Category > Company > ProductType > Model > Product
//
// Modelled on the client's own examples (Electronics/Samsung/Galaxy S25 and
// Furniture/WoodCraft/AB8) plus a spare-parts category in the shape of the
// reference screenshots. Products are the parts that make up a model, which is
// what the fifth level is for.
// ---------------------------------------------------------------------------

interface PartSeed {
  code: string;
  name: string;
  price: number;
  stock: number;
  discount?: number;
  tags?: string[];
  variants?: string[];
}

interface ModelSeed {
  code: string;
  name: string;
  releaseYear?: number;
  parts: PartSeed[];
}

interface ProductTypeSeed {
  name: string;
  description?: string;
  models: ModelSeed[];
}

interface CompanySeed {
  code: string;
  name: string;
  imageUrl?: string;
  productTypes: ProductTypeSeed[];
}

interface CategorySeed {
  name: string;
  icon: string;
  description: string;
  thumbnail?: string;
  companies: CompanySeed[];
}

function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

/**
 * Builds a part list from a template.
 *
 * Prices scale off the model's headline value so an iPhone 17 display costs
 * more than a Redmi one without every row being written out by hand.
 */
function partsFrom(
  template: { code: string; name: string; factor: number; stock: number }[],
  base: number,
  overrides: Partial<Record<string, Partial<PartSeed>>> = {},
): PartSeed[] {
  return template.map((t) => ({
    code: t.code,
    name: t.name,
    price: round2(base * t.factor),
    stock: t.stock,
    ...overrides[t.code],
  }));
}

const PHONE_PART_TEMPLATE = [
  { code: 'LCD', name: 'LCD Display Assembly', factor: 1, stock: 42 },
  { code: 'BAT', name: 'Battery', factor: 0.22, stock: 130 },
  { code: 'CHG', name: 'Charging Port Flex', factor: 0.11, stock: 88 },
  { code: 'RCAM', name: 'Rear Camera Module', factor: 0.54, stock: 26 },
  { code: 'FCAM', name: 'Front Camera Module', factor: 0.27, stock: 47 },
  { code: 'SPK', name: 'Loudspeaker', factor: 0.09, stock: 12 },
  { code: 'MB', name: 'Motherboard', factor: 1.85, stock: 6 },
];

const TABLET_PART_TEMPLATE = [
  { code: 'LCD', name: 'Display Assembly', factor: 1, stock: 22 },
  { code: 'BAT', name: 'Battery', factor: 0.3, stock: 40 },
  { code: 'CHG', name: 'Charging Port Flex', factor: 0.12, stock: 35 },
  { code: 'SPK', name: 'Speaker Set', factor: 0.14, stock: 18 },
];

const LAPTOP_PART_TEMPLATE = [
  { code: 'LCD', name: 'Retina Display Panel', factor: 1, stock: 9 },
  { code: 'BAT', name: 'Battery Pack', factor: 0.28, stock: 24 },
  { code: 'KBD', name: 'Keyboard Assembly', factor: 0.34, stock: 16 },
  { code: 'TRK', name: 'Trackpad', factor: 0.21, stock: 11 },
  { code: 'MB', name: 'Logic Board', factor: 2.4, stock: 4 },
];

const CHAIR_PART_TEMPLATE = [
  { code: 'SEAT', name: 'Seat Cushion', factor: 1, stock: 60 },
  { code: 'BACK', name: 'Back Support', factor: 0.85, stock: 45 },
  { code: 'HNDL', name: 'Armrest Handle', factor: 0.3, stock: 90 },
  { code: 'LEGS', name: 'Leg Set (4)', factor: 0.6, stock: 38 },
];

const TABLE_PART_TEMPLATE = [
  { code: 'TOP', name: 'Table Top', factor: 1, stock: 20 },
  { code: 'LEGS', name: 'Leg Set (4)', factor: 0.42, stock: 34 },
  { code: 'HRDW', name: 'Fixing Hardware Kit', factor: 0.08, stock: 150 },
];

const DRILL_PART_TEMPLATE = [
  { code: 'MOTOR', name: 'Replacement Motor', factor: 1, stock: 14 },
  { code: 'CABLE', name: 'Power Cable', factor: 0.15, stock: 70 },
  { code: 'SWITCH', name: 'Trigger Switch', factor: 0.12, stock: 55 },
  { code: 'CHUCK', name: 'Keyless Chuck', factor: 0.35, stock: 26 },
];

const CATALOG: CategorySeed[] = [
  {
    name: 'Electronics',
    icon: 'electronics',
    description: 'Spare parts and components for phones, tablets and laptops.',
    thumbnail:
      'https://images.unsplash.com/photo-1498049860654-af1a5c076218?w=800&h=600&fit=crop',
    companies: [
      {
        code: 'SAM',
        name: 'Samsung',
        productTypes: [
          {
            name: 'Mobile Phones',
            models: [
              {
                code: 'S25',
                name: 'Galaxy S25',
                releaseYear: 2025,
                parts: partsFrom(PHONE_PART_TEMPLATE, 189, {
                  LCD: { tags: ['NEW ARRIVAL'], variants: ['With Frame', 'Panel Only'] },
                  MB: { discount: 5 },
                }),
              },
              {
                code: 'S24',
                name: 'Galaxy S24',
                releaseYear: 2024,
                parts: partsFrom(PHONE_PART_TEMPLATE, 154, {
                  BAT: { discount: 10 },
                }),
              },
              {
                code: 'A56',
                name: 'Galaxy A56',
                releaseYear: 2025,
                parts: partsFrom(PHONE_PART_TEMPLATE, 89),
              },
            ],
          },
          {
            name: 'Tablets',
            models: [
              {
                code: 'TABS10',
                name: 'Galaxy Tab S10',
                releaseYear: 2024,
                parts: partsFrom(TABLET_PART_TEMPLATE, 219),
              },
            ],
          },
          {
            name: 'Smart Watches',
            models: [
              {
                code: 'W7',
                name: 'Galaxy Watch 7',
                releaseYear: 2024,
                parts: partsFrom(TABLET_PART_TEMPLATE, 96),
              },
            ],
          },
        ],
      },
      {
        code: 'APL',
        name: 'Apple',
        productTypes: [
          {
            name: 'Mobile Phones',
            models: [
              {
                code: 'IP17PM',
                name: 'iPhone 17 Pro Max',
                releaseYear: 2025,
                parts: partsFrom(PHONE_PART_TEMPLATE, 279, {
                  LCD: { tags: ['NEW ARRIVAL'], variants: ['Original', 'Aftermarket'] },
                }),
              },
              {
                code: 'IP16',
                name: 'iPhone 16',
                releaseYear: 2024,
                parts: partsFrom(PHONE_PART_TEMPLATE, 208),
              },
              {
                code: 'IP13',
                name: 'iPhone 13',
                releaseYear: 2021,
                parts: partsFrom(PHONE_PART_TEMPLATE, 132, {
                  LCD: { discount: 15 },
                }),
              },
            ],
          },
          {
            name: 'Laptops',
            models: [
              {
                code: 'MBP14',
                name: 'MacBook Pro 14"',
                releaseYear: 2024,
                parts: partsFrom(LAPTOP_PART_TEMPLATE, 449),
              },
            ],
          },
        ],
      },
      {
        code: 'XIA',
        name: 'Xiaomi',
        productTypes: [
          {
            name: 'Mobile Phones',
            models: [
              {
                code: 'RN14',
                name: 'Redmi Note 14',
                releaseYear: 2025,
                parts: partsFrom(PHONE_PART_TEMPLATE, 74, {
                  SPK: { discount: 20 },
                }),
              },
            ],
          },
        ],
      },
    ],
  },
  {
    name: 'Furniture',
    icon: 'home',
    description: 'Replacement components for chairs, tables and cabinets.',
    thumbnail:
      'https://images.unsplash.com/photo-1503602642458-232111445840?w=800&h=600&fit=crop',
    companies: [
      {
        code: 'WCR',
        name: 'WoodCraft',
        productTypes: [
          {
            name: 'Chairs',
            models: [
              { code: 'AB8', name: 'AB8', parts: partsFrom(CHAIR_PART_TEMPLATE, 64) },
              { code: 'J7', name: 'J7', parts: partsFrom(CHAIR_PART_TEMPLATE, 48) },
              {
                code: 'PREM',
                name: 'Premium Series',
                parts: partsFrom(CHAIR_PART_TEMPLATE, 118, {
                  SEAT: { tags: ['NEW ARRIVAL'] },
                }),
              },
            ],
          },
          {
            name: 'Tables',
            models: [
              { code: 'LUX', name: 'Luxury Series', parts: partsFrom(TABLE_PART_TEMPLATE, 210) },
              { code: 'OAK2', name: 'Oak Two', parts: partsFrom(TABLE_PART_TEMPLATE, 145) },
            ],
          },
        ],
      },
      {
        code: 'IKA',
        name: 'IKEA',
        productTypes: [
          {
            name: 'Chairs',
            models: [
              { code: 'MRK', name: 'Markus', parts: partsFrom(CHAIR_PART_TEMPLATE, 39) },
            ],
          },
        ],
      },
    ],
  },
  {
    name: 'Hardware',
    icon: 'automotive',
    description: 'Power tool parts and workshop spares.',
    thumbnail:
      'https://images.unsplash.com/photo-1581147036324-c1c88bb6efd6?w=800&h=600&fit=crop',
    companies: [
      {
        code: 'BSH',
        name: 'Bosch',
        productTypes: [
          {
            name: 'Drilling Machines',
            models: [
              { code: 'X10', name: 'X10', releaseYear: 2023, parts: partsFrom(DRILL_PART_TEMPLATE, 88) },
              { code: 'X20', name: 'X20', releaseYear: 2025, parts: partsFrom(DRILL_PART_TEMPLATE, 126) },
            ],
          },
        ],
      },
    ],
  },
];

/**
 * Flattened product rows, one per part, each carrying the path to its Model.
 * SKUs are deterministic (`<company>-<model>-<part>`) so the demo orders below
 * can reference them by name.
 */
const PRODUCTS = CATALOG.flatMap((category) =>
  category.companies.flatMap((company) =>
    company.productTypes.flatMap((productType) =>
      productType.models.flatMap((model) =>
        model.parts.map((part) => ({
          sku: `${company.code}-${model.code}-${part.code}`,
          name: `${part.name} — ${company.name} ${model.name}`,
          path: {
            category: category.name,
            company: company.name,
            productType: productType.name,
            model: model.name,
          },
          stock: part.stock,
          price: part.price,
          discount: part.discount ?? 0,
          unitValue: round2(part.price * 0.62),
          tags: part.tags ?? [],
          variants: part.variants ?? [],
          description: `Genuine replacement ${part.name.toLowerCase()} for the ${company.name} ${model.name}.`,
          images: [] as string[],
        })),
      ),
    ),
  ),
);

const CUSTOMERS = [
  {
    email: 'elena.bianchi@example.com',
    fullName: 'Elena Bianchi',
    phone: '+39 333 481 2290',
    status: UserStatus.ACTIVE,
    joined: 1600,
    address: [
      'Elena Bianchi',
      'Via della Spiga, 12',
      '20121 Milano (MI)',
      'Italy',
    ],
  },
  {
    email: 'm.rossi@service.it',
    fullName: 'Marco Rossi',
    phone: '+39 348 110 7734',
    status: UserStatus.ACTIVE,
    joined: 1400,
    address: [
      'Marco Rossi',
      'Corso Buenos Aires, 45',
      '20124 Milano (MI)',
      'Italy',
    ],
  },
  {
    email: 's.conti@design.com',
    fullName: 'Sofia Conti',
    phone: '+39 366 902 5514',
    status: UserStatus.INACTIVE,
    joined: 700,
    address: ['Sofia Conti', 'Via Garibaldi, 9', '50123 Firenze (FI)', 'Italy'],
  },
  {
    email: 'l.moretti@tech.io',
    fullName: 'Luca Moretti',
    phone: '+39 349 220 8891',
    status: UserStatus.ACTIVE,
    joined: 2000,
    address: ['Luca Moretti', 'Via Dante, 77', '16121 Genova (GE)', 'Italy'],
  },
  {
    email: 'giulia.ricci@corp.it',
    fullName: 'Giulia Ricci',
    phone: '+39 331 774 0126',
    status: UserStatus.SUSPENDED,
    joined: 1200,
    address: ['Giulia Ricci', 'Piazza Duomo, 3', '20122 Milano (MI)', 'Italy'],
  },
  {
    email: 'c.esposito@example.com',
    fullName: 'Chiara Esposito',
    phone: '+39 327 445 9902',
    status: UserStatus.ACTIVE,
    joined: 820,
    address: [
      'Chiara Esposito',
      'Via Etnea, 210',
      '95131 Catania (CT)',
      'Italy',
    ],
  },
  {
    email: 'matteo.greco@example.com',
    fullName: 'Matteo Greco',
    phone: '+39 351 220 6614',
    status: UserStatus.INACTIVE,
    joined: 630,
    address: ['Matteo Greco', 'Via Verdi, 12', '40121 Bologna (BO)', 'Italy'],
  },
  {
    email: 'f.marino@example.com',
    fullName: 'Francesca Marino',
    phone: '+39 366 004 8821',
    status: UserStatus.ACTIVE,
    joined: 1500,
    address: [
      'Francesca Marino',
      'Corso Vittorio, 88',
      '00186 Roma (RM)',
      'Italy',
    ],
  },
  {
    email: 'davide.costa@example.com',
    fullName: 'Davide Costa',
    phone: '+39 342 887 1200',
    status: UserStatus.INACTIVE,
    joined: 1100,
    address: ['Davide Costa', 'Via Mazzini, 5', '35121 Padova (PD)', 'Italy'],
  },
  {
    email: 'antonio.bruno@example.com',
    fullName: 'Antonio Bruno',
    phone: '+39 328 661 4407',
    status: UserStatus.ACTIVE,
    joined: 300,
    address: ['Antonio Bruno', 'Via Napoli, 45', '80133 Napoli (NA)', 'Italy'],
  },
];

const DISCOUNTS = [
  {
    code: 'SUMMER24',
    name: 'Summer Solstice Sale',
    type: DiscountType.PERCENTAGE,
    value: 20,
    usageLimit: 1000,
    start: -60,
    end: 60,
    category: DiscountCategory.ACTIVE,
    icon: 'Sun',
  },
  {
    code: 'WELCOME10',
    name: 'New Customer Reward',
    type: DiscountType.FIXED_AMOUNT,
    value: 10,
    usageLimit: 5000,
    start: -200,
    end: 160,
    category: DiscountCategory.ACTIVE,
    icon: 'UserPlus',
  },
  {
    code: 'VIPGOLD',
    name: 'VIP Loyalty Tier',
    type: DiscountType.PERCENTAGE,
    value: 15,
    usageLimit: 750,
    start: -120,
    end: 90,
    category: DiscountCategory.ACTIVE,
    icon: 'Crown',
  },
  {
    code: 'BLACKFRI',
    name: 'Black Friday Preview',
    type: DiscountType.PERCENTAGE,
    value: 40,
    usageLimit: 2000,
    start: 30,
    end: 45,
    category: DiscountCategory.SCHEDULED,
    icon: 'Sparkles',
  },
  {
    code: 'FREESHIP',
    name: 'Free Shipping Weekend',
    type: DiscountType.FIXED_AMOUNT,
    value: 8,
    usageLimit: 1500,
    start: 14,
    end: 17,
    category: DiscountCategory.SCHEDULED,
    icon: 'Truck',
  },
  {
    code: 'CENTO5YRS',
    name: 'Anniversary Gift',
    type: DiscountType.PERCENTAGE,
    value: 25,
    usageLimit: 900,
    start: 20,
    end: 27,
    category: DiscountCategory.SCHEDULED,
    icon: 'Gift',
  },
  {
    code: 'SPRING23',
    name: 'Spring Refresh',
    type: DiscountType.PERCENTAGE,
    value: 30,
    usageLimit: 1200,
    start: -500,
    end: -400,
    category: DiscountCategory.ARCHIVED,
    icon: 'CalendarHeart',
  },
  {
    code: 'WINTER20',
    name: 'Winter Warm-Up',
    type: DiscountType.FIXED_AMOUNT,
    value: 20,
    usageLimit: 500,
    start: -400,
    end: -300,
    category: DiscountCategory.ARCHIVED,
    icon: 'Snowflake',
  },
  {
    code: 'AUTUMN15',
    name: 'Back to Business',
    type: DiscountType.PERCENTAGE,
    value: 15,
    usageLimit: 640,
    start: -300,
    end: -250,
    category: DiscountCategory.ARCHIVED,
    icon: 'Percent',
  },
];

/** Orders: [customerIndex, daysAgo, status, paymentStatus, [ [sku, qty], ... ], shipping, discount] */
const ORDERS: Array<{
  customer: number;
  days: number;
  status: OrderStatus;
  payment: PaymentStatus;
  items: [string, number][];
  shipping: number;
  discount: number;
  method: string;
  tracking: string;
  payMethod: string;
}> = [
  {
    customer: 0,
    days: 2,
    status: OrderStatus.SHIPPED,
    payment: PaymentStatus.PAID,
    items: [
      ['APL-IP17PM-LCD', 1],
      ['XIA-RN14-CHG', 3],
    ],
    shipping: 39,
    discount: 0,
    method: 'Express Delivery (DHL)',
    tracking: 'DHL-99203348120',
    payMethod: 'Visa •••• 4242',
  },
  {
    customer: 1,
    days: 3,
    status: OrderStatus.PENDING,
    payment: PaymentStatus.PENDING,
    items: [
      ['XIA-RN14-CHG', 2],
      ['BSH-X10-MOTOR', 2],
    ],
    shipping: 32.5,
    discount: 0,
    method: 'Standard Delivery (BRT)',
    tracking: 'BRT-55120983311',
    payMethod: 'PayPal',
  },
  {
    customer: 3,
    days: 4,
    status: OrderStatus.PROCESSING,
    payment: PaymentStatus.PAID,
    items: [
      ['SAM-S25-LCD', 1],
      ['SAM-S25-BAT', 1],
    ],
    shipping: 46,
    discount: 10,
    method: 'Freight Delivery (SDA)',
    tracking: 'SDA-77410026654',
    payMethod: 'Bank Transfer',
  },
  {
    customer: 5,
    days: 5,
    status: OrderStatus.DELIVERED,
    payment: PaymentStatus.PAID,
    items: [['WCR-AB8-SEAT', 1]],
    shipping: 0,
    discount: 0,
    method: 'Standard Delivery (Poste)',
    tracking: 'PI-42109887760',
    payMethod: 'Mastercard •••• 8817',
  },
  {
    customer: 9,
    days: 6,
    status: OrderStatus.CANCELLED,
    payment: PaymentStatus.REFUNDED,
    items: [
      ['SAM-S25-BAT', 1],
      ['WCR-PREM-HNDL', 1],
    ],
    shipping: 35,
    discount: 0,
    method: 'Express Delivery (DHL)',
    tracking: 'DHL-11220945567',
    payMethod: 'Visa •••• 1109',
  },
  {
    customer: 4,
    days: 8,
    status: OrderStatus.DELIVERED,
    payment: PaymentStatus.PAID,
    items: [
      ['APL-MBP14-TRK', 2],
      ['XIA-RN14-CHG', 1],
    ],
    shipping: 12,
    discount: 0,
    method: 'Standard Delivery (BRT)',
    tracking: 'BRT-90031224587',
    payMethod: 'Visa •••• 7731',
  },
  {
    customer: 3,
    days: 10,
    status: OrderStatus.PROCESSING,
    payment: PaymentStatus.PAID,
    items: [['APL-IP16-LCD', 1]],
    shipping: 15,
    discount: 0,
    method: 'Express Delivery (DHL)',
    tracking: 'DHL-33019987123',
    payMethod: 'PayPal',
  },
  {
    customer: 5,
    days: 12,
    status: OrderStatus.SHIPPED,
    payment: PaymentStatus.PAID,
    items: [['WCR-PREM-HNDL', 4]],
    shipping: 24,
    discount: 0,
    method: 'Standard Delivery (SDA)',
    tracking: 'SDA-66200114873',
    payMethod: 'Mastercard •••• 2043',
  },
  {
    customer: 6,
    days: 15,
    status: OrderStatus.PENDING,
    payment: PaymentStatus.FAILED,
    items: [['BSH-X10-MOTOR', 2]],
    shipping: 20,
    discount: 0,
    method: 'Standard Delivery (Poste)',
    tracking: 'PI-88123094410',
    payMethod: 'Visa •••• 5560',
  },
  {
    customer: 7,
    days: 20,
    status: OrderStatus.DELIVERED,
    payment: PaymentStatus.PAID,
    items: [
      ['SAM-S24-BAT', 1],
      ['XIA-RN14-CHG', 2],
    ],
    shipping: 18,
    discount: 25,
    method: 'Express Delivery (DHL)',
    tracking: 'DHL-45590023188',
    payMethod: 'Visa •••• 3390',
  },
  {
    customer: 8,
    days: 25,
    status: OrderStatus.RETURNED,
    payment: PaymentStatus.REFUNDED,
    items: [['APL-IP16-BAT', 3]],
    shipping: 15,
    discount: 0,
    method: 'Standard Delivery (BRT)',
    tracking: 'BRT-12009873345',
    payMethod: 'Bank Transfer',
  },
  {
    customer: 0,
    days: 35,
    status: OrderStatus.DELIVERED,
    payment: PaymentStatus.PAID,
    items: [['APL-IP17PM-LCD', 2]],
    shipping: 40,
    discount: 60,
    method: 'Freight Delivery (SDA)',
    tracking: 'SDA-30948871220',
    payMethod: 'Bank Transfer',
  },
  {
    customer: 1,
    days: 50,
    status: OrderStatus.DELIVERED,
    payment: PaymentStatus.PAID,
    items: [
      ['WCR-AB8-SEAT', 2],
      ['APL-MBP14-TRK', 1],
    ],
    shipping: 22,
    discount: 0,
    method: 'Standard Delivery (BRT)',
    tracking: 'BRT-77120983312',
    payMethod: 'PayPal',
  },
  {
    customer: 7,
    days: 70,
    status: OrderStatus.DELIVERED,
    payment: PaymentStatus.PAID,
    items: [['SAM-S25-LCD', 1]],
    shipping: 55,
    discount: 0,
    method: 'Freight Delivery (SDA)',
    tracking: 'SDA-99410026655',
    payMethod: 'Bank Transfer',
  },
  {
    customer: 3,
    days: 95,
    status: OrderStatus.DELIVERED,
    payment: PaymentStatus.PAID,
    items: [
      ['SAM-S24-BAT', 2],
      ['SAM-S25-BAT', 2],
    ],
    shipping: 60,
    discount: 100,
    method: 'Freight Delivery (SDA)',
    tracking: 'SDA-11410026699',
    payMethod: 'Bank Transfer',
  },
  {
    customer: 5,
    days: 120,
    status: OrderStatus.DELIVERED,
    payment: PaymentStatus.PAID,
    items: [
      ['APL-IP16-LCD', 2],
      ['WCR-PREM-HNDL', 2],
    ],
    shipping: 28,
    discount: 0,
    method: 'Standard Delivery (Poste)',
    tracking: 'PI-52109887761',
    payMethod: 'Mastercard •••• 8817',
  },
];

// ---------------------------------------------------------------------------

async function main() {
  console.log('[seed] Starting...');

  // --- Bootstrap super-admin -----------------------------------------------
  const adminEmail = (
    process.env.ADMIN_EMAIL ?? 'admin@cento.local'
  ).toLowerCase();
  const adminName = process.env.ADMIN_NAME ?? 'Alessandro Cento';
  // Required rather than defaulted: a fallback password here would be a literal
  // credential in the repo, and would silently create a reachable admin account
  // with a publicly known password.
  // --- Tenant ---------------------------------------------------------------
  // Everything below belongs to one store. A second tenant can be created
  // through POST /api/platform/tenants; nothing here is shared between them.
  const tenant = await prisma.tenant.upsert({
    where: { slug: DEFAULT_TENANT_SLUG },
    update: {},
    create: {
      id: 'tenant_default',
      name: 'Default Store',
      slug: DEFAULT_TENANT_SLUG,
    },
  });
  const tenantId = tenant.id;
  console.log(`[seed] Tenant: ${tenant.slug} (${tenantId})`);

  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminPassword) {
    throw new Error(
      'ADMIN_PASSWORD is not set. Add it to backend/.env before seeding — it becomes ' +
        `the password for the bootstrap super-admin (${adminEmail}).`,
    );
  }

  // The bootstrap SUPER_ADMIN is the PLATFORM operator: tenantId stays null so
  // it belongs to no store, which is what lets it create tenants and act inside
  // any of them via the X-Tenant-Slug header. A store's own top-level account is
  // an ADMIN scoped to that store (admin@gmail.com below).
  // Deliberately a different address from ADMIN_EMAIL: that one is the default
  // store's own SUPER_ADMIN, and two accounts sharing an email would make the
  // storefront login ambiguous (the tenant-scoped row always wins).
  const platformEmail =
    process.env.PLATFORM_ADMIN_EMAIL ?? `platform@${adminEmail.split('@')[1]}`;

  const existingAdmin = await prisma.user.findFirst({
    where: { email: platformEmail, tenantId: null },
  });
  const admin =
    existingAdmin ??
    (await prisma.user.create({
      data: {
        tenantId: null,
        email: platformEmail,
        passwordHash: await bcrypt.hash(adminPassword, 12),
        fullName: `${adminName} (Platform)`,
        role: Role.SUPER_ADMIN,
        status: UserStatus.ACTIVE,
        emailVerified: true,
      },
    }));
  console.log(`[seed] Platform super-admin: ${admin.email} (no tenant)`);

  // --- Default admin user ---------------------------------------------------
  const defaultAdmin = await prisma.user.upsert({
    where: { tenantId_email: { tenantId, email: 'admin@gmail.com' } },
    update: {},
    create: {
      tenantId,
      email: 'admin@gmail.com',
      passwordHash: await bcrypt.hash('Admin123', 12),
      fullName: 'Admin',
      role: Role.ADMIN,
      status: UserStatus.ACTIVE,
      emailVerified: true,
    },
  });
  console.log(`[seed] Default admin: ${defaultAdmin.email}`);

  // --- Demo staff -----------------------------------------------------------
  const demoPassword = await bcrypt.hash('StaffPass123!', 12);
  for (const staff of [
    {
      email: 'manager@cento.local',
      fullName: 'Marta Ferrero',
      role: Role.MANAGER,
    },
    {
      email: 'support@cento.local',
      fullName: 'Paolo Greco',
      role: Role.SUPPORT,
    },
  ]) {
    await prisma.user.upsert({
      where: { tenantId_email: { tenantId, email: staff.email } },
      update: {},
      create: {
        tenantId,
        ...staff,
        passwordHash: demoPassword,
        status: UserStatus.ACTIVE,
        emailVerified: true,
      },
    });
  }

  // --- Catalog hierarchy ----------------------------------------------------
  // Created top-down, because each level needs its parent's id. Every upsert is
  // keyed on the same compound unique the API enforces, so re-running the seed
  // updates rather than duplicates.
  const modelIds = new Map<string, string>();
  let companyCount = 0;
  let productTypeCount = 0;

  for (const [categoryIndex, c] of CATALOG.entries()) {
    const category = await prisma.category.upsert({
      where: { tenantId_slug: { tenantId, slug: slugify(c.name) } },
      update: { description: c.description, icon: c.icon },
      create: {
        tenantId,
        name: c.name,
        slug: slugify(c.name),
        description: c.description,
        icon: c.icon,
        position: categoryIndex,
        thumbnailName: c.thumbnail,
        imageUrl: c.thumbnail,
      },
    });

    for (const [companyIndex, co] of c.companies.entries()) {
      const company = await prisma.company.upsert({
        where: { categoryId_slug: { categoryId: category.id, slug: slugify(co.name) } },
        update: {},
        create: {
          tenantId,
          categoryId: category.id,
          name: co.name,
          slug: slugify(co.name),
          position: companyIndex,
          imageUrl: co.imageUrl,
        },
      });
      companyCount++;

      for (const [typeIndex, pt] of co.productTypes.entries()) {
        const productType = await prisma.productType.upsert({
          where: { companyId_slug: { companyId: company.id, slug: slugify(pt.name) } },
          update: {},
          create: {
            tenantId,
            companyId: company.id,
            name: pt.name,
            slug: slugify(pt.name),
            description: pt.description ?? '',
            position: typeIndex,
          },
        });
        productTypeCount++;

        for (const [modelIndex, m] of pt.models.entries()) {
          const model = await prisma.model.upsert({
            where: {
              productTypeId_slug: {
                productTypeId: productType.id,
                slug: slugify(m.name),
              },
            },
            update: {},
            create: {
              tenantId,
              productTypeId: productType.id,
              name: m.name,
              slug: slugify(m.name),
              position: modelIndex,
              releaseYear: m.releaseYear,
            },
          });
          modelIds.set(`${c.name}/${co.name}/${pt.name}/${m.name}`, model.id);
        }
      }
    }
  }
  console.log(
    `[seed] Catalog: ${CATALOG.length} categories, ${companyCount} companies, ` +
      `${productTypeCount} product types, ${modelIds.size} models`,
  );

  // --- Products -------------------------------------------------------------
  const productIds = new Map<string, string>();
  for (const p of PRODUCTS) {
    const modelKey = `${p.path.category}/${p.path.company}/${p.path.productType}/${p.path.model}`;
    const modelId = modelIds.get(modelKey);
    if (!modelId) throw new Error(`Seed error: no model for ${modelKey}`);

    const existing = await prisma.product.findFirst({
      where: { tenantId, sku: p.sku },
    });
    if (existing) {
      productIds.set(p.sku, existing.id);
      continue;
    }

    const product = await prisma.product.create({
      data: {
        tenantId,
        modelId,
        sku: p.sku,
        name: p.name,
        description: p.description,
        stock: p.stock,
        status: stockStatus(p.stock),
        price: new Prisma.Decimal(p.price),
        unitValue: new Prisma.Decimal(p.unitValue),
        discount: p.discount,
        tags: p.tags,
        visibility: ProductVisibility.PUBLIC,
        images: { create: p.images.map((url) => ({ url })) },
        variants: { create: p.variants.map((name) => ({ name })) },
      },
    });
    productIds.set(p.sku, product.id);
  }
  console.log(`[seed] Products: ${productIds.size}`);

  // Order lines snapshot where a product sat when it sold; precomputed here so
  // the demo orders below carry the same data a real checkout would write.
  const classificationBySku = new Map(
    PRODUCTS.map((p) => [
      p.sku,
      {
        categoryName: p.path.category,
        companyName: p.path.company,
        productTypeName: p.path.productType,
        modelName: p.path.model,
      },
    ]),
  );

  // --- Customers ------------------------------------------------------------
  const customerPassword = await bcrypt.hash('Customer123!', 12);
  const customerIds: string[] = [];
  for (const c of CUSTOMERS) {
    const customer = await prisma.user.upsert({
      where: { tenantId_email: { tenantId, email: c.email } },
      update: {},
      create: {
        tenantId,
        email: c.email,
        fullName: c.fullName,
        phone: c.phone,
        passwordHash: customerPassword,
        role: Role.CUSTOMER,
        status: c.status,
        emailVerified: true,
        createdAt: daysAgo(c.joined),
        addresses: { create: { lines: c.address, isDefault: true } },
        wishlists: { create: { tenantId } },
      },
    });
    customerIds.push(customer.id);
  }
  console.log(`[seed] Customers: ${customerIds.length}`);

  // --- Orders ---------------------------------------------------------------
  const priceBySku = new Map(PRODUCTS.map((p) => [p.sku, p.price]));
  const nameBySku = new Map(PRODUCTS.map((p) => [p.sku, p.name]));
  let orderSeq = 1000;

  for (const o of ORDERS) {
    const orderNumber = `ORD-2026-${orderSeq++}`;
    const existing = await prisma.order.findFirst({
      where: { tenantId, orderNumber },
    });
    if (existing) continue;

    const customerId = customerIds[o.customer];
    const address = CUSTOMERS[o.customer].address;

    await prisma.order.create({
      data: {
        tenantId,
        orderNumber,
        customerId,
        status: o.status,
        paymentStatus: o.payment,
        paymentMethod: o.payMethod,
        shippingMethod: o.method,
        shippingTracking: o.tracking,
        shippingAddress: address,
        shippingCost: new Prisma.Decimal(o.shipping),
        discount: new Prisma.Decimal(o.discount),
        placedAt: daysAgo(o.days),
        createdAt: daysAgo(o.days),
        items: {
          create: o.items.map(([sku, qty]) => ({
            productId: productIds.get(sku),
            name: nameBySku.get(sku)!,
            sku,
            quantity: qty,
            unitPrice: new Prisma.Decimal(priceBySku.get(sku)!),
            // Classification snapshot, mirroring what checkout writes.
            ...classificationBySku.get(sku),
          })),
        },
      },
    });
  }
  console.log(`[seed] Orders: ${ORDERS.length}`);

  // --- Discounts ------------------------------------------------------------
  for (const d of DISCOUNTS) {
    await prisma.discount.upsert({
      where: { tenantId_code: { tenantId, code: d.code } },
      update: {},
      create: {
        tenantId,
        code: d.code,
        name: d.name,
        type: d.type,
        value: new Prisma.Decimal(d.value),
        usageLimit: d.usageLimit,
        usageCount: Math.floor(d.usageLimit * 0.15),
        category: d.category,
        icon: d.icon,
        startDate: daysAgo(-d.start),
        endDate: daysAgo(-d.end),
      },
    });
  }
  console.log(`[seed] Discounts: ${DISCOUNTS.length}`);

  // --- Notifications (broadcast to all admins) -------------------------------
  if ((await prisma.notification.count({ where: { tenantId } })) === 0) {
    await prisma.notification.createMany({
      data: ([
        {
          type: NotificationType.SUCCESS,
          category: NotificationCategory.ORDERS,
          title: 'New Order Received',
          description: 'Order ORD-2026-1000 from Elena Bianchi.',
          read: false,
          createdAt: new Date(),
        },
        {
          type: NotificationType.INFO,
          category: NotificationCategory.CUSTOMERS,
          title: 'Customer Registration',
          description: 'Antonio Bruno created a new account.',
          read: false,
          createdAt: new Date(),
        },
        {
          type: NotificationType.SUCCESS,
          category: NotificationCategory.ORDERS,
          title: 'Payment Successful',
          description: 'Payment for order ORD-2026-1003 was captured.',
          read: true,
          createdAt: daysAgo(0),
        },
        {
          type: NotificationType.WARNING,
          category: NotificationCategory.INVENTORY,
          title: 'Product Out of Stock',
          description: '“Halo Studio Headphones” has reached zero stock.',
          read: false,
          createdAt: daysAgo(1),
        },
        {
          type: NotificationType.INFO,
          category: NotificationCategory.DISCOUNTS,
          title: 'Discount Campaign Started',
          description: '“Summer Solstice Sale” (SUMMER24) is now active.',
          read: true,
          createdAt: daysAgo(1),
        },
        {
          type: NotificationType.ERROR,
          category: NotificationCategory.ORDERS,
          title: 'Payment Failed',
          description: 'Payment attempt for order ORD-2026-1008 failed.',
          read: false,
          createdAt: daysAgo(2),
        },
        {
          type: NotificationType.INFO,
          category: NotificationCategory.REPORTS,
          title: 'Monthly Sales Report Ready',
          description: 'Your latest performance report is available.',
          read: true,
          createdAt: daysAgo(5),
        },
        {
          type: NotificationType.WARNING,
          category: NotificationCategory.SYSTEM,
          title: 'Security Login Alert',
          description: 'New sign-in from Milan, Italy on Chrome (Windows).',
          read: true,
          createdAt: daysAgo(6),
        },
      ] as const).map((n) => ({ ...n, tenantId })),
    });
    console.log('[seed] Notifications: 8');
  }

  // --- Conversations --------------------------------------------------------
  if ((await prisma.conversation.count({ where: { tenantId } })) === 0) {
    const threads = [
      {
        customer: 0,
        unread: 2,
        messages: [
          {
            d: MessageDirection.INCOMING,
            t: "Hi! I placed an order yesterday but haven't received a confirmation email.",
          },
          {
            d: MessageDirection.OUTGOING,
            t: 'Hello Elena! Let me check that for you right away.',
          },
          {
            d: MessageDirection.OUTGOING,
            t: 'I can see your order was confirmed — the email may have gone to spam.',
          },
          {
            d: MessageDirection.INCOMING,
            t: 'Found it, thanks! It was indeed in spam.',
          },
          {
            d: MessageDirection.INCOMING,
            t: 'Perfect, thank you! When can I expect the delivery?',
          },
        ],
      },
      {
        customer: 1,
        unread: 1,
        messages: [
          {
            d: MessageDirection.INCOMING,
            t: 'Good morning, I need to update the delivery address for my latest order.',
          },
          {
            d: MessageDirection.OUTGOING,
            t: 'Of course, Marco. Which order is it?',
          },
          {
            d: MessageDirection.INCOMING,
            t: 'Could you help me change the shipping address?',
          },
        ],
      },
      {
        customer: 2,
        unread: 0,
        messages: [
          {
            d: MessageDirection.INCOMING,
            t: "Hello, I'd like to request a refund for a returned item.",
          },
          {
            d: MessageDirection.OUTGOING,
            t: "I've started the refund process for you.",
          },
          {
            d: MessageDirection.OUTGOING,
            t: 'The refund has been processed. Thanks for your patience.',
          },
        ],
      },
      {
        customer: 3,
        unread: 0,
        messages: [
          {
            d: MessageDirection.INCOMING,
            t: 'Hi, I manage procurement for a small studio.',
          },
          {
            d: MessageDirection.INCOMING,
            t: 'Do you offer bulk discounts for corporate accounts?',
          },
        ],
      },
    ];

    for (const thread of threads) {
      await prisma.conversation.create({
        data: {
          tenantId,
          customerId: customerIds[thread.customer],
          unreadCount: thread.unread,
          lastMessageAt: new Date(),
          messages: {
            create: thread.messages.map((m, i) => ({
              direction: m.d,
              text: m.t,
              // Space messages a minute apart so ordering is stable.
              createdAt: new Date(
                Date.now() - (thread.messages.length - i) * 60_000,
              ),
            })),
          },
        },
      });
    }
    console.log(`[seed] Conversations: ${threads.length}`);
  }

  console.log('[seed] Done.');
}

main()
  .catch((e) => {
    console.error('[seed] Failed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
