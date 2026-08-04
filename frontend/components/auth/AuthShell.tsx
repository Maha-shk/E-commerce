import type { ReactNode } from "react";
import { Logo } from "@/components/ui/Logo";
import { cn } from "@/lib/utils";

/** Centered layout wrapper for authentication screens. */
export function AuthShell({
  showLogo = true,
  children,
  footer,
  className,
}: {
  showLogo?: boolean;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 py-10">
      <div className={cn("w-full max-w-md", className)}>
        {showLogo && (
          <div className="mb-8 flex justify-center">
            <Logo className="h-14 w-auto" />
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
