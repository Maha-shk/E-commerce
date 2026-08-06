"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { HomePageHeader } from "@/components/customer/HomePageHeader";
import { useSession, useLogout } from "@/lib/hooks/use-auth";
import { authApi, type Order } from "@/lib/api/services/auth";
import {
  Loader2,
  ShoppingBag,
  User,
  LogOut,
  ChevronRight,
  Heart,
  Book,
  ArrowRight,
  Search,
  ChevronLeft,
  Home,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

interface MenuItem {
  icon: typeof User;
  title: string;
  path: string;
}

const statusOptions = [
  { value: "All", label: "All Orders" },
  { value: "PENDING", label: "Pending" },
  { value: "PROCESSING", label: "Processing" },
  { value: "SHIPPED", label: "Shipped" },
  { value: "DELIVERED", label: "Delivered" },
  { value: "CANCELLED", label: "Cancelled" },
  { value: "RETURNED", label: "Returned" },
];

export default function OrdersPage() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAuthenticated, isAdmin, hydrated } = useSession();
  const logout = useLogout();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Orders state
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalOrders, setTotalOrders] = useState(0);
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);

  // Fetch orders
  useEffect(() => {
    async function fetchOrders() {
      if (!isAuthenticated || !hydrated) return;

      setIsLoading(true);
      setIsError(false);

      try {
        console.log('Fetching orders with params:', { page, limit, statusFilter });
        const response = await authApi.getOrders({
          page,
          limit,
          status: statusFilter === "All" ? undefined : statusFilter,
        });

        console.log('Orders response:', response);

        // Handle both array and PaginatedResponse formats
        const ordersData = Array.isArray(response) ? response : (response.data || []);
        const meta = (!Array.isArray(response) && response.meta) ? response.meta : null;

        console.log('Orders data:', ordersData);
        console.log('Orders meta:', meta);
        console.log('Orders count:', ordersData.length);

        setOrders(ordersData);
        setTotalPages(meta?.totalPages || 1);
        setTotalOrders(meta?.total || ordersData.length);
      } catch (error) {
        console.error('Failed to fetch orders:', error);
        console.error('Error details:', error instanceof Error ? error.message : error);
        setIsError(true);
      } finally {
        setIsLoading(false);
      }
    }

    fetchOrders();
  }, [page, statusFilter, isAuthenticated, hydrated]);

  // Client-side search filtering
  useEffect(() => {
    if (searchQuery) {
      const filtered = orders.filter((order) =>
        order.orderNumber.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredOrders(filtered);
    } else {
      setFilteredOrders(orders);
    }
  }, [searchQuery, orders]);

  // Authentication guards
  useEffect(() => {
    if (!hydrated) return;

    if (isAuthenticated && isAdmin) {
      router.push('/admin/dashboard');
    }

    if (!isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, isAdmin, hydrated, router]);

  // Show loading while hydrating
  if (!hydrated || !isAuthenticated || !user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
          <p className="mt-4 text-muted-foreground">Loading your orders...</p>
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

  const getStatusColor = (status: string) => {
    switch (status.toUpperCase()) {
      case 'DELIVERED':
        return 'bg-success-muted text-success';
      case 'SHIPPED':
        return 'bg-info-muted text-info';
      case 'PROCESSING':
      case 'PENDING':
        return 'bg-warning-muted text-warning';
      case 'CANCELLED':
      case 'RETURNED':
        return 'bg-destructive-muted text-destructive';
      default:
        return 'bg-muted-foreground/10 text-muted-foreground';
    }
  };

  const displayedOrders = searchQuery ? filteredOrders : orders;
  const displayedCount = displayedOrders.length;

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
                  <h1 className="text-2xl font-bold text-[#00234E] mb-2">My Orders</h1>
                  <p className="text-gray-600">
                    View and track all your orders
                  </p>
                </div>
              </div>
            </div>

            {/* Filters and Search */}
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                {/* Status Filters */}
                <div className="flex flex-wrap items-center gap-2">
                  {statusOptions.map((option) => (
                    <Button
                      key={option.value}
                      size="sm"
                      variant={statusFilter === option.value ? "default" : "outline"}
                      onClick={() => {
                        setStatusFilter(option.value);
                        setPage(1); // Reset to page 1
                      }}
                      className={cn(
                        "transition-colors",
                        statusFilter === option.value
                          ? "bg-[#00234E] text-white hover:bg-[#00234E]/90"
                          : "hover:bg-gray-100"
                      )}
                    >
                      {option.label}
                    </Button>
                  ))}
                </div>

                {/* Search */}
                <div className="relative w-full md:w-64">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    type="search"
                    placeholder="Search by order ID…"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
            </div>

            {/* Orders Table */}
            <div className="bg-white rounded-xl border border-gray-200">
              <div className="p-5">
                {/* Error State */}
                {isError && (
                  <div className="text-center py-8">
                    <p className="text-red-600 mb-3">Failed to load orders. Please try again.</p>
                    <Button size="sm" onClick={() => window.location.reload()}>
                      Retry
                    </Button>
                  </div>
                )}

                {/* Loading State */}
                {isLoading && !isError && (
                  <div className="text-center py-8">
                    <Loader2 className="w-8 h-8 text-[#00234E] mx-auto mb-3 animate-spin" />
                    <p className="text-gray-600">Loading orders...</p>
                  </div>
                )}

                {/* Table */}
                {!isLoading && !isError && (
                  <>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-gray-200">
                            <th className="text-left py-3 px-2 text-sm font-medium text-gray-600">Order ID</th>
                            <th className="text-left py-3 px-2 text-sm font-medium text-gray-600">Date</th>
                            <th className="text-left py-3 px-2 text-sm font-medium text-gray-600">Status</th>
                            <th className="text-right py-3 px-2 text-sm font-medium text-gray-600">Total</th>
                          </tr>
                        </thead>
                        <tbody>
                          {displayedOrders.map((order) => (
                            <tr
                              key={order.id}
                              className="border-b border-gray-200 last:border-0 hover:bg-gray-50 cursor-pointer transition-colors"
                              onClick={() => router.push(`/orders/${order.orderNumber}`)}
                            >
                              <td className="py-3 px-2 text-sm font-medium text-[#00234E]">{order.orderNumber}</td>
                              <td className="py-3 px-2 text-sm text-gray-600">
                                {new Date(order.placedAt).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric'
                                })}
                              </td>
                              <td className="py-3 px-2">
                                <Badge className={cn("text-xs", getStatusColor(order.status))}>
                                  {order.status}
                                </Badge>
                              </td>
                              <td className="py-3 px-2 text-sm font-medium text-right text-[#00234E]">
                                €{order.totals.total.toFixed(2)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Empty State */}
                    {displayedOrders.length === 0 && (
                      <div className="text-center py-8">
                        <ShoppingBag className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                        <p className="text-gray-600 mb-2">
                          {searchQuery ? "No orders found matching your search." : "No orders yet."}
                        </p>
                        {!searchQuery && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="mt-3"
                            onClick={() => router.push('/products')}
                          >
                            Start Shopping
                          </Button>
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Pagination */}
              {!isLoading && !isError && !searchQuery && (
                <div className="border-t border-gray-200 px-5 py-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-600">
                      Showing {displayedOrders.length} out of {totalOrders} orders
                      {totalOrders > limit && ` (page ${page} of ${totalPages})`}
                    </p>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        disabled={page === 1 || totalPages === 1}
                      >
                        <ChevronLeft className="w-4 h-4 mr-1" />
                        Previous
                      </Button>

                      {/* Page numbers */}
                      {totalPages > 1 && (
                        <div className="flex items-center gap-1">
                          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                            let pageNum;
                            if (totalPages <= 5) {
                              pageNum = i + 1;
                            } else if (page <= 3) {
                              pageNum = i + 1;
                            } else if (page >= totalPages - 2) {
                              pageNum = totalPages - 4 + i;
                            } else {
                              pageNum = page - 2 + i;
                            }

                            return (
                              <Button
                                key={pageNum}
                                size="sm"
                                variant={page === pageNum ? "default" : "outline"}
                                onClick={() => setPage(pageNum)}
                                className={cn(
                                  "w-8 h-8",
                                  page === pageNum
                                    ? "bg-[#00234E] text-white hover:bg-[#00234E]/90"
                                    : "hover:bg-gray-100"
                                )}
                              >
                                {pageNum}
                              </Button>
                            );
                          })}
                        </div>
                      )}

                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                        disabled={page === totalPages || totalPages === 1}
                      >
                        Next
                        <ChevronRight className="w-4 h-4 ml-1" />
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>

          </div>
        </div>
      </div>

    </div>
  );
}
