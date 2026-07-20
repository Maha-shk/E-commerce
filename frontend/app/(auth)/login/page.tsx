import Link from "next/link";
import { AuthShell, AuthCard } from "@/components/auth/AuthShell";
import { Field } from "@/components/ui/field";
import { Button } from "@/components/ui/button";

export default function LoginPage() {
  return (
    <AuthShell footer="Established 2024">
      <AuthCard>
        <h1 className="font-display text-2xl font-semibold text-foreground">Welcome back</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Sign in to access your bespoke hardware collection.
        </p>

        <form className="mt-6 space-y-4">
          <Field label="Email address" id="email" type="email" placeholder="name@domain.com" />
          <Field
            label="Password"
            id="password"
            type="password"
            placeholder="••••••••"
            labelAddon={
              <Link
                href="/forgot-password"
                className="text-xs font-semibold uppercase tracking-wider text-primary hover:underline"
              >
                Forgot password?
              </Link>
            }
          />
          <Button asChild size="xl" className="w-full uppercase tracking-wider">
            <Link href="/dashboard">Sign In</Link>
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          New to CENTO?{" "}
          <Link href="/register" className="font-semibold text-primary hover:underline">
            Create an account
          </Link>
        </p>
      </AuthCard>
    </AuthShell>
  );
}
