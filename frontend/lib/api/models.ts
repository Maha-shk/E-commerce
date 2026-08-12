/**
 * Domain models as serialised by the backend API.
 *
 * Notes:
 * - Prisma `Decimal` fields are converted to `number` server-side.
 * - Dates arrive as ISO strings.
 * - Enums are UPPER_SNAKE_CASE; use the label maps below for display.
 */

import type { Role, UserStatus } from "@/lib/api/types";
import type { BreadcrumbEntry } from "@/lib/api/catalog";

/* ---- Enums ---- */

export type StockStatus = "IN_STOCK" | "LOW_STOCK" | "OUT_OF_STOCK";
export type ProductVisibility = "PUBLIC" | "PRIVATE" | "SCHEDULED";
export type OrderStatus =
  | "PENDING"
  | "PROCESSING"
  | "SHIPPED"
  | "DELIVERED"
  | "CANCELLED"
  | "RETURNED";
/** Settlement state, tracked independently of fulfilment status. */
export type PaymentStatus = "PAID" | "PENDING" | "REFUNDED" | "FAILED";
export type DiscountType = "PERCENTAGE" | "FIXED_AMOUNT";
export type DiscountCategory = "ACTIVE" | "SCHEDULED" | "ARCHIVED";
export type NotificationType = "SUCCESS" | "INFO" | "WARNING" | "ERROR";
export type NotificationCategory =
  | "ORDERS"
  | "CUSTOMERS"
  | "INVENTORY"
  | "DISCOUNTS"
  | "REPORTS"
  | "SYSTEM";

/* ---- Display labels (enum -> human text used across the admin UI) ---- */

export const stockStatusLabel: Record<StockStatus, string> = {
  IN_STOCK: "In Stock",
  LOW_STOCK: "Low Stock",
  OUT_OF_STOCK: "Out of Stock",
};

export const orderStatusLabel: Record<OrderStatus, string> = {
  PENDING: "Pending",
  PROCESSING: "Processing",
  SHIPPED: "Shipped",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
  RETURNED: "Returned",
};

export const paymentStatusLabel: Record<PaymentStatus, string> = {
  PAID: "Paid",
  PENDING: "Pending",
  REFUNDED: "Refunded",
  FAILED: "Failed",
};

export const userStatusLabel: Record<UserStatus, string> = {
  ACTIVE: "Active",
  INACTIVE: "Inactive",
  SUSPENDED: "Suspended",
};

export const discountTypeLabel: Record<DiscountType, string> = {
  PERCENTAGE: "Percentage",
  FIXED_AMOUNT: "Fixed Amount",
};

/* ---- Catalog ----
 *
 * The four levels (Category → Company → Product Type → Model) live in
 * `lib/api/catalog.ts`, since they share one shape and one set of endpoints.
 */

/** A product's place in the hierarchy, denormalised onto every response. */
export type ProductClassification = {
  modelId: string;
  model: { id: string; name: string; slug: string };
  productType: { id: string; name: string; slug: string };
  /** The Company *is* the brand now — there is no `brand` string any more. */
  company: { id: string; name: string; slug: string; imageUrl: string | null };
  category: { id: string; name: string; slug: string };
  /** Four entries, root first: Category › Company › Product Type › Model. */
  breadcrumb: BreadcrumbEntry[];
};

export type Product = ProductClassification & {
  id: string;
  name: string;
  description: string;
  sku: string;
  stock: number;
  status: StockStatus;
  price: number;
  discount: number;
  visibility: ProductVisibility;
  scheduledDate: string | null;
  tags: string[];
  unitValue: number | null;
  /** Flattened to plain arrays by the API. */
  images: string[];
  variants: string[];
  createdAt: string;
  updatedAt: string;
};

/* ---- Inventory ---- */

export type InventoryItem = {
  id: string;
  name: string;
  sku: string;
  /** The full classification, so a row can show where a part sits. */
  model: { id: string; name: string };
  productType: { id: string; name: string };
  company: { id: string; name: string };
  category: { id: string; name: string };
  stock: number;
  status: StockStatus;
  lastUpdated: string;
  unitValue: number;
};

export type InventoryStats = {
  totalProducts: number;
  totalUnits: number;
  totalValue: number;
  lowStock: number;
  outOfStock: number;
  lowStockThreshold: number;
};

/* ---- Orders ---- */

export type OrderItem = {
  id: string;
  productId: string | null;
  name: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
};

