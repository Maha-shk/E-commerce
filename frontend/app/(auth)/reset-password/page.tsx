"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, Check, Circle, Loader2 } from "lucide-react";
import { AuthShell, AuthCard } from "@/components/auth/AuthShell";
import { PasswordField } from "@/components/auth/PasswordField";
import { Button } from "@/components/ui/button";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { useResetPassword } from "@/lib/hooks/use-auth";
import { cn } from "@/lib/utils";

// Rules mirror the backend ResetPasswordDto exactly.
const schema = z
  .object({
    code: z.string().regex(/^\d{6}$/, "Enter the 6-digit code from your email"),
    newPassword: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .max(72)
      .regex(
        /(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        "Must include an uppercase letter, a lowercase letter and a number",
      ),
    confirmPassword: z.string(),
  })
  .refine((v) => v.newPassword === v.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type FormValues = z.infer<typeof schema>;

/** Live checklist reflecting the real password policy. */
const rules: { label: string; test: (v: string) => boolean }[] = [
  { label: "At least 8 characters", test: (v) => v.length >= 8 },
  { label: "One uppercase and one lowercase letter", test: (v) => /[a-z]/.test(v) && /[A-Z]/.test(v) },
  { label: "At least one number", test: (v) => /\d/.test(v) },
];

function ResetPasswordForm() {
  const email = useSearchParams().get("email") ?? "";
  const resetPassword = useResetPassword();

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { code: "", newPassword: "", confirmPassword: "" },
  });

  // `useWatch` rather than `watch()`: the latter returns a fresh function on
  // every render, so the React Compiler bails out of memoizing this whole
  // component. `useWatch` subscribes to the single field instead.
  const password = useWatch({ control, name: "newPassword" }) ?? "";

  return (
    <AuthCard>
      <h1 className="text-2xl font-semibold tracking-tight">Create a new password</h1>
      <p className="mt-1.5 text-sm text-muted-foreground">
        Enter the code sent to{" "}
        {email ? <span className="font-semibold text-foreground">{email}</span> : "your email"} and
        choose a new password.
      </p>

      {!email ? (
        <p className="mt-4 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
          Missing email address.{" "}
          <Link href="/forgot-password" className="font-semibold underline">
            Request a new code
          </Link>
          .
        </p>
      ) : null}

      <form
        className="mt-6 space-y-4"
        onSubmit={handleSubmit((values) =>
          resetPassword.mutate({
            email,
            code: values.code,
            newPassword: values.newPassword,
          }),
        )}
        noValidate
      >
        <div className="space-y-2">
          <p className="eyebrow">Verification code</p>
          <Controller
            control={control}
            name="code"
            render={({ field }) => (
              <InputOTP
                maxLength={6}
                value={field.value}
                onChange={field.onChange}
                containerClassName="gap-2"
              >
                {Array.from({ length: 6 }).map((_, i) => (
                  <InputOTPGroup key={i}>
                    <InputOTPSlot
                      index={i}
                      className="size-11 rounded-lg border text-lg font-semibold"
                    />
                  </InputOTPGroup>
                ))}
              </InputOTP>
            )}
          />
          {errors.code ? (
            <p className="text-xs font-medium text-destructive">{errors.code.message}</p>
          ) : null}
        </div>

        <PasswordField
          label="Password"
          id="newPassword"
          placeholder="Enter new password"
          autoComplete="new-password"
          error={errors.newPassword?.message}
          {...register("newPassword")}
        />
        <PasswordField
          label="Confirm password"
          id="confirmPassword"
          placeholder="Re-enter new password"
          autoComplete="new-password"
          error={errors.confirmPassword?.message}
          {...register("confirmPassword")}
        />

        <div className="rounded-xl bg-muted/60 p-4">
          <p className="text-xs font-medium text-muted-foreground">
            Your password needs
          </p>
          <ul className="mt-3 space-y-2.5">
            {rules.map((rule) => {
              const passed = rule.test(password);
              return (
                <li
                  key={rule.label}
                  className={cn(
                    "flex items-center gap-2.5 text-sm transition-colors",
                    passed ? "text-success" : "text-muted-foreground",
                  )}
                >
                  {passed ? (
                    <Check className="size-4 shrink-0" aria-hidden />
                  ) : (
                    <Circle className="size-4 shrink-0 text-border" aria-hidden />
                  )}
                  {rule.label}
                </li>
              );
            })}
          </ul>
        </div>

        <Button
          type="submit"
          size="xl"
          className="w-full"
          disabled={!email || resetPassword.isPending}
        >
          {resetPassword.isPending ? (
            <Loader2 className="size-4 animate-spin" aria-hidden />
          ) : null}
          {resetPassword.isPending ? "Updating…" : "Update password"}
        </Button>
      </form>

      <Link
        href="/login"
        className="mt-6 flex items-center justify-center gap-2 rounded-md text-sm font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
      >
        <ArrowLeft className="size-4" aria-hidden />
        Back to sign in
      </Link>
    </AuthCard>
  );
}

export default function ResetPasswordPage() {
  return (
    <AuthShell>
      <Suspense
        fallback={
          <AuthCard className="flex justify-center py-16">
            <Loader2 className="size-6 animate-spin text-muted-foreground" aria-hidden />
          </AuthCard>
        }
      >
        <ResetPasswordForm />
      </Suspense>
    </AuthShell>
  );
}
