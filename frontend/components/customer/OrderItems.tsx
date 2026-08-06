import { Package } from "lucide-react";

interface OrderItemsProps {
  items: Array<{
    id: string;
    name: string;
    sku: string;
    quantity: number;
    unitPrice: number;
    lineTotal: number;
    image?: string;
  }>;
}

export function OrderItems({ items }: OrderItemsProps) {
  const formatEuro = (amount: number) => {
    return new Intl.NumberFormat("en-IE", {
      style: "currency",
      currency: "EUR",
    }).format(amount);
  };

  // Handle undefined items
  const orderItems = items || [];

  // Calculate line total if missing
  const processedItems = orderItems.map(item => ({
    ...item,
    lineTotal: item.lineTotal || (item.quantity * item.unitPrice),
    unitPrice: item.unitPrice || 0,
    quantity: item.quantity || 0,
  }));

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
      <div className="p-6 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-[#00234E]">Order Items</h3>
        <p className="text-sm text-gray-600 mt-1">
          {processedItems.length} {processedItems.length === 1 ? "item" : "items"} in your order
        </p>
      </div>

      <div className="p-6">
        {processedItems.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No items found for this order
          </div>
        ) : (
          <div className="space-y-4">
            {processedItems.map((item) => (
              <div
                key={item.id || item.name}
                className="flex gap-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                {/* Product Image */}
                <div className="relative w-20 h-20 shrink-0">
                  {item.image ? (
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-full h-full object-cover rounded-lg"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-[#00234E]/10 to-[#00234E]/5 rounded-lg flex items-center justify-center">
                      <Package className="w-8 h-8 text-[#00234E]/40" />
                    </div>
                  )}
                </div>

                {/* Product Details */}
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-gray-900 text-sm line-clamp-2">
                    {item.name || "Unknown Product"}
                  </h4>
                  <p className="text-xs text-gray-500 mt-1">SKU: {item.sku || "N/A"}</p>
                  <p className="text-xs text-gray-500">
                    Quantity: {item.quantity || 0}
                  </p>
                </div>

                {/* Price */}
                <div className="text-right shrink-0">
                  <p className="text-sm text-gray-600">
                    {formatEuro(item.unitPrice)} each
                  </p>
                  <p className="text-lg font-semibold text-[#00234E] mt-1">
                    {formatEuro(item.lineTotal)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}