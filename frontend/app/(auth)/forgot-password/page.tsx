import Link from "next/link";
import { ArrowLeft, Mail } from "lucide-react";
import { AuthShell, AuthCard } from "@/components/auth/AuthShell";
import { Field } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

export default function ForgotPasswordPage() {
  return (
    <AuthShell footer="Secure authentication portal © 2024">
      <AuthCard>
        <h1 className="font-display text-2xl font-semibold text-foreground">Forgot password</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Enter your email address and we&apos;ll send you a link to reset your password.
        </p>

        <form className="mt-6 space-y-4">
          <Field
            label="Email address"
            id="email"
            type="email"
            placeholder="e.g. julian.vane@cento.tech"
            icon={<Mail />}
          />
          <Button asChild size="xl" className="w-full uppercase tracking-wider">
            <Link href="/reset-password">Send Reset Link</Link>
          </Button>
        </form>

        <Separator className="my-6" />

        <Link
          href="/login"
          className="flex items-center justify-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Return to sign in
        </Link>
      </AuthCard>
    </AuthShell>
  );
}
