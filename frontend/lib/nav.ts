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
  { name: "Overview", href: "/account", icon: "overview", exact: true },
  { name: "My Orders", href: "/account/orders", icon: "orders" },
  { name: "Wishlist", href: "/account/wishlist", icon: "wishlist" },
  { name: "Address Book", href: "/account/addresses", icon: "address" },
  { name: "Profile", href: "/account/profile", icon: "profile" },
];

export type PageMeta = { title: string; subtitle: string };

const pageMeta: Record<string, PageMeta> = {
  "/account": {
    title: "Overview",
    subtitle: "A snapshot of your orders, wishlist and account activity.",
  },
  "/account/orders": {
    title: "My Orders",
    subtitle: "Track deliveries and review your purchase history.",
  },
  "/account/wishlist": {
    title: "Wishlist",
    subtitle: "Products you've saved for later.",
  },
  "/account/addresses": {
    title: "Address Book",
    subtitle: "Manage your shipping and billing addresses.",
  },
  "/account/profile": {
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
