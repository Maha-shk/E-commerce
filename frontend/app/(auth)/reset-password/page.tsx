import Link from "next/link";
import { ArrowLeft, Circle } from "lucide-react";
import { AuthShell, AuthCard } from "@/components/auth/AuthShell";
import { PasswordField } from "@/components/auth/PasswordField";
import { Button } from "@/components/ui/button";

const checklist = ["Minimum 12 characters", "At least one special symbol", "Include at least one number"];

export default function ResetPasswordPage() {
  return (
    <AuthShell footer="Trouble resetting? Contact concierge">
      <AuthCard>
        <h1 className="font-display text-2xl font-semibold text-foreground">Create new password</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Set a secure password to protect your premium account access.
        </p>

        <form className="mt-6 space-y-4">
          <PasswordField label="Password" id="password" placeholder="Enter new password" />
          <PasswordField label="Confirm password" id="confirmPassword" placeholder="Re-enter new password" />

          <div className="rounded-xl bg-muted/60 p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-subtle">Security checklist</p>
            <ul className="mt-3 space-y-2.5">
              {checklist.map((rule) => (
                <li key={rule} className="flex items-center gap-2.5 text-sm text-muted-foreground">
                  <Circle className="size-4 shrink-0 text-subtle" />
                  {rule}
                </li>
              ))}
            </ul>
          </div>

          <Button asChild size="xl" className="w-full uppercase tracking-wider">
            <Link href="/login">Update Password</Link>
          </Button>
        </form>

        <Link
          href="/login"
          className="mt-6 flex items-center justify-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Return to login
        </Link>
      </AuthCard>
    </AuthShell>
  );
}
