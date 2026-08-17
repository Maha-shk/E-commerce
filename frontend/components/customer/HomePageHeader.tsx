"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Heart, Menu, Search, ShoppingCart, User } from "lucide-react";
import { CatalogDrawer } from "@/components/customer/CatalogDrawer";
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

export function HomePageHeader({ cartCount = 0 }: { cartCount?: number }) {
  const router = useRouter();
  const { isAuthenticated, isAdmin, hydrated } = useSession();
  const { wishlistItemIds } = useWishlist();
  const [searchTerm, setSearchTerm] = useState("");
  /*
   * Owned here rather than passed in. Both shells held this state purely to
   * hand it straight back, and nothing else read it — so it was a prop that
   * only ever travelled in a circle.
   */
  const [menuOpen, setMenuOpen] = useState(false);

  const profileHref =
    hydrated && isAuthenticated ? (isAdmin ? "/admin/dashboard" : "/account") : "/login";
  const wishlistCount = wishlistItemIds.length;

  /**
   * The search box was previously a bare <input> with no handler at all —
   * typing did nothing and Enter did nothing. /products already reads a
   * `search` query param, so submitting just needs to navigate there.
   */
  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const term = searchTerm.trim();
    if (!term) return;

    router.push(`/products?search=${encodeURIComponent(term)}`);
    setMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-card">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6">
        <div className="flex h-19 items-center justify-between gap-4 sm:h-21">
          {/* Logo */}
          <Link
            href="/"
            className="flex shrink-0 items-center rounded-md focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
            aria-label="Cento — home"
          >
            <Image
              src="/logos/cento-logo.png"
              alt="Cento"
              width={180}
              height={60}
              priority
              // Larger than it was, and it grows with the viewport. The header
              // row grew to match so the mark isn't clipped.
              className="h-11 w-auto sm:h-13"
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
            <form
              role="search"
              onSubmit={submitSearch}
              className="mr-2 hidden items-center gap-2 rounded-full bg-muted px-4 lg:flex focus-within:ring-2 focus-within:ring-ring/40"
            >
              <button
                type="submit"
                aria-label="Search"
                className="flex shrink-0 items-center text-muted-foreground transition-colors hover:text-foreground"
              >
                <Search className="size-4" aria-hidden />
              </button>
              <input
                type="search"
                name="search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search products…"
                aria-label="Search products"
                className="h-10 w-40 border-none bg-transparent text-sm outline-none placeholder:text-muted-foreground [&::-webkit-search-cancel-button]:hidden"
              />
            </form>

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

            {/* Opens the catalogue drawer, at every breakpoint. It used to be
                a phone-only dropdown of four static links, so the four-level
                catalogue was unreachable from the header on any screen. */}
            <button
              type="button"
              onClick={() => setMenuOpen(true)}
              className={ICON_ACTION}
              aria-label="Browse catalogue"
              aria-expanded={menuOpen}
            >
              <Menu className="size-5" aria-hidden />
            </button>
          </div>
        </div>

        {/* The desktop search bar is lg-only, so without this small screens
            have no way to search at all. */}
        <form
          role="search"
          onSubmit={submitSearch}
          className="flex items-center gap-2 border-t border-border py-2 lg:hidden"
        >
          <div className="flex flex-1 items-center gap-2 rounded-full bg-muted px-4 focus-within:ring-2 focus-within:ring-ring/40">
            <button
              type="submit"
              aria-label="Search"
              className="flex shrink-0 items-center text-muted-foreground"
            >
              <Search className="size-4" aria-hidden />
            </button>
            <input
              type="search"
              name="search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search products…"
              aria-label="Search products"
              className="h-10 w-full border-none bg-transparent text-sm outline-none placeholder:text-muted-foreground [&::-webkit-search-cancel-button]:hidden"
            />
          </div>
        </form>
      </div>

      <CatalogDrawer open={menuOpen} onOpenChange={setMenuOpen} />
    </header>
  );
}
