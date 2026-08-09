"use client";

import Link from "next/link";
import { ArrowRight, ShieldCheck, ShoppingBag } from "lucide-react";
import { AuthShell, AuthCard } from "@/components/auth/AuthShell";
import { Button } from "@/components/ui/button";
import { useSession } from "@/lib/hooks/use-auth";

export default function VerifiedPage() {
  const { isAuthenticated, hydrated } = useSession();

  /*
   * One card, two destinations.
   *
   * This file previously rendered the entire card twice — an if/else whose two
   * arms differed only in one sentence and the button. It also claimed
   * "Encrypted session established" in BOTH arms, including the branch that
   * exists precisely because there is no session yet.
   *
   * `hydrated` matters: before the persisted store loads, `isAuthenticated` is
   * false, so an already-signed-in user would briefly be told to sign in.
   */
  const signedIn = hydrated && isAuthenticated;

  return (
    <AuthShell showBackToStore={false}>
      <AuthCard className="text-center">
        <span className="mx-auto flex size-16 items-center justify-center rounded-full bg-success-muted text-success">
          <ShieldCheck className="size-8" aria-hidden />
        </span>

        <h1 className="mt-5 text-2xl font-semibold tracking-tight">Account verified</h1>
        <p className="mx-auto mt-1.5 max-w-sm text-sm text-muted-foreground">
          {signedIn
            ? "Your email address is confirmed. You're all set."
            : "Your email address is confirmed. Sign in to continue."}
        </p>

        <Button asChild size="xl" className="mt-6 w-full">
          {signedIn ? (
            <Link href="/account">
              Go to my account
              <ShoppingBag className="size-4" aria-hidden />
            </Link>
          ) : (
            <Link href="/login">
              Sign in
              <ArrowRight className="size-4" aria-hidden />
            </Link>
          )}
        </Button>

        <Button asChild variant="ghost" className="mt-2 w-full">
          <Link href="/products">Continue shopping</Link>
        </Button>
      </AuthCard>
    </AuthShell>
  );
}
