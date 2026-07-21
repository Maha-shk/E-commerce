"use client";

import Link from "next/link";
import { Menu, Search, Mail, Bell } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

/** Sticky header for the admin console: mobile menu trigger, global search, notifications. */
export function AdminTopbar({ onMenu }: { onMenu: () => void }) {
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

        <div className="relative w-full max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-subtle" />
          <Input
            type="search"
            placeholder="Search orders, products..."
            className="h-11 w-full rounded-full bg-card pl-9"
          />
        </div>

        <div className="ml-auto flex items-center gap-2 sm:gap-3">
          <Button
            asChild
            variant="outline"
            size="icon"
            aria-label="Messages"
            className="relative size-10"
          >
            <Link href="/admin/messages">
              <Mail className="size-5" />
              <span className="absolute right-2.5 top-2.5 size-2 rounded-full bg-destructive ring-2 ring-background" />
            </Link>
          </Button>

          <Button asChild variant="outline" size="icon" aria-label="Notifications" className="size-10">
            <Link href="/admin/notifications">
              <Bell className="size-5" />
            </Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
