import { Badge } from "@/components/ui/badge";
import { Calendar, Package } from "lucide-react";
import { cn } from "@/lib/utils";

interface OrderHeaderProps {
  order: {
    orderNumber: string;
    placedAt: string;
    status: string;
    paymentStatus: string;
  };
}

export function OrderHeader({ order }: OrderHeaderProps) {
  const getStatusColor = (status: string | undefined | null) => {
    if (!status) return "bg-gray-100 text-gray-700 border-gray-200";

    switch (status.toUpperCase()) {
      case "DELIVERED":
        return "bg-green-100 text-green-700 border-green-200";
      case "SHIPPED":
        return "bg-blue-100 text-blue-700 border-blue-200";
      case "PROCESSING":
      case "PENDING":
        return "bg-orange-100 text-orange-700 border-orange-200";
      case "CANCELLED":
      case "RETURNED":
        return "bg-red-100 text-red-700 border-red-200";
      default:
        return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        {/* Order Number */}
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-12 h-12 bg-[#00234E] rounded-lg">
            <Package className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-[#00234E]">
              {order.orderNumber}
            </h2>
            <div className="flex items-center gap-2 mt-1 text-sm text-gray-600">
              <Calendar className="w-4 h-4" />
              <span>
                Placed on {new Date(order.placedAt).toLocaleDateString("en-US", {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
              </span>
            </div>
          </div>
        </div>

        {/* Status Badge */}
        <div className="flex items-center">
          <Badge
            className={cn(
              "px-3 py-1.5 text-sm font-semibold border",
              getStatusColor(order.status)
            )}
          >
            {order.status}
          </Badge>
        </div>
      </div>
    </div>
  );
}