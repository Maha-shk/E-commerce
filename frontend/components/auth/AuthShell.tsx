import type { ReactNode } from "react";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { Logo } from "@/components/ui/Logo";
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
  footer?: ReactNode;
  className?: string;
  showBackToStore?: boolean;
}) {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center px-4 py-10">
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
        {showLogo && (
          <div className="mb-8 flex justify-center">
            {/* Logo doubles as a home link, the convention shoppers expect. */}
            <Link
              href="/"
              aria-label="Back to store"
              className="rounded-md focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
            >
              <Logo className="h-14 w-auto" />
            </Link>
          </div>
        )}
        {children}
        {footer && (
          <p className="mt-8 text-center text-[0.7rem] font-medium uppercase tracking-[0.14em] text-subtle">
            {footer}
          </p>
        )}
      </div>
    </div>
  );
}

/** The soft card surface used on every auth screen. */
export function AuthCard({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn("rounded-2xl border bg-card p-6 sm:p-8", className)}>{children}</div>
  );
}
