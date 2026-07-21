import { Search, ListFilter, CheckCheck, Trash2, BellOff } from "lucide-react";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DeleteConfirmButton } from "@/components/admin/DeleteConfirmButton";
import { NotificationCard } from "@/components/admin/NotificationCard";
import { EmptyState } from "@/components/admin/EmptyState";
import { notificationTabs, notificationGroups, unreadCount } from "@/lib/admin/notifications";
import { cn } from "@/lib/utils";

const hasNotifications = notificationGroups.some((group) => group.items.length > 0);

export default function NotificationsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Notifications"
        subtitle="Stay updated with orders, customers, system alerts, and platform activities."
        action={
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button variant="outline" size="xl">
              <CheckCheck />
              Mark All as Read
            </Button>
            <DeleteConfirmButton
              variant="outline"
              size="xl"
              title="Clear all notifications?"
              description="Every notification in your inbox will be permanently removed. This action cannot be undone."
              confirmLabel="Clear all"
            >
              <Trash2 />
              Clear All
            </DeleteConfirmButton>
          </div>
        }
      />

      {/* Search + filter */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-subtle" />
          <Input
            type="search"
            placeholder="Search notifications…"
            aria-label="Search notifications"
            className="h-11 rounded-lg bg-card pl-9"
          />
        </div>
        <Button variant="outline" size="xl" className="w-full sm:w-auto">
          <ListFilter />
          Filter
        </Button>
      </div>

      {/* Category tabs (presentational) */}
      <div className="flex gap-1.5 overflow-x-auto pb-1">
        {notificationTabs.map((tab, i) => {
          const active = i === 0;
          return (
            <button
              key={tab}
              type="button"
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex shrink-0 items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              {tab}
              {tab === "Unread" && unreadCount > 0 && (
                <span className="rounded-full bg-muted px-1.5 text-xs font-semibold text-foreground">
                  {unreadCount}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Grouped list */}
      {hasNotifications ? (
        <div className="space-y-6">
          {notificationGroups.map((group) => (
            <section key={group.label} className="space-y-3">
              <div className="flex items-center gap-2 px-1">
                <h2 className="text-xs font-semibold uppercase tracking-wider text-subtle">
                  {group.label}
                </h2>
                <span className="text-xs text-subtle">· {group.items.length}</span>
              </div>
              <Card className="gap-0 overflow-hidden py-0">
                <div className="divide-y">
                  {group.items.map((notification) => (
                    <NotificationCard key={notification.id} notification={notification} />
                  ))}
                </div>
              </Card>
            </section>
          ))}
        </div>
      ) : (
        <Card className="py-0">
          <EmptyState
            icon={BellOff}
            title="No notifications available."
            description="You're all caught up. New alerts about orders, customers, and system activity will appear here."
          />
        </Card>
      )}
    </div>
  );
}
