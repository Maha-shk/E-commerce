"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { HomePageHeader } from "@/components/customer/HomePageHeader";
import { HomePageFooter } from "@/components/customer/HomePageFooter";
import { useProducts } from "@/lib/hooks/use-customer";
import { useCart } from "@/lib/hooks/use-cart";
import { ProductCard } from "@/components/customer/ProductCard";
import { Loader2, ChevronDown, ChevronUp, Check } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

function BestSellersContent() {
  const searchParams = useSearchParams();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    category: true,
    priceRange: true,
    availability: true,
  });
  const [inStockOnly, setInStockOnly] = useState(false);
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("5000");
  const [sortBy, setSortBy] = useState("newest");
  const [sortOpen, setSortOpen] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [draggingHandle, setDraggingHandle] = useState<'min' | 'max' | null>(null);

  // Add global mouse event listeners for smooth dragging
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!draggingHandle) return;

      const slider = document.querySelector('[data-slider="price-range"]');
      if (!slider) return;

      const rect = slider.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
      const newValue = Math.floor((percentage / 100) * 5000);

      if (draggingHandle === 'min') {
        const currentMax = parseFloat(maxPrice || '5000');
        setMinPrice(Math.min(newValue, currentMax - 10).toString());
      } else {
        const currentMin = parseFloat(minPrice || '0');
        setMaxPrice(Math.max(newValue, currentMin + 10).toString());
      }
    };

    const handleMouseUp = () => {
      setDraggingHandle(null);
    };

    if (draggingHandle) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [draggingHandle, minPrice, maxPrice]);

  // Get URL params
  const categoryParam = searchParams.get("category");
  const searchParam = searchParams.get("search");

  // Fetch best sellers products
  const { data: products, isLoading, isError } = useProducts({
    bestsellers: true,
    categoryId: categoryParam || undefined,
    search: searchParam || undefined,
    limit: 50,
  });

  // Cart count
  const { totalItems } = useCart();

  // Toggle section expansion
  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  // Toggle category selection
  const toggleCategory = (category: string) => {
    setSelectedCategories(prev => {
      if (category === "All Categories") {
        // If selecting "All Categories", clear other selections
        return prev.includes("All Categories") ? [] : ["All Categories"];
      } else {
        // If selecting a specific category, remove "All Categories" if present
        const newCategories = prev.includes(category)
          ? prev.filter(c => c !== category)
          : [...prev.filter(c => c !== "All Categories"), category];
        return newCategories;
      }
    });
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
    // Category filter
    if (selectedCategories.length > 0 && !selectedCategories.includes("All Categories")) {
      const productCategory = product.category?.name;
      if (!productCategory || !selectedCategories.some(cat => cat === productCategory)) {
        return false;
      }
    }

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
    <div className="min-h-screen bg-[#FBF9F8]">
      <HomePageHeader
        mobileMenuOpen={mobileMenuOpen}
        setMobileMenuOpen={setMobileMenuOpen}
        cartCount={totalItems}
      />

      <main className="container mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar Filters */}
          <aside className="lg:w-80 shrink-0">
            <div className="lg:sticky lg:top-24">
              {/* Single Filter Card */}
              <div className="bg-white rounded-xl border border-gray-200 p-5">
                <h2 className="text-sm font-bold text-[#00234E] tracking-wide mb-6">FILTERS</h2>

                {/* Category Section */}
                <div className="mb-6">
                  <button
                    onClick={() => toggleSection("category")}
                    className="flex items-center justify-between w-full text-left mb-3 group"
                  >
                    <h3 className="text-xs font-semibold text-gray-900 uppercase tracking-wider group-hover:text-[#00234E] transition-colors">Category</h3>
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center transition-all ${
                      expandedSections.category ? "bg-[#00234E]/10" : "bg-gray-100 group-hover:bg-[#00234E]/10"
                    }`}>
                      {expandedSections.category ? (
                        <ChevronUp className="w-3 h-3 text-[#00234E]" />
                      ) : (
                        <ChevronDown className="w-3 h-3 text-gray-500 group-hover:text-[#00234E] transition-colors" />
                      )}
                    </div>
                  </button>

                  {expandedSections.category && (
                    <div className="space-y-2">
                      {["All Categories", "Electronics", "Audio", "Accessories", "Cameras", "Gaming"].map((category) => (
                        <label key={category} className="flex items-center space-x-2 cursor-pointer group py-1">
                          <div className="relative">
                            <input
                              type="checkbox"
                              checked={selectedCategories.includes(category)}
                              onChange={() => toggleCategory(category)}
                              className="sr-only"
                            />
                            <div className={`w-4 h-4 border-2 rounded flex items-center justify-center transition-all duration-200 ${
                              selectedCategories.includes(category)
                                ? "bg-[#00234E] border-[#00234E] shadow-md shadow-[#00234E]/30"
                                : "border-gray-300 group-hover:border-[#00234E] group-hover:bg-[#00234E]/5"
                            }`}>
                              {selectedCategories.includes(category) && (
                                <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />
                              )}
                            </div>
                          </div>
                          <span className={`text-xs transition-colors duration-200 ${
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
                <div className="mb-6">
                  <button
                    onClick={() => toggleSection("priceRange")}
                    className="flex items-center justify-between w-full text-left mb-3 group"
                  >
                    <h3 className="text-xs font-semibold text-gray-900 uppercase tracking-wider group-hover:text-[#00234E] transition-colors">Price Range</h3>
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center transition-all ${
                      expandedSections.priceRange ? "bg-[#00234E]/10" : "bg-gray-100 group-hover:bg-[#00234E]/10"
                    }`}>
                      {expandedSections.priceRange ? (
                        <ChevronUp className="w-3 h-3 text-[#00234E]" />
                      ) : (
                        <ChevronDown className="w-3 h-3 text-gray-500 group-hover:text-[#00234E] transition-colors" />
                      )}
                    </div>
                  </button>

                  {expandedSections.priceRange && (
                    <div className="space-y-4">
                      {/* Interactive Dual Range Slider */}
                      <div className="relative px-1">
                        <div
                          className="relative h-2 bg-gray-200 rounded-full select-none"
                          data-slider="price-range"
                        >
                          {/* Track Background */}
                          <div className="absolute h-full w-full rounded-full bg-gray-300"></div>

                          {/* Colored Range Bar */}
                          <div
                            className="absolute h-full bg-[#00234E] rounded-full transition-all duration-200"
                            style={{
                              left: minPrice ? `${(parseFloat(minPrice) / 5000) * 100}%` : '0%',
                              width: maxPrice ?
                                `${((parseFloat(maxPrice) - parseFloat(minPrice || '0')) / 5000) * 100}%` :
                                '100%'
                            }}
                          ></div>

                          {/* Min Handle */}
                          <div
                            className="absolute w-5 h-5 bg-white border-2 border-[#00234E] rounded-full shadow-md cursor-grab hover:scale-110 transition-all duration-200"
                            style={{
                              left: minPrice ? `${(parseFloat(minPrice) / 5000) * 100}%` : '0%',
                              transform: 'translateX(-50%)'
                            }}
                            onMouseDown={() => setDraggingHandle('min')}
                          >
                            <div className="absolute top-1/2 left-1/2 w-1 h-3 bg-[#00234E] rounded-full transform -translate-y-1/2 -translate-x-1/2"></div>
                          </div>

                          {/* Max Handle */}
                          <div
                            className="absolute w-5 h-5 bg-white border-2 border-[#00234E] rounded-full shadow-md cursor-grab hover:scale-110 transition-all duration-200"
                            style={{
                              left: maxPrice ? `${(parseFloat(maxPrice) / 5000) * 100}%` : '100%',
                              transform: 'translateX(-50%)'
                            }}
                            onMouseDown={() => setDraggingHandle('max')}
                          >
                            <div className="absolute top-1/2 left-1/2 w-1 h-3 bg-[#00234E] rounded-full transform -translate-y-1/2 -translate-x-1/2"></div>
                          </div>
                        </div>
                      </div>

                      {/* Price Labels */}
                      <div className="flex justify-between text-xs text-gray-600 font-medium">
                        <span>€{minPrice || '0'}</span>
                        <span className="text-[#00234E] font-semibold">
                          {maxPrice && parseFloat(maxPrice) >= 5000 ? '€5000+' : `€${maxPrice || '5000+'}`}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Availability Section */}
                <div className="mb-6">
                  <button
                    onClick={() => toggleSection("availability")}
                    className="flex items-center justify-between w-full text-left mb-3 group"
                  >
                    <h3 className="text-xs font-semibold text-gray-900 uppercase tracking-wider group-hover:text-[#00234E] transition-colors">Availability</h3>
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center transition-all ${
                      expandedSections.availability ? "bg-[#00234E]/10" : "bg-gray-100 group-hover:bg-[#00234E]/10"
                    }`}>
                      {expandedSections.availability ? (
                        <ChevronUp className="w-3 h-3 text-[#00234E]" />
                      ) : (
                        <ChevronDown className="w-3 h-3 text-gray-500 group-hover:text-[#00234E] transition-colors" />
                      )}
                    </div>
                  </button>

                  {expandedSections.availability && (
                    <div className="space-y-1.5">
                      <label className="flex items-center justify-between cursor-pointer group py-1">
                        <span className="text-xs text-gray-600 group-hover:text-[#00234E] transition-colors font-medium">In Stock Only</span>
                        <div
                          onClick={() => setInStockOnly(!inStockOnly)}
                          className={`relative inline-flex h-5 w-9 items-center rounded-full transition-all duration-200 cursor-pointer ${
                            inStockOnly ? "bg-[#00234E] shadow-lg shadow-[#00234E]/30" : "bg-gray-200 group-hover:bg-gray-300"
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
                  )}
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
            {/* Page Title and Sort Bar */}
            <div className="mb-6">
              <h1 className="text-3xl font-bold text-gray-900 mb-4">Best Sellers</h1>
              <div className="flex items-center justify-between">
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
                    <ProductCard key={product.id} product={product} />
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

export default function BestSellersPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#FBF9F8]">
        <HomePageHeader mobileMenuOpen={false} setMobileMenuOpen={() => {}} />
        <main className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-[#00234E]" />
          </div>
        </main>
        <HomePageFooter />
      </div>
    }>
      <BestSellersContent />
    </Suspense>
  );
}
