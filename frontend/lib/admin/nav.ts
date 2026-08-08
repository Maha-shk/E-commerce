export type AdminNavIconKey =
  | "dashboard"
  | "product"
  | "category"
  | "banners"
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

export type AdminNavGroup = {
  /** Section heading. `null` for the top group, which needs no label. */
  label: string | null;
  items: AdminNavItem[];
};

/**
 * Primary navigation for the admin console.
 *
 * Grouped rather than one flat list of ten: at that length everything reads as
 * equally important and there's no way to scan for "the orders area" without
 * reading every label. Names are also consistently plural now — it was
 * "Product"/"Category" next to "Customers"/"Orders".
 */
export const adminNavGroups: AdminNavGroup[] = [
  {
    label: null,
    items: [
      { name: "Dashboard", href: "/admin/dashboard", icon: "dashboard", exact: true },
    ],
  },
  {
    label: "Catalogue",
    items: [
      { name: "Products", href: "/admin/products", icon: "product" },
      { name: "Categories", href: "/admin/categories", icon: "category" },
      { name: "Inventory", href: "/admin/inventory", icon: "inventory" },
      { name: "Banners", href: "/admin/banners", icon: "banners" },
    ],
  },
  {
    label: "Sales",
    items: [
      { name: "Orders", href: "/admin/orders", icon: "orders" },
      { name: "Customers", href: "/admin/customers", icon: "customers" },
      { name: "Discounts", href: "/admin/discounts", icon: "discounts" },
    ],
  },
  {
    label: "Insights",
    items: [
      { name: "Reports", href: "/admin/reports", icon: "reports" },
      { name: "Settings", href: "/admin/settings", icon: "settings" },
    ],
  },
];

/** Flat list, for anything that needs to iterate every destination. */
export const adminNav: AdminNavItem[] = adminNavGroups.flatMap((g) => g.items);

/** Returns whether a nav item should render as active for a given pathname. */
export function isAdminNavActive(pathname: string, item: AdminNavItem): boolean {
  if (item.exact) return pathname === item.href;
  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}
