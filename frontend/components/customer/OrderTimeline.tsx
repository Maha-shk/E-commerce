import { Check, Package, Truck, Box } from "lucide-react";
import { cn } from "@/lib/utils";

interface OrderTimelineProps {
  status: string;
  placedAt: string;
}

export function OrderTimeline({ status, placedAt }: OrderTimelineProps) {
  // Handle undefined/null status
  const orderStatus = status || "PENDING";

  const steps = [
    {
      key: "placed",
      label: "Order Placed",
      icon: Package,
      date: new Date(placedAt).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      }),
      completed: true,
    },
    {
      key: "processing",
      label: "Processing",
      icon: Box,
      date:
        orderStatus === "PENDING" || orderStatus === "CANCELLED"
          ? "Estimated"
          : new Date(placedAt).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            }),
      completed:
        orderStatus !== "PENDING" &&
        orderStatus !== "CANCELLED" &&
        orderStatus !== "RETURNED",
    },
    {
      key: "shipped",
      label: "Shipped",
      icon: Truck,
      date:
        orderStatus === "SHIPPED" ||
        orderStatus === "DELIVERED" ||
        orderStatus === "RETURNED"
          ? new Date().toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            })
          : "Estimated",
      completed: orderStatus === "SHIPPED" || orderStatus === "DELIVERED",
    },
    {
      key: "delivered",
      label: "Delivered",
      icon: Check,
      date:
        orderStatus === "DELIVERED"
          ? new Date().toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            })
          : "Estimated",
      completed: orderStatus === "DELIVERED",
    },
  ];

  // Handle special cases
  if (orderStatus === "CANCELLED") {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-[#00234E] mb-4">Order Status</h3>
        <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
            <Check className="w-5 h-5 text-red-600" />
          </div>
          <div>
            <p className="font-semibold text-red-900">Order Cancelled</p>
            <p className="text-sm text-red-700">
              This order has been cancelled
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (orderStatus === "RETURNED") {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-[#00234E] mb-4">Order Status</h3>
        <div className="flex items-center gap-3 p-4 bg-orange-50 border border-orange-200 rounded-lg">
          <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
            <Box className="w-5 h-5 text-orange-600" />
          </div>
          <div>
            <p className="font-semibold text-orange-900">Order Returned</p>
            <p className="text-sm text-orange-700">
              This order has been returned
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
      <h3 className="text-lg font-semibold text-[#00234E] mb-6">Order Progress</h3>

      <div className="relative">
        {/* Progress Line */}
        <div className="absolute top-5 left-0 right-0 h-1 bg-gray-200 -z-10 rounded">
          <div
            className="h-full bg-[#00234E] transition-all duration-500 rounded"
            style={{
              width:
                orderStatus === "PENDING"
                  ? "0%"
                  : orderStatus === "PROCESSING"
                  ? "33%"
                  : orderStatus === "SHIPPED"
                  ? "66%"
                  : "100%",
            }}
          />
        </div>

        {/* Steps */}
        <div className="flex justify-between">
          {steps.map((step, index) => {
            const Icon = step.icon;
            const isCurrent = index === steps.findIndex((s) => !s.completed);

            return (
              <div key={step.key} className="flex flex-col items-center">
                <div
                  className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300",
                    step.completed
                      ? "bg-[#00234E] border-[#00234E]"
                      : "bg-white border-gray-300",
                    isCurrent && !step.completed && "border-[#00234E]"
                  )}
                >
                  <Icon
                    className={cn(
                      "w-5 h-5",
                      step.completed ? "text-white" : "text-gray-400"
                    )}
                  />
                </div>
                <div className="mt-2 text-center">
                  <p
                    className={cn(
                      "text-xs font-medium",
                      step.completed
                        ? "text-[#00234E]"
                        : "text-gray-600"
                    )}
                  >
                    {step.label}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {step.date}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}