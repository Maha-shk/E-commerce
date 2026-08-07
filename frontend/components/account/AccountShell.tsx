"use client";

import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { HomePageHeader } from "@/components/customer/HomePageHeader";
import { AccountSidebar } from "@/components/account/AccountSidebar";
import { useSession } from "@/lib/hooks/use-auth";

/**
 * The chrome every /account tab shares: site header, page container, the
 * 12-column grid and the sidebar.
 *
 * All five tabs render through this, which is what keeps the sidebar, the
 * content column and the gutters pixel-identical when switching between them —
 * previously each page re-declared the grid and they had drifted apart.
 */
export function AccountShell({
  children,
  loadingLabel = "Loading your account…",
  adminRedirect = "/admin/dashboard",
}: {
  children: ReactNode;
  /** Shown while the auth store hydrates. */
  loadingLabel?: string;
  /** Where staff get sent instead; /account/profile points at its admin twin. */
  adminRedirect?: string;
}) {
  const router = useRouter();
  const { user, isAuthenticated, isAdmin, hydrated } = useSession();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    // Auth decisions have to wait for the persisted store to hydrate,
    // otherwise a refresh bounces the user to /login for a frame.
    if (!hydrated) return;

    if (!isAuthenticated) {
      router.replace("/login");
      return;
    }
    // /account is the customer portal; staff have their own console.
    if (isAdmin) router.replace(adminRedirect);
  }, [hydrated, isAuthenticated, isAdmin, adminRedirect, router]);

  if (!hydrated || !isAuthenticated || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="size-7 animate-spin text-primary" aria-hidden />
          <p className="text-sm text-muted-foreground">{loadingLabel}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <HomePageHeader
        mobileMenuOpen={mobileMenuOpen}
        setMobileMenuOpen={setMobileMenuOpen}
        cartCount={0}
      />

      <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:py-8">
        <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
          {/*
           * `sticky` has to live on the GRID ITEM itself, not on the Card
           * inside it.
           *
           * A sticky element can only travel inside its containing block. When
           * the Card was the sticky element, its containing block was this
           * <aside>, which is only as tall as the Card — zero room to travel,
           * so it just scrolled away with the page. Moving sticky onto the
           * <aside> makes the containing block the grid *area*, which spans the
           * full height of the row (i.e. the content column), giving it the
           * whole page to stick through. `self-start` stops the item from
           * stretching, which would otherwise cancel the effect.
           *
           * `top-24` clears the 72px sticky site header with 24px to spare.
           */}
          <aside className="lg:sticky lg:top-24 lg:col-span-4 lg:self-start xl:col-span-3">
            <AccountSidebar />
          </aside>

          <div className="min-w-0 space-y-6 lg:col-span-8 xl:col-span-9">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
