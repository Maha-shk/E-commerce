"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Search, ShoppingCart, User, Heart, Menu, X } from "lucide-react";

export function SiteHeader() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  // Mock cart count - replace with actual cart state
  const cartCount = 2;
  const wishlistCount = 0;

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
            <Link href="/categories" className="text-gray-700 hover:text-gray-900 font-medium transition-colors">
              Categories
            </Link>
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
            <Link href="/favorites" className="p-2 hover:bg-gray-100 rounded-full transition-colors relative">
              <Heart className="w-5 h-5 sm:w-6 sm:h-6 text-gray-700" />
              {wishlistCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-orange-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                  {wishlistCount}
                </span>
              )}
            </Link>

            {/* User */}
            <Link href="/login" className="p-2 hover:bg-gray-100 rounded-full transition-colors" aria-label="Login">
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
