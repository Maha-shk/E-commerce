"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/hooks/use-auth";
import { authApi, type Order } from "@/lib/api/services/auth";
import { HomePageHeader } from "@/components/customer/HomePageHeader";
import {
  Loader2,
  Package,
  Truck,
  Search,
  ShoppingBag,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

type Status = "PENDING" | "PROCESSING" | "SHIPPED" | "DELIVERED" | "CANCELLED" | "RETURNED";
type BadgeVariant = "success" | "info" | "warning" | "destructive";

const statusVariant: Record<Status, BadgeVariant> = {
  PENDING: "warning",
  PROCESSING: "warning",
  SHIPPED: "info",
  DELIVERED: "success",
  CANCELLED: "destructive",
  RETURNED: "destructive",
};

const statusLabels: Record<Status, string> = {
  PENDING: "Pending",
  PROCESSING: "Processing",
  SHIPPED: "Shipped",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
  RETURNED: "Returned",
};

const filters = ["All", "PENDING", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED"] as const;

function OrderCard({ order }: { order: Order }) {
  const router = useRouter();
  const status = order.status as Status;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-3 border-b">
        <div className="flex items-center gap-3">
          <Badge variant={statusVariant[status]} className="gap-1.5">
            <span className="size-1.5 rounded-full bg-current" />
            {statusLabels[status] || status}
          </Badge>
          <div>
            <p className="text-sm font-semibold text-foreground">{order.orderNumber}</p>
            <p className="text-xs text-muted-foreground">
              Placed on {new Date(order.placedAt).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric'
              })}
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-xs text-muted-foreground">Total</p>
          <p className="text-sm font-semibold text-foreground">
            €{order.totals.total.toFixed(2)}
          </p>
        </div>
      </CardHeader>

      <CardContent className="divide-y">
        {order.items.map((item) => (
          <div key={item.id} className="flex items-center gap-4 py-4 first:pt-0 last:pb-0">
            <span className="flex size-14 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-primary/10 to-muted text-primary">
              <Package className="size-6" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-foreground">{item.name}</p>
              <p className="text-xs text-muted-foreground">
                Qty: {item.quantity} × €{item.unitPrice.toFixed(2)}
              </p>
            </div>
            <p className="text-sm font-medium text-foreground">
              €{item.lineTotal.toFixed(2)}
            </p>
          </div>
        ))}
      </CardContent>

      <CardFooter className="justify-end gap-2 bg-transparent">
        {status === "SHIPPED" && order.shippingMethod && (
          <Button variant="ghost" size="sm">
            <Truck className="mr-2 h-4 w-4" />
            Track order
          </Button>
        )}
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.push(`/orders/${order.orderNumber}`)}
        >
          View details
        </Button>
        <Button size="sm">Buy again</Button>
      </CardFooter>
    </Card>
  );
}

export default function OrdersPage() {
  const router = useRouter();
  const { isAuthenticated, hydrated } = useSession();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("All");

  // Pagination state
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalOrders, setTotalOrders] = useState(0);

  useEffect(() => {
    if (!hydrated) return;

    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    fetchOrders();
  }, [isAuthenticated, hydrated, router, page, activeTab]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await authApi.getOrders({
        page,
        limit,
        status: activeTab === "All" ? undefined : activeTab,
      });

      // Handle both array and PaginatedResponse formats
      const ordersData = Array.isArray(response) ? response : (response.data || []);
      const meta = (!Array.isArray(response) && response.meta) ? response.meta : null;

      setOrders(ordersData);
      setTotalPages(meta?.totalPages || 1);
      setTotalOrders(meta?.total || ordersData.length);
    } catch (err) {
      console.error('Failed to fetch orders:', err);
      setError('Failed to load orders. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Filter orders based on search query only (tab is now server-side)
  const filteredOrders = orders.filter((order) => {
    return searchQuery === "" ||
      order.orderNumber.toLowerCase().includes(searchQuery.toLowerCase());
  });

  // Show loading while hydrating or checking auth
  if (!hydrated || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <HomePageHeader mobileMenuOpen={false} setMobileMenuOpen={() => {}} cartCount={0} />

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Back Button */}
        <Button
          variant="ghost"
          size="sm"
          className="mb-6"
          onClick={() => router.push('/account')}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Account
        </Button>

        <div className="space-y-6">
          {/* Page Header */}
          <div>
            <h1 className="text-3xl font-bold mb-2">My Orders</h1>
            <p className="text-muted-foreground">
              Track deliveries and review your purchase history.
            </p>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          )}

          {/* Error State */}
          {error && !loading && (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground mb-4">{error}</p>
                <Button onClick={fetchOrders}>Try Again</Button>
              </CardContent>
            </Card>
          )}

          {/* Empty State */}
          {!loading && !error && orders.length === 0 && (
            <Card>
              <CardContent className="py-12 text-center">
                <ShoppingBag className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground mb-4">No orders yet</p>
                <Button onClick={() => router.push('/products')}>
                  Start Shopping
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Orders List */}
          {!loading && !error && orders.length > 0 && (
            <>
              {/* Filters */}
              <Tabs value={activeTab} onValueChange={(value) => { setActiveTab(value); setPage(1); }}>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <TabsList className="h-9">
                    {filters.map((f) => (
                      <TabsTrigger key={f} value={f} className="px-3">
                        {f === 'All' ? 'All Orders' : statusLabels[f as Status] || f}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                  <div className="relative sm:w-64">
                    <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      type="search"
                      placeholder="Search by order ID…"
                      className="h-10 rounded-lg bg-card pl-9"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                </div>

                {filters.map((f) => {
                  const list = f === "All" ? filteredOrders : filteredOrders;

                  return (
                    <TabsContent key={f} value={f} className="mt-5 space-y-4">
                      {list.length > 0 ? (
                        <>
                          <div className="space-y-4">
                            {list.map((order) => <OrderCard key={order.id} order={order} />)}
                          </div>

                          {/* Pagination */}
                          {!searchQuery && (
                            <div className="flex items-center justify-between pt-4 border-t">
                              <p className="text-sm text-muted-foreground">
                                Showing {orders.length} out of {totalOrders} orders
                                {totalOrders > limit && ` (page ${page} of ${totalPages})`}
                              </p>
                              <div className="flex items-center gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
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
                                          variant={page === pageNum ? "default" : "outline"}
                                          size="sm"
                                          onClick={() => setPage(pageNum)}
                                          className="w-8 h-8"
                                        >
                                          {pageNum}
                                        </Button>
                                      );
                                    })}
                                  </div>
                                )}

                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                  disabled={page === totalPages || totalPages === 1}
                                >
                                  Next
                                  <ChevronRight className="w-4 h-4 ml-1" />
                                </Button>
                              </div>
                            </div>
                          )}
                        </>
                      ) : (
                        <Card>
                          <CardContent className="py-12 text-center text-sm text-muted-foreground">
                            No {f === 'All' ? '' : statusLabels[f as Status]?.toLowerCase()} orders found.
                          </CardContent>
                        </Card>
                      )}
                    </TabsContent>
                  );
                })}
              </Tabs>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
