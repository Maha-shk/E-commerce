/**
 * Domain models as serialised by the backend API.
 *
 * Notes:
 * - Prisma `Decimal` fields are converted to `number` server-side.
 * - Dates arrive as ISO strings.
 * - Enums are UPPER_SNAKE_CASE; use the label maps below for display.
 */

import type { Role, UserStatus } from "@/lib/api/types";

/* ---- Enums ---- */

export type StockStatus = "IN_STOCK" | "LOW_STOCK" | "OUT_OF_STOCK";
export type ProductVisibility = "PUBLIC" | "PRIVATE" | "SCHEDULED";
export type CategoryStatus = "ACTIVE" | "ARCHIVED";
export type CategoryVisibility = "VISIBLE" | "HIDDEN";
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

export const categoryStatusLabel: Record<CategoryStatus, string> = {
  ACTIVE: "Active",
  ARCHIVED: "Archived",
};

export const categoryVisibilityLabel: Record<CategoryVisibility, string> = {
  VISIBLE: "Visible",
  HIDDEN: "Hidden",
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

/* ---- Catalog ---- */

export type Category = {
  id: string;
  name: string;
  slug: string;
  description: string;
  icon: string;
  status: CategoryStatus;
  visibility: CategoryVisibility;
  thumbnailName: string | null;
  thumbnailSize: string | null;
  parentId: string | null;
  /** Flattened counts from Prisma's `_count`. */
  products: number;
  subcategories: number;
  createdAt: string;
  updatedAt: string;
};

export type Product = {
  id: string;
  name: string;
  brand: string;
  categoryId: string | null;
  category: { id: string; name: string; slug: string } | null;
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
  category: string | null;
  categoryId: string | null;
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
