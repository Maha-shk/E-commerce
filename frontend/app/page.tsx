"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

export default function HomePage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-white">
      {/* Header/Navigation */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm shadow-md border-b border-gray-100">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center">
              <Link href="/">
                <Image
                  src="/images/homepage/logo.png"
                  alt="Cento Logo"
                  width={120}
                  height={40}
                  className="h-12 w-auto hover:opacity-80 transition-opacity"
                />
              </Link>
            </div>

            {/* Navigation Links */}
            <nav className="hidden lg:flex items-center space-x-8">
              <Link href="/" className="text-gray-900 hover:text-blue-600 font-semibold transition-colors relative group">
                Home
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-blue-600 group-hover:w-full transition-all"></span>
              </Link>
              <Link href="/products" className="text-gray-700 hover:text-blue-600 font-medium transition-colors relative group">
                Products
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-blue-600 group-hover:w-full transition-all"></span>
              </Link>
              <Link href="/categories" className="text-gray-700 hover:text-blue-600 font-medium transition-colors relative group">
                Categories
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-blue-600 group-hover:w-full transition-all"></span>
              </Link>
              <Link href="/about" className="text-gray-700 hover:text-blue-600 font-medium transition-colors relative group">
                About
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-blue-600 group-hover:w-full transition-all"></span>
              </Link>
              <Link href="/contact" className="text-gray-700 hover:text-blue-600 font-medium transition-colors relative group">
                Contact
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-blue-600 group-hover:w-full transition-all"></span>
              </Link>
            </nav>

            {/* Icons */}
            <div className="flex items-center space-x-3">
              <button className="p-2.5 hover:bg-gray-100 rounded-full transition-colors group" aria-label="Search">
                <Image
                  src="/images/homepage/icon-search.png"
                  alt="Search"
                  width={24}
                  height={24}
                  className="w-5 h-5 group-hover:scale-110 transition-transform"
                />
              </button>
              <Link href="/auth/login" className="p-2.5 hover:bg-gray-100 rounded-full transition-colors group">
                <Image
                  src="/images/homepage/icon-user.png"
                  alt="User Account"
                  width={24}
                  height={24}
                  className="w-5 h-5 group-hover:scale-110 transition-transform"
                />
              </Link>
              <Link href="/cart" className="p-2.5 hover:bg-gray-100 rounded-full relative transition-colors group">
                <Image
                  src="/images/homepage/icon-cart.png"
                  alt="Shopping Cart"
                  width={24}
                  height={24}
                  className="w-5 h-5 group-hover:scale-110 transition-transform"
                />
                <span className="absolute -top-1 -right-1 bg-gradient-to-r from-blue-600 to-blue-700 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold shadow-lg">2</span>
              </Link>
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2.5 hover:bg-gray-100 rounded-full lg:hidden transition-colors"
                aria-label="Toggle menu"
              >
                <Image
                  src="/images/homepage/icon-menu.png"
                  alt="Menu"
                  width={24}
                  height={24}
                  className="w-5 h-5"
                />
              </button>
            </div>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="lg:hidden mt-4 pb-4 border-t border-gray-100 pt-4">
              <nav className="flex flex-col space-y-3">
                <Link href="/" className="text-gray-900 hover:text-blue-600 font-medium py-2">Home</Link>
                <Link href="/products" className="text-gray-700 hover:text-blue-600 font-medium py-2">Products</Link>
                <Link href="/categories" className="text-gray-700 hover:text-blue-600 font-medium py-2">Categories</Link>
                <Link href="/about" className="text-gray-700 hover:text-blue-600 font-medium py-2">About</Link>
                <Link href="/contact" className="text-gray-700 hover:text-blue-600 font-medium py-2">Contact</Link>
              </nav>
            </div>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 py-16 md:py-24 overflow-hidden">
        <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-12">
            <div className="lg:w-1/2 text-center lg:text-left">
              <div className="inline-block px-4 py-2 bg-blue-100 text-blue-700 rounded-full text-sm font-semibold mb-6">
                ✨ New Collection 2024
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-6 leading-tight">
                Discover Your Style at <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">Cento</span>
              </h1>
              <p className="text-lg md:text-xl text-gray-600 mb-8 leading-relaxed">
                Explore our curated collection of premium products. Quality meets affordability with fast shipping and exceptional service.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Link
                  href="/products"
                  className="bg-gradient-to-r from-gray-900 to-gray-800 text-white px-8 py-4 rounded-xl font-semibold hover:from-gray-800 hover:to-gray-700 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                >
                  Shop Now →
                </Link>
                <button className="border-2 border-gray-900 text-gray-900 px-8 py-4 rounded-xl font-semibold hover:bg-gray-900 hover:text-white transition-all">
                  Learn More
                </button>
              </div>
              <div className="flex items-center justify-center lg:justify-start gap-8 mt-8 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <span className="text-green-500">✓</span> Free Shipping
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-green-500">✓</span> 24/7 Support
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-green-500">✓</span> Secure Payment
                </div>
              </div>
            </div>
            <div className="lg:w-1/2 relative">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-400 rounded-3xl transform rotate-3 opacity-20"></div>
                <Image
                  src="/images/homepage/hero-image.jpg"
                  alt="Hero Banner - Featured Products"
                  width={800}
                  height={600}
                  className="rounded-3xl shadow-2xl relative z-10 w-full h-auto"
                  priority
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Product Categories */}
      <section className="py-16 md:py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Shop by Category
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Browse our wide selection of categories to find exactly what you're looking for
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
            {[
              { name: "Electronics", image: "category-1.jpg", items: "2,500+ items" },
              { name: "Fashion", image: "category-2.jpg", items: "3,200+ items" },
              { name: "Home & Garden", image: "category-3.jpg", items: "1,800+ items" },
              { name: "Sports", image: "category-4.jpg", items: "1,200+ items" }
            ].map((category, index) => (
              <Link
                key={index}
                href={`/categories/${category.name.toLowerCase().replace(' & ', '-and-')}`}
                className="group relative overflow-hidden rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1"
              >
                <div className="relative h-72">
                  <Image
                    src={`/images/homepage/${category.image}`}
                    alt={category.name}
                    fill
                    className="object-cover group-hover:scale-110 transition duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent"></div>
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6">
                    <h3 className="text-white text-2xl md:text-3xl font-bold mb-2">{category.name}</h3>
                    <p className="text-white/90 text-sm">{category.items}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-16 md:py-20 bg-gradient-to-b from-gray-50 to-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Featured Products
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Handpicked products loved by our customers
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
            {[
              { name: "Wireless Headphones", price: "$129.99", originalPrice: "$159.99", image: "product-1.jpg", rating: 4.8, reviews: 234 },
              { name: "Smart Watch Pro", price: "$249.99", originalPrice: "$299.99", image: "product-2.jpg", rating: 4.9, reviews: 567 },
              { name: "Premium Backpack", price: "$89.99", originalPrice: "$119.99", image: "product-3.jpg", rating: 4.7, reviews: 189 },
              { name: "Fitness Tracker", price: "$79.99", originalPrice: "$99.99", image: "product-4.jpg", rating: 4.6, reviews: 345 },
              { name: "Bluetooth Speaker", price: "$149.99", originalPrice: "$189.99", image: "product-5.jpg", rating: 4.8, reviews: 432 },
              { name: "Laptop Stand", price: "$49.99", originalPrice: "$69.99", image: "product-6.jpg", rating: 4.5, reviews: 156 },
              { name: "Wireless Charger", price: "$39.99", originalPrice: "$49.99", image: "product-7.jpg", rating: 4.7, reviews: 678 },
              { name: "USB-C Hub", price: "$59.99", originalPrice: "$79.99", image: "product-8.jpg", rating: 4.6, reviews: 234 }
            ].map((product, index) => (
              <div
                key={index}
                className="bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden group transform hover:-translate-y-1"
              >
                <div className="relative h-72 overflow-hidden">
                  <Image
                    src={`/images/homepage/${product.image}`}
                    alt={product.name}
                    fill
                    className="object-cover group-hover:scale-110 transition duration-500"
                  />
                  <div className="absolute top-4 left-4 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-bold">
                    -{Math.round((1 - parseFloat(product.price.replace('$', '')) / parseFloat(product.originalPrice.replace('$', ''))) * 100)}%
                  </div>
                  <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button className="bg-white p-2 rounded-full shadow-lg hover:bg-gray-100">
                      <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                      </svg>
                    </button>
                  </div>
                </div>
                <div className="p-5">
                  <div className="flex items-center mb-2">
                    <div className="flex items-center text-yellow-400">
                      <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20">
                        <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z"/>
                      </svg>
                      <span className="ml-1 text-sm text-gray-700 font-medium">{product.rating}</span>
                      <span className="ml-1 text-xs text-gray-500">({product.reviews})</span>
                    </div>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3 line-clamp-2">{product.name}</h3>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <span className="text-xl font-bold text-gray-900">{product.price}</span>
                      <span className="text-sm text-gray-500 line-through ml-2">{product.originalPrice}</span>
                    </div>
                  </div>
                  <button className="w-full bg-gradient-to-r from-gray-900 to-gray-800 text-white py-3 rounded-xl font-semibold hover:from-gray-800 hover:to-gray-700 transition-all shadow-lg hover:shadow-xl">
                    Add to Cart
                  </button>
                </div>
              </div>
            ))}
          </div>
          <div className="text-center mt-12">
            <Link
              href="/products"
              className="inline-flex items-center gap-2 bg-white text-gray-900 px-8 py-4 rounded-xl font-semibold border-2 border-gray-900 hover:bg-gray-900 hover:text-white transition-all shadow-lg hover:shadow-xl"
            >
              View All Products
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
          </div>
        </div>
      </section>

      {/* Promotional Banners */}
      <section className="py-16 md:py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Link href="/products?sale=true" className="group relative h-80 md:h-96 rounded-3xl overflow-hidden shadow-2xl transform hover:-translate-y-1 transition-all duration-300">
              <Image
                src="/images/homepage/banner-1.jpg"
                alt="Special Offers and Discounts"
                fill
                className="object-cover group-hover:scale-110 transition duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-red-600/80 to-orange-600/80 flex flex-col items-center justify-center text-white p-8">
                <div className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full mb-4 text-sm font-semibold">
                  🔥 Limited Time Offer
                </div>
                <h3 className="text-4xl md:text-5xl font-bold mb-3">Special Offers</h3>
                <p className="text-xl md:text-2xl mb-6 text-center">Up to 50% off selected items</p>
                <button className="bg-white text-gray-900 px-8 py-4 rounded-xl font-semibold hover:bg-gray-100 transition-all shadow-xl">
                  Shop Now →
                </button>
              </div>
            </Link>
            <Link href="/products?new=true" className="group relative h-80 md:h-96 rounded-3xl overflow-hidden shadow-2xl transform hover:-translate-y-1 transition-all duration-300">
              <Image
                src="/images/homepage/banner-2.jpg"
                alt="New Arrivals Collection"
                fill
                className="object-cover group-hover:scale-110 transition duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600/80 to-purple-600/80 flex flex-col items-center justify-center text-white p-8">
                <div className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full mb-4 text-sm font-semibold">
                  ✨ Just Dropped
                </div>
                <h3 className="text-4xl md:text-5xl font-bold mb-3">New Arrivals</h3>
                <p className="text-xl md:text-2xl mb-6 text-center">Check out our latest products</p>
                <button className="bg-white text-gray-900 px-8 py-4 rounded-xl font-semibold hover:bg-gray-100 transition-all shadow-xl">
                  Explore →
                </button>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* Newsletter Section */}
      <section className="py-16 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Stay Updated with Exclusive Deals
          </h2>
          <p className="text-white/90 mb-8 max-w-2xl mx-auto">
            Subscribe to our newsletter and be the first to know about new arrivals, special offers, and insider tips.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center max-w-xl mx-auto">
            <input
              type="email"
              placeholder="Enter your email address"
              className="flex-1 px-6 py-4 rounded-xl text-gray-900 focus:outline-none focus:ring-4 focus:ring-white/30"
            />
            <button className="bg-white text-blue-600 px-8 py-4 rounded-xl font-semibold hover:bg-gray-100 transition-all shadow-xl">
              Subscribe
            </button>
          </div>
          <p className="text-white/70 text-sm mt-4">
            No spam, unsubscribe anytime. We respect your privacy.
          </p>
        </div>
      </section>

      {/* Trust Badges */}
      <section className="py-12 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-lg mb-4">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">Secure Payment</h3>
              <p className="text-sm text-gray-600">100% secure transactions</p>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-lg mb-4">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">Free Shipping</h3>
              <p className="text-sm text-gray-600">On orders over $50</p>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-lg mb-4">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">Easy Returns</h3>
              <p className="text-sm text-gray-600">30-day return policy</p>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-lg mb-4">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">24/7 Support</h3>
              <p className="text-sm text-gray-600">Dedicated support team</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-16">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
            <div>
              <Link href="/" className="inline-block mb-4">
                <Image
                  src="/images/homepage/logo.png"
                  alt="Cento Logo"
                  width={120}
                  height={40}
                  className="h-10 w-auto brightness-0 invert"
                />
              </Link>
              <p className="text-gray-400 text-sm mb-6 leading-relaxed">
                Your one-stop shop for amazing products at great prices. Quality guaranteed, customer satisfaction prioritized.
              </p>
              <div className="flex space-x-4">
                <a href="#" className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center hover:bg-white/20 transition">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/></svg>
                </a>
                <a href="#" className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center hover:bg-white/20 transition">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
                </a>
                <a href="#" className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center hover:bg-white/20 transition">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M9 8h-3v4h3v12h5v-12h3.642l.358-4h-4v-1.667c0-.955.192-1.333 1.115-1.333h2.885v-5h-3.808c-3.596 0-5.192 1.583-5.192 4.615v3.385z"/></svg>
                </a>
              </div>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-6">Quick Links</h3>
              <ul className="space-y-3">
                <li><Link href="/about" className="text-gray-400 hover:text-white transition flex items-center gap-2"><span className="text-blue-400">→</span> About Us</Link></li>
                <li><Link href="/contact" className="text-gray-400 hover:text-white transition flex items-center gap-2"><span className="text-blue-400">→</span> Contact</Link></li>
                <li><Link href="/faq" className="text-gray-400 hover:text-white transition flex items-center gap-2"><span className="text-blue-400">→</span> FAQ</Link></li>
                <li><Link href="/shipping" className="text-gray-400 hover:text-white transition flex items-center gap-2"><span className="text-blue-400">→</span> Shipping Info</Link></li>
                <li><Link href="/track-order" className="text-gray-400 hover:text-white transition flex items-center gap-2"><span className="text-blue-400">→</span> Track Order</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-6">Customer Service</h3>
              <ul className="space-y-3">
                <li><Link href="/returns" className="text-gray-400 hover:text-white transition flex items-center gap-2"><span className="text-blue-400">→</span> Returns & Refunds</Link></li>
                <li><Link href="/privacy" className="text-gray-400 hover:text-white transition flex items-center gap-2"><span className="text-blue-400">→</span> Privacy Policy</Link></li>
                <li><Link href="/terms" className="text-gray-400 hover:text-white transition flex items-center gap-2"><span className="text-blue-400">→</span> Terms of Service</Link></li>
                <li><Link href="/support" className="text-gray-400 hover:text-white transition flex items-center gap-2"><span className="text-blue-400">→</span> Help Center</Link></li>
                <li><Link href="/size-guide" className="text-gray-400 hover:text-white transition flex items-center gap-2"><span className="text-blue-400">→</span> Size Guide</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-6">Contact Info</h3>
              <ul className="space-y-4 text-gray-400">
                <li className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span>123 Commerce Street, New York, NY 10001</span>
                </li>
                <li className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-blue-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <a href="mailto:support@cento.com" className="hover:text-white transition">support@cento.com</a>
                </li>
                <li className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-blue-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  <a href="tel:+1234567890" className="hover:text-white transition">+1 (234) 567-890</a>
                </li>
                <li className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-blue-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>Mon-Fri: 9AM - 6PM EST</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Payment Methods */}
          <div className="border-t border-gray-800 mt-12 pt-8">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <div className="flex flex-wrap justify-center gap-4">
                <div className="bg-white/10 px-4 py-2 rounded-lg text-sm flex items-center gap-2">
                  <span className="text-blue-400">💳</span> Visa
                </div>
                <div className="bg-white/10 px-4 py-2 rounded-lg text-sm flex items-center gap-2">
                  <span className="text-blue-400">💳</span> Mastercard
                </div>
                <div className="bg-white/10 px-4 py-2 rounded-lg text-sm flex items-center gap-2">
                  <span className="text-blue-400">💳</span> American Express
                </div>
                <div className="bg-white/10 px-4 py-2 rounded-lg text-sm flex items-center gap-2">
                  <span className="text-blue-400">💳</span> PayPal
                </div>
                <div className="bg-white/10 px-4 py-2 rounded-lg text-sm flex items-center gap-2">
                  <span className="text-blue-400">🔒</span> SSL Secured
                </div>
              </div>
            </div>
          </div>

          {/* Copyright */}
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400 text-sm">
            <p className="mb-2">&copy; 2024 Cento. All rights reserved. | Designed with ❤️ for customers worldwide.</p>
            <div className="flex justify-center gap-4 text-xs">
              <Link href="/privacy" className="hover:text-white transition">Privacy Policy</Link>
              <span>|</span>
              <Link href="/terms" className="hover:text-white transition">Terms of Service</Link>
              <span>|</span>
              <Link href="/cookies" className="hover:text-white transition">Cookie Policy</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}