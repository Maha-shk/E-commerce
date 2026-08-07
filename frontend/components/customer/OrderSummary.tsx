import { Receipt } from "lucide-react";

interface OrderSummaryProps {
  order: {
    // Optional because the component below falls back to deriving the figures
    // from the line items when a response omits the totals block.
    totals?: {
      subtotal: number;
      shipping: number;
      discount: number;
      total: number;
    };
    items?: Array<{
      quantity: number;
      unitPrice: number;
      lineTotal?: number;
    }>;
    shippingCost?: number;
    discount?: number;
  };
}

export function OrderSummary({ order }: OrderSummaryProps) {
  const formatEuro = (amount: number) => {
    return new Intl.NumberFormat("en-IE", {
      style: "currency",
      currency: "EUR",
    }).format(amount);
  };

  // Handle missing totals object
  const totals = order.totals || {
    subtotal: 0,
    shipping: 0,
    discount: 0,
    total: 0,
  };

  // Calculate totals if missing from API response
  if (!order.totals && order.items && order.items.length > 0) {
    totals.subtotal = order.items.reduce((sum, item) => sum + (item.lineTotal || item.quantity * item.unitPrice), 0);
    totals.shipping = order.shippingCost || 0;
    totals.discount = order.discount || 0;
    totals.total = totals.subtotal + totals.shipping - totals.discount;
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <Receipt className="w-5 h-5 text-[#00234E]" />
        <h3 className="text-lg font-semibold text-[#00234E]">Order Summary</h3>
      </div>

      <div className="space-y-3">
        {/* Subtotal */}
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">Subtotal</span>
          <span className="font-medium text-gray-900">
            {formatEuro(totals.subtotal)}
          </span>
        </div>

        {/* Shipping */}
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">Shipping</span>
          <span className="font-medium text-gray-900">
            {totals.shipping === 0
              ? "Free"
              : formatEuro(totals.shipping)}
          </span>
        </div>

        {/* Discount */}
        {totals.discount > 0 && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Discount</span>
            <span className="font-medium text-green-600">
              −{formatEuro(totals.discount)}
            </span>
          </div>
        )}

        {/* Total */}
        <div className="flex items-center justify-between pt-4 border-t-2 border-gray-300 mt-4">
          <span className="text-lg font-bold text-[#00234E]">Total</span>
          <span className="text-2xl font-bold text-[#00234E]">
            {formatEuro(totals.total)}
          </span>
        </div>
      </div>
    </div>
  );
}