import { cn } from "@/lib/utils";
import { StatusDot, type StatusTone } from "@/components/admin/StatusDot";
import type { Notification, NotificationType } from "@/lib/admin/notifications";

/** Icon medallion tint + status tone per notification type. */
const typeConfig: Record<NotificationType, { chip: string; tone: StatusTone }> = {
  success: { chip: "bg-success-muted text-success", tone: "success" },
  info: { chip: "bg-info-muted text-info", tone: "info" },
  warning: { chip: "bg-warning-muted text-warning", tone: "warning" },
  error: { chip: "bg-destructive/10 text-destructive", tone: "error" },
};

/** A single notification row. Unread rows get a subtle highlight + status dot. */
export function NotificationCard({ notification }: { notification: Notification }) {
  const { icon: Icon, title, description, time, type, unread } = notification;
  const { chip, tone } = typeConfig[type];

  return (
    <div
      className={cn(
        "flex gap-3.5 px-4 py-4 transition-colors sm:px-5",
        unread ? "bg-accent/50" : "hover:bg-muted/30",
      )}
    >
      <span className={cn("flex size-10 shrink-0 items-center justify-center rounded-full", chip)}>
        <Icon className="size-5" />
      </span>

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-3">
          <p className="flex items-center gap-2 font-semibold text-foreground">
            {title}
            {unread && <StatusDot tone={tone} className="size-1.5" />}
          </p>
          <span className="shrink-0 text-xs whitespace-nowrap text-subtle">{time}</span>
        </div>
        <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>
      </div>

      {/* Unread indicator */}
      <span className="flex w-2 shrink-0 items-center justify-center">
        {unread && <span className="size-2 rounded-full bg-primary" />}
      </span>
    </div>
  );
}
