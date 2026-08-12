"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutGrid,
  Package,
  Tags,
  FolderTree,
  Building2,
  Shapes,
  Smartphone,
  GalleryHorizontal,
  Warehouse,
  Users,
  ShoppingCart,
  Percent,
  FileText,
  Settings,
  UserRound,
  LogOut,
  MoreVertical,
  Store,
  type LucideIcon,
} from "lucide-react";
import { adminNavGroups, isAdminNavActive, type AdminNavIconKey } from "@/lib/admin/nav";
import { Logo } from "@/components/ui/Logo";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { useLogout, useSession } from "@/lib/hooks/use-auth";
import { initialsOf } from "@/lib/admin/format";

/** Human-readable role names shown in the account footer. */
const roleLabels: Record<string, string> = {
  SUPER_ADMIN: "Super Administrator",
  ADMIN: "Administrator",
  MANAGER: "Manager",
  SUPPORT: "Support Agent",
  CUSTOMER: "Customer",
};

const navIcons: Record<AdminNavIconKey, LucideIcon> = {
  dashboard: LayoutGrid,
  catalog: FolderTree,
  category: Tags,
  company: Building2,
  productType: Shapes,
  model: Smartphone,
  product: Package,
  banners: GalleryHorizontal,
  inventory: Warehouse,
  customers: Users,
  orders: ShoppingCart,
  discounts: Percent,
  reports: FileText,
  settings: Settings,
};

/** Persistent left navigation for the admin console. */
export function AdminSidebar({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const { user } = useSession();
  const logout = useLogout();

  const displayName = user?.fullName ?? "Admin User";
  const roleLabel = user ? roleLabels[user.role] : "Administrator";

  return (
    <div className="flex h-full flex-col bg-sidebar">
      {/*
       * `h-16` + `border-b` matches AdminTopbar exactly, so the brand block and
       * the page header form one continuous horizontal line across the app.
       * It was `py-5` around an h-11 logo — about 84px against the topbar's
       * 64px — so the two headers were visibly out of step.
       */}
      <div className="flex h-16 shrink-0 items-center border-b border-sidebar-border px-6">
        <Link
          href="/admin/dashboard"
          onClick={onNavigate}
          aria-label="CENTO Servizi — dashboard"
          className="rounded-md focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
        >
          <Logo className="h-9 w-auto" />
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4" aria-label="Admin">
        {adminNavGroups.map((group, groupIndex) => (
          <div key={group.label ?? "primary"} className={cn(groupIndex > 0 && "mt-6")}>
            {group.label ? (
              <h2 className="px-3 pb-2 text-[0.6875rem] font-semibold tracking-wider text-subtle uppercase">
                {group.label}
              </h2>
            ) : null}

            <ul className="space-y-1">
              {group.items.map((item) => {
                const Icon = navIcons[item.icon];
                const active = isAdminNavActive(pathname, item);

                if (item.disabled) {
                  return (
                    <li key={item.href}>
                      <span
                        aria-disabled="true"
                        className="flex h-10 cursor-not-allowed items-center gap-3 rounded-lg px-3 text-sm font-medium text-muted-foreground/50"
                      >
                        <Icon className="size-4 shrink-0" aria-hidden />
                        {item.name}
                      </span>
                    </li>
                  );
                }

                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={onNavigate}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "group flex h-10 items-center gap-3 rounded-lg px-3 text-sm font-medium",
                        "transition-colors duration-150",
                        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
                        active
                          ? "bg-sidebar-primary text-sidebar-primary-foreground"
                          : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                      )}
                    >
                      {/* Fixed 16px slot keeps every label on one x-position. */}
                      <Icon className="size-4 shrink-0" aria-hidden />
                      <span className="truncate">{item.name}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* Quick escape to the storefront — previously there was no way back
          without editing the URL. */}
      <div className="px-3 pb-2">
        <Link
          href="/"
          onClick={onNavigate}
          className="flex h-10 items-center gap-3 rounded-lg px-3 text-sm font-medium text-sidebar-foreground transition-colors duration-150 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        >
          <Store className="size-4 shrink-0" aria-hidden />
          View store
        </Link>
      </div>

      {/* Account footer */}
      <div className="flex items-center gap-2.5 border-t border-sidebar-border p-3">
        <Avatar className="size-9">
          {user?.avatarUrl ? <AvatarImage src={user.avatarUrl} alt="" /> : null}
          <AvatarFallback className="bg-primary text-xs font-semibold text-primary-foreground">
            {initialsOf(displayName)}
          </AvatarFallback>
        </Avatar>

        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm leading-tight font-semibold text-foreground">
            {displayName}
          </span>
          <span className="block truncate text-xs leading-tight text-subtle">
            {roleLabel}
          </span>
        </span>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="Account options"
              className="shrink-0 text-muted-foreground"
            >
              <MoreVertical className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" side="top" className="min-w-52">
            <DropdownMenuItem asChild>
              <Link href="/admin/profile" onClick={onNavigate}>
                <UserRound />
                My Profile
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              variant="destructive"
              disabled={logout.isPending}
              onClick={() => {
                onNavigate?.();
                logout.mutate();
              }}
            >
              <LogOut />
              {logout.isPending ? "Signing out…" : "Sign Out"}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
