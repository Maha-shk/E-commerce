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

const CATEGORIES = [
  {
    name: 'UAV Systems',
    icon: '',
    description: 'Industrial drones and aerial survey systems.',
    thumbnail:
      'https://images.unsplash.com/photo-1473968512647-3e447244af8f?w=800&h=600&fit=crop',
    thumbnailSize: '800x600',
  },
  {
    name: 'Power Solutions',
    icon: '',
    description: 'Energy cells, inverters and field power gear.',
    thumbnail:
      'https://images.unsplash.com/photo-1497440001374-f26997328c1?w=800&h=600&fit=crop',
    thumbnailSize: '800x600',
  },
  {
    name: 'Infrastructure',
    icon: '',
    description: 'IoT gateways and distributed sensor networks.',
    thumbnail:
      'https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&h=600&fit=crop',
    thumbnailSize: '800x600',
  },
  {
    name: 'Furniture & Office',
    icon: '',
    description: 'Ergonomic seating and workspace essentials.',
    thumbnail:
      'https://images.unsplash.com/photo-1503602642458-232111445840?w=800&h=600&fit=crop',
    thumbnailSize: '800x600',
  },
  {
    name: 'Electronics',
    icon: '',
    description: 'Displays, peripherals and computing hardware.',
    thumbnail:
      'https://images.unsplash.com/photo-1498049860654-af1a5c076218?w=800&h=600&fit=crop',
    thumbnailSize: '800x600',
  },
  {
    name: 'Audio',
    icon: '',
    description: 'Studio monitoring and professional audio.',
    thumbnail:
      'https://images.unsplash.com/photo-1545128485-c400e710279f?w=800&h=600&fit=crop',
    thumbnailSize: '800x600',
  },
  {
    name: 'Accessories',
    icon: '',
    description: 'Desk accessories, hubs and everyday extras.',
    thumbnail:
      'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&h=600&fit=crop',
    thumbnailSize: '800x600',
  },
  {
    name: 'Health & Beauty',
    icon: '',
    description: 'Skincare, fitness equipment and wellness.',
    thumbnail:
      'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=800&h=600&fit=crop',
    thumbnailSize: '800x600',
  },
  {
    name: 'Sports & Outdoors',
    icon: '',
    description: 'Gear for hiking, cycling and team sports.',
    thumbnail:
      'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=800&h=600&fit=crop',
    thumbnailSize: '800x600',
  },
  {
    name: 'Books & Media',
    icon: '',
    description: 'Bestsellers, audiobooks and digital media.',
    thumbnail:
      'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=800&h=600&fit=crop',
    thumbnailSize: '800x600',
  },
];

