"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { HomePageHeader } from "@/components/customer/HomePageHeader";
import { HomePageFooter } from "@/components/customer/HomePageFooter";
import { useProducts } from "@/lib/hooks/use-customer";
import { Loader2, ChevronDown, ChevronUp, Check } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

export default function ProductsPage() {
  const searchParams = useSearchParams();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    category: true,
    priceRange: true,
    availability: true,
  });
  const [inStockOnly, setInStockOnly] = useState(false);
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [sortOpen, setSortOpen] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

  // Get URL params
  const categoryParam = searchParams.get("category");
  const searchParam = searchParams.get("search");

  // Fetch products
  const { data: products, isLoading, isError } = useProducts({
    categoryId: categoryParam || undefined,
    search: searchParam || undefined,
    limit: 50,
  });

  // Toggle section expansion
  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  // Toggle category selection
  const toggleCategory = (category: string) => {
    setSelectedCategories(prev =>
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  // Clear all filters
  const clearFilters = () => {
    setInStockOnly(false);
    setMinPrice("");
    setMaxPrice("");
    setSortBy("newest");
    setSelectedCategories([]);
  };

  // Filter products
  const filteredProducts = products?.filter((product) => {
    // Stock filter
    if (inStockOnly && !product.inStock) return false;

    // Price range filter
    if (minPrice && product.salePrice < parseFloat(minPrice)) return false;
    if (maxPrice && product.salePrice > parseFloat(maxPrice)) return false;

    return true;
  }) || [];

  // Sort products
  const sortedProducts = [...filteredProducts].sort((a, b) => {
    if (sortBy === "price-low") return a.salePrice - b.salePrice;
    if (sortBy === "price-high") return b.salePrice - a.salePrice;
    if (sortBy === "name") return a.name.localeCompare(b.name);
    if (sortBy === "newest") return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    return 0;
  });

  const sortOptions = [
    { value: "newest", label: "Newest Arrivals" },
    { value: "price-low", label: "Price: Low to High" },
    { value: "price-high", label: "Price: High to Low" },
    { value: "name", label: "Name: A to Z" },
    { value: "featured", label: "Featured" },
  ];

  // Get current sort label
  const currentSortLabel = sortOptions.find(opt => opt.value === sortBy)?.label || "Newest Arrivals";

  return (
    <div className="min-h-screen bg-white">
      <HomePageHeader mobileMenuOpen={mobileMenuOpen} setMobileMenuOpen={setMobileMenuOpen} />

      <main className="container mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar Filters */}
          <aside className="lg:w-80 shrink-0">
            <div className="lg:sticky lg:top-24 space-y-6 bg-white">
              {/* Filter Header */}
              <div className="border-b-2 border-[#00234E] pb-4">
                <h2 className="text-2xl font-bold text-[#00234E] tracking-wide">FILTERS</h2>
              </div>

              {/* Category Section */}
              <div className="border-b border-gray-100 pb-6">
                <button
                  onClick={() => toggleSection("category")}
                  className="flex items-center justify-between w-full text-left mb-5 group"
                >
                  <h3 className="text-base font-semibold text-gray-900 uppercase tracking-wider group-hover:text-[#00234E] transition-colors">Category</h3>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                    expandedSections.category ? "bg-[#00234E]/10" : "bg-gray-100 group-hover:bg-[#00234E]/10"
                  }`}>
                    {expandedSections.category ? (
                      <ChevronUp className="w-4 h-4 text-[#00234E]" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-gray-500 group-hover:text-[#00234E] transition-colors" />
                    )}
                  </div>
                </button>

                {expandedSections.category && (
                  <div className="space-y-2">
                    {["All Categories", "Electronics", "Audio", "Accessories", "Cameras", "Gaming"].map((category) => (
                      <label key={category} className="flex items-center space-x-3 cursor-pointer group py-1">
                        <div className="relative">
                          <input
                            type="checkbox"
                            checked={selectedCategories.includes(category)}
                            onChange={() => toggleCategory(category)}
                            className="sr-only"
                          />
                          <div className={`w-5 h-5 border-2 rounded flex items-center justify-center transition-all duration-200 ${
                            selectedCategories.includes(category)
                              ? "bg-[#00234E] border-[#00234E] shadow-md shadow-[#00234E]/30"
                              : "border-gray-300 group-hover:border-[#00234E] group-hover:bg-[#00234E]/5"
                          }`}>
                            {selectedCategories.includes(category) && (
                              <Check className="w-3 h-3 text-white" strokeWidth={3} />
                            )}
                          </div>
                        </div>
                        <span className={`text-sm transition-colors duration-200 ${
                          selectedCategories.includes(category)
                            ? "text-[#00234E] font-semibold"
                            : "text-gray-600 group-hover:text-[#00234E]"
                        }`}>
                          {category}
                        </span>
                      </label>
                    ))}
                  </div>
                )}
              </div>

              {/* Price Range Section */}
              <div className="border-b border-gray-100 pb-6">
                <button
                  onClick={() => toggleSection("priceRange")}
                  className="flex items-center justify-between w-full text-left mb-5 group"
                >
                  <h3 className="text-base font-semibold text-gray-900 uppercase tracking-wider group-hover:text-[#00234E] transition-colors">Price Range</h3>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                    expandedSections.priceRange ? "bg-[#00234E]/10" : "bg-gray-100 group-hover:bg-[#00234E]/10"
                  }`}>
                    {expandedSections.priceRange ? (
                      <ChevronUp className="w-4 h-4 text-[#00234E]" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-gray-500 group-hover:text-[#00234E] transition-colors" />
                    )}
                  </div>
                </button>

                {expandedSections.priceRange && (
                  <div className="space-y-4">
                    <div className="flex items-center space-x-3">
                      <div className="relative flex-1">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">€</span>
                        <input
                          type="number"
                          placeholder="Min"
                          value={minPrice}
                          onChange={(e) => setMinPrice(e.target.value)}
                          className="w-full pl-7 pr-3 py-2.5 border-2 border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#00234E] focus:border-[#00234E] transition-all duration-200 hover:border-gray-300"
                        />
                      </div>
                      <span className="text-gray-400 font-medium">—</span>
                      <div className="relative flex-1">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">€</span>
                        <input
                          type="number"
                          placeholder="Max"
                          value={maxPrice}
                          onChange={(e) => setMaxPrice(e.target.value)}
                          className="w-full pl-7 pr-3 py-2.5 border-2 border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#00234E] focus:border-[#00234E] transition-all duration-200 hover:border-gray-300"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Availability Section */}
              <div className="border-b border-gray-100 pb-6">
                <button
                  onClick={() => toggleSection("availability")}
                  className="flex items-center justify-between w-full text-left mb-5 group"
                >
                  <h3 className="text-base font-semibold text-gray-900 uppercase tracking-wider group-hover:text-[#00234E] transition-colors">Availability</h3>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                    expandedSections.availability ? "bg-[#00234E]/10" : "bg-gray-100 group-hover:bg-[#00234E]/10"
                  }`}>
                    {expandedSections.availability ? (
                      <ChevronUp className="w-4 h-4 text-[#00234E]" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-gray-500 group-hover:text-[#00234E] transition-colors" />
                    )}
                  </div>
                </button>

                {expandedSections.availability && (
                  <div className="space-y-2">
                    <label className="flex items-center justify-between cursor-pointer group py-1">
                      <span className="text-sm text-gray-600 group-hover:text-[#00234E] transition-colors font-medium">In Stock Only</span>
                      <div
                        onClick={() => setInStockOnly(!inStockOnly)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-all duration-200 cursor-pointer ${
                          inStockOnly ? "bg-[#00234E] shadow-lg shadow-[#00234E]/30" : "bg-gray-200 group-hover:bg-gray-300"
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full transition-all duration-200 bg-white shadow-md ${
                            inStockOnly ? "translate-x-6" : "translate-x-1"
                          }`}
                        />
                      </div>
                    </label>
                  </div>
                )}
              </div>

              {/* Clear Filters Button */}
              <button
                onClick={clearFilters}
                className="w-full bg-[#00234E] hover:bg-[#001a3a] text-white py-3 px-6 rounded-lg font-semibold uppercase tracking-wider transition-all duration-200 hover:shadow-xl hover:shadow-[#00234E]/30 active:scale-[0.98] border-2 border-[#00234E]"
              >
                Clear All Filters
              </button>
            </div>
          </aside>

          {/* Main Content Area */}
          <div className="flex-1">
            {/* Sort Bar and Product Count */}
            <div className="flex items-center justify-between mb-6">
              <p className="text-gray-600 text-sm">
                Showing <span className="font-semibold text-gray-900">{sortedProducts.length}</span> {sortedProducts.length === 1 ? "product" : "products"}
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
                  <span className="font-semibold text-[#00234E]">{currentSortLabel}</span>
                  <ChevronDown className={`w-4 h-4 text-[#00234E] transition-transform duration-200 ${sortOpen ? 'rotate-180' : ''}`} />
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

            {/* Loading State */}
            {isLoading && (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-[#00234E]" />
              </div>
            )}

            {/* Error State */}
            {isError && (
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
            {!isLoading && !isError && sortedProducts.length === 0 && (
              <div className="text-center py-20">
                <p className="text-gray-500 text-lg">No products found</p>
                <p className="text-gray-400 mt-2">Try adjusting your filters</p>
              </div>
            )}

            {/* Products Grid */}
            {!isLoading && !isError && sortedProducts.length > 0 && (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {sortedProducts.map((product) => (
                    <Link
                      key={product.id}
                      href={`/products/${product.id}`}
                      className="bg-[#FAFAF9] rounded-xl border border-gray-200 hover:shadow-lg transition-all overflow-hidden group"
                    >
                      {/* Product Image */}
                      <div className="relative h-56 overflow-hidden bg-[#E5E7EB] rounded-t-xl">
                        {product.images && product.images.length > 0 ? (
                          <Image
                            src={product.images[0].url}
                            alt={product.name}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <div className="text-gray-300">
                              <svg className="w-12 h-12 mx-auto mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
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
                            <span className="text-red-500 text-xs font-medium">Out of Stock</span>
                          ) : product.lowStock ? (
                            <span className="text-orange-500 text-xs font-medium">
                              Only {product.stock} left
                            </span>
                          ) : (
                            <span className="text-green-600 text-xs font-medium">In Stock</span>
                          )}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </main>

      <HomePageFooter />
    </div>
  );
}
