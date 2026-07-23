import { cn } from "@/lib/utils";
import { StatusDot, type StatusTone } from "@/components/admin/StatusDot";
import type { Notification, NotificationType } from "@/lib/api/models";
import { CheckCircle2, Info, TriangleAlert, AlertCircle } from "lucide-react";

/** Icon per notification type. */
const icons: Record<NotificationType, React.ComponentType<{ className?: string }>> = {
  SUCCESS: CheckCircle2,
  INFO: Info,
  WARNING: TriangleAlert,
  ERROR: AlertCircle,
};

/** Icon medallion tint + status tone per notification type. */
const typeConfig: Record<NotificationType, { chip: string; tone: StatusTone }> = {
  SUCCESS: { chip: "bg-success-muted text-success", tone: "success" },
  INFO: { chip: "bg-info-muted text-info", tone: "info" },
  WARNING: { chip: "bg-warning-muted text-warning", tone: "warning" },
  ERROR: { chip: "bg-destructive/10 text-destructive", tone: "error" },
};

/** A single notification row. Unread rows get a subtle highlight + status dot. */
export function NotificationCard({
  notification,
  onDelete
}: {
  notification: Notification;
  onDelete?: () => void;
}) {
  const Icon = icons[notification.type];
  const { chip, tone } = typeConfig[notification.type];

  const time = new Date(notification.createdAt).toLocaleDateString();

  return (
    <div
      className={cn(
        "flex gap-3.5 px-4 py-4 transition-colors sm:px-5",
        notification.read ? "hover:bg-muted/30" : "bg-accent/50",
      )}
    >
      <span className={cn("flex size-10 shrink-0 items-center justify-center rounded-full", chip)}>
        <Icon className="size-5" />
      </span>

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-3">
          <p className="flex items-center gap-2 font-semibold text-foreground">
            {notification.title}
            {!notification.read && <StatusDot tone={tone} className="size-1.5" />}
          </p>
          <div className="flex items-center gap-2">
            <span className="shrink-0 text-xs whitespace-nowrap text-subtle">{time}</span>
            {onDelete && (
              <button
                type="button"
                onClick={onDelete}
                className="shrink-0 text-muted-foreground hover:text-destructive transition-colors"
                aria-label="Delete notification"
              >
                ×
              </button>
            )}
          </div>
        </div>
        <p className="mt-0.5 text-sm text-muted-foreground">{notification.description}</p>
      </div>

      {/* Unread indicator */}
      <span className="flex w-2 shrink-0 items-center justify-center">
        {!notification.read && <span className="size-2 rounded-full bg-primary" />}
      </span>
    </div>
  );
}
