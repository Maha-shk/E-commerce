"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useSession } from "@/lib/hooks/use-auth";
import { publicService } from "@/lib/api/services/public";
import { HomePageHeader } from "@/components/customer/HomePageHeader";
import { Loader2, ShoppingBag, AlertCircle, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { OrderHeader } from "@/components/customer/OrderHeader";
import { OrderItems } from "@/components/customer/OrderItems";
import { OrderShipping } from "@/components/customer/OrderShipping";
import { OrderSummary } from "@/components/customer/OrderSummary";
import { OrderTimeline } from "@/components/customer/OrderTimeline";

export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user, isAuthenticated } = useSession();
  const [orderData, setOrderData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [accessDenied, setAccessDenied] = useState(false);

  useEffect(() => {
    async function fetchOrderData() {
      if (!params.orderNumber) return;

      setIsLoading(true);
      setError(null);
      setAccessDenied(false);

      try {
        const response = await publicService.getOrder(params.orderNumber as string);

        if (response.success && response.data) {
          // Verify user access
          const accessCheck = verifyOrderAccess(response.data, user);
          if (!accessCheck.hasAccess) {
            setAccessDenied(true);
            setError(accessCheck.reason || "Access denied");
            // Redirect after showing error message
            setTimeout(() => {
              router.push("/account/orders");
            }, 3000);
            return;
          }

          setOrderData(response.data);
        } else {
          setError("Unable to load order details");
        }
      } catch (err: any) {
        console.error("Error fetching order data:", err);
        if (err.response?.status === 404) {
          setError("Order not found");
        } else if (err.response?.status === 403) {
          setAccessDenied(true);
          setError("You don't have permission to view this order");
          setTimeout(() => {
            router.push("/account/orders");
          }, 3000);
        } else {
          setError("Failed to load order details");
        }
      } finally {
        setIsLoading(false);
      }
    }

    fetchOrderData();
  }, [params.orderNumber, user, router]);

  // Access control verification
  const verifyOrderAccess = (order: any, currentUser: any) => {
    // Case 1: Guest user - allow access via order number lookup
    if (!isAuthenticated) {
      return { hasAccess: true, isGuest: true };
    }

    // Case 2: Authenticated user viewing own order
    // Check if the order belongs to the current user by comparing customer email
    const orderCustomerEmail = order.customer?.email || order.customerEmail;
    if (currentUser && orderCustomerEmail === currentUser.email) {
      return { hasAccess: true };
    }

    // Case 3: Admin users can view any order
    if (currentUser && (currentUser.role === 'ADMIN' || currentUser.isAdmin === true)) {
      return { hasAccess: true };
    }

    // Case 4: Access denied - trying to view someone else's order
    return { hasAccess: false, reason: "ACCESS_DENIED" };
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#FBF9F8]">
        <HomePageHeader mobileMenuOpen={false} setMobileMenuOpen={() => {}} cartCount={0} />
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="text-center">
            <Loader2 className="mx-auto h-8 w-8 animate-spin text-[#00234E]" />
            <p className="mt-4 text-gray-600">Loading order details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !orderData) {
    return (
      <div className="min-h-screen bg-[#FBF9F8]">
        <HomePageHeader mobileMenuOpen={false} setMobileMenuOpen={() => {}} cartCount={0} />
        <div className="container mx-auto px-4 py-16 max-w-2xl">
          <div className="text-center">
            {accessDenied ? (
              <>
                <AlertCircle className="mx-auto h-16 w-16 text-red-500 mb-4" />
                <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
                <p className="text-gray-600 mb-6">{error}</p>
                <p className="text-sm text-gray-500 mb-6">Redirecting to your orders...</p>
              </>
            ) : (
              <>
                <ShoppingBag className="mx-auto h-16 w-16 text-gray-400 mb-4" />
                <h1 className="text-2xl font-bold text-gray-900 mb-2">Order Not Found</h1>
                <p className="text-gray-600 mb-6">{error || "We couldn't find the order you're looking for."}</p>
              </>
            )}
            <Link href="/account/orders">
              <Button size="lg" className="bg-[#00234E] hover:bg-[#001a3a]">
                View My Orders
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FBF9F8]">
      <HomePageHeader mobileMenuOpen={false} setMobileMenuOpen={() => {}} cartCount={0} />

      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Back Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.back()}
          className="mb-6 text-[#00234E] hover:text-[#001a3a]"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[#00234E] mb-2">Order Details</h1>
          <p className="text-gray-600">
            View and track your order information
          </p>
        </div>

        {/* Order Header */}
        <OrderHeader order={orderData} />

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
          {/* Left Column - Order Items */}
          <div className="lg:col-span-2 space-y-6">
            <OrderItems items={orderData.items} />
            <OrderTimeline status={orderData.status} placedAt={orderData.placedAt} />
          </div>

          {/* Right Column - Summary, Shipping */}
          <div className="space-y-6">
            <OrderSummary order={orderData} />
            <OrderShipping order={orderData} />
          </div>
        </div>
      </div>
    </div>
  );
}