"use client";

import Link from "next/link";
import Image from "next/image";
import { Heart, Menu, Search, ShoppingCart, User, X } from "lucide-react";
import { useSession } from "@/lib/hooks/use-auth";
import { useWishlist } from "@/lib/hooks/use-wishlist";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { href: "/categories", label: "Categories" },
  { href: "/products", label: "Products" },
  { href: "/new-arrivals", label: "New Arrivals" },
  { href: "/contact", label: "Contact Us" },
] as const;

/** Circular icon button used for the wishlist / account / cart actions. */
const ICON_ACTION =
  "relative flex size-10 items-center justify-center rounded-full text-foreground transition-colors duration-150 hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring";

/** Count pill sitting on the top-right of an icon action. */
function CountBadge({ count }: { count: number }) {
  if (count <= 0) return null;

  return (
    <span className="absolute -top-0.5 -right-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-orange-500 px-1 text-[11px] leading-none font-semibold text-white tabular-nums ring-2 ring-card">
      {count > 99 ? "99+" : count}
    </span>
  );
}

export function HomePageHeader({
  mobileMenuOpen,
  setMobileMenuOpen,
  cartCount = 0,
}: {
  mobileMenuOpen: boolean;
  setMobileMenuOpen: (open: boolean) => void;
  cartCount?: number;
}) {
  const { isAuthenticated, isAdmin, hydrated } = useSession();
  const { wishlistItemIds } = useWishlist();

  const profileHref =
    hydrated && isAuthenticated ? (isAdmin ? "/admin/dashboard" : "/account") : "/login";
  const wishlistCount = wishlistItemIds.length;

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-card">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6">
        <div className="flex h-18 items-center justify-between gap-4">
          {/* Logo */}
          <Link
            href="/"
            className="flex shrink-0 items-center rounded-md focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
            aria-label="Cento — home"
          >
            <Image
              src="/logos/cento-logo.png"
              alt="Cento"
              width={120}
              height={40}
              priority
              className="h-10 w-auto"
            />
          </Link>

          {/* Navigation */}
          <nav className="hidden items-center gap-8 md:flex" aria-label="Main">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="rounded-md text-sm font-medium text-muted-foreground transition-colors duration-150 hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-1">
            {/* Search */}
            <div className="mr-2 hidden items-center gap-2 rounded-full bg-muted px-4 lg:flex focus-within:ring-2 focus-within:ring-ring/40">
              <Search className="size-4 shrink-0 text-muted-foreground" aria-hidden />
              <input
                type="text"
                inputMode="search"
                placeholder="Search products…"
                aria-label="Search products"
                className="h-10 w-40 border-none bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              />
            </div>

            <Link
              href="/account/wishlist"
              className={ICON_ACTION}
              aria-label={`Wishlist${wishlistCount ? ` (${wishlistCount} items)` : ""}`}
            >
              <Heart className="size-5" aria-hidden />
              <CountBadge count={wishlistCount} />
            </Link>

            <Link
              href={profileHref}
              className={ICON_ACTION}
              aria-label={hydrated && isAuthenticated ? "Account" : "Login"}
            >
              <User className="size-5" aria-hidden />
            </Link>

            <Link
              href="/cart"
              className={ICON_ACTION}
              aria-label={`Cart${cartCount ? ` (${cartCount} items)` : ""}`}
            >
              <ShoppingCart className="size-5" aria-hidden />
              <CountBadge count={cartCount} />
            </Link>

            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className={cn(ICON_ACTION, "md:hidden")}
              aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? (
                <X className="size-5" aria-hidden />
              ) : (
                <Menu className="size-5" aria-hidden />
              )}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen ? (
          <nav
            className="border-t border-border py-3 md:hidden"
            aria-label="Main"
          >
            <ul className="flex flex-col">
              {NAV_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex h-11 items-center rounded-lg px-3 text-sm font-medium text-muted-foreground transition-colors duration-150 hover:bg-muted hover:text-foreground"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ) : null}
      </div>
    </header>
  );
}
