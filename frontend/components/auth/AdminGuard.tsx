"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useCurrentUser, useSession } from "@/lib/hooks/use-auth";

/**
 * Client-side protection for the admin console.
 *
 * Tokens live in memory/localStorage rather than cookies, so a server-side
 * `proxy` cannot see them — the gate has to run in the browser. It waits for
 * the persisted store to hydrate before deciding, otherwise every reload would
 * bounce an authenticated admin to /login.
 */
export function AdminGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, hydrated, isAuthenticated, isAdmin } = useSession();

  // Revalidates the session and repopulates `user` after a page reload.
  const { isError, isLoading } = useCurrentUser();

  useEffect(() => {
    if (!hydrated) return;

    if (!isAuthenticated || isError) {
      const next = encodeURIComponent(pathname);
      router.replace(`/login?next=${next}`);
      return;
    }

    // Authenticated, but a customer account — send them to their own portal.
    if (user && !isAdmin) {
      router.replace("/dashboard");
    }
  }, [hydrated, isAuthenticated, isError, isAdmin, user, pathname, router]);

  const checking = !hydrated || (isAuthenticated && !user && isLoading);

  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-muted-foreground">
          <Loader2 className="size-6 animate-spin" />
          <p className="text-sm">Checking your session…</p>
        </div>
      </div>
    );
  }

  // Redirecting: render nothing rather than flashing the console.
  if (!isAuthenticated || (user && !isAdmin)) return null;

  return <>{children}</>;
}
