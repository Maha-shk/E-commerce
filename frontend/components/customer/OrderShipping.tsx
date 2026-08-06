import { Truck, MapPin } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface OrderShippingProps {
  order: {
    shippingMethod: string | null;
    shippingTracking: string | null;
    shippingAddress: string[];
  };
}

export function OrderShipping({ order }: OrderShippingProps) {
  // Handle undefined shipping address
  const shippingAddress = order.shippingAddress || [];
  const shippingMethod = order.shippingMethod || "Standard Shipping";
  const trackingNumber = order.shippingTracking || null;

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <Truck className="w-5 h-5 text-[#00234E]" />
        <h3 className="text-lg font-semibold text-[#00234E]">Shipping Information</h3>
      </div>

      <div className="space-y-4">
        {/* Shipping Method */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">
            Shipping Method
          </p>
          <p className="text-sm font-medium text-gray-900">
            {shippingMethod}
          </p>
        </div>

        {/* Tracking Number */}
        {trackingNumber && (
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">
              Tracking Number
            </p>
            <div className="flex items-center gap-2">
              <Badge
                variant="outline"
                className="font-mono text-xs bg-blue-50 text-blue-700 border-blue-200"
              >
                {trackingNumber}
              </Badge>
            </div>
          </div>
        )}

        {/* Shipping Address */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2 flex items-center gap-1">
            <MapPin className="w-3 h-3" />
            Shipping Address
          </p>
          <address className="text-sm text-gray-900 not-italic bg-gray-50 rounded-lg p-3">
            {shippingAddress.length > 0 ? (
              shippingAddress.map((line, index) => (
                <span key={index} className="block">
                  {line}
                </span>
              ))
            ) : (
              <span className="text-gray-500">No shipping address provided</span>
            )}
          </address>
        </div>
      </div>
    </div>
  );
}