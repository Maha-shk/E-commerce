import Link from "next/link";
import { AuthShell, AuthCard } from "@/components/auth/AuthShell";
import { Field } from "@/components/ui/field";
import { PasswordField } from "@/components/auth/PasswordField";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";

export default function RegisterPage() {
  return (
    <AuthShell footer="Support · Accessibility · © 2024 CENTO Servizi">
      <AuthCard>
        <h1 className="font-display text-2xl font-semibold text-foreground">Create your account</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Join the membership to unlock your premium collection.
        </p>

        <form className="mt-6 space-y-4">
          <Field label="Full name" id="fullName" placeholder="Arthur Morgan" autoComplete="name" />
          <Field
            label="Email address"
            id="email"
            type="email"
            placeholder="name@institution.com"
            autoComplete="email"
          />
          <PasswordField label="Password" id="password" placeholder="Create a password" />

          <div className="flex items-center gap-2 pt-1">
            <Checkbox id="terms" />
            <label
              htmlFor="terms"
              className="text-[11px] font-normal whitespace-nowrap text-muted-foreground"
            >
              I acknowledge the{" "}
              <Link href="#" className="font-semibold text-primary hover:underline">
                Privacy Policy
              </Link>{" "}
              and accept the membership terms.
            </label>
          </div>

          <Button asChild size="xl" className="w-full uppercase tracking-wider">
            <Link href="/verify-otp">Create Account</Link>
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link href="/login" className="font-semibold text-primary hover:underline">
            Sign in
          </Link>
        </p>
      </AuthCard>
    </AuthShell>
  );
}
