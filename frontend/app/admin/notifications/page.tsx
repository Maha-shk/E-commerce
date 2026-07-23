"use client";

import { useState } from "react";
import { Search, CheckCheck, Trash2, BellOff, X } from "lucide-react";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NotificationCard } from "@/components/admin/NotificationCard";
import { useNotificationGroups, useUnreadCount, useMarkAllNotificationsRead, useDeleteNotification } from "@/lib/hooks/use-admin";
import { cn } from "@/lib/utils";

const tabs = ["All", "Unread"];
const categoryOptions = ["All", "ORDERS", "CUSTOMERS", "INVENTORY", "DISCOUNTS", "REPORTS", "SYSTEM"];

export default function NotificationsPage() {
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("All");
  const [category, setCategory] = useState("All");

  const { data: groupedData } = useNotificationGroups({
    unreadOnly: activeTab === "Unread",
    category: category === "All" ? undefined : category,
  });

  const { data: unreadData } = useUnreadCount();
  const markAllRead = useMarkAllNotificationsRead();
  const deleteNotification = useDeleteNotification();

  const unreadCount = unreadData?.unread ?? 0;
  const groups = groupedData?.data ?? [];

  const allNotifications = groups.flatMap((g) => g.items);

  function handleMarkAllRead() {
    markAllRead.mutate(undefined);
  }

  function handleClearAll() {
    // Would need a bulk delete endpoint - for now just mark all as read
    handleMarkAllRead();
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Notifications"
        subtitle="Stay updated with orders, customers, system alerts, and platform activities."
        action={
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button variant="outline" size="xl" onClick={handleMarkAllRead}>
              <CheckCheck />
              Mark All as Read
            </Button>
            <Button variant="outline" size="xl" onClick={handleClearAll}>
              <Trash2 />
              Clear All
            </Button>
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
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-11 rounded-lg bg-card pl-9"
          />
        </div>
        <div className="flex items-center gap-2">
          {categoryOptions.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setCategory(cat)}
              className={cn(
                "rounded-lg px-4 py-2 text-sm font-medium transition-colors",
                category === cat
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Category tabs */}
      <div className="flex gap-1.5 overflow-x-auto pb-1">
        {tabs.map((tab) => {
          const isActive = tab === activeTab;
          return (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={cn(
                "flex shrink-0 items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium transition-colors",
                isActive
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
      {groups.length > 0 ? (
        <div className="space-y-6">
          {groups.map((group) => (
            <section key={group.label} className="space-y-3">
              <div className="flex items-center gap-2 px-1">
                <h2 className="text-xs font-semibold uppercase tracking-wider text-subtle">
                  {group.label}
                </h2>
                <span className="text-xs text-subtle">· {group.items.length}</span>
              </div>
              <Card className="gap-0 overflow-hidden py-0">
                <div className="divide-y">
                  {group.items
                    .filter((notification) => {
                      if (!search) return true;
                      const q = search.toLowerCase();
                      return (
                        notification.title.toLowerCase().includes(q) ||
                        notification.description.toLowerCase().includes(q)
                      );
                    })
                    .map((notification) => (
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
        <Card className="py-16">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <BellOff className="size-12 text-muted-foreground mb-4" />
            <p className="text-lg font-semibold text-foreground">No notifications</p>
            <p className="text-sm text-muted-foreground">
              {search ? "No notifications match your search." : "You're all caught up!"}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
