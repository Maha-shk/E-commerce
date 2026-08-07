"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookUser,
  Heart,
  LayoutDashboard,
  Loader2,
  LogOut,
  ShoppingBag,
  User,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useLogout, useSession } from "@/lib/hooks/use-auth";
import { cn } from "@/lib/utils";

/**
 * The five account tabs. Kept in one place so the nav can't drift between
 * pages — every /account route renders this same component.
 *
 * Icons are all lucide-react at a uniform 16px, rendered in a fixed-width slot
 * so the labels start on the same x-position regardless of glyph width.
 */
export const ACCOUNT_MENU = [
  { icon: LayoutDashboard, title: "Overview", path: "/account" },
  { icon: ShoppingBag, title: "My Orders", path: "/account/orders" },
  { icon: Heart, title: "My Wishlist", path: "/account/wishlist" },
  { icon: BookUser, title: "Address Book", path: "/account/addresses" },
  { icon: User, title: "Profile", path: "/account/profile" },
] as const;

/** Initials fallback for the avatar, e.g. "Arthur Morgan" -> "AM". */
export function initialsOf(fullName: string) {
  return fullName
    .split(" ")
    .filter(Boolean)
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

/**
 * Placeholder with the same footprint as the real sidebar. Rendering this
 * instead of `null` while the session hydrates stops the content column from
 * jumping sideways on first paint.
 */
function SidebarSkeleton() {
  return (
    <Card className="gap-0 py-0">
      <div className="flex flex-col items-center border-b border-border px-5 py-6">
        <div className="size-20 animate-pulse rounded-full bg-muted" />
        <div className="mt-4 h-4 w-32 animate-pulse rounded bg-muted" />
        <div className="mt-2 h-3 w-40 animate-pulse rounded bg-muted" />
      </div>
      <div className="space-y-1 p-3">
        {ACCOUNT_MENU.map((item) => (
          <div key={item.path} className="h-10 animate-pulse rounded-lg bg-muted/60" />
        ))}
      </div>
    </Card>
  );
}

export function AccountSidebar() {
  const pathname = usePathname();
  const { user } = useSession();
  const logout = useLogout();

  if (!user) return <SidebarSkeleton />;

  return (
    // Positioning is owned by AccountShell's <aside> — see the note there on
    // why `sticky` must sit on the grid item rather than on this Card.
    <Card className="gap-0 py-0">
      {/* Profile header */}
      <div className="flex flex-col items-center border-b border-border px-5 py-6 text-center">
        <Avatar className="size-20">
          {user.avatarUrl ? (
            <AvatarImage src={user.avatarUrl} alt="" />
          ) : null}
          <AvatarFallback className="bg-muted text-xl font-semibold text-primary">
            {initialsOf(user.fullName)}
          </AvatarFallback>
        </Avatar>
        <p className="mt-4 max-w-full truncate text-base font-semibold tracking-tight">
          {user.fullName}
        </p>
        <p className="mt-0.5 max-w-full truncate text-sm text-muted-foreground">
          {user.email}
        </p>
      </div>

      {/* Tabs */}
      <nav aria-label="Account" className="p-3">
        <ul className="space-y-1">
          {ACCOUNT_MENU.map((item) => {
            const Icon = item.icon;
            // "/account" must match exactly, or it would light up on every
            // nested route as well.
            const isActive =
              item.path === "/account"
                ? pathname === "/account"
                : pathname.startsWith(item.path);

            return (
              <li key={item.path}>
                <Link
                  href={item.path}
                  aria-current={isActive ? "page" : undefined}
                  className={cn(
                    "flex h-10 w-full items-center gap-3 rounded-lg px-3 text-sm font-medium",
                    "transition-colors duration-150 ease-out",
                    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  )}
                >
                  {/* Fixed 16px slot keeps every label on the same x-position. */}
                  <Icon className="size-4 shrink-0" aria-hidden />
                  <span className="truncate">{item.title}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Sign out */}
      <div className="border-t border-border p-3">
        <button
          type="button"
          onClick={() => logout.mutate()}
          disabled={logout.isPending}
          className={cn(
            "flex h-10 w-full items-center gap-3 rounded-lg px-3 text-sm font-medium",
            "text-destructive transition-colors duration-150 ease-out hover:bg-destructive/10",
            "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-destructive",
            "disabled:opacity-60",
          )}
        >
          {logout.isPending ? (
            <Loader2 className="size-4 shrink-0 animate-spin" aria-hidden />
          ) : (
            <LogOut className="size-4 shrink-0" aria-hidden />
          )}
          <span>{logout.isPending ? "Signing out…" : "Sign Out"}</span>
        </button>
      </div>
    </Card>
  );
}
