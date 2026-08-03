"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

export default function HomePage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-white">
      {/* Header/Navigation */}
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

            {/* Navigation Links */}
            <nav className="hidden md:flex items-center space-x-8">
              <Link href="/categories" className="text-gray-700 hover:text-gray-900 font-medium transition-colors">
                Categories
              </Link>
              <Link href="/products?new=true" className="text-gray-700 hover:text-gray-900 font-medium transition-colors">
                New Arrivals
              </Link>
              <Link href="/contact" className="text-gray-700 hover:text-gray-900 font-medium transition-colors">
                Contact Us
              </Link>
            </nav>

            {/* Right Icons */}
            <div className="flex items-center space-x-4">
              {/* Search Bar */}
              <div className="hidden lg:flex items-center bg-gray-100 rounded-full px-4 py-2">
                <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  placeholder="Search products..."
                  className="bg-transparent border-none outline-none ml-2 w-40 text-sm"
                />
              </div>

              {/* User Icon */}
              <Link href="/auth/login" className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </Link>

              {/* Favorite/Heart Icon */}
              <Link href="/favorites" className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </Link>

              {/* Cart Icon */}
              <Link href="/cart" className="p-2 hover:bg-gray-100 rounded-full relative transition-colors">
                <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <span className="absolute -top-1 -right-1 bg-orange-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">2</span>
              </Link>

              {/* Mobile Menu Button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 hover:bg-gray-100 rounded-full transition-colors"
                aria-label="Toggle menu"
              >
                <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="md:hidden mt-4 pb-4 border-t border-gray-100 pt-4">
              <nav className="flex flex-col space-y-3">
                <Link href="/categories" className="text-gray-700 hover:text-gray-900 font-medium py-2">Categories</Link>
                <Link href="/products?new=true" className="text-gray-700 hover:text-gray-900 font-medium py-2">New Arrivals</Link>
                <Link href="/contact" className="text-gray-700 hover:text-gray-900 font-medium py-2">Contact Us</Link>
              </nav>
            </div>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-16 md:py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="relative h-120 md:h-140 rounded-3xl overflow-hidden shadow-2xl">
            <Image
              src="/images/homepage/hero-image.png"
              alt="Hero Banner with headphones"
              fill
              className="object-cover"
              priority
            />
            <div className="absolute inset-0" style={{ background: 'linear-gradient(to right, rgba(6, 161, 94, 0.85), rgba(6, 161, 94, 0.4), transparent)' }}></div>
            <div className="absolute inset-0 flex items-center">
              <div className="container mx-auto px-4">
                <div className="max-w-2xl" style={{ marginLeft: '3rem' }}>
                  <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
                    Experience the Future of Audio Engineering
                  </h1>
                  <Link
                    href="/products"
                    className="inline-block bg-orange-500 hover:bg-orange-600 text-white px-8 py-4 rounded-lg font-semibold text-lg transition-colors shadow-lg"
                  >
                    Shop Now
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Explore Categories */}
      <section className="py-16 md:py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
              Explore Categories
            </h2>
            <Link href="/categories" className="text-orange-500 hover:text-orange-600 font-medium flex items-center gap-1">
              View All
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
            {[
              { name: "Laptops", icon: "💻" },
              { name: "Phones", icon: "📱" },
              { name: "Wearables", icon: "⌚" },
              { name: "Audio", icon: "🎧" },
              { name: "Cameras", icon: "📷" },
              { name: "Gaming", icon: "🎮" }
            ].map((category, index) => (
              <Link
                key={index}
                href={`/categories/${category.name.toLowerCase()}`}
                className="flex flex-col items-center p-6 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors group"
              >
                <div className="text-5xl mb-4 group-hover:scale-110 transition-transform">
                  {category.icon}
                </div>
                <h3 className="text-gray-900 font-medium text-center">{category.name}</h3>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Best Sellers */}
      <section className="py-16 md:py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
              Best Sellers
            </h2>
            <Link href="/products?sort=bestsellers" className="text-orange-500 hover:text-orange-600 font-medium flex items-center gap-1">
              View All
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
          <div className="flex overflow-x-auto gap-6 pb-4 scrollbar-hide">
            {[
              { name: "Dell XPS Laptop", price: "$999.99", image: "product-1.jpg" },
              { name: "Audio Over-Ear Headphones", price: "$299.99", image: "product-2.jpg" },
              { name: "Minimalist Duffel Bag", price: "$149.99", image: "product-3.jpg" },
              { name: "Linear Mechanical Keyboard", price: "$89.99", image: "product-4.jpg" }
            ].map((product, index) => (
              <div
                key={index}
                className="shrink-0 w-72 bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow overflow-hidden group"
              >
                <div className="relative h-56 overflow-hidden">
                  <Image
                    src={`/images/homepage/${product.image}`}
                    alt={product.name}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <div className="p-5">
                  <h3 className="text-gray-900 font-semibold mb-2 line-clamp-2">{product.name}</h3>
                  <p className="text-orange-500 font-bold text-lg">{product.price}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* New Arrivals */}
      <section className="py-16 md:py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
              New Arrivals
            </h2>
            <Link href="/products?new=true" className="text-orange-500 hover:text-orange-600 font-medium flex items-center gap-1">
              View All
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Featured Bundle - Larger Card */}
            <div className="lg:col-span-2 bg-gray-50 rounded-2xl overflow-hidden group">
              <div className="relative h-80">
                <Image
                  src="/images/homepage/bundle-product.jpg"
                  alt="Studio Tech Bundle"
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-linear-to-t from-black/60 to-transparent"></div>
                <div className="absolute bottom-0 left-0 right-0 p-8">
                  <h3 className="text-white text-2xl font-bold mb-2">Studio Tech Bundle</h3>
                  <p className="text-white/80 mb-4">Complete setup for creators</p>
                  <button className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors">
                    Explore Bundle
                  </button>
                </div>
              </div>
            </div>

            {/* Two Smaller Products */}
            <div className="space-y-6">
              {[
                { name: "Professional Camera Kit", price: "$1,299.99", image: "camera-product.jpg" },
                { name: "Mechanical Keyboard Pro", price: "$159.99", image: "keyboard-product.jpg" }
              ].map((product, index) => (
                <div
                  key={index}
                  className="bg-gray-50 rounded-xl overflow-hidden group flex h-[calc(50%-12px)]"
                >
                  <div className="relative w-1/2">
                    <Image
                      src={`/images/homepage/${product.image}`}
                      alt={product.name}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <div className="w-1/2 p-4 flex flex-col justify-center">
                    <h3 className="text-gray-900 font-semibold mb-2 line-clamp-2 text-sm">{product.name}</h3>
                    <p className="text-orange-500 font-bold">{product.price}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Sales Section */}
      <section className="py-16 md:py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
              Sales
            </h2>
            <Link href="/products?sale=true" className="text-orange-500 hover:text-orange-600 font-medium flex items-center gap-1">
              View All
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { name: "Studio Headphones", price: "$129.99", originalPrice: "$199.99", image: "sale-1.jpg", discount: 35 },
              { name: "Travel Duffel", price: "$79.99", originalPrice: "$129.99", image: "sale-2.jpg", discount: 38 },
              { name: "Essential Hoodie", price: "$39.99", originalPrice: "$69.99", image: "sale-3.jpg", discount: 43 },
              { name: "Chrono Timepiece", price: "$499.99", originalPrice: "$799.99", image: "sale-4.jpg", discount: 38 }
            ].map((product, index) => (
              <div
                key={index}
                className="bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow overflow-hidden group"
              >
                <div className="relative h-56 overflow-hidden">
                  <Image
                    src={`/images/homepage/${product.image}`}
                    alt={product.name}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-4 left-4 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-bold">
                    -{product.discount}%
                  </div>
                </div>
                <div className="p-5">
                  <h3 className="text-gray-900 font-semibold mb-2 line-clamp-2">{product.name}</h3>
                  <div className="flex items-center gap-2">
                    <span className="text-orange-500 font-bold text-lg">{product.price}</span>
                    <span className="text-gray-400 line-through text-sm">{product.originalPrice}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12" style={{ backgroundColor: '#00234E', color: '#728BBC' }}>
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            {/* Company Info */}
            <div>
              <Link href="/" className="inline-block mb-4">
                <Image
                  src="/logos/cento-logo.png"
                  alt="Cento Logo"
                  width={120}
                  height={40}
                  className="h-10 w-auto brightness-0 invert"
                />
              </Link>
              <div className="flex space-x-4">
                <a href="#" className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center hover:bg-white/20 transition">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/>
                  </svg>
                </a>
                <a href="#" className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center hover:bg-white/20 transition">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                  </svg>
                </a>
                <a href="#" className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center hover:bg-white/20 transition">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M9 8h-3v4h3v12h5v-12h3.642l.358-4h-4v-1.667c0-.955.192-1.333 1.115-1.333h2.885v-5h-3.808c-3.596 0-5.192 1.583-5.192 4.615v3.385z"/>
                  </svg>
                </a>
              </div>
            </div>

            {/* Center Links */}
            <div>
              <h3 className="text-lg font-semibold mb-4" style={{ color: '#728BBC' }}>Quick Links</h3>
              <ul className="space-y-2">
                <li><Link href="/privacy" className="hover:opacity-80 transition" style={{ color: '#728BBC' }}>Privacy Policy</Link></li>
                <li><Link href="/terms" className="hover:opacity-80 transition" style={{ color: '#728BBC' }}>Terms of Service</Link></li>
                <li><Link href="/contact" className="hover:opacity-80 transition" style={{ color: '#728BBC' }}>Contact Us</Link></li>
              </ul>
            </div>

            {/* Right Links */}
            <div>
              <h3 className="text-lg font-semibold mb-4" style={{ color: '#728BBC' }}>Support</h3>
              <ul className="space-y-2">
                <li><Link href="/shipping" className="hover:opacity-80 transition" style={{ color: '#728BBC' }}>Shipping & Returns</Link></li>
                <li><Link href="/faq" className="hover:opacity-80 transition" style={{ color: '#728BBC' }}>FAQ</Link></li>
                <li><Link href="/returns" className="hover:opacity-80 transition" style={{ color: '#728BBC' }}>Easy Returns</Link></li>
              </ul>
            </div>
          </div>

          {/* Copyright */}
          <div className="border-t pt-8 text-center text-sm" style={{ borderColor: 'rgba(114, 139, 188, 0.2)', color: 'rgba(114, 139, 188, 0.6)' }}>
            <p>&copy; 2024 Cento Servizi. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}