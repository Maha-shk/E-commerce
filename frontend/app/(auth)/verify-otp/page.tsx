"use client";

import { Suspense, useState, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useRouter } from "next/navigation";
import { Loader2, ShieldCheck } from "lucide-react";
import { AuthShell, AuthCard } from "@/components/auth/AuthShell";
import { Button } from "@/components/ui/button";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { useVerifyOtp } from "@/lib/hooks/use-auth";
import { useResendOtp } from "@/lib/hooks/use-auth";
import { toast } from "sonner";

function VerifyOtpForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const email = searchParams.get("email") ?? "";
  const [code, setCode] = useState("");
  const [redirectAfterVerification, setRedirectAfterVerification] = useState<string | null>(null);

  const verifyOtp = useVerifyOtp();
  const resendOtp = useResendOtp();

  useEffect(() => {
    // Check if user was redirected from registration after checkout
    const redirectTarget = sessionStorage.getItem('redirectAfterVerification');
    if (redirectTarget === 'order-confirmation') {
      setRedirectAfterVerification(redirectTarget);
    }
  }, []);

  const canSubmit = code.length === 6 && Boolean(email) && !verifyOtp.isPending;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;

    // Handle redirect after verification
    if (redirectAfterVerification === 'order-confirmation') {
      // Clear redirect flag
      sessionStorage.removeItem('redirectAfterVerification');

      // Check if there's a pending order
      const pendingOrderId = sessionStorage.getItem('pendingOrderId');

      if (pendingOrderId) {
        // Keep the pending order data intact for the login page to use
        // Redirect to login to complete the session
        await verifyOtp.mutateAsync({ email, code });
        router.push(`/login?redirect=order-confirmation`);
      } else {
        await verifyOtp.mutateAsync({ email, code });
        router.push("/login");
      }
    } else {
      await verifyOtp.mutateAsync({ email, code });
    }
  };

  const handleResend = async () => {
    if (!email) return;
    resendOtp.mutate({ email });
  };

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

      {redirectAfterVerification === 'order-confirmation' && (
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">
            🔔 Verify your account to track your recent order.
          </p>
        </div>
      )}

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
        onSubmit={handleSubmit}
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
          {verifyOtp.isPending && <Loader2 className="animate-spin" />}
          {verifyOtp.isPending ? "Verifying…" : "Verify Account"}
        </Button>
      </form>

      <p className="mt-6 text-sm text-muted-foreground">
        Didn&apos;t receive the code?{" "}
        <button
          type="button"
          onClick={handleResend}
          disabled={!email || resendOtp.isPending}
          className="font-semibold text-primary hover:underline disabled:opacity-50"
        >
          {resendOtp.isPending ? "Sending…" : "Resend Code"}
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
