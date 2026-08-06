import { ShoppingCart, ExternalLink, HeadphonesIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface OrderActionsProps {
  order: {
    status: string;
    shippingTracking: string | null;
  };
}

export function OrderActions({ order }: OrderActionsProps) {
  const orderStatus = order.status || "PENDING";
  const isShipped = orderStatus === "SHIPPED" || orderStatus === "DELIVERED";
  const hasTracking = order.shippingTracking && order.shippingTracking.length > 0;

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
      <h3 className="text-lg font-semibold text-[#00234E] mb-4">Actions</h3>

      <div className="space-y-3">
        {/* Buy Again Button */}
        <Link href="/products" className="block">
          <Button
            variant="outline"
            className="w-full justify-start gap-2 h-11"
          >
            <ShoppingCart className="w-4 h-4" />
            Buy Again
          </Button>
        </Link>

        {/* Track Order Button - Only show if shipped and has tracking */}
        {isShipped && hasTracking && (
          <Button
            variant="outline"
            className="w-full justify-start gap-2 h-11"
            onClick={() => {
              // Open tracking in new tab with the tracking number
              if (order.shippingTracking) {
                window.open(
                  `https://trackingshipment.com/${order.shippingTracking}`,
                  "_blank"
                );
              }
            }}
          >
            <ExternalLink className="w-4 h-4" />
            Track Order
          </Button>
        )}

        {/* Contact Support Button */}
        <Link href="/contact" className="block">
          <Button
            variant="outline"
            className="w-full justify-start gap-2 h-11"
          >
            <HeadphonesIcon className="w-4 h-4" />
            Contact Support
          </Button>
        </Link>
      </div>

      {/* Help Text */}
      <div className="mt-4 p-3 bg-gray-50 rounded-lg">
        <p className="text-xs text-gray-600 text-center">
          Need help? Our support team is available 24/7 to assist you with any
          order-related questions.
        </p>
      </div>
    </div>
  );
}