"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, Mail, Bell } from "lucide-react";
import { AdminSearch } from "@/components/admin/AdminSearch";
import { AdminBreadcrumbs } from "@/components/admin/AdminBreadcrumbs";
import { Button } from "@/components/ui/button";
import { useUnreadCount, useUnreadMessageCount } from "@/lib/hooks/use-admin";

/** Routes where the global search field is suppressed. */
const HIDE_SEARCH_ON = ["/admin/profile"];

/** Count pill on a topbar icon button. Renders nothing at zero. */
function CountBadge({ count, label }: { count: number; label: string }) {
  if (count <= 0) return null;

  return (
    <span
      className="absolute -top-1.5 -right-1.5 flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-destructive px-1 text-[10px] leading-none font-semibold text-white tabular-nums ring-2 ring-background"
      aria-label={`${count} unread ${label}`}
    >
      {count > 99 ? "99+" : count}
    </span>
  );
}

/** Sticky header for the admin console: mobile menu trigger, global search, notifications. */
export function AdminTopbar({ onMenu }: { onMenu: () => void }) {
  const pathname = usePathname();
  const showSearch = !HIDE_SEARCH_ON.includes(pathname);

  const { data: unread } = useUnreadCount();
  const { data: unreadMessages = 0 } = useUnreadMessageCount();
  const unreadCount = unread?.unread ?? 0;

  return (
    // `h-16` matches the sidebar's brand block, so the two form one continuous
    // header line across the console.
    <header className="sticky top-0 z-30 border-b border-border bg-background">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-4 sm:px-6 lg:px-8">
        <Button
          variant="outline"
          size="icon"
          onClick={onMenu}
          aria-label="Open menu"
          className="size-10 shrink-0 lg:hidden"
        >
          <Menu className="size-5" />
        </Button>

        {/* Left: where you are. The bar used to start with the search box and
            leave the entire middle empty on wide screens. */}
        <AdminBreadcrumbs />

        {/* Right: search + actions, grouped so the controls read as one
            cluster instead of drifting to opposite ends of the bar. */}
        <div className="ml-auto flex min-w-0 items-center gap-2 sm:gap-3">
          {showSearch ? <AdminSearch /> : null}

          {/* Hairline between "find things" and "things waiting for you". */}
          <span className="hidden h-6 w-px shrink-0 bg-border sm:block" aria-hidden />

          <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
            <Button
              asChild
              variant="outline"
              size="icon"
              aria-label={
                unreadMessages > 0 ? `Messages (${unreadMessages} unread)` : "Messages"
              }
              className="relative size-10"
            >
              <Link href="/admin/messages">
                <Mail className="size-4.5" />
                {/* Driven by the real unread total — this used to be a red dot
                    hardcoded to always render. */}
                <CountBadge count={unreadMessages} label="messages" />
              </Link>
            </Button>

            <Button
              asChild
              variant="outline"
              size="icon"
              aria-label={
                unreadCount > 0 ? `Notifications (${unreadCount} unread)` : "Notifications"
              }
              className="relative size-10"
            >
              <Link href="/admin/notifications">
                <Bell className="size-4.5" />
                <CountBadge count={unreadCount} label="notifications" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
