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
  { name: "Dashboard", href: "/dashboard", icon: "dashboard", exact: true },
  { name: "Product", href: "/products", icon: "product" },
  { name: "Category", href: "/categories", icon: "category" },
  { name: "Inventory", href: "/inventory", icon: "inventory" },
  { name: "Customers", href: "/customers", icon: "customers" },
  { name: "Orders", href: "/orders", icon: "orders" },
  { name: "Discounts", href: "/discounts", icon: "discounts" },
  { name: "Reports", href: "/reports", icon: "reports" },
  { name: "Settings", href: "/settings", icon: "settings" },
];

/** Returns whether a nav item should render as active for a given pathname. */
export function isAdminNavActive(pathname: string, item: AdminNavItem): boolean {
  if (item.exact) return pathname === item.href;
  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}
