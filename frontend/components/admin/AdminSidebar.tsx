"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutGrid,
  Package,
  Tags,
  Warehouse,
  Users,
  ShoppingCart,
  Percent,
  FileText,
  Settings,
  UserRound,
  LogOut,
  MoreVertical,
  type LucideIcon,
} from "lucide-react";
import { adminNav, isAdminNavActive, type AdminNavIconKey } from "@/lib/admin/nav";
import { Logo } from "@/components/ui/Logo";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
  product: Package,
  category: Tags,
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
      {/* Brand */}
      <div className="flex items-center px-6 py-5">
        <Link href="/admin" onClick={onNavigate} aria-label="CENTO Servizi home">
          <Logo className="h-11 w-auto" />
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {adminNav.map((item) => {
          const Icon = navIcons[item.icon];
          const active = isAdminNavActive(pathname, item);

          if (item.disabled) {
            return (
              <div
                key={item.href}
                aria-disabled="true"
                className="flex cursor-not-allowed items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-400"
              >
                <Icon className="size-5 shrink-0 text-slate-400" />
                {item.name}
              </div>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              aria-current={active ? "page" : undefined}
              className={cn(
                "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-slate-700 hover:bg-muted hover:text-foreground",
              )}
            >
              <Icon
                className={cn(
                  "size-5 shrink-0",
                  active ? "text-primary-foreground" : "text-slate-500 group-hover:text-primary",
                )}
              />
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* Account footer */}
      <div className="border-t p-3">
        <div className="flex items-center gap-2.5 rounded-lg p-2">
          <Avatar className="size-9">
            <AvatarFallback className="bg-primary text-xs font-semibold text-primary-foreground">
              {initialsOf(displayName)}
            </AvatarFallback>
          </Avatar>
          <span className="min-w-0 flex-1 text-left">
            <span className="block truncate text-sm font-semibold leading-tight text-foreground">
              {displayName}
            </span>
            <span className="block truncate text-xs leading-tight text-subtle">{roleLabel}</span>
          </span>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label="Account options"
                className="shrink-0 text-slate-500"
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
    </div>
  );
}
