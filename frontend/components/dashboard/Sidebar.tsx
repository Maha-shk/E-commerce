"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutGrid,
  ShoppingBag,
  Heart,
  MapPin,
  User,
  LogOut,
  ShieldCheck,
  type LucideIcon,
} from "lucide-react";
import { dashboardNav, isActive, type NavIconKey } from "@/lib/nav";
import { Logo } from "@/components/ui/Logo";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const navIcons: Record<NavIconKey, LucideIcon> = {
  overview: LayoutGrid,
  orders: ShoppingBag,
  wishlist: Heart,
  address: MapPin,
  profile: User,
};

/** Persistent left navigation for the customer dashboard. */
export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <div className="flex h-full flex-col bg-sidebar">
      {/* Brand */}
      <div className="flex h-16 items-center px-6">
        <Link href="/dashboard" onClick={onNavigate} aria-label="CENTO Servizi home">
          <Logo />
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        <p className="px-3 pb-2 text-xs font-semibold uppercase tracking-wider text-subtle">Menu</p>
        {dashboardNav.map((item) => {
          const Icon = navIcons[item.icon];
          const active = isActive(pathname, item);
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
                  : "text-sidebar-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              <Icon
                className={cn(
                  "size-5 shrink-0",
                  active ? "text-primary-foreground" : "text-subtle group-hover:text-primary",
                )}
              />
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* Support card + sign out */}
      <div className="space-y-2 border-t p-3">
        <div className="rounded-xl bg-primary p-4 text-primary-foreground">
          <div className="flex items-center gap-2">
            <ShieldCheck className="size-4 text-green" />
            <p className="text-sm font-semibold">Need help?</p>
          </div>
          <p className="mt-1 text-xs leading-relaxed text-primary-foreground/70">
            Our concierge team is available 24/7 for your orders.
          </p>
          <Button
            size="sm"
            className="mt-3 w-full bg-white/10 text-primary-foreground hover:bg-white/20"
          >
            Contact Support
          </Button>
        </div>

        <Button
          variant="ghost"
          size="lg"
          onClick={onNavigate}
          className="w-full justify-start gap-3 px-3 text-sidebar-foreground hover:bg-destructive/10 hover:text-destructive"
        >
          <LogOut className="size-5" />
          Sign Out
        </Button>
      </div>
    </div>
  );
}
