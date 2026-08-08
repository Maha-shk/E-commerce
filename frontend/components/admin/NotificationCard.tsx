import { cn } from "@/lib/utils";
import { StatusDot, type StatusTone } from "@/components/admin/StatusDot";
import type { Notification, NotificationType } from "@/lib/api/models";
import { CheckCircle2, Info, TriangleAlert, AlertCircle, X } from "lucide-react";
import { formatDateTime, formatRelative } from "@/lib/admin/format";

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

  // "2 hours ago" beats a bare date on a feed where the newest entries are the
  // point — and it falls back to a formatted date past 30 days.
  const time = formatRelative(notification.createdAt);
  const exactTime = formatDateTime(notification.createdAt);

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
            <time
              dateTime={notification.createdAt}
              title={exactTime}
              className="shrink-0 text-xs whitespace-nowrap text-subtle"
            >
              {time}
            </time>
            {onDelete && (
              // Was a bare "×" character in a 0-padding button: a ~10px target
              // with no hit area and no icon alignment.
              <button
                type="button"
                onClick={onDelete}
                className="flex size-6 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-destructive focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                aria-label="Delete notification"
              >
                <X className="size-3.5" aria-hidden />
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
