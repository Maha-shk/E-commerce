"use client";

import { useMemo, useState } from "react";
import { Search, CheckCheck, BellOff, X, Loader2 } from "lucide-react";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NotificationCard } from "@/components/admin/NotificationCard";
import { ErrorState } from "@/components/admin/QueryState";
import {
  useNotificationGroups,
  useUnreadCount,
  useMarkAllNotificationsRead,
  useDeleteNotification,
} from "@/lib/hooks/use-admin";
import { titleCase } from "@/lib/admin/format";
import { cn } from "@/lib/utils";

/** Raw enum values from the API, rendered in title case. */
const CATEGORIES = [
  "ORDERS",
  "CUSTOMERS",
  "INVENTORY",
  "DISCOUNTS",
  "REPORTS",
  "SYSTEM",
] as const;

export default function NotificationsPage() {
  const [search, setSearch] = useState("");
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [category, setCategory] = useState<"All" | (typeof CATEGORIES)[number]>("All");

  const { data: groupedData, isPending, isError, error, refetch } = useNotificationGroups({
    unreadOnly,
    category: category === "All" ? undefined : category,
  });

  const { data: unreadData } = useUnreadCount();
  const markAllRead = useMarkAllNotificationsRead();
  const deleteNotification = useDeleteNotification();

  const unreadCount = unreadData?.unread ?? 0;

  /*
   * Search is applied BEFORE the groups render.
   *
   * It used to filter inside each group's item list, so a group header could
   * read "Today · 5" above zero visible rows, and a search matching nothing
   * still rendered every header with an empty card underneath instead of the
   * empty state.
   */
  const groups = useMemo(() => {
    const raw = groupedData?.data ?? [];
    const q = search.trim().toLowerCase();
    if (!q) return raw;

    return raw
      .map((group) => ({
        ...group,
        items: group.items.filter(
          (n) =>
            n.title.toLowerCase().includes(q) || n.description.toLowerCase().includes(q),
        ),
      }))
      .filter((group) => group.items.length > 0);
  }, [groupedData, search]);

  const hasFilters = Boolean(search) || unreadOnly || category !== "All";

  function clearFilters() {
    setSearch("");
    setUnreadOnly(false);
    setCategory("All");
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Notifications"
        subtitle="Orders, stock alerts and system activity."
        action={
          // "Clear All" is gone: it carried a trash icon but its own comment
          // read "Would need a bulk delete endpoint - for now just mark all as
          // read", and it called the very same handler as the button beside it.
          <Button
            variant="outline"
            size="lg"
            onClick={() => markAllRead.mutate(undefined)}
            disabled={unreadCount === 0 || markAllRead.isPending}
          >
            {markAllRead.isPending ? (
              <Loader2 className="size-4 animate-spin" aria-hidden />
            ) : (
              <CheckCheck className="size-4" aria-hidden />
            )}
            Mark all as read
          </Button>
        }
      />

      {/* Filters — one row, one visual language. Read/unread and category were
          two separate chip rows styled identically, so neither read as the
          primary axis. */}
      <Card className="gap-0 py-0">
        <div className="flex flex-col gap-3 p-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <div
              role="group"
              aria-label="Read state"
              className="inline-flex rounded-lg bg-muted p-1"
            >
              {[
                { label: "All", value: false },
                { label: "Unread", value: true },
              ].map((option) => {
                const isActive = unreadOnly === option.value;
                return (
                  <button
                    key={option.label}
                    type="button"
                    onClick={() => setUnreadOnly(option.value)}
                    aria-pressed={isActive}
                    className={cn(
                      "flex items-center gap-1.5 rounded-md px-3.5 py-1.5 text-sm font-medium transition-colors",
                      "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
                      isActive
                        ? "bg-card text-foreground shadow-card"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {option.label}
                    {option.value && unreadCount > 0 ? (
                      <span className="rounded-full bg-destructive px-1.5 text-xs font-semibold text-white tabular-nums">
                        {unreadCount}
                      </span>
                    ) : null}
                  </button>
                );
              })}
            </div>

            <span className="hidden h-6 w-px bg-border sm:block" aria-hidden />

            <div className="scrollbar-hide flex min-w-0 items-center gap-1.5 overflow-x-auto">
              {(["All", ...CATEGORIES] as const).map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategory(cat)}
                  aria-pressed={category === cat}
                  className={cn(
                    "shrink-0 rounded-lg border px-3 py-1.5 text-xs font-medium whitespace-nowrap transition-colors",
                    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
                    category === cat
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border text-muted-foreground hover:bg-muted hover:text-foreground",
                  )}
                >
                  {/* Were raw enums: ORDERS, CUSTOMERS, INVENTORY… */}
                  {cat === "All" ? "All" : titleCase(cat)}
                </button>
              ))}
            </div>
          </div>

          <div className="relative w-full lg:w-64">
            <Search
              className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-subtle"
              aria-hidden
            />
            <Input
              type="text"
              inputMode="search"
              aria-label="Search notifications"
              placeholder="Search notifications…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className={cn("h-10 bg-card pl-9", search && "pr-9")}
            />
            {search ? (
              <button
                type="button"
                onClick={() => setSearch("")}
                aria-label="Clear search"
                className="absolute top-1/2 right-1.5 flex size-7 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
              >
                <X className="size-4" aria-hidden />
              </button>
            ) : null}
          </div>
        </div>
      </Card>

      {/* The page had no loading or error state: a failed request looked
          identical to "You're all caught up!" */}
      {isError ? (
        <Card className="gap-0 py-0">
          <div className="p-5">
            <ErrorState error={error} onRetry={() => refetch()} />
          </div>
        </Card>
      ) : isPending ? (
        <Card className="gap-0 py-0">
          <div className="flex flex-col items-center gap-3 py-20">
            <Loader2 className="size-6 animate-spin text-muted-foreground" aria-hidden />
            <p className="text-sm text-muted-foreground">Loading notifications…</p>
          </div>
        </Card>
      ) : groups.length > 0 ? (
        <div className="space-y-6">
          {groups.map((group) => (
            <section key={group.label} className="space-y-3">
              <div className="flex items-center gap-2 px-1">
                <h2 className="text-xs font-semibold tracking-wider text-subtle uppercase">
                  {group.label}
                </h2>
                <span className="text-xs text-subtle tabular-nums">
                  · {group.items.length}
                </span>
              </div>
              <Card className="gap-0 py-0">
                <div className="divide-y divide-border">
                  {group.items.map((notification) => (
                    <NotificationCard
                      key={notification.id}
                      notification={notification}
                      onDelete={() => deleteNotification.mutate(notification.id)}
                    />
                  ))}
                </div>
              </Card>
            </section>
          ))}
        </div>
      ) : (
        <Card className="gap-0 py-0">
          <div className="flex flex-col items-center px-6 py-20 text-center">
            <span className="mb-3 flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
              <BellOff className="size-6" aria-hidden />
            </span>
            <p className="text-base font-semibold tracking-tight">
              {hasFilters ? "No matching notifications" : "No notifications"}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {hasFilters
                ? "Nothing matches your current filters."
                : "You're all caught up."}
            </p>
            {hasFilters ? (
              <Button variant="outline" className="mt-5" onClick={clearFilters}>
                Clear filters
              </Button>
            ) : null}
          </div>
        </Card>
      )}
    </div>
  );
}
