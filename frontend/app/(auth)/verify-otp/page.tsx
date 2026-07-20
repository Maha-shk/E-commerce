import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import { AuthShell, AuthCard } from "@/components/auth/AuthShell";
import { Button } from "@/components/ui/button";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";

export default function VerifyOtpPage() {
  return (
    <AuthShell showLogo={false} footer="© 2024 CENTO Servizi. All rights reserved.">
      <AuthCard className="text-center">
        <span className="mx-auto flex size-16 items-center justify-center rounded-full bg-accent text-primary">
          <ShieldCheck className="size-7" />
        </span>

        <h1 className="mt-5 font-display text-xl font-semibold uppercase tracking-wide text-foreground">
          Verify account
        </h1>
        <p className="mx-auto mt-1.5 max-w-xs text-sm text-muted-foreground">
          Enter the 6-digit code sent to your email to secure your CENTO profile.
        </p>

        <form className="mt-6 space-y-6">
          <InputOTP maxLength={6} containerClassName="justify-center gap-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <InputOTPGroup key={i}>
                <InputOTPSlot index={i} className="size-12 rounded-lg border text-lg font-semibold" />
              </InputOTPGroup>
            ))}
          </InputOTP>

          <Button asChild size="xl" className="w-full uppercase tracking-wider">
            <Link href="/verified">Verify Account</Link>
          </Button>
        </form>

        <p className="mt-6 text-sm text-muted-foreground">
          Didn&apos;t receive the code?{" "}
          <button type="button" className="font-semibold text-primary hover:underline">
            Resend Code
          </button>
        </p>
      </AuthCard>
    </AuthShell>
  );
}
