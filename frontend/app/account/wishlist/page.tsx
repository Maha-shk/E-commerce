"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { HomePageHeader } from "@/components/customer/HomePageHeader";
import { useSession } from "@/lib/hooks/use-auth";
import { useLogout } from "@/lib/hooks/use-auth";
import { useWishlist } from "@/lib/hooks/use-wishlist";
import { ProductCard } from "@/components/customer/ProductCard";
import {
  Loader2,
  ShoppingBag,
  User,
  LogOut,
  ChevronRight,
  Heart,
  ShoppingCart,
  Home,
  Book,
  ArrowRight,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

interface MenuItem {
  icon: typeof User;
  title: string;
  path: string;
}

export default function WishlistPage() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAuthenticated, isAdmin, hydrated } = useSession();
  const logout = useLogout();
  const { wishlistItems, isLoading } = useWishlist();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    // Wait for hydration to complete before making auth decisions
    if (!hydrated) return;

    // Redirect admins to their dashboard - /account is for customers only
    if (isAuthenticated && isAdmin) {
      router.push('/admin/dashboard');
    }

    // Redirect unauthenticated users to login
    if (!isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, isAdmin, hydrated, router]);

  // Show loading while hydrating or checking auth
  if (!hydrated || !isAuthenticated || !user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
          <p className="mt-4 text-muted-foreground">Loading your wishlist...</p>
        </div>
      </div>
    );
  }

  const menuItems: MenuItem[] = [
    { icon: Home, title: "Overview", path: "/account" },
    { icon: ShoppingBag, title: "My Orders", path: "/account/orders" },
    { icon: Heart, title: "My Wishlist", path: "/account/wishlist" },
    { icon: Book, title: "Address Book", path: "/account/addresses" },
    { icon: User, title: "Profile", path: "/account/profile" },
  ];

  const memberSince = new Date(user.createdAt).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric'
  });

  const userInitials = user.fullName
    .split(' ')
    .map((n: string) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="min-h-screen bg-[#FBF9F8]">
      {/* Header */}
      <HomePageHeader
        mobileMenuOpen={mobileMenuOpen}
        setMobileMenuOpen={setMobileMenuOpen}
        cartCount={0}
      />

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

          {/* Left Sidebar - Single Card with Profile + Navigation */}
          <div className="lg:col-span-4 xl:col-span-3">
            <div className="lg:sticky lg:top-6">
              <div className="bg-white rounded-xl border border-gray-200">
                <div className="p-0">
                {/* Profile Avatar Section */}
                <div className="p-6 text-center border-b border-gray-200">
                  <Avatar className="w-20 h-20 mx-auto mb-3">
                    <AvatarFallback className="bg-gray-100 text-[#00234E] text-xl font-bold">
                      {userInitials}
                    </AvatarFallback>
                  </Avatar>
                  <h3 className="font-semibold text-lg text-gray-900">{user.fullName}</h3>
                  <p className="text-sm text-gray-600 truncate">{user.email}</p>
                </div>

                {/* Simple Navigation Menu */}
                <div className="p-2">
                  <ul className="space-y-0.5">
                    {menuItems.map((item, index) => {
                      const Icon = item.icon;
                      const isActive = pathname === item.path ||
                                       (item.path === '/account' && pathname === '/account') ||
                                       (item.path !== '/account' && pathname.startsWith(item.path));

                      return (
                        <li key={index}>
                          <button
                            onClick={() => router.push(item.path)}
                            className={cn(
                              "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors",
                              "text-sm",
                              isActive
                                ? "bg-[#00234E] text-white font-medium"
                                : "text-gray-600 hover:bg-gray-100 hover:text-[#00234E]"
                            )}
                          >
                            <Icon className="w-4 h-4 shrink-0" />
                            <span>{item.title}</span>
                            {isActive && (
                              <ChevronRight className="w-4 h-4 ml-auto shrink-0" />
                            )}
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </div>

                {/* Divider */}
                <div className="border-t border-gray-200 mx-2" />

                {/* Logout Button */}
                <div className="p-2">
                  <button
                    onClick={() => logout.mutate()}
                    disabled={logout.isPending}
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors",
                      "text-sm text-red-600 hover:bg-red-50",
                      "disabled:opacity-50 disabled:cursor-not-allowed"
                    )}
                  >
                    {logout.isPending ? (
                      <Loader2 className="w-4 h-4 shrink-0 animate-spin" />
                    ) : (
                      <LogOut className="w-4 h-4 shrink-0" />
                    )}
                    <span>{logout.isPending ? 'Signing out...' : 'Sign Out'}</span>
                  </button>
                </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Content Area - Wider */}
          <div className="lg:col-span-8 xl:col-span-9 space-y-6">

            {/* Page Header */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-[#00234E] mb-2">My Wishlist ({wishlistItems.length})</h1>
                  <p className="text-gray-600">
                    Products you've saved for later
                  </p>
                </div>
              </div>
            </div>

            {/* Loading State */}
            {isLoading && (
              <div className="text-center py-12">
                <Loader2 className="w-12 h-12 text-[#00234E] mx-auto mb-4 animate-spin" />
                <p className="text-gray-600">Loading your wishlist...</p>
              </div>
            )}

            {/* Wishlist Products Grid */}
            {!isLoading && wishlistItems.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {wishlistItems.map((item) => (
                  <ProductCard
                    key={item.productId}
                    product={{
                      id: item.productId,
                      name: item.name,
                      price: item.price,
                      salePrice: item.salePrice,
                      discountPercent: item.discount,
                      inStock: item.inStock,
                      stock: item.stock,
                      lowStock: item.lowStock,
                      images: item.image ? [{ url: item.image }] : [],
                      category: item.category,
                    }}
                  />
                ))}
              </div>
            )}

            {/* Empty State */}
            {!isLoading && wishlistItems.length === 0 && (
              <div className="bg-white rounded-xl border-2 border-dashed border-gray-300 p-12 text-center">
                <Heart className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Your wishlist is empty</h3>
                <p className="text-gray-600 mb-6">
                  Start adding products you love and they'll appear here!
                </p>
                <div className="flex items-center justify-center gap-3">
                  <Button
                    size="lg"
                    onClick={() => router.push('/products')}
                  >
                    <ShoppingCart className="w-4 h-4 mr-2" />
                    Explore Products
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    onClick={() => router.push('/categories')}
                  >
                    Browse Categories
                  </Button>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>

    </div>
  );
}