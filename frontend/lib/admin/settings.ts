import { Banknote, CreditCard, Landmark, Wallet, ShieldCheck, type LucideIcon } from "lucide-react";

/* ---- Shared primitives ---- */

export type ToggleSetting = {
  id: string;
  label: string;
  description: string;
  defaultChecked: boolean;
};

export type SettingsNavItem = { id: string; label: string };

/** Anchors for the in-page settings navigation, in section order. */
export const settingsNavItems: SettingsNavItem[] = [
  { id: "store-information", label: "Store Information" },
  { id: "customer-accounts", label: "Customer Accounts" },
  { id: "orders", label: "Order Settings" },
  { id: "shipping", label: "Shipping" },
  
  { id: "tax", label: "Tax Settings" },
  
  { id: "inventory", label: "Inventory" },
  { id: "notifications", label: "Notifications" },
  { id: "security", label: "Security" },
  
  { id: "email", label: "Email Configuration" },
  
  { id: "legal", label: "Legal & Policies" },
  { id: "backup", label: "Backup & System" },
];

/* ---- Store information ---- */

export const currencies = ["EUR (€)", "USD ($)", "GBP (£)", "CHF (Fr.)", "JPY (¥)"];
export const timeZones = [
  "(UTC+01:00) Rome, Berlin, Paris",
  "(UTC+00:00) London, Lisbon",
  "(UTC-05:00) New York, Toronto",
  "(UTC-08:00) Los Angeles, Vancouver",
  "(UTC+09:00) Tokyo, Seoul",
];
export const languages = ["English", "Italian", "French", "German", "Spanish"];

/* ---- Customer account settings ---- */

export const customerAccountToggles: ToggleSetting[] = [
  {
    id: "registration",
    label: "Enable customer registration",
    description: "Allow new customers to create an account on the storefront.",
    defaultChecked: true,
  },
  {
    id: "email-verification",
    label: "Require email verification",
    description: "New accounts must verify their email before placing an order.",
    defaultChecked: true,
  },
  {
    id: "guest-checkout",
    label: "Allow guest checkout",
    description: "Customers can complete an order without creating an account.",
    defaultChecked: true,
  },
  {
    id: "profile-editing",
    label: "Allow customers to edit profile",
    description: "Customers can update their name, address, and contact details.",
    defaultChecked: true,
  },
];

export const passwordStrengthOptions = ["Basic", "Medium", "Strong"];
export const sessionTimeoutOptions = ["15 minutes", "30 minutes", "1 hour", "4 hours", "24 hours"];

/* ---- Order settings ---- */

export const defaultOrderStatusOptions = ["Pending", "Processing", "Confirmed"];
export const cancellationWindowOptions = ["1 hour", "6 hours", "24 hours", "48 hours"];
export const returnPeriodOptions = ["7 days", "14 days", "30 days", "60 days"];

export const orderToggles: ToggleSetting[] = [
  {
    id: "order-tracking",
    label: "Enable order tracking",
    description: "Show shipment tracking details on the customer's order page.",
    defaultChecked: true,
  },
  {
    id: "invoice-generation",
    label: "Automatic invoice generation",
    description: "Generate and attach a PDF invoice once an order is confirmed.",
    defaultChecked: true,
  },
];

/* ---- Shipping settings ---- */

export type ShippingMethod = {
  id: string;
  name: string;
  description: string;
  price: string;
  defaultChecked: boolean;
};

export const shippingMethods: ShippingMethod[] = [
  {
    id: "standard",
    name: "Standard Shipping",
    description: "Delivered in 3–5 business days",
    price: "€4.99",
    defaultChecked: true,
  },
  {
    id: "express",
    name: "Express Shipping",
    description: "Delivered in 1–2 business days",
    price: "€9.99",
    defaultChecked: true,
  },
];

export const shippingRegions = [
  "Europe",
  "North America",
  "Asia Pacific",
  "Middle East",
  "Australia & Oceania",
  "Rest of World",
];

/* ---- Payment settings ---- */

export type PaymentMethod = {
  id: string;
  name: string;
  description: string;
  icon: LucideIcon;
  defaultChecked: boolean;
};

export const paymentMethods: PaymentMethod[] = [
  {
    id: "cod",
    name: "Cash on Delivery",
    description: "Customers pay in cash when the order arrives.",
    icon: Banknote,
    defaultChecked: true,
  },
  {
    id: "card",
    name: "Credit / Debit Cards",
    description: "Visa, Mastercard, and American Express.",
    icon: CreditCard,
    defaultChecked: true,
  },
  {
    id: "bank-transfer",
    name: "Bank Transfer",
    description: "Customers pay via direct bank transfer.",
    icon: Landmark,
    defaultChecked: false,
  },
  {
    id: "wallet",
    name: "Digital Wallets",
    description: "Apple Pay, Google Pay, and Samsung Pay.",
    icon: Wallet,
    defaultChecked: true,
  },
  {
    id: "gateway",
    name: "Online Payment Gateway",
    description: "Stripe and PayPal checkout.",
    icon: ShieldCheck,
    defaultChecked: true,
  },
];

/* ---- Tax settings ---- */

export type RegionalTaxRate = { region: string; rate: string };

export const regionalTaxRates: RegionalTaxRate[] = [
  { region: "European Union (VAT)", rate: "20%" },
  { region: "United Kingdom (VAT)", rate: "20%" },
  { region: "United States (Sales Tax)", rate: "Varies by state" },
];

