"use client";

import { useState, type ReactNode } from "react";
import { HomePageHeader } from "@/components/customer/HomePageHeader";
import { HomePageFooter } from "@/components/customer/HomePageFooter";
import { Container } from "@/components/customer/Container";
import { useCart } from "@/lib/hooks/use-cart";
import { cn } from "@/lib/utils";

/**
 * Header + page + footer for every customer-facing route.
 *
 * Each page used to wire these up itself, which is why they had drifted:
 * different container widths (`container` vs `max-w-7xl`), different vertical
 * padding (`py-8` / `py-16`), and a `cartCount` that several pages hardcoded
 * to 0 so the header badge was wrong depending on which page you were on.
 * Going through one shell keeps the navbar and footer pinned to the same
 * gutters as the content between them, on every page.
 */
export function CustomerPageShell({
  children,
  className,
  /** Opt out of the container when the page needs full-bleed sections. */
  bleed = false,
}: {
  children: ReactNode;
  className?: string;
  bleed?: boolean;
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  // Read once, here — the badge is now correct on every page by construction.
  const { totalItems } = useCart();

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <HomePageHeader
        mobileMenuOpen={mobileMenuOpen}
        setMobileMenuOpen={setMobileMenuOpen}
        cartCount={totalItems}
      />

      {bleed ? (
        <main className={cn("grow", className)}>{children}</main>
      ) : (
        <Container as="main" className={cn("grow py-8 lg:py-10", className)}>
          {children}
        </Container>
      )}

      <HomePageFooter />
    </div>
  );
}
