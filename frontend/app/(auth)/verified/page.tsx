"use client";

import Link from "next/link";
import { ShieldCheck, ArrowRight, Lock, ShoppingBag } from "lucide-react";
import { AuthShell, AuthCard } from "@/components/auth/AuthShell";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useSession } from "@/lib/hooks/use-auth";

export default function VerifiedPage() {
  const { isAuthenticated } = useSession();

  // If user is not authenticated (just verified but no session), redirect to login
  if (!isAuthenticated) {
    return (
      <AuthShell showLogo={false} footer="Privacy · Support">
        <AuthCard className="text-center">
          <span className="mx-auto flex size-16 items-center justify-center rounded-full bg-success-muted text-success">
            <ShieldCheck className="size-8" />
          </span>

          <h1 className="mt-5 font-display text-2xl font-semibold text-foreground">Account verified</h1>
          <p className="mx-auto mt-1.5 max-w-sm text-sm text-muted-foreground">
            Your email has been successfully verified. Please sign in to continue.
          </p>

          <Button asChild size="xl" className="mt-6 w-full uppercase tracking-wider">
            <Link href="/login">
              Sign In
              <ArrowRight />
            </Link>
          </Button>

          <Separator className="my-6" />

          <p className="flex items-center justify-center gap-2 text-xs font-medium uppercase tracking-wider text-subtle">
            <Lock className="size-3.5" />
            Encrypted session established
          </p>
        </AuthCard>
      </AuthShell>
    );
  }

  // All users (customers only) go to account page
  return (
    <AuthShell showLogo={false} footer="Privacy · Support">
      <AuthCard className="text-center">
        <span className="mx-auto flex size-16 items-center justify-center rounded-full bg-success-muted text-success">
          <ShieldCheck className="size-8" />
        </span>

        <h1 className="mt-5 font-display text-2xl font-semibold text-foreground">Account verified</h1>
        <p className="mx-auto mt-1.5 max-w-sm text-sm text-muted-foreground">
          Your account has been successfully verified. Welcome to CENTO Servizi!
        </p>

        <Button asChild size="xl" className="mt-6 w-full uppercase tracking-wider">
          <Link href="/account">
            Go to My Account
            <ShoppingBag className="ml-2" />
          </Link>
        </Button>

        <Separator className="my-6" />

        <p className="flex items-center justify-center gap-2 text-xs font-medium uppercase tracking-wider text-subtle">
          <Lock className="size-3.5" />
          Encrypted session established
        </p>
      </AuthCard>
    </AuthShell>
  );
}
