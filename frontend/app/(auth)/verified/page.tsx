"use client";

import Link from "next/link";
import { ShieldCheck, ArrowRight, Lock } from "lucide-react";
import { AuthShell, AuthCard } from "@/components/auth/AuthShell";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useSession } from "@/lib/hooks/use-auth";

export default function VerifiedPage() {
  const { isAdmin } = useSession();

  return (
    <AuthShell showLogo={false} footer="Privacy · Support">
      <AuthCard className="text-center">
        <span className="mx-auto flex size-16 items-center justify-center rounded-full bg-success-muted text-success">
          <ShieldCheck className="size-8" />
        </span>

        <h1 className="mt-5 font-display text-2xl font-semibold text-foreground">Account verified</h1>
        <p className="mx-auto mt-1.5 max-w-sm text-sm text-muted-foreground">
          Your identity has been successfully confirmed. Welcome to the elite tier of digital
          management.
        </p>

        <Button asChild size="xl" className="mt-6 w-full uppercase tracking-wider">
          <Link href="/dashboard">
            Enter Portal
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
