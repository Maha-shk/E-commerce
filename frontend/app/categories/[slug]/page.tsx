"use client";

import { useState, useMemo } from "react";
import { useParams } from "next/navigation";
import { HomePageHeader } from "@/components/customer/HomePageHeader";
import { HomePageFooter } from "@/components/customer/HomePageFooter";
import { useCategoryBySlug, useCategories } from "@/lib/hooks/use-homepage";
import { useProducts } from "@/lib/hooks/use-customer";
import { Loader2, Search, ChevronDown, Check } from "lucide-react";
import Link from "next/link";

export default function CategoryDetailPage() {
  const params = useParams();
  const slug = params.slug as string;
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [inStockOnly, setInStockOnly] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [sortOpen, setSortOpen] = useState(false);

  // Fetch current category
  const { data: category, isLoading: categoryLoading } = useCategoryBySlug(slug);

  // Fetch products only when category exists
  const shouldFetchProducts = category?.id ? true : false;
  const categoryId = category?.id;
  const { data: products, isLoading: productsLoading, isError: productsError } = useProducts(
    shouldFetchProducts && categoryId
      ? {
          categoryId: categoryId,
          search: searchQuery || undefined,
          limit: 50,
        }
      : undefined
  );

  // Clear all filters
  const clearFilters = () => {
    setInStockOnly(false);
    setSearchQuery("");
    setSortBy("newest");
  };

  // Filter products
  const filteredProducts = useMemo(() => {
    if (!products) return [];

    return products.filter((product) => {
      // Stock filter
      if (inStockOnly && !product.inStock) return false;

      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        if (
          !product.name.toLowerCase().includes(query) &&
          !product.description?.toLowerCase().includes(query)
        ) {
          return false;
        }
      }

      return true;
    });
  }, [products, inStockOnly, searchQuery]);

  // Sort products
  const sortedProducts = useMemo(() => {
    return [...filteredProducts].sort((a, b) => {
      if (sortBy === "price-low") return a.salePrice - b.salePrice;
      if (sortBy === "price-high") return b.salePrice - a.salePrice;
      if (sortBy === "name") return a.name.localeCompare(b.name);
      if (sortBy === "newest")
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      return 0;
    });
  }, [filteredProducts, sortBy]);

  const sortOptions = [
    { value: "newest", label: "Newest Arrivals" },
    { value: "price-low", label: "Price: Low to High" },
    { value: "price-high", label: "Price: High to Low" },
    { value: "name", label: "Name: A to Z" },
  ];

  const currentSortLabel =
    sortOptions.find((opt) => opt.value === sortBy)?.label || "Newest Arrivals";

  // Loading state
  if (categoryLoading) {
    return (
      <div className="min-h-screen bg-[#FBF9F8]">
        <HomePageHeader mobileMenuOpen={mobileMenuOpen} setMobileMenuOpen={setMobileMenuOpen} />
        <main className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-[#00234E]" />
          </div>
        </main>
      </div>
    );
  }

  // Category not found
  if (!category) {
    return (
      <div className="min-h-screen bg-[#FBF9F8]">
        <HomePageHeader mobileMenuOpen={mobileMenuOpen} setMobileMenuOpen={setMobileMenuOpen} />
        <main className="container mx-auto px-4 py-8">
          <div className="text-center py-20">
            <p className="text-gray-500 text-lg">Category not found</p>
            <Link href="/categories" className="text-[#00234E] hover:underline mt-4 inline-block">
              Back to Categories
            </Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FBF9F8]">
      <HomePageHeader mobileMenuOpen={mobileMenuOpen} setMobileMenuOpen={setMobileMenuOpen} />

      <main className="container mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-gray-600 mb-6">
          <Link href="/" className="hover:text-[#00234E]">
            Home
          </Link>
          <span>/</span>
          <Link href="/categories" className="hover:text-[#00234E]">
            Categories
          </Link>
          <span>/</span>
          <span className="text-gray-900 font-medium">{category.name}</span>
        </div>

        {/* Category Header */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-8">
          {/* Category Banner */}
          <div className="relative h-64 overflow-hidden">
            {category.thumbnailName ? (
              <img
                src={category.thumbnailName}
                alt={category.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                <div className="text-gray-400 text-sm">No image</div>
              </div>
            )}

            {/* Overlay with Category Info */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/30 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-6">
              <div className="mb-3">
                <h1 className="text-4xl font-bold text-white mb-2">
                  {category.name}
                </h1>
                <p className="text-white/80">{category.description}</p>
              </div>
              <div className="flex items-center gap-4 text-sm">
                <span className="bg-orange-500 text-white px-3 py-1 rounded-full font-medium">
                  {category.productCount} {category.productCount === 1 ? "product" : "products"}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar Filters */}
          <aside className="lg:w-64 shrink-0">
            <div className="lg:sticky lg:top-24">
              <div className="bg-white rounded-xl border border-gray-200 p-5">
                <h2 className="text-sm font-bold text-[#00234E] tracking-wide mb-6">
                  FILTERS
                </h2>

                {/* Availability Section */}
                <div className="mb-6">
                  <h3 className="text-xs font-semibold text-gray-900 uppercase tracking-wider mb-3">
                    Availability
                  </h3>
                  <label className="flex items-center justify-between cursor-pointer group py-1">
                    <span className="text-xs text-gray-600 group-hover:text-[#00234E] transition-colors font-medium">
                      In Stock Only
                    </span>
                    <div
                      onClick={() => setInStockOnly(!inStockOnly)}
                      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-all duration-200 cursor-pointer ${
                        inStockOnly
                          ? "bg-[#00234E] shadow-lg shadow-[#00234E]/30"
                          : "bg-gray-200 group-hover:bg-gray-300"
                      }`}
                    >
                      <span
                        className={`inline-block h-3.5 w-3.5 transform rounded-full transition-all duration-200 bg-white shadow-md ${
                          inStockOnly ? "translate-x-5" : "translate-x-1"
                        }`}
                      />
                    </div>
                  </label>
                </div>

                {/* Clear Filters Button */}
                <button
                  onClick={clearFilters}
                  className="w-full bg-[#00234E] hover:bg-[#001a3a] text-white py-2 px-4 rounded-lg font-semibold uppercase tracking-wider transition-all duration-200 hover:shadow-xl hover:shadow-[#00234E]/30 active:scale-[0.98] border-2 border-[#00234E] text-xs"
                >
                  Clear All Filters
                </button>
              </div>
            </div>
          </aside>

          {/* Main Content Area */}
          <div className="flex-1">
            {/* Search, Sort Bar and Product Count */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
              {/* Search Bar */}
              <div className="relative w-full sm:w-auto sm:flex-1 max-w-xs">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search products in this category..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-white border-2 border-gray-200 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-[#00234E] focus:border-[#00234E] transition-all duration-200 hover:border-gray-300"
                />
              </div>

              <div className="flex items-center gap-4 w-full sm:w-auto">
                <p className="text-gray-600 text-sm whitespace-nowrap">
                  Showing{" "}
                  <span className="font-semibold text-gray-900">
                    {sortedProducts.length}
                  </span>{" "}
                  {sortedProducts.length === 1 ? "product" : "products"}
                </p>

              {/* Sort Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setSortOpen(!sortOpen)}
                  className={`flex items-center space-x-3 px-5 py-2.5 border-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    sortOpen
                      ? "border-[#00234E] bg-[#00234E]/5 shadow-md shadow-[#00234E]/20"
                      : "border-gray-200 hover:border-[#00234E] hover:bg-[#00234E]/5"
                  }`}
                >
                  <span className="text-gray-600">Sort by:</span>
                  <span className="font-semibold text-[#00234E]">
                    {currentSortLabel}
                  </span>
                  <ChevronDown
                    className={`w-4 h-4 text-[#00234E] transition-transform ${
                      sortOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {sortOpen && (
                  <div className="absolute right-0 mt-2 w-64 bg-white border-2 border-gray-100 rounded-lg shadow-xl shadow-gray-200/50 z-10 overflow-hidden">
                    <div className="p-1">
                      {sortOptions.map((option) => (
                        <button
                          key={option.value}
                          onClick={() => {
                            setSortBy(option.value);
                            setSortOpen(false);
                          }}
                          className={`w-full text-left px-4 py-3 text-sm transition-all duration-200 rounded-md ${
                            sortBy === option.value
                              ? "bg-[#00234E] text-white font-semibold shadow-md"
                              : "text-gray-700 hover:bg-gray-100 font-medium"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span>{option.label}</span>
                            {sortBy === option.value && (
                              <Check className="w-4 h-4 text-white" strokeWidth={3} />
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                </div>
              </div>
            </div>

            {/* Loading State */}
            {productsLoading && (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-[#00234E]" />
              </div>
            )}

            {/* Error State */}
            {productsError && (
              <div className="text-center py-20">
                <p className="text-red-500 mb-4">Failed to load products</p>
                <button
                  onClick={() => window.location.reload()}
                  className="bg-[#00234E] text-white px-6 py-2 rounded-lg hover:bg-[#00234E]/90 transition-colors"
                >
                  Retry
                </button>
              </div>
            )}

            {/* Empty State */}
            {!productsLoading && !productsError && sortedProducts.length === 0 && (
              <div className="text-center py-20">
                <p className="text-gray-500 text-lg">No products found</p>
                <p className="text-gray-400 mt-2">Try adjusting your filters</p>
              </div>
            )}

            {/* Products Grid */}
            {!productsLoading && !productsError && sortedProducts.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {sortedProducts.map((product) => (
                  <Link
                    key={product.id}
                    href={`/products/${product.id}`}
                    className="bg-white rounded-xl border border-gray-200 hover:shadow-lg transition-all overflow-hidden group"
                  >
                    {/* Product Image */}
                    <div className="relative h-56 overflow-hidden bg-[#E5E7EB] rounded-t-xl">
                      {product.images && product.images.length > 0 ? (
                        <img
                          src={product.images[0].url}
                          alt={product.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <div className="text-gray-300">
                            <svg
                              className="w-12 h-12 mx-auto mb-1"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={1.5}
                                d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                              />
                            </svg>
                            <p className="text-xs text-center">No Image</p>
                          </div>
                        </div>
                      )}

                      {/* Sale Badge */}
                      {product.discountPercent > 0 && (
                        <div className="absolute top-3 left-3 bg-orange-500 text-white px-2 py-1 rounded-full text-xs font-bold shadow-md">
                          -{product.discountPercent}%
                        </div>
                      )}

                      {/* Low Stock Badge */}
                      {product.lowStock && product.inStock && (
                        <div className="absolute top-3 right-3 bg-red-500 text-white px-2 py-1 rounded-full text-xs font-bold">
                          Low Stock
                        </div>
                      )}

                      {/* Out of Stock Overlay */}
                      {!product.inStock && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                          <span className="bg-red-500 text-white px-3 py-1 rounded-full text-sm font-bold">
                            Out of Stock
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Product Info */}
                    <div className="p-4">
                      {/* Category */}
                      {product.category && (
                        <p className="text-xs text-gray-500 mb-1">
                          {product.category.name}
                        </p>
                      )}

                      {/* Product Name */}
                      <h3 className="text-gray-900 font-semibold mb-2 line-clamp-2 h-10">
                        {product.name}
                      </h3>

                      {/* Brand */}
                      <p className="text-gray-500 text-xs mb-2">{product.brand}</p>

                      {/* Price */}
                      <div className="flex items-center gap-2">
                        {product.discountPercent > 0 ? (
                          <>
                            <span className="text-orange-500 font-bold text-lg">
                              €{product.salePrice.toFixed(2)}
                            </span>
                            <span className="text-gray-400 line-through text-sm">
                              €{product.price.toFixed(2)}
                            </span>
                          </>
                        ) : (
                          <span className="text-orange-500 font-bold text-lg">
                            €{product.price.toFixed(2)}
                          </span>
                        )}
                      </div>

                      {/* Stock Status */}
                      <div className="mt-2">
                        {!product.inStock ? (
                          <span className="text-red-500 text-xs font-medium">
                            Out of Stock
                          </span>
                        ) : product.lowStock ? (
                          <span className="text-orange-500 text-xs font-medium">
                            Only {product.stock} left
                          </span>
                        ) : (
                          <span className="text-green-600 text-xs font-medium">
                            In Stock
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      <HomePageFooter />
    </div>
  );
}
