"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Loader2, ShieldCheck } from "lucide-react";
import { AuthShell, AuthCard } from "@/components/auth/AuthShell";
import { Button } from "@/components/ui/button";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { useResendOtp, useVerifyOtp } from "@/lib/hooks/use-auth";

function VerifyOtpForm() {
  const email = useSearchParams().get("email") ?? "";
  const [code, setCode] = useState("");
  const verify = useVerifyOtp();
  const resend = useResendOtp();

  const canSubmit = code.length === 6 && Boolean(email) && !verify.isPending;

  return (
    <AuthCard className="text-center">
      <span className="mx-auto flex size-16 items-center justify-center rounded-full bg-accent text-primary">
        <ShieldCheck className="size-7" />
      </span>

      <h1 className="mt-5 font-display text-xl font-semibold uppercase tracking-wide text-foreground">
        Verify account
      </h1>
      <p className="mx-auto mt-1.5 max-w-xs text-sm text-muted-foreground">
        Enter the 6-digit code sent to{" "}
        {email ? (
          <span className="font-semibold text-foreground">{email}</span>
        ) : (
          "your email"
        )}{" "}
        to secure your CENTO profile.
      </p>

      {!email ? (
        <p className="mt-4 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
          Missing email address.{" "}
          <Link href="/register" className="font-semibold underline">
            Start registration again
          </Link>
          .
        </p>
      ) : null}

      <form
        className="mt-6 space-y-6"
        onSubmit={(e) => {
          e.preventDefault();
          if (canSubmit) verify.mutate({ email, code });
        }}
      >
        <InputOTP
          maxLength={6}
          value={code}
          onChange={setCode}
          containerClassName="justify-center gap-2"
        >
          {Array.from({ length: 6 }).map((_, i) => (
            <InputOTPGroup key={i}>
              <InputOTPSlot index={i} className="size-12 rounded-lg border text-lg font-semibold" />
            </InputOTPGroup>
          ))}
        </InputOTP>

        <Button
          type="submit"
          size="xl"
          className="w-full uppercase tracking-wider"
          disabled={!canSubmit}
        >
          {verify.isPending && <Loader2 className="animate-spin" />}
          {verify.isPending ? "Verifying…" : "Verify Account"}
        </Button>
      </form>

      <p className="mt-6 text-sm text-muted-foreground">
        Didn&apos;t receive the code?{" "}
        <button
          type="button"
          onClick={() => email && resend.mutate({ email })}
          disabled={!email || resend.isPending}
          className="font-semibold text-primary hover:underline disabled:opacity-50"
        >
          {resend.isPending ? "Sending…" : "Resend Code"}
        </button>
      </p>
    </AuthCard>
  );
}

export default function VerifyOtpPage() {
  return (
    <AuthShell showLogo={false} footer="© 2024 CENTO Servizi. All rights reserved.">
      {/* useSearchParams needs a Suspense boundary to keep the route prerenderable. */}
      <Suspense
        fallback={
          <AuthCard className="flex justify-center py-16">
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
          </AuthCard>
        }
      >
        <VerifyOtpForm />
      </Suspense>
    </AuthShell>
  );
}
