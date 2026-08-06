"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { HomePageHeader } from "@/components/customer/HomePageHeader";
import { useSession, useCurrentUser } from "@/lib/hooks/use-auth";
import { useLogout } from "@/lib/hooks/use-auth";
import { useWishlist } from "@/lib/hooks/use-wishlist";
import { authApi, type Order } from "@/lib/api/services/auth";
import { ProductCard } from "@/components/customer/ProductCard";
import {
  Loader2,
  ShoppingBag,
  User,
  LogOut,
  ChevronRight,
  Shield,
  Heart,
  MapPin,
  Clock,
  Pencil,
  Mail,
  Phone,
  ArrowRight,
  Home,
  Book,
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

// Mock wishlist data - only 3 items
const mockWishlist = [
  {
    id: 1,
    name: "ErgoRest Wrist Support",
    price: 36,
    originalPrice: 45,
    discountPercent: 20,
    image: "/api/placeholder/200/200",
    inStock: true,
    stock: 15,
    category: { name: "Office Accessories" }
  },
  {
    id: 2,
    name: "LumixLED Desk Lamp",
    price: 45,
    originalPrice: 45,
    discountPercent: 0,
    image: "/api/placeholder/200/200",
    inStock: true,
    stock: 8,
    lowStock: true,
    category: { name: "Lighting" }
  },
  {
    id: 3,
    name: "ComfortMesh Chair",
    price: 189,
    originalPrice: 250,
    discountPercent: 24,
    image: "/api/placeholder/200/200",
    inStock: true,
    stock: 5,
    lowStock: true,
    category: { name: "Furniture" }
  },
];

export default function AccountPage() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAuthenticated, isAdmin, hydrated } = useSession();
  const logout = useLogout();
  // This will refresh the access token on page load
  useCurrentUser();
  const { wishlistItems, removeFromWishlist, wishlistItemIds } = useWishlist(); // Get shared wishlist state
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);

  // Debug log to see when wishlistItemIds changes
  useEffect(() => {
    console.log('wishlistItemIds updated:', wishlistItemIds);
    console.log('wishlistItems count:', wishlistItems.length);
  }, [wishlistItemIds, wishlistItems]);

  // Fetch recent orders
  useEffect(() => {
    if (!isAuthenticated || !user) return;

    const fetchOrders = async () => {
      try {
        setOrdersLoading(true);
        console.log('Fetching orders for user:', user.email, user.id);
        console.log('Storage tokens:', localStorage.getItem('accessToken')?.substring(0, 20) + '...');

        const response = await authApi.getOrders({ limit: 20, page: 1 });
        console.log('Orders response:', response);
        console.log('Orders data:', response.data);
        console.log('Orders count:', response.data?.length);

        // Handle both array and PaginatedResponse formats
        const ordersData = Array.isArray(response) ? response : (response.data || []);

        // Sort by date (most recent first) and take only 4 most recent
        const sortedOrders = ordersData.sort((a, b) =>
          new Date(b.placedAt).getTime() - new Date(a.placedAt).getTime()
        );
        const recentOrders = sortedOrders.slice(0, 4);

        console.log('Recent orders (4 most recent):', recentOrders);
        setOrders(recentOrders);
      } catch (error) {
        console.error('Failed to fetch orders:', error);
        console.error('Error details:', error instanceof Error ? error.message : error);
        setOrders([]);
      } finally {
        setOrdersLoading(false);
      }
    };

    fetchOrders();
  }, [isAuthenticated, user]);

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
          <p className="mt-4 text-muted-foreground">Loading your account...</p>
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

  // Get wishlist products directly from wishlist items (most recent first)
  // Transform wishlist items to match product card structure
  const wishlistProducts = wishlistItems.slice().reverse().slice(0, 3).map(item => ({
    id: item.productId,
    name: item.name,
    images: item.image ? [{ url: item.image }] : [],
    discountPercent: item.discount,
    inStock: item.inStock,
    lowStock: item.lowStock,
    stock: item.stock,
    category: item.category,
    salePrice: item.salePrice,
    price: item.price,
  }));

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

  return (
    <div className="min-h-screen bg-background">
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
            <Card className="sticky top-6">
              <CardContent className="p-0">
                {/* Profile Avatar Section */}
                <div className="p-6 text-center border-b border-border">
                  <Avatar className="w-20 h-20 mx-auto mb-3">
                    <AvatarFallback className="bg-muted text-primary text-xl font-bold">
                      {userInitials}
                    </AvatarFallback>
                  </Avatar>
                  <h3 className="font-semibold text-lg">{user.fullName}</h3>
                  <p className="text-sm text-muted-foreground truncate">{user.email}</p>
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
                                ? "bg-primary text-primary-foreground font-medium"
                                : "text-muted-foreground hover:bg-muted hover:text-foreground"
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
                <div className="border-t border-border mx-2" />

                {/* Logout Button */}
                <div className="p-2">
                  <button
                    onClick={() => logout.mutate()}
                    disabled={logout.isPending}
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors",
                      "text-sm text-destructive hover:bg-destructive/10",
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
              </CardContent>
            </Card>
          </div>

          {/* Right Content Area - Wider */}
          <div className="lg:col-span-8 xl:col-span-9 space-y-6">

            {/* Welcome Banner - With white bg card */}
            <div className="bg-card border border-border rounded-xl p-6">
              <h1 className="text-2xl font-bold mb-2">
                Welcome back, {user.fullName.split(' ')[0]}! 👋
              </h1>
              <p className="text-muted-foreground">
                Manage your account settings, preferences, and more.
              </p>
            </div>

            {/* Two Cards Side by Side - Reduced Height */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Profile Summary Card */}
              <Card>
                <div className="p-5">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold">Profile Summary</h3>
                    <Button size="sm" variant="ghost" className="h-8" onClick={() => router.push('/account/profile')}>
                      <Pencil className="w-3.5 h-3.5 mr-1" />
                      Edit
                    </Button>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center gap-2.5">
                      <User className="w-4 h-4 text-muted-foreground shrink-0" />
                      <div className="min-w-0">
                        <p className="text-xs text-muted-foreground">Name</p>
                        <p className="text-sm font-medium truncate">{user.fullName}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5">
                      <Mail className="w-4 h-4 text-muted-foreground shrink-0" />
                      <div className="min-w-0">
                        <p className="text-xs text-muted-foreground">Email</p>
                        <p className="text-sm font-medium truncate">{user.email}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5">
                      <Shield className="w-4 h-4 text-muted-foreground shrink-0" />
                      <div className="min-w-0">
                        <p className="text-xs text-muted-foreground">Status</p>
                        <Badge variant={user.emailVerified ? "default" : "secondary"} className="text-xs mt-0.5">
                          {user.emailVerified ? 'Verified' : 'Pending'}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Default Shipping Card */}
              <Card>
                <div className="p-5">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold">Default Shipping</h3>
                    <Button size="sm" variant="ghost" className="h-8" onClick={() => router.push('/account/addresses')}>
                      <Pencil className="w-3.5 h-3.5 mr-1" />
                      Edit
                    </Button>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center gap-2.5">
                      <User className="w-4 h-4 text-muted-foreground shrink-0" />
                      <div className="min-w-0">
                        <p className="text-xs text-muted-foreground">Recipient</p>
                        <p className="text-sm font-medium truncate">{user.fullName}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5">
                      <MapPin className="w-4 h-4 text-muted-foreground shrink-0" />
                      <div className="min-w-0">
                        <p className="text-xs text-muted-foreground">Address</p>
                        <p className="text-sm text-muted-foreground italic">No address set</p>
                      </div>
                    </div>

                    {user.phone && (
                      <div className="flex items-center gap-2.5">
                        <Phone className="w-4 h-4 text-muted-foreground shrink-0" />
                        <div className="min-w-0">
                          <p className="text-xs text-muted-foreground">Phone</p>
                          <p className="text-sm font-medium">{user.phone}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            </div>

            {/* Recent Orders Section - Full Width */}
            <Card>
              <div className="p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-lg">Recent Orders</h3>
                  <Button size="sm" variant="ghost" onClick={() => router.push('/account/orders')}>
                    View All
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>

                {/* Orders Table */}
                <div className="overflow-x-auto">
                  {ordersLoading ? (
                    <div className="text-center py-8">
                      <Loader2 className="w-8 h-8 text-primary mx-auto mb-3 animate-spin" />
                      <p className="text-muted-foreground">Loading orders...</p>
                    </div>
                  ) : (
                    <table className="w-full">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">Order ID</th>
                        <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">Date</th>
                        <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">Status</th>
                        <th className="text-right py-3 px-2 text-sm font-medium text-muted-foreground">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orders.map((order) => (
                        <tr
                          key={order.id}
                          className="border-b border-border last:border-0 hover:bg-muted/50 cursor-pointer"
                          onClick={() => router.push(`/orders/${order.orderNumber}`)}
                        >
                          <td className="py-3 px-2 text-sm font-medium">{order.orderNumber}</td>
                          <td className="py-3 px-2 text-sm text-muted-foreground">
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
                          <td className="py-3 px-2 text-sm font-medium text-right">€{order.totals.total.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  )}
                </div>

                {!ordersLoading && orders.length === 0 && (
                  <div className="text-center py-8">
                    <ShoppingBag className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                    <p className="text-muted-foreground">No orders yet</p>
                    <Button
                      size="sm"
                      variant="outline"
                      className="mt-3"
                      onClick={() => router.push('/products')}
                    >
                      Start Shopping
                    </Button>
                  </div>
                )}
              </div>
            </Card>

            {/* Wishlist Section - Only 3 Cards */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-lg">My Wishlist ({wishlistProducts.length})</h3>
                <Button size="sm" variant="ghost" onClick={() => router.push('/account/wishlist')}>
                  View All
                  <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </div>

              {/* Wishlist Product Cards - Using real products from API */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {wishlistProducts.length > 0 ? (
                  wishlistProducts.slice(0, 3).map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))
                ) : (
                  <Card className="border-dashed col-span-full">
                    <CardContent className="p-8 text-center">
                      <Heart className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                      <p className="text-muted-foreground">Your wishlist is empty</p>
                      <Button
                        size="sm"
                        variant="outline"
                        className="mt-3"
                        onClick={() => router.push('/products')}
                      >
                        Explore Products
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>

          </div>
        </div>
      </div>

    </div>
  );
}
