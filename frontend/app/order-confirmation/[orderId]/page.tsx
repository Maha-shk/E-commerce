"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Check, ShoppingCart, MapPin, CreditCard, Package, Truck } from "lucide-react";
import { useSession } from "@/lib/hooks/use-auth";

export default function OrderConfirmPage() {
  const params = useParams();
  const router = useRouter();
  const { user, isAuthenticated } = useSession();
  const [orderData, setOrderData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [accessChecked, setAccessChecked] = useState(false);

  useEffect(() => {
    async function fetchOrderData() {
      if (!params.orderId) return;

      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/public/orders/${params.orderId}`);

        if (!response.ok) {
          console.error('Failed to fetch order:', response.status);
          setError('Order not found');
          setIsLoading(false);
          return;
        }

        const result = await response.json();
        if (result.success && result.data) {
          setOrderData(result.data);

          // Check if user has access to this order
          checkOrderAccess(result.data);
        } else {
          setError('Unable to load order details');
        }
      } catch (error) {
        console.error('Error fetching order data:', error);
        setError('Failed to load order details');
      } finally {
        setIsLoading(false);
      }
    }

    fetchOrderData();
  }, [params.orderId]);

  // Function to check if user has proper access to the order
  const checkOrderAccess = (order: any) => {
    setAccessChecked(true);

    // Check if user came through proper checkout flow
    const justCompletedCheckout = sessionStorage.getItem('justCompletedCheckout');
    const recentOrderId = sessionStorage.getItem('recentOrderId');

    // Case 1: User just completed checkout (proper flow)
    if (justCompletedCheckout === 'true' && recentOrderId === params.orderId) {
      // Clear the flags
      sessionStorage.removeItem('justCompletedCheckout');
      sessionStorage.removeItem('recentOrderId');
      return;
    }

    // Case 2: Guest checkout flow - user not authenticated but just completed order
    if (!isAuthenticated && recentOrderId === params.orderId) {
      // Allow access for guests who just completed an order
      // They'll be prompted to login for tracking
      sessionStorage.removeItem('justCompletedCheckout');
      sessionStorage.removeItem('recentOrderId');
      return;
    }

    // Case 3: Authenticated user - check if order belongs to them
    if (isAuthenticated && user && order.customerEmail) {
      // Order has a customer email, check if it matches current user
      if (order.customerEmail !== user.email) {
        // Order belongs to different user
        setError('Access denied - This order belongs to another user');
        setTimeout(() => {
          router.push('/account');
        }, 2000);
        return;
      }
      // Valid user viewing their own order - clear flags if present
      sessionStorage.removeItem('justCompletedCheckout');
      sessionStorage.removeItem('recentOrderId');
      return;
    }

    // Case 4: Direct URL access without proper checkout flow
    if (!justCompletedCheckout && !recentOrderId) {
      setError('Invalid access - Please complete checkout first');
      setTimeout(() => {
        if (isAuthenticated) {
          router.push('/account');
        } else {
          router.push('/products');
        }
      }, 3000);
      return;
    }

    // Case 5: Authenticated user viewing guest order (converted after login)
    if (isAuthenticated && user && !order.customerEmail && recentOrderId === params.orderId) {
      // Guest order that user just logged in to view
      sessionStorage.removeItem('justCompletedCheckout');
      sessionStorage.removeItem('recentOrderId');
      return;
    }

    // Default: Clear flags
    sessionStorage.removeItem('justCompletedCheckout');
    sessionStorage.removeItem('recentOrderId');
  };

  // If order not found after checking, redirect
  useEffect(() => {
    if (accessChecked && error && !isLoading) {
      // Give user time to see error message before redirect
      const redirectTimer = setTimeout(() => {
        if (isAuthenticated) {
          router.push('/account');
        } else {
          router.push('/products');
        }
      }, 3000);

      return () => clearTimeout(redirectTimer);
    }
  }, [accessChecked, error, isLoading, isAuthenticated, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#FBF9F8] flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#00234E]"></div>
          <p className="mt-4 text-gray-600">Loading order details...</p>
        </div>
      </div>
    );
  }

  if (error || !orderData) {
    return (
      <div className="min-h-screen bg-[#FBF9F8] flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Order Not Found</h1>
          <p className="text-gray-600 mb-6">{error || 'We could not find your order details'}</p>
          <Link
            href="/products"
            className="inline-block px-6 py-3 bg-[#00234E] hover:bg-[#001a3a] text-white font-semibold rounded-lg transition-colors"
          >
            Continue Shopping
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FBF9F8] py-12 px-4">
      <div className="container mx-auto max-w-4xl">
        {/* Success Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-4">
            <Check className="w-10 h-10 text-green-600" strokeWidth={3} />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
            Order Confirmed!
          </h1>
          <p className="text-gray-600 text-lg mb-4">
            Thank you for your purchase. We've received your order.
          </p>
          <p className="text-gray-500">
            Order <span className="font-semibold text-gray-900">#{orderData.orderNumber}</span>
          </p>
        </div>

        {/* Order Details */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden mb-6">
          {/* Items Section */}
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Order Items</h2>
            <div className="space-y-4">
              {orderData.items.map((item: any) => (
                <div key={item.id} className="flex gap-4">
                  <div className="relative w-20 h-20 shrink-0">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-full h-full object-cover rounded-lg"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-gray-900 text-sm line-clamp-2">
                      {item.name}
                    </h3>
                    <p className="text-gray-500 text-xs mt-1">
                      {item.color && `Color: ${item.color}`}
                    </p>
                    <p className="text-gray-500 text-xs">
                      Quantity: {item.quantity}
                    </p>
                  </div>
                  <div className="text-right">
                    {item.discount > 0 ? (
                      <>
                        <p className="font-semibold text-gray-900">
                          ${(item.salePrice * item.quantity).toFixed(2)}
                        </p>
                        <p className="text-gray-400 line-through text-xs">
                          ${(item.price * item.quantity).toFixed(2)}
                        </p>
                      </>
                    ) : (
                      <p className="font-semibold text-gray-900">
                        ${(item.price * item.quantity).toFixed(2)}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Shipping Information */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center gap-2 mb-3">
              <Truck className="w-5 h-5 text-[#00234E]" />
              <h3 className="text-lg font-semibold text-gray-900">Shipping Information</h3>
            </div>
            <div className="space-y-2 text-sm text-gray-600">
              <p>
                <span className="font-medium text-gray-900">Name:</span> {orderData.shippingAddress.fullName}
              </p>
              <p>
                <span className="font-medium text-gray-900">Address:</span> {orderData.shippingAddress.address}
              </p>
              <p>
                <span className="font-medium text-gray-900">City:</span> {orderData.shippingAddress.city}, {orderData.shippingAddress.state} {orderData.shippingAddress.postalCode}
              </p>
              <p>
                <span className="font-medium text-gray-900">Country:</span> {orderData.shippingAddress.country}
              </p>
            </div>
          </div>

          {/* Order Summary */}
          <div className="p-6 bg-gray-50">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Summary</h3>
            <div className="space-y-3">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal</span>
                <span>${orderData.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Shipping</span>
                <span>{orderData.shipping === 0 ? 'Free' : `$${orderData.shipping.toFixed(2)}`}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Tax</span>
                <span>${orderData.tax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-xl font-bold text-gray-900 pt-3 border-t border-gray-300">
                <span>Total</span>
                <span className="text-orange-500">${orderData.total.toFixed(2)}</span>
              </div>
            </div>

            {/* Estimated Delivery */}
            <div className="mt-6 p-4 bg-white rounded-lg border border-gray-200">
              <div className="flex items-center gap-3">
                <Package className="w-5 h-5 text-[#00234E]" />
                <div>
                  <p className="font-medium text-gray-900">Estimated Delivery</p>
                  <p className="text-gray-600 text-sm">{orderData.estimatedDelivery}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 mt-6">
          <Link
            href="/products"
            className="flex-1 inline-flex items-center justify-center px-8 py-3 bg-[#00234E] hover:bg-[#001a3a] text-white font-semibold rounded-lg transition-colors"
          >
            Continue Shopping
          </Link>
          <button
            onClick={() => router.push('/orders')}
            className="flex-1 inline-flex items-center justify-center px-8 py-3 border-2 border-[#00234E] text-[#00234E] hover:bg-[#00234E] hover:text-white font-semibold rounded-lg transition-colors"
          >
            Track Order
          </button>
        </div>

        {/* Need Help Section */}
        <div className="mt-8 text-center">
          <p className="text-gray-600 mb-2">Need help with your order?</p>
          <Link
            href="/contact"
            className="text-[#00234E] hover:text-[#001a3a] font-medium"
          >
            Contact Our Support Team
          </Link>
        </div>
      </div>
    </div>
  );
}
