"use client";

import { useState } from "react";
import { HomePageHeader } from "@/components/customer/HomePageHeader";
import { HomePageFooter } from "@/components/customer/HomePageFooter";
import { useCategories } from "@/lib/hooks/use-homepage";
import { useCart } from "@/lib/hooks/use-cart";
import { Loader2, Search } from "lucide-react";
import Link from "next/link";

export default function CategoriesPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch all categories
  const { data: categories, isLoading, isError } = useCategories(100);

  // Cart count
  const { totalItems } = useCart();

  // Filter categories based on search
  const filteredCategories = categories?.filter((category) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      category.name.toLowerCase().includes(query) ||
      category.description.toLowerCase().includes(query)
    );
  }) || [];

  return (
    <div className="min-h-screen bg-[#FBF9F8]">
      <HomePageHeader
        mobileMenuOpen={mobileMenuOpen}
        setMobileMenuOpen={setMobileMenuOpen}
        cartCount={totalItems}
      />

      <main className="container mx-auto px-4 py-8">
        {/* Page Header with Search */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">Categories</h1>
              <p className="text-gray-600 text-lg">
                Browse our wide selection of product categories
              </p>
            </div>

            {/* Search Bar */}
            <div className="relative w-80">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search categories..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-white border-2 border-gray-200 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-[#00234E] focus:border-[#00234E] transition-all duration-200 hover:border-gray-300"
              />
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
            <p className="text-red-500 mb-4">Failed to load categories</p>
            <button
              onClick={() => window.location.reload()}
              className="bg-[#00234E] text-white px-6 py-2 rounded-lg hover:bg-[#00234E]/90 transition-colors"
            >
              Retry
            </button>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !isError && filteredCategories.length === 0 && (
          <div className="text-center py-20">
            <p className="text-gray-500 text-lg">No categories found</p>
            <p className="text-gray-400 mt-2">Try a different search term</p>
          </div>
        )}

        {/* Categories Grid */}
        {!isLoading && !isError && filteredCategories.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCategories.map((category) => (
              <Link
                key={category.id}
                href={`/categories/${category.slug}`}
                className="bg-white rounded-xl border border-gray-200 overflow-hidden transition-all duration-200 hover:border-[#00234E]/30"
              >
                {/* Category Image/Icon */}
                <div className="relative h-48 overflow-hidden">
                  {category.thumbnailName ? (
                    <img
                      src={category.thumbnailName}
                      alt={category.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                      <div className="text-gray-400 text-sm">No image</div>
                    </div>
                  )}

                  {/* Products Count Badge */}
                  <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm text-orange-600 px-3 py-1 rounded-full text-xs font-semibold shadow-md">
                    {category.productCount} {category.productCount === 1 ? 'product' : 'products'}
                  </div>
                </div>

                {/* Category Info */}
                <div className="p-6">
                  {/* Category Name */}
                  <h2 className="text-xl font-bold text-gray-900 mb-2">
                    {category.name}
                  </h2>

                  {/* Category Description */}
                  <p className="text-gray-600 text-sm line-clamp-2">
                    {category.description}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>

      <HomePageFooter />
    </div>
  );
}
