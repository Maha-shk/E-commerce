"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ChevronDown, Search, ShoppingCart, User, Heart, Menu, X } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useSession } from "@/lib/hooks/use-auth";
import { useWishlist } from "@/lib/hooks/use-wishlist";
import { useCatalogTree } from "@/lib/hooks/use-customer";
import type { PublicCatalogNode } from "@/lib/api/services/public";

/**
 * Category → its brands, for the header menu.
 *
 * Driven off `/public/catalog/tree` rather than a hand-written list: the tree
 * already strips archived and hidden branches server-side, so anything that
 * reaches the menu is safe to show, and adding a category to the admin puts it
 * in the navigation without a code change.
 *
 * Depth 1 — categories and their companies. Going deeper would pull every
 * product type and model in the store into a drop-down nobody reads.
 */
function CategoryMenu({ categories }: { categories: PublicCatalogNode[] }) {
  if (categories.length === 0) {
    return (
      <Link
        href="/categories"
        className="text-gray-700 hover:text-gray-900 font-medium transition-colors"
      >
        Categories
      </Link>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex items-center gap-1 font-medium text-gray-700 transition-colors hover:text-gray-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring">
        Categories
        <ChevronDown className="size-4" aria-hidden />
      </DropdownMenuTrigger>

      <DropdownMenuContent align="start" className="w-136 p-4">
        <div className="grid grid-cols-2 gap-x-6 gap-y-4">
          {categories.map((category) => (
            <div key={category.id} className="min-w-0">
              <Link
                href={`/categories/${category.slug}`}
                className="block truncate text-sm font-semibold text-foreground hover:text-primary"
              >
                {category.name}
              </Link>

              {category.children.length > 0 ? (
                <ul className="mt-1.5 space-y-1">
                  {/* The brands inside it. A company filters the product list
                      by id — brands are real nodes now, not free text. */}
                  {category.children.slice(0, 5).map((company) => (
                    <li key={company.id}>
                      <Link
                        href={`/products?companyId=${company.id}`}
                        className="block truncate text-sm text-muted-foreground hover:text-foreground"
                      >
                        {company.name}
                      </Link>
                    </li>
                  ))}
                  {category.children.length > 5 ? (
                    <li>
                      <Link
                        href={`/categories/${category.slug}`}
                        className="text-xs font-medium text-primary hover:underline"
                      >
                        +{category.children.length - 5} more
                      </Link>
                    </li>
                  ) : null}
                </ul>
              ) : null}
            </div>
          ))}
        </div>

        <div className="mt-4 border-t border-border pt-3">
          <Link
            href="/categories"
            className="text-sm font-medium text-primary hover:underline"
          >
            Browse all categories
          </Link>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function SiteHeader() {
  const { isAuthenticated, isAdmin, hydrated } = useSession();
  const { wishlistItemIds } = useWishlist();
  const { data: tree } = useCatalogTree(1);
  const categories = tree ?? [];
  const profileHref = hydrated && isAuthenticated
    ? (isAdmin ? "/admin/dashboard" : "/account")
    : "/login";
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  // Mock cart count - replace with actual cart state
  const cartCount = 2;
  const wishlistCount = wishlistItemIds.length;

  return (
    <header className="sticky top-0 z-50 bg-white shadow-sm border-b border-gray-100">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center">
            <Image
              src="/logos/cento-logo.png"
              alt="Cento Logo"
              width={120}
              height={40}
              className="h-10 w-auto"
            />
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <CategoryMenu categories={categories} />
            <Link href="/products" className="text-gray-700 hover:text-gray-900 font-medium transition-colors">
              Products
            </Link>
            <Link href="/new-arrivals" className="text-gray-700 hover:text-gray-900 font-medium transition-colors">
              New Arrivals
            </Link>
            <Link href="/contact" className="text-gray-700 hover:text-gray-900 font-medium transition-colors">
              Contact Us
            </Link>
          </nav>

          {/* Right Icons */}
          <div className="flex items-center space-x-2 sm:space-x-4">
            {/* Search Bar */}
            <div className="hidden lg:flex items-center bg-gray-100 rounded-full px-4 py-2">
              <Search className="w-5 h-5 text-gray-500" />
              <input
                type="text"
                placeholder="Search products..."
                className="bg-transparent border-none outline-none ml-2 w-40 text-sm"
              />
            </div>

            {/* Search Button (Mobile/Tablet) */}
            <button
              onClick={() => setSearchOpen(!searchOpen)}
              className="lg:hidden p-2 hover:bg-gray-100 rounded-full transition-colors"
              aria-label="Search"
            >
              <Search className="w-5 h-5 text-gray-700" />
            </button>

            {/* Wishlist */}
            <Link href="/account/wishlist" className="p-2 hover:bg-gray-100 rounded-full transition-colors relative">
              <Heart className="w-5 h-5 sm:w-6 sm:h-6 text-gray-700" />
              {wishlistCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-orange-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                  {wishlistCount}
                </span>
              )}
            </Link>

            {/* User */}
            <Link 
              href={profileHref} 
              className="p-2 hover:bg-gray-100 rounded-full transition-colors" 
              aria-label={hydrated && isAuthenticated ? "Account" : "Login"}
            >
              <User className="w-5 h-5 sm:w-6 sm:h-6 text-gray-700" />
            </Link>

            {/* Cart */}
            <Link href="/cart" className="p-2 hover:bg-gray-100 rounded-full relative transition-colors">
              <ShoppingCart className="w-5 h-5 sm:w-6 sm:h-6 text-gray-700" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-orange-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                  {cartCount}
                </span>
              )}
            </Link>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 hover:bg-gray-100 rounded-full transition-colors"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? (
                <X className="w-6 h-6 text-gray-700" />
              ) : (
                <Menu className="w-6 h-6 text-gray-700" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden mt-4 pb-4 border-t border-gray-100 pt-4">
            <nav className="flex flex-col space-y-3">
              <Link href="/categories" className="text-gray-700 hover:text-gray-900 font-medium py-2">
                Categories
              </Link>
              {/* The categories themselves, indented — a drop-down is the wrong
                  shape on mobile, but the list is still worth having. */}
              {categories.length > 0 ? (
                <ul className="space-y-1 border-l border-gray-100 pl-4">
                  {categories.map((category) => (
                    <li key={category.id}>
                      <Link
                        href={`/categories/${category.slug}`}
                        className="block py-1 text-sm text-gray-600 hover:text-gray-900"
                      >
                        {category.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : null}
              <Link href="/products" className="text-gray-700 hover:text-gray-900 font-medium py-2">
                Products
              </Link>
              <Link href="/products?new=true" className="text-gray-700 hover:text-gray-900 font-medium py-2">
                New Arrivals
              </Link>
              <Link href="/contact" className="text-gray-700 hover:text-gray-900 font-medium py-2">
                Contact Us
              </Link>
            </nav>
          </div>
        )}

        {/* Search Bar (Mobile/Tablet) */}
        {searchOpen && (
          <div className="md:hidden mt-4 pb-4 border-t border-gray-100 pt-4">
            <div className="flex items-center bg-gray-100 rounded-full px-4 py-2">
              <Search className="w-5 h-5 text-gray-500" />
              <input
                type="text"
                placeholder="Search products..."
                className="bg-transparent border-none outline-none ml-2 w-full text-sm"
              />
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
