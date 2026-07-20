export type AdminNavIconKey =
  | "dashboard"
  | "product"
  | "category"
  | "inventory"
  | "customers"
  | "orders"
  | "discounts"
  | "reports"
  | "settings";

export type AdminNavItem = {
  name: string;
  href: string;
  icon: AdminNavIconKey;
  /** When true, the link is only active on an exact pathname match. */
  exact?: boolean;
  /** Screens not built yet — rendered as a disabled row instead of a link. */
  disabled?: boolean;
};

/** Primary navigation for the admin console. */
export const adminNav: AdminNavItem[] = [
  { name: "Dashboard", href: "/admin", icon: "dashboard", exact: true },
  { name: "Product", href: "/admin/products", icon: "product" },
  { name: "Category", href: "/admin/categories", icon: "category" },
  { name: "Inventory", href: "/admin/inventory", icon: "inventory" },
  { name: "Customers", href: "/admin/customers", icon: "customers" },
  { name: "Orders", href: "/admin/orders", icon: "orders" },
  { name: "Discounts", href: "/admin/discounts", icon: "discounts" },
  { name: "Reports", href: "/admin/reports", icon: "reports" },
  { name: "Settings", href: "/admin/settings", icon: "settings" },
];

/** Returns whether a nav item should render as active for a given pathname. */
export function isAdminNavActive(pathname: string, item: AdminNavItem): boolean {
  if (item.exact) return pathname === item.href;
  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}
