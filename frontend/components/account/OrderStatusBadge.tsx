import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

/**
 * Order status → badge tone. Lives here (rather than duplicated in each page)
 * so the Overview table and the Orders table can never disagree about what
 * colour "SHIPPED" is.
 */
const STATUS_TONE: Record<string, string> = {
  DELIVERED: "bg-success-muted text-success",
  SHIPPED: "bg-info-muted text-info",
  PROCESSING: "bg-warning-muted text-warning",
  PENDING: "bg-warning-muted text-warning",
  CANCELLED: "bg-destructive-muted text-destructive",
  RETURNED: "bg-destructive-muted text-destructive",
};

/** "PENDING" -> "Pending", "OUT_FOR_DELIVERY" -> "Out for delivery". */
function humanise(status: string) {
  const words = status.replace(/_/g, " ").toLowerCase();
  return words.charAt(0).toUpperCase() + words.slice(1);
}

export function OrderStatusBadge({
  status,
  className,
}: {
  status: string;
  className?: string;
}) {
  const key = status.toUpperCase();

  return (
    <Badge
      className={cn(
        "h-6 px-2.5 text-xs font-medium",
        STATUS_TONE[key] ?? "bg-muted text-muted-foreground",
        className,
      )}
    >
      {humanise(status)}
    </Badge>
  );
}
