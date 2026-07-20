"use client";

import { usePathname } from "next/navigation";
import { Menu, Search, Bell } from "lucide-react";
import { getPageMeta } from "@/lib/nav";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

/** Sticky header: mobile menu trigger, contextual title, search & account. */
export function Topbar({ onMenu }: { onMenu: () => void }) {
  const pathname = usePathname();
  const meta = getPageMeta(pathname);

  return (
    <header className="sticky top-0 z-30 border-b bg-background/85 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-4 sm:px-6 lg:px-8">
        <Button
          variant="outline"
          size="icon"
          onClick={onMenu}
          aria-label="Open menu"
          className="size-10 lg:hidden"
        >
          <Menu className="size-5" />
        </Button>

        <div className="hidden sm:block">
          <p className="text-xs font-semibold uppercase tracking-wider text-subtle">Customer Portal</p>
          <p className="font-display text-sm font-semibold text-foreground">{meta.title}</p>
        </div>

        <div className="ml-auto flex items-center gap-2 sm:gap-3">
          <div className="relative hidden md:block">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-subtle" />
            <Input
              type="search"
              placeholder="Search orders, products…"
              className="h-10 w-56 rounded-lg bg-card pl-9 lg:w-72"
            />
          </div>

          <Button
            variant="outline"
            size="icon"
            aria-label="Notifications"
            className="relative size-10"
          >
            <Bell className="size-5" />
            <span className="absolute right-2.5 top-2.5 size-2 rounded-full bg-green ring-2 ring-background" />
          </Button>

          <div className="flex items-center gap-2.5 rounded-lg border bg-card py-1 pl-1 pr-1 sm:pr-3">
            <Avatar className="size-8">
              <AvatarFallback className="bg-primary text-xs font-semibold text-primary-foreground">
                AM
              </AvatarFallback>
            </Avatar>
            <span className="hidden text-left sm:block">
              <span className="block text-sm font-semibold leading-tight text-foreground">
                Arthur Morgan
              </span>
              <span className="block text-xs leading-tight text-subtle">Member</span>
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
