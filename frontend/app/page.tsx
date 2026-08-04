"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useHomepageCategories, useBestSellers, useNewArrivals, useSaleProducts } from "@/lib/hooks/use-homepage";
import { Loader2 } from "lucide-react";
import { HomePageHeader } from "@/components/customer/HomePageHeader";
import { HomePageFooter } from "@/components/customer/HomePageFooter";

export default function HomePage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [bestSellersScrollIndex, setBestSellersScrollIndex] = useState(0);
  const [salesScrollIndex, setSalesScrollIndex] = useState(0);

  // API hooks for fetching data
  const { data: categories, isLoading: categoriesLoading } = useHomepageCategories(6);
  const { data: bestSellers, isLoading: bestSellersLoading } = useBestSellers(5);
  const { data: newArrivals, isLoading: newArrivalsLoading } = useNewArrivals(3);
  const { data: saleProducts, isLoading: saleProductsLoading } = useSaleProducts(5);

  const scrollBestSellers = (direction: 'left' | 'right') => {
    const container = document.getElementById('bestsellers-container');
    if (container) {
      const cardWidth = 288 + 24; // w-72 (288px) + gap-6 (24px)
      const scrollAmount = cardWidth * 2; // Scroll 2 cards at a time

      if (direction === 'left') {
        container.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
        setBestSellersScrollIndex(Math.max(0, bestSellersScrollIndex - 2));
      } else {
        container.scrollBy({ left: scrollAmount, behavior: 'smooth' });
        setBestSellersScrollIndex(Math.min(3, bestSellersScrollIndex + 2));
      }
    }
  };

  const scrollSales = (direction: 'left' | 'right') => {
    const container = document.getElementById('sales-container');
    if (container) {
      const cardWidth = 288 + 24; // w-72 (288px) + gap-6 (24px)
      const scrollAmount = cardWidth * 2; // Scroll 2 cards at a time

      if (direction === 'left') {
        container.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
        setSalesScrollIndex(Math.max(0, salesScrollIndex - 2));
      } else {
        container.scrollBy({ left: scrollAmount, behavior: 'smooth' });
        setSalesScrollIndex(Math.min(3, salesScrollIndex + 2));
      }
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header/Navigation */}
      <HomePageHeader mobileMenuOpen={mobileMenuOpen} setMobileMenuOpen={setMobileMenuOpen} />

      {/* Hero Section */}
      <section className="pt-16 md:pt-20 pb-8 md:pb-12 bg-white">
        <div className="container mx-auto px-4">
          <div className="relative h-120 md:h-140 rounded-3xl overflow-hidden">
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
                  <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-4 leading-tight">
                    Experience the Future of Audio Engineering
                  </h1>
                  <Link
                    href="/products"
                    className="inline-block bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-3xl font-semibold text-sm transition-colors"
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
            {categoriesLoading ? (
              <div className="col-span-full flex justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
              </div>
            ) : categories && categories.length > 0 ? (
              categories.map((category) => (
                <Link
                  key={category.id}
                  href={`/categories/${category.slug}`}
                  className="flex flex-col items-center p-6 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors group"
                >
                  <div className="text-5xl mb-4 group-hover:scale-110 transition-transform">
                    {category.icon || '📦'}
                  </div>
                  <h3 className="text-gray-900 font-medium text-center">{category.name}</h3>
                </Link>
              ))
            ) : null}
          </div>
        </div>
      </section>

      {/* Best Sellers */}
      <section className="py-16 md:py-20 bg-white">
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

          {/* Carousel Container */}
          <div className="relative">
            {/* Left Navigation Arrow - Positioned in middle */}
            <button
              onClick={() => scrollBestSellers('left')}
              disabled={bestSellersScrollIndex === 0}
              className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-white shadow-md border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center justify-center"
              aria-label="Previous products"
              style={{ transform: 'translateY(-50%)' }}
            >
              <svg className="w-4 h-4 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            {/* Products Carousel */}
            <div
              id="bestsellers-container"
              className="flex overflow-x-auto gap-6 scrollbar-hide scroll-smooth mx-12 py-2"
              style={{
                scrollbarWidth: 'none',
                msOverflowStyle: 'none',
                WebkitScrollbar: 'none'
              }}
            >
              {bestSellersLoading ? (
                <div className="w-full flex justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
                </div>
              ) : bestSellers && bestSellers.length > 0 ? (
                bestSellers.map((product) => (
                  <Link
                    key={product.id}
                    href={`/products/${product.id}`}
                    className="shrink-0 w-72 bg-[#FAFAF9] rounded-xl transition-all overflow-hidden group"
                  >
                    <div className="relative h-56 overflow-hidden rounded-t-xl">
                      {product.images && product.images.length > 0 ? (
                        <Image
                          src={product.images[0].url}
                          alt={product.name}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                          <span className="text-gray-400">No image</span>
                        </div>
                      )}
                    </div>
                    <div className="p-5">
                      <h3 className="text-gray-900 font-semibold mb-2 line-clamp-2">{product.name}</h3>
                      <div className="flex items-center gap-2">
                        {product.discountPercent > 0 ? (
                          <>
                            <span className="text-gray-400 line-through text-sm">
                              ${product.price.toFixed(2)}
                            </span>
                            <span className="text-orange-500 font-bold text-lg">
                              ${product.salePrice.toFixed(2)}
                            </span>
                          </>
                        ) : (
                          <span className="text-orange-500 font-bold text-lg">
                            ${product.price.toFixed(2)}
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>
                ))
              ) : (
                <div className="w-full text-center py-8 text-gray-500">No products available</div>
              )}
            </div>

            {/* Right Navigation Arrow - Positioned in middle */}
            <button
              onClick={() => scrollBestSellers('right')}
              disabled={bestSellersScrollIndex >= 3}
              className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-white shadow-md border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center justify-center"
              aria-label="Next products"
              style={{ transform: 'translateY(-50%)' }}
            >
              <svg className="w-4 h-4 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      </section>

      {/* New Arrivals */}
      <section className="pt-16 md:pt-20 pb-4 md:pb-8 bg-white">
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
            {newArrivalsLoading ? (
              <div className="col-span-full flex justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
              </div>
            ) : newArrivals && newArrivals.length > 0 ? (
              <>
                {/* Featured Product - Larger Card */}
                {newArrivals[0] && (
                  <Link
                    key={newArrivals[0].id}
                    href={`/products/${newArrivals[0].id}`}
                    className="lg:col-span-2 bg-[#FAFAF9] rounded-2xl overflow-hidden group"
                  >
                    <div className="relative h-full rounded-2xl" style={{ minHeight: '512px' }}>
                      {newArrivals[0].images && newArrivals[0].images.length > 0 ? (
                        <Image
                          src={newArrivals[0].images[0].url}
                          alt={newArrivals[0].name}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                          <span className="text-gray-400">No image</span>
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                      <div className="absolute bottom-0 left-0 right-0 p-8">
                        <h3 className="text-white text-2xl font-bold mb-2">{newArrivals[0].name}</h3>
                        <p className="text-white/80 mb-4">{newArrivals[0].brand || 'Featured Product'}</p>
                        <div className="flex items-center gap-3">
                          <span className="text-orange-500 font-bold text-xl">
                            ${newArrivals[0].salePrice.toFixed(2)}
                          </span>
                          {newArrivals[0].discountPercent > 0 && (
                            <span className="text-white/70 line-through">
                              ${newArrivals[0].price.toFixed(2)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </Link>
                )}

                {/* Two Smaller Products */}
                <div className="space-y-6">
                  {newArrivals.slice(1, 3).map((product) => (
                    <Link
                      key={product.id}
                      href={`/products/${product.id}`}
                      className="bg-[#FAFAF9] rounded-xl overflow-hidden group h-64 block"
                    >
                      <div className="relative h-full rounded-xl">
                        {product.images && product.images.length > 0 ? (
                          <Image
                            src={product.images[0].url}
                            alt={product.name}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                            <span className="text-gray-400">No image</span>
                          </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
                        <div className="absolute bottom-0 left-0 right-0 p-4">
                          <h3 className="text-white font-semibold mb-1 text-sm line-clamp-1">{product.name}</h3>
                          <div className="flex items-center gap-2">
                            {product.discountPercent > 0 ? (
                              <>
                                <span className="text-white font-bold text-sm">
                                  ${product.salePrice.toFixed(2)}
                                </span>
                                <span className="text-white/70 line-through text-xs">
                                  ${product.price.toFixed(2)}
                                </span>
                              </>
                            ) : (
                              <span className="text-white font-bold text-sm">
                                ${product.price.toFixed(2)}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </>
            ) : null}
          </div>
        </div>
      </section>

      {/* Sales Section */}
      <section className="py-16 md:py-20 bg-white">
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

          {/* Carousel Container */}
          <div className="relative">
            {/* Left Navigation Arrow - Positioned in middle */}
            <button
              onClick={() => scrollSales('left')}
              disabled={salesScrollIndex === 0}
              className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-white shadow-md border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center justify-center"
              aria-label="Previous products"
              style={{ transform: 'translateY(-50%)' }}
            >
              <svg className="w-4 h-4 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            {/* Products Carousel */}
            <div
              id="sales-container"
              className="flex overflow-x-auto gap-6 scrollbar-hide scroll-smooth mx-12 py-2"
              style={{
                scrollbarWidth: 'none',
                msOverflowStyle: 'none',
                WebkitScrollbar: 'none'
              }}
            >
              {saleProductsLoading ? (
                <div className="w-full flex justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
                </div>
              ) : saleProducts && saleProducts.length > 0 ? (
                saleProducts.map((product) => (
                  <Link
                    key={product.id}
                    href={`/products/${product.id}`}
                    className="shrink-0 w-72 bg-[#FAFAF9] rounded-xl transition-all overflow-hidden group"
                  >
                    <div className="relative h-56 overflow-hidden rounded-t-xl">
                      {product.images && product.images.length > 0 ? (
                        <Image
                          src={product.images[0].url}
                          alt={product.name}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                          <span className="text-gray-400">No image</span>
                        </div>
                      )}
                      {product.discountPercent > 0 && (
                        <div className="absolute top-4 left-4 bg-orange-500 text-white px-3 py-1 rounded-full text-sm font-bold">
                          -{product.discountPercent}%
                        </div>
                      )}
                    </div>
                    <div className="p-5">
                      <h3 className="text-gray-900 font-semibold mb-2 line-clamp-2">{product.name}</h3>
                      <div className="flex items-center gap-2">
                        {product.discountPercent > 0 ? (
                          <>
                            <span className="text-gray-400 line-through text-sm">
                              ${product.price.toFixed(2)}
                            </span>
                            <span className="text-orange-500 font-bold text-lg">
                              ${product.salePrice.toFixed(2)}
                            </span>
                          </>
                        ) : (
                          <span className="text-orange-500 font-bold text-lg">
                            ${product.price.toFixed(2)}
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>
                ))
              ) : (
                <div className="w-full text-center py-8 text-gray-500">No sale products available</div>
              )}
            </div>

            {/* Right Navigation Arrow - Positioned in middle */}
            <button
              onClick={() => scrollSales('right')}
              disabled={salesScrollIndex >= 3}
              className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-white shadow-md border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center justify-center"
              aria-label="Next products"
              style={{ transform: 'translateY(-50%)' }}
            >
              <svg className="w-4 h-4 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <HomePageFooter />
    </div>
  );
}