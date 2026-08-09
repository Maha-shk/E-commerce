import type { ReactNode } from "react";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { site } from "@/lib/site";
import { cn } from "@/lib/utils";

/** Centered layout wrapper for authentication screens. */
export function AuthShell({
  showLogo = true,
  children,
  footer,
  className,
  /** Hide the escape hatch on screens that are mid-flow (e.g. OTP entry). */
  showBackToStore = true,
}: {
  showLogo?: boolean;
  children: ReactNode;
  /** Extra line above the standard copyright. */
  footer?: ReactNode;
  className?: string;
  showBackToStore?: boolean;
}) {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-background px-4 py-10">
      {/* The auth screens were a dead end — no logo link, no nav, no way back
          to the storefront short of editing the URL. */}
      {showBackToStore ? (
        <Link
          href="/"
          className="absolute top-6 left-4 inline-flex items-center gap-1 rounded-md text-sm font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring sm:left-6"
        >
          <ChevronLeft className="size-4" aria-hidden />
          Back to store
        </Link>
      ) : null}

      <div className={cn("w-full max-w-md", className)}>
        {showLogo ? (
          <div className="mb-8 flex justify-center">
            {/* Logo doubles as a home link, the convention shoppers expect. */}
            <Link
              href="/"
              aria-label={`${site.shortName} — home`}
              className="rounded-md focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
            >
              <Logo className="h-14 w-auto" />
            </Link>
          </div>
        ) : null}

        {children}

        {/*
         * One footer for every auth screen.
         *
         * The six pages carried five different hardcoded strings — "Established
         * 2024", "Secure authentication portal © 2024", "Privacy · Support",
         * "Support · Accessibility · © 2024 CENTO Servizi" — all frozen at 2024
         * and none of them saying anything useful. This is the real company
         * name, the real year, and links that go somewhere.
         */}
        <div className="mt-8 space-y-2 text-center">
          {footer ? <p className="text-sm text-muted-foreground">{footer}</p> : null}

          <p className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
            <Link href="/privacy" className="rounded-md hover:text-foreground hover:underline">
              Privacy
            </Link>
            <span aria-hidden className="text-border">
              ·
            </span>
            <Link href="/terms" className="rounded-md hover:text-foreground hover:underline">
              Terms
            </Link>
            <span aria-hidden className="text-border">
              ·
            </span>
            <Link href="/contact" className="rounded-md hover:text-foreground hover:underline">
              Support
            </Link>
          </p>

          <p className="text-xs text-muted-foreground/70">
            &copy; {new Date().getFullYear()} {site.name}
          </p>
        </div>
      </div>
    </div>
  );
}

/** The soft card surface used on every auth screen. */
export function AuthCard({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn("rounded-2xl border border-border bg-card p-6 sm:p-8", className)}>
      {children}
    </div>
  );
}