export type Order = {
  id: string;
  orderNumber: string;
  customerId: string | null;
  customer: {
    id: string;
    fullName: string;
    email: string;
    phone: string | null;
  } | null;
  status: OrderStatus;
  paymentMethod: string | null;
  shippingMethod: string | null;
  shippingTracking: string | null;
  shippingAddress: string[];
  shippingCost: number;
  discount: number;
  placedAt: string;
  items: OrderItem[];
  totals: {
    subtotal: number;
    shipping: number;
    discount: number;
    total: number;
  };
  createdAt: string;
  updatedAt: string;
};

export type OrderStats = {
  total: number;
  byStatus: Partial<Record<OrderStatus, number>>;
  revenue: number;
  averageOrderValue: number;
};

/* ---- Customers ---- */

export type CustomerListItem = {
  id: string;
  fullName: string;
  email: string;
  phone: string | null;
  status: UserStatus;
  createdAt: string;
  joinedAt: string;
  avatarUrl: string | null;
  initials: string;
  totalOrders: number;
  totalSpent: number;
};

export type CustomerDetail = CustomerListItem & {
  emailVerified: boolean;
  averageOrderValue: number;
  addresses: { id: string; lines: string[]; isDefault: boolean }[];
  recentOrders: {
    id: string;
    orderNumber: string;
    date: string;
    status: OrderStatus;
    total: number;
  }[];
};

/* ---- Discounts ---- */

export type Discount = {
  id: string;
  name: string;
  code: string;
  type: DiscountType;
  value: number;
  category: DiscountCategory;
  icon: string | null;
  usageLimit: number;
  usageCount: number;
  startDate: string;
  endDate: string;
  /** Derived server-side from the date window. */
  status: "Active" | "Scheduled" | "Expired";
  remainingUses: number | null;
  createdAt: string;
  updatedAt: string;
};

/* ---- Dashboard ---- */

export type DashboardStats = {
  totalSales: number;
  activeOrders: number;
  pendingOrders: number;
  totalCustomers: number;
  averageOrderValue: number;
  conversionRate: number;
  outOfStockProducts: number;
};

export type MonthlyPoint = { month: string; revenue: number; orders: number };

export type RecentOrder = {
  id: string;
  orderNumber: string;
  customer: string;
  status: OrderStatus;
  placedAt: string;
  total: number;
};

export type TopProduct = {
  sku: string;
  unitsSold: number;
  product: { id: string; name: string; sku: string; price: number } | null;
};

/* ---- Reports ---- */

export type ReportRow = {
  id: string;
  initials: string;
  title: string;
  subtitle: string;
  reference: string;
  detail: string;
  amount: number;
  status: "Completed" | "Processing" | "Returned";
};

export type ReportView = {
  key: "orders" | "sales" | "products";
  label: string;
  columns: { primary: string; reference: string; detail: string; amount: string };
  metrics: { label: string; value: number | string }[];
  totalEntries: number;
  rows: ReportRow[];
};

/* ---- Notifications ---- */

export type Notification = {
  id: string;
  userId: string | null;
  type: NotificationType;
  category: NotificationCategory;
  title: string;
  description: string;
  read: boolean;
  createdAt: string;
};

export type NotificationGroup = { label: string; items: Notification[] };

/* ---- Messages ---- */

export type Conversation = {
  id: string;
  customer: {
    id: string;
    fullName: string;
    email: string;
    phone: string | null;
    initials: string;
  };
  lastMessage: string;
  lastMessageAt: string;
  unread: number;
};

export type ChatMessage = {
  id: string;
  conversationId: string;
  direction: "INCOMING" | "OUTGOING";
  text: string;
  createdAt: string;
};

export type ConversationDetail = {
  id: string;
  customerId: string;
  customer: {
    id: string;
    fullName: string;
    email: string;
    phone: string | null;
    status: UserStatus;
    createdAt: string;
    initials: string;
  };
  unreadCount: number;
  lastMessageAt: string;
  messages: ChatMessage[];
  totalOrders: number;
  totalSpent: number;
  recentOrders: {
    id: string;
    orderNumber: string;
    date: string;
    status: OrderStatus;
    amount: number;
  }[];
};

/* ---- Profile & staff ---- */

export type AdminProfile = {
  id: string;
  email: string;
  fullName: string;
  phone: string | null;
  role: Role;
  status: UserStatus;
  emailVerified: boolean;
  avatarUrl: string | null;
  initials: string;
  roleLabel: string;
  username: string;
  accountSecurity: number;
  activeSessions: number;
  createdAt: string;
  updatedAt: string;
};

export type SessionInfo = {
  id: string;
  userAgent: string | null;
  ip: string | null;
  createdAt: string;
  expiresAt: string;
};

export type StaffMember = {
  id: string;
  email: string;
  fullName: string;
  role: Role;
  status: UserStatus;
  initials: string;
  roleLabel: string;
  createdAt: string;
};
