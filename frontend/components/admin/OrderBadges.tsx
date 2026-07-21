import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { OrderStatus, PaymentStatus } from "@/lib/admin/orders";

type BadgeVariant = "success" | "warning" | "info" | "navy" | "secondary" | "destructive";

const orderStatusVariant: Record<OrderStatus, BadgeVariant> = {
  Pending: "warning",
  Processing: "info",
  Shipped: "navy",
  Delivered: "success",
  Cancelled: "destructive",
  Returned: "warning",
};

const paymentStatusVariant: Record<PaymentStatus, BadgeVariant> = {
  Paid: "success",
  Pending: "warning",
  Refunded: "secondary",
  Failed: "destructive",
};

/** Colour-coded fulfilment status pill. */
export function OrderStatusBadge({
  status,
  className,
}: {
  status: OrderStatus;
  className?: string;
}) {
  return (
    <Badge variant={orderStatusVariant[status]} className={cn("uppercase", className)}>
      <span className="size-1.5 rounded-full bg-current" />
      {status}
    </Badge>
  );
}

/** Colour-coded payment status pill. */
export function PaymentStatusBadge({
  status,
  className,
}: {
  status: PaymentStatus;
  className?: string;
}) {
  return (
    <Badge variant={paymentStatusVariant[status]} className={cn("uppercase", className)}>
      <span className="size-1.5 rounded-full bg-current" />
      {status}
    </Badge>
  );
}