/* ---- Discounts & promotions ---- */

export const discountToggles: ToggleSetting[] = [
  {
    id: "coupons",
    label: "Enable discount coupons",
    description: "Allow customers to redeem coupon codes at checkout.",
    defaultChecked: true,
  },
  {
    id: "automatic-discounts",
    label: "Automatic discounts",
    description: "Apply eligible promotions automatically without a code.",
    defaultChecked: false,
  },
  {
    id: "referral-program",
    label: "Referral program",
    description: "Reward customers who refer new shoppers.",
    defaultChecked: false,
  },
  {
    id: "loyalty-rewards",
    label: "Loyalty rewards",
    description: "Customers earn points redeemable on future orders.",
    defaultChecked: false,
  },
  {
    id: "first-order-discount",
    label: "First-order discounts",
    description: "Offer a one-time discount to new customers.",
    defaultChecked: true,
  },
];

export const couponExpirationOptions = ["7 days", "30 days", "60 days", "90 days", "No expiration"];

/* ---- Inventory settings ---- */

export const outOfStockVisibilityOptions = [
  "Hide from storefront",
  "Show as “Out of Stock”",
  "Show with waitlist",
];
export const stockReservationOptions = ["15 minutes", "30 minutes", "1 hour", "2 hours"];

export const inventoryToggles: ToggleSetting[] = [
  {
    id: "backorders",
    label: "Allow backorders",
    description: "Customers can order items that are currently out of stock.",
    defaultChecked: false,
  },
  {
    id: "auto-inventory-updates",
    label: "Automatic inventory updates",
    description: "Stock levels adjust automatically as orders are placed.",
    defaultChecked: true,
  },
];

/* ---- Notification settings ---- */

export const customerNotifications: ToggleSetting[] = [
  {
    id: "order-confirmation",
    label: "Order confirmation",
    description: "Sent immediately after an order is placed.",
    defaultChecked: true,
  },
  {
    id: "shipping-updates",
    label: "Shipping updates",
    description: "Notify customers when their order ships.",
    defaultChecked: true,
  },
  {
    id: "delivery-confirmation",
    label: "Delivery confirmation",
    description: "Sent when the courier marks an order as delivered.",
    defaultChecked: true,
  },
  {
    id: "promotional-emails",
    label: "Promotional emails",
    description: "Sales, new arrivals, and seasonal campaigns.",
    defaultChecked: false,
  },
  {
    id: "sms-notifications",
    label: "SMS notifications",
    description: "Order and delivery updates sent via text message.",
    defaultChecked: false,
  },
  {
    id: "newsletter",
    label: "Newsletter subscription",
    description: "Periodic roundup of news and product updates.",
    defaultChecked: true,
  },
];

export const adminNotifications: ToggleSetting[] = [
  {
    id: "new-order-alerts",
    label: "New order alerts",
    description: "Get notified the moment a new order is placed.",
    defaultChecked: true,
  },
  {
    id: "low-inventory-alerts",
    label: "Low inventory alerts",
    description: "Alert the team when a product drops below its stock threshold.",
    defaultChecked: true,
  },
  {
    id: "customer-registration-alerts",
    label: "Customer registration alerts",
    description: "Notify admins when a new customer account is created.",
    defaultChecked: false,
  },
];

/* ---- Security settings ---- */

export const loginAttemptOptions = ["3 attempts", "5 attempts", "10 attempts"];
export const passwordExpiryOptions = ["Never", "30 days", "60 days", "90 days"];

export const securityToggles: ToggleSetting[] = [
  {
    id: "session-management",
    label: "Auto sign-out inactive sessions",
    description: "End an admin session automatically after prolonged inactivity.",
    defaultChecked: true,
  },
  {
    id: "security-alerts",
    label: "Security alerts",
    description: "Email the account owner about suspicious sign-in activity.",
    defaultChecked: true,
  },
];

export type TrustedDevice = {
  id: string;
  name: string;
  location: string;
  lastActive: string;
  current?: boolean;
};

export const trustedDevices: TrustedDevice[] = [
  { id: "dev-1", name: "MacBook Pro · Chrome", location: "Milan, Italy", lastActive: "Active now", current: true },
  { id: "dev-2", name: "iPhone 15 · Safari", location: "Milan, Italy", lastActive: "2 hours ago" },
  { id: "dev-3", name: "Windows PC · Edge", location: "Rome, Italy", lastActive: "3 days ago" },
];

/* ---- Appearance settings ---- */

export type ThemeOption = { id: string; label: string; description: string };

export const themeOptions: ThemeOption[] = [
  { id: "light", label: "Light", description: "Bright background, dark text" },
  { id: "dark", label: "Dark", description: "Dark background, light text" },
  { id: "system", label: "System", description: "Match the visitor's device" },
];

export const primaryColorSwatches = ["#0A2540", "#2CA35A", "#B9820F", "#2F6FB0", "#CF4257"];
export const secondaryColorSwatches = ["#F4F3EF", "#E7F4EC", "#FBF1DA", "#E6F0F9", "#FDE8EA"];

/* ---- Legal & policies ---- */


/* ---- Backup & system ---- */

export const backupFrequencyOptions = ["Daily", "Weekly", "Monthly"];

export const systemInfo = {
  version: "v2.4.1",
  lastBackup: "Oct 24, 2024 · 3:00 AM",
};
