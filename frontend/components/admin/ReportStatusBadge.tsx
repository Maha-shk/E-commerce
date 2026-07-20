import { Badge } from "@/components/ui/badge";
import type { ReportStatus } from "@/lib/admin/reports";

/**
 * Transaction status pill. Uses the admin-wide semantic status colours
 * (success / info / destructive) rendered in their soft muted tones.
 */
const statusVariant: Record<ReportStatus, "success" | "info" | "destructive"> = {
  Completed: "success",
  Processing: "info",
  Returned: "destructive",
};

export function ReportStatusBadge({
  status,
  className,
}: {
  status: ReportStatus;
  className?: string;
}) {
  return (
    <Badge variant={statusVariant[status]} className={className}>
      {status}
    </Badge>
  );
}
