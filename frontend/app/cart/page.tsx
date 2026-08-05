"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { X, Plus, Minus, ArrowRight, Loader2 } from "lucide-react";
import { HomePageHeader } from "@/components/customer/HomePageHeader";
import { HomePageFooter } from "@/components/customer/HomePageFooter";
import { useCart } from "@/lib/hooks/use-cart";

export default function CartPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [itemToRemove, setItemToRemove] = useState<string | null>(null);
  const [showRemoveDialog, setShowRemoveDialog] = useState(false);

  const {
    cart,
    isLoading,
    error,
    fetchCart,
    updateItem,
    removeItem,
    isEmpty,
    totalItems,
    subtotal,
    shipping,
    tax,
    total,
  } = useCart();

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  const handleQuantityChange = async (itemId: string, change: number) => {
    const item = cart?.items.find((i) => i.id === itemId);
    if (!item) return;

    const newQuantity = Math.max(1, item.quantity + change);
    if (newQuantity !== item.quantity) {
      try {
        await updateItem(itemId, newQuantity);
      } catch (error) {
        console.error("Failed to update quantity:", error);
      }
    }
  };

  const handleRemoveItem = (id: string) => {
    setItemToRemove(id);
    setShowRemoveDialog(true);
  };

  const confirmRemove = async () => {
    if (itemToRemove) {
      try {
        await removeItem(itemToRemove);
        setItemToRemove(null);
        setShowRemoveDialog(false);
      } catch (error) {
        console.error("Failed to remove item:", error);
      }
    }
  };

  const cancelRemove = () => {
    setItemToRemove(null);
    setShowRemoveDialog(false);
  };

  return (
    <div className="min-h-screen bg-[#FBF9F8] flex flex-col">
      <HomePageHeader
        mobileMenuOpen={mobileMenuOpen}
        setMobileMenuOpen={setMobileMenuOpen}
        cartCount={totalItems}
      />

      <main className="flex-grow container mx-auto px-4 py-6 md:py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Your Cart</h1>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <p className="text-gray-600">
              Review your selections before proceeding to checkout
            </p>
            <Link
              href="/"
              className="inline-flex items-center font-medium transition hover:opacity-80 self-start sm:self-auto"
              style={{ color: '#00234E' }}
            >
              Continue Shopping →
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items Section */}
          <div className="lg:col-span-2 space-y-4">
            {isLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-[#00234E]" />
              </div>
            ) : isEmpty ? (
              <div className="bg-white rounded-lg  p-8 text-center">
                <p className="text-gray-600 mb-4">Your cart is empty</p>
                <Link
                  href="/"
                  className="inline-block text-white px-6 py-3 rounded-lg hover:opacity-90 transition"
                  style={{ backgroundColor: '#00234E' }}
                >
                  Continue Shopping
                </Link>
              </div>
            ) : (
              cart?.items.map((item) => (
                <div
                  key={item.id}
                  className="bg-white rounded-lg  p-6 flex gap-6"
                >
                  {/* Product Image */}
                  <div className="relative w-32 h-32 flex-shrink-0 bg-gray-100 rounded-lg overflow-hidden">
                    {item.image ? (
                      <Image
                        src={item.image}
                        alt={item.name}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        <svg
                          className="w-16 h-16"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1}
                            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                          />
                        </svg>
                      </div>
                    )}
                  </div>

                  {/* Product Details */}
                  <div className="flex-grow">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          {item.name}
                        </h3>
                        <p className="text-sm text-gray-500">{item.brand}</p>
                      </div>
                      <button
                        onClick={() => handleRemoveItem(item.id)}
                        className="text-gray-400 hover:text-gray-600 transition p-1"
                        aria-label="Remove item"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>

                    <div className="space-y-1 mb-4">
                      {item.color && (
                        <p className="text-sm text-gray-600">
                          Color: <span className="font-medium">{item.color}</span>
                        </p>
                      )}
                      {item.size && (
                        <p className="text-sm text-gray-600">
                          Size: <span className="font-medium">{item.size}</span>
                        </p>
                      )}
                      <p className="text-sm text-gray-600">
                        {item.inStock ? (
                          item.lowStock ? (
                            <span className="text-orange-500">
                              Only {item.stock} left
                            </span>
                          ) : (
                            <span className="text-green-600">In Stock</span>
                          )
                        ) : (
                          <span className="text-red-500">Out of Stock</span>
                        )}
                      </p>
                    </div>

                    <div className="flex items-center justify-between">
                      {/* Quantity Controls */}
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleQuantityChange(item.id, -1)}
                          className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-100 transition disabled:opacity-50 disabled:cursor-not-allowed"
                          disabled={item.quantity <= 1 || !item.inStock}
                          aria-label="Decrease quantity"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-8 text-center font-semibold text-gray-900">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => handleQuantityChange(item.id, 1)}
                          className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-100 transition disabled:opacity-50 disabled:cursor-not-allowed"
                          disabled={!item.inStock}
                          aria-label="Increase quantity"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      {/* Price */}
                      <p className="text-xl font-bold text-orange-500">
                        €{(item.salePrice * item.quantity).toFixed(2)}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Order Summary Section */}
          {!isEmpty && cart && (
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg  p-6 sticky top-24">
                <h2 className="text-xl font-bold text-gray-900 mb-6">
                  Order Summary
                </h2>

                <div className="space-y-4 mb-6">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">
                      Subtotal ({totalItems} {totalItems === 1 ? "item" : "items"})
                    </span>
                    <span className="font-semibold text-gray-900">
                      €{subtotal.toFixed(2)}
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Estimated Shipping</span>
                    <span className="font-semibold text-green-700">
                      {shipping === 0 ? "Complimentary" : `€${shipping.toFixed(2)}`}
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Estimated Tax</span>
                    <span className="font-semibold text-gray-900">
                      €{tax.toFixed(2)}
                    </span>
                  </div>

                  <div className="border-t border-gray-200 pt-4">
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-bold text-gray-900">
                        Total
                      </span>
                      <span className="text-2xl font-bold text-orange-500">
                        €{total.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>

                <Link
                  href="/checkout"
                  className="w-full text-white py-4 px-6 rounded-lg font-semibold flex items-center justify-center gap-2 hover:opacity-90 transition mb-3"
                  style={{ backgroundColor: '#00234E' }}
                >
                  Proceed to Checkout
                  <ArrowRight className="w-5 h-5" />
                </Link>

                <p className="text-center text-sm text-gray-600">
                  🔒 Secure Checkout
                </p>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Remove Item Confirmation Dialog */}
      {showRemoveDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50"
            onClick={cancelRemove}
          />

          {/* Dialog */}
          <div className="relative bg-white rounded-lg p-6 max-w-md w-full shadow-lg">
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              Remove Item from Cart?
            </h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to remove this item from your cart? This action cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={cancelRemove}
                className="px-6 py-2 rounded-lg border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={confirmRemove}
                className="px-6 py-2 rounded-lg text-white font-medium transition hover:opacity-90"
                style={{ backgroundColor: '#00234E' }}
              >
                Remove Item
              </button>
            </div>
          </div>
        </div>
      )}

      <HomePageFooter />
    </div>
  );
}
