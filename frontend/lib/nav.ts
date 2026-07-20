export type NavIconKey = "overview" | "orders" | "wishlist" | "address" | "profile";

export type NavItem = {
  name: string;
  href: string;
  icon: NavIconKey;
  /** When true, the link is only active on an exact pathname match. */
  exact?: boolean;
};

/** Primary navigation for the customer dashboard. */
export const dashboardNav: NavItem[] = [
  { name: "Overview", href: "/dashboard", icon: "overview", exact: true },
  { name: "My Orders", href: "/dashboard/orders", icon: "orders" },
  { name: "Wishlist", href: "/dashboard/wishlist", icon: "wishlist" },
  { name: "Address Book", href: "/dashboard/addresses", icon: "address" },
  { name: "Profile", href: "/dashboard/profile", icon: "profile" },
];

export type PageMeta = { title: string; subtitle: string };

const pageMeta: Record<string, PageMeta> = {
  "/dashboard": {
    title: "Overview",
    subtitle: "A snapshot of your orders, wishlist and account activity.",
  },
  "/dashboard/orders": {
    title: "My Orders",
    subtitle: "Track deliveries and review your purchase history.",
  },
  "/dashboard/wishlist": {
    title: "Wishlist",
    subtitle: "Products you've saved for later.",
  },
  "/dashboard/addresses": {
    title: "Address Book",
    subtitle: "Manage your shipping and billing addresses.",
  },
  "/dashboard/profile": {
    title: "Profile",
    subtitle: "Update your personal details and account security.",
  },
};

/** Returns whether a nav item should render as active for a given pathname. */
export function isActive(pathname: string, item: NavItem): boolean {
  if (item.exact) return pathname === item.href;
  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}

/** Resolves the page title/subtitle for the current pathname. */
export function getPageMeta(pathname: string): PageMeta {
  if (pageMeta[pathname]) return pageMeta[pathname];

  const match = [...dashboardNav]
    .sort((a, b) => b.href.length - a.href.length)
    .find((item) => pathname === item.href || pathname.startsWith(`${item.href}/`));

  return (match && pageMeta[match.href]) ?? { title: "Dashboard", subtitle: "" };
}