const PRODUCTS = [
  {
    sku: 'AS-900-PR',
    name: 'AeroScan Precision Drone',
    brand: 'Cento Aerial',
    category: 'UAV Systems',
    stock: 48,
    price: 12499,
    discount: 15,
    unitValue: 9800,
    tags: ['NEW ARRIVAL'],
    variants: ['Standard', 'Extended Battery'],
    description:
      'High-altitude mapping system built for industrial survey work.',
    images: [
      'https://images.unsplash.com/photo-1473968512647-3e447244af8f?w=800&h=600&fit=crop',
    ],
  },
  {
    sku: 'VP-5000-X',
    name: 'Cento Volt-Pack',
    brand: 'Cento Power',
    category: 'Power Solutions',
    stock: 6,
    price: 4250,
    discount: 5,
    unitValue: 3100,
    tags: [],
    variants: ['5000mAh', '10000mAh'],
    description: 'High-capacity energy cell for field deployments.',
    images: [
      'https://images.unsplash.com/photo-1497440001374-f26997328c1?w=800&h=600&fit=crop',
    ],
  },
  {
    sku: 'ISH-42-GEN3',
    name: 'Industrial Sensor Hub',
    brand: 'Cento Systems',
    category: 'Infrastructure',
    stock: 120,
    price: 1890,
    discount: 12,
    unitValue: 1240,
    tags: ['ECO-FRIENDLY'],
    variants: ['Gen 3'],
    description: 'IoT infrastructure gateway for distributed sensor networks.',
    images: [
      'https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&h=600&fit=crop',
    ],
  },
  {
    sku: 'CS-PRD-00123',
    name: 'Premium Leather Ergonomic Chair',
    brand: 'Cento Design',
    category: 'Furniture & Office',
    stock: 100,
    price: 249,
    discount: 10,
    unitValue: 150,
    tags: ['NEW ARRIVAL', 'ECO-FRIENDLY'],
    variants: ['Matte Black', 'Carbon Gray', 'Arctic White'],
    description:
      'Premium ergonomic office chair in full-grain leather with adjustable lumbar support.',
    images: [
      'https://images.unsplash.com/photo-1598300042267-174c1e13cd2c?w=800&h=600&fit=crop',
    ],
  },
  {
    sku: 'HS-220-AUD',
    name: 'Halo Studio Headphones',
    brand: 'Cento Audio',
    category: 'Audio',
    stock: 0,
    price: 219,
    discount: 8,
    unitValue: 130,
    tags: [],
    variants: ['Black', 'Silver'],
    description:
      'Closed-back studio monitoring headphones with active noise cancellation.',
    images: [
      'https://images.unsplash.com/photo-1545128485-c400e710279f?w=800&h=600&fit=crop',
    ],
  },
  {
    sku: 'NB-310-MON',
    name: 'Lumen 27" 4K Monitor',
    brand: 'Cento Displays',
    category: 'Electronics',
    stock: 34,
    price: 429,
    discount: 20,
    unitValue: 300,
    tags: [],
    variants: [],
    description: '27-inch 4K IPS display with USB-C power delivery.',
    images: [
      'https://images.unsplash.com/photo-1498049860654-af1a5c076218?w=800&h=600&fit=crop',
    ],
  },
  {
    sku: 'PD-014-ACC',
    name: 'Pulse Desk Mat — XL',
    brand: 'Cento Design',
    category: 'Accessories',
    stock: 18,
    price: 29,
    discount: 5,
    unitValue: 12,
    tags: [],
    variants: ['Navy', 'Sand'],
    description: 'Extra-large stitched-edge desk mat.',
    images: [
      'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&h=600&fit=crop',
    ],
  },
  {
    sku: 'VX-077-HUB',
    name: 'Vortex USB-C Hub',
    brand: 'Cento Systems',
    category: 'Accessories',
    stock: 9,
    price: 39,
    discount: 15,
    unitValue: 20,
    tags: [],
    variants: [],
    description: '7-in-1 USB-C hub with HDMI 4K and 100W passthrough.',
    images: [
      'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=600&fit=crop',
    ],
  },
  {
    sku: 'AK-500-KEY',
    name: 'Aurora Mechanical Keyboard',
    brand: 'Cento Peripherals',
    category: 'Electronics',
    stock: 62,
    price: 149,
    discount: 18,
    unitValue: 85,
    tags: ['NEW ARRIVAL'],
    variants: ['Ivory', 'Onyx'],
    description: 'Hot-swappable mechanical keyboard with per-key RGB.',
    images: [
      'https://images.unsplash.com/photo-1595225476474-90129e84ea9b?w=800&h=600&fit=crop',
    ],
  },
  {
    sku: 'NW-200-MOU',
    name: 'Nebula Wireless Mouse',
    brand: 'Cento Peripherals',
    category: 'Electronics',
    stock: 71,
    price: 59,
    discount: 10,
    unitValue: 32,
    tags: [],
    variants: [],
    description: 'Lightweight wireless mouse with 4000 DPI sensor.',
    images: [
      'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=800&h=600&fit=crop',
    ],
  },
  {
    sku: 'PS-880-INF',
    name: 'Perimeter Sensor Array',
    brand: 'Cento Systems',
    category: 'Infrastructure',
    stock: 4,
    price: 3120,
    discount: 25,
    unitValue: 2400,
    tags: [],
    variants: [],
    description: 'Weatherproof perimeter sensing array with mesh networking.',
    visibility: ProductVisibility.SCHEDULED,
    scheduledDate: new Date('2026-08-01'),
    images: [
      'https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&h=600&fit=crop',
    ],
  },
  {
    sku: 'GB-140-PWR',
    name: 'Cento GridBox Inverter',
    brand: 'Cento Power',
    category: 'Power Solutions',
    stock: 27,
    price: 1580,
    discount: 8,
    unitValue: 1100,
    tags: [],
    variants: [],
    description: 'Modular grid-tie inverter for solar deployments.',
    images: [
      'https://images.unsplash.com/photo-1497440001374-f26997328c1?w=800&h=600&fit=crop',
    ],
  },
  {
    sku: 'QS-200-CAM',
    name: 'Quantum Security Camera',
    brand: 'Cento Security',
    category: 'Electronics',
    stock: 55,
    price: 189,
    discount: 12,
    unitValue: 120,
    tags: ['NEW ARRIVAL'],
    variants: ['Indoor', 'Outdoor'],
    description: '4K security camera with night vision and motion detection.',
    images: [
      'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=600&fit=crop',
    ],
  },
  {
    sku: 'ST-150-SPA',
    name: 'SoundTower Bluetooth Speaker',
    brand: 'Cento Audio',
    category: 'Audio',
    stock: 38,
    price: 129,
    discount: 15,
    unitValue: 80,
    tags: [],
    variants: ['Black', 'White', 'Blue'],
    description: 'Portable Bluetooth speaker with 360-degree sound.',
    images: [
      'https://images.unsplash.com/photo-1545128485-c400e710279f?w=800&h=600&fit=crop',
    ],
  },
  {
    sku: 'ER-300-WRT',
    name: 'ErgoRest Wrist Support',
    brand: 'Cento Design',
    category: 'Accessories',
    stock: 92,
    price: 45,
    discount: 20,
    unitValue: 28,
    tags: ['ECO-FRIENDLY'],
    variants: ['Standard', 'XL'],
    description: 'Memory foam wrist rest for keyboard and mouse.',
    images: [
      'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&h=600&fit=crop',
    ],
  },
];

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
      ['ISH-42-GEN3', 1],
      ['PD-014-ACC', 3],
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
      ['PD-014-ACC', 2],
      ['VX-077-HUB', 2],
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
      ['AS-900-PR', 1],
      ['VP-5000-X', 1],
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
    items: [['CS-PRD-00123', 1]],
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
      ['VP-5000-X', 1],
      ['NW-200-MOU', 1],
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
      ['AK-500-KEY', 2],
      ['PD-014-ACC', 1],
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
    items: [['NB-310-MON', 1]],
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
    items: [['NW-200-MOU', 4]],
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
    items: [['VX-077-HUB', 2]],
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
      ['GB-140-PWR', 1],
      ['PD-014-ACC', 2],
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
    items: [['HS-220-AUD', 3]],
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
    items: [['ISH-42-GEN3', 2]],
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
      ['CS-PRD-00123', 2],
      ['AK-500-KEY', 1],
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
    items: [['AS-900-PR', 1]],
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
      ['GB-140-PWR', 2],
      ['VP-5000-X', 2],
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
      ['NB-310-MON', 2],
      ['NW-200-MOU', 2],
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
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminPassword) {
    throw new Error(
      'ADMIN_PASSWORD is not set. Add it to backend/.env before seeding — it becomes ' +
        `the password for the bootstrap super-admin (${adminEmail}).`,
    );
  }

  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      passwordHash: await bcrypt.hash(adminPassword, 12),
      fullName: adminName,
      role: Role.SUPER_ADMIN,
      status: UserStatus.ACTIVE,
      emailVerified: true,
    },
  });
  console.log(`[seed] Super-admin: ${admin.email}`);

  // --- Default admin user ---------------------------------------------------
  const defaultAdmin = await prisma.user.upsert({
    where: { email: 'admin@gmail.com' },
    update: {},
    create: {
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
      where: { email: staff.email },
      update: {},
      create: {
        ...staff,
        passwordHash: demoPassword,
        status: UserStatus.ACTIVE,
        emailVerified: true,
      },
    });
  }

  // --- Categories -----------------------------------------------------------
  const categoryIds = new Map<string, string>();
  for (const c of CATEGORIES) {
    const category = await prisma.category.upsert({
      where: { slug: slugify(c.name) },
      update: {
        description: c.description,
        icon: c.icon,
        thumbnailName: c.thumbnail,
        thumbnailSize: c.thumbnailSize,
      },
      create: {
        name: c.name,
        slug: slugify(c.name),
        description: c.description,
        icon: c.icon,
        thumbnailName: c.thumbnail,
        thumbnailSize: c.thumbnailSize,
      },
    });
    categoryIds.set(c.name, category.id);
  }
  console.log(`[seed] Categories: ${categoryIds.size}`);

  // --- Products -------------------------------------------------------------
  const productIds = new Map<string, string>();
  for (const p of PRODUCTS) {
    const existing = await prisma.product.findUnique({ where: { sku: p.sku } });
    if (existing) {
      productIds.set(p.sku, existing.id);
      continue;
    }
    const product = await prisma.product.create({
      data: {
        sku: p.sku,
        name: p.name,
        brand: p.brand,
        description: p.description,
        categoryId: categoryIds.get(p.category),
        stock: p.stock,
        status: stockStatus(p.stock),
        price: new Prisma.Decimal(p.price),
        unitValue: new Prisma.Decimal(p.unitValue),
        discount: p.discount,
        tags: p.tags,
        visibility: p.visibility ?? ProductVisibility.PUBLIC,
        scheduledDate: p.scheduledDate ?? null,
        images: { create: (p.images || []).map((url) => ({ url })) },
        variants: { create: p.variants.map((name) => ({ name })) },
      },
    });
    productIds.set(p.sku, product.id);
  }
  console.log(`[seed] Products: ${productIds.size}`);

  // --- Customers ------------------------------------------------------------
  const customerPassword = await bcrypt.hash('Customer123!', 12);
  const customerIds: string[] = [];
  for (const c of CUSTOMERS) {
    const customer = await prisma.user.upsert({
      where: { email: c.email },
      update: {},
      create: {
        email: c.email,
        fullName: c.fullName,
        phone: c.phone,
        passwordHash: customerPassword,
        role: Role.CUSTOMER,
        status: c.status,
        emailVerified: true,
        createdAt: daysAgo(c.joined),
        addresses: { create: { lines: c.address, isDefault: true } },
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
    const existing = await prisma.order.findUnique({ where: { orderNumber } });
    if (existing) continue;

    const customerId = customerIds[o.customer];
    const address = CUSTOMERS[o.customer].address;

    await prisma.order.create({
      data: {
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
          })),
        },
      },
    });
  }
  console.log(`[seed] Orders: ${ORDERS.length}`);

  // --- Discounts ------------------------------------------------------------
  for (const d of DISCOUNTS) {
    await prisma.discount.upsert({
      where: { code: d.code },
      update: {},
      create: {
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
  if ((await prisma.notification.count()) === 0) {
    await prisma.notification.createMany({
      data: [
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
      ],
    });
    console.log('[seed] Notifications: 8');
  }

  // --- Conversations --------------------------------------------------------
  if ((await prisma.conversation.count()) === 0) {
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
