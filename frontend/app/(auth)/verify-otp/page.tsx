"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, MailCheck } from "lucide-react";
import { AuthShell, AuthCard } from "@/components/auth/AuthShell";
import { AuthNotice } from "@/components/auth/AuthNotice";
import { Button } from "@/components/ui/button";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { useVerifyOtp, useResendOtp } from "@/lib/hooks/use-auth";

function VerifyOtpForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const email = searchParams.get("email") ?? "";
  /*
   * Read from the URL, which the registration step now sets.
   *
   * This was a `useEffect` reading `sessionStorage.redirectAfterVerification`
   * into state — an extra render and a lint error, for a value that is pure
   * navigation context and belongs in the URL.
   */
  const fromCheckout = searchParams.get("redirect") === "order-confirmation";

  const [code, setCode] = useState("");

  const verifyOtp = useVerifyOtp();
  const resendOtp = useResendOtp();

  const canSubmit = code.length === 6 && Boolean(email) && !verifyOtp.isPending;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;

    await verifyOtp.mutateAsync({ email, code });

    // The pending order id stays in sessionStorage for the login step to pick
    // up; only the routing decision is made here.
    if (fromCheckout) {
      router.push("/login?redirect=order-confirmation");
    }
    // Otherwise `useVerifyOtp` handles the redirect to /verified itself.
  };

  return (
    <AuthCard className="text-center">
      <span className="mx-auto flex size-16 items-center justify-center rounded-full bg-accent text-primary">
        <MailCheck className="size-7" aria-hidden />
      </span>

      {/* Was `uppercase tracking-wide` — the only shouting heading in the app. */}
      <h1 className="mt-5 text-xl font-semibold tracking-tight">Check your email</h1>
      <p className="mx-auto mt-1.5 max-w-xs text-sm text-muted-foreground">
        Enter the 6-digit code we sent to{" "}
        {email ? (
          <span className="font-medium text-foreground">{email}</span>
        ) : (
          "your email address"
        )}
        .
      </p>

      {fromCheckout ? (
        <AuthNotice>Verify your account to track your recent order.</AuthNotice>
      ) : null}

      {!email ? (
        <p className="mt-4 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
          Missing email address.{" "}
          <Link href="/register" className="font-semibold underline">
            Start registration again
          </Link>
          .
        </p>
      ) : null}

      <form className="mt-6 space-y-6" onSubmit={handleSubmit}>
        <InputOTP
          maxLength={6}
          value={code}
          onChange={setCode}
          containerClassName="justify-center gap-2"
        >
          {Array.from({ length: 6 }).map((_, i) => (
            <InputOTPGroup key={i}>
              <InputOTPSlot
                index={i}
                className="size-12 rounded-lg border text-lg font-semibold"
              />
            </InputOTPGroup>
          ))}
        </InputOTP>

        <Button type="submit" size="xl" className="w-full" disabled={!canSubmit}>
          {verifyOtp.isPending ? (
            <Loader2 className="size-4 animate-spin" aria-hidden />
          ) : null}
          {verifyOtp.isPending ? "Verifying…" : "Verify account"}
        </Button>
      </form>

      <p className="mt-6 text-sm text-muted-foreground">
        Didn&apos;t receive the code?{" "}
        <button
          type="button"
          onClick={() => email && resendOtp.mutate({ email })}
          disabled={!email || resendOtp.isPending}
          className="rounded-md font-semibold text-primary hover:underline disabled:opacity-50"
        >
          {resendOtp.isPending ? "Sending…" : "Resend code"}
        </button>
      </p>
    </AuthCard>
  );
}

export default function VerifyOtpPage() {
  return (
    // Mid-flow: no "back to store" escape hatch, but the logo still links home.
    <AuthShell showBackToStore={false}>
      {/* useSearchParams needs a Suspense boundary to keep the route prerenderable. */}
      <Suspense
        fallback={
          <AuthCard className="flex justify-center py-16">
            <Loader2 className="size-6 animate-spin text-muted-foreground" aria-hidden />
          </AuthCard>
        }
      >
        <VerifyOtpForm />
      </Suspense>
    </AuthShell>
  );
}
