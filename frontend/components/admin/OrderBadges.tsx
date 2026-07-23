import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { orderStatusLabel, paymentStatusLabel, type OrderStatus, type PaymentStatus } from "@/lib/api/models";

type BadgeVariant = "success" | "warning" | "info" | "navy" | "secondary" | "destructive";

const orderStatusVariant: Record<OrderStatus, BadgeVariant> = {
  PENDING: "warning",
  PROCESSING: "info",
  SHIPPED: "navy",
  DELIVERED: "success",
  CANCELLED: "destructive",
  RETURNED: "warning",
};

const paymentStatusVariant: Record<PaymentStatus, BadgeVariant> = {
  PAID: "success",
  PENDING: "warning",
  REFUNDED: "secondary",
  FAILED: "destructive",
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
      {orderStatusLabel[status]}
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
      {paymentStatusLabel[status]}
    </Badge>
  );
}
