"use client";

import Link from "next/link";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import { AuthShell, AuthCard } from "@/components/auth/AuthShell";
import { Field } from "@/components/ui/field";
import { PasswordField } from "@/components/auth/PasswordField";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useRegister } from "@/lib/hooks/use-auth";

// Mirrors the backend RegisterDto so validation fails fast, client-side.
const schema = z.object({
  fullName: z.string().min(2, "Enter your full name").max(120),
  email: z.string().min(1, "Email is required").email("Enter a valid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(72)
    .regex(
      /(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      "Must include an uppercase letter, a lowercase letter and a number",
    ),
  terms: z.literal(true, {
    message: "You must accept the membership terms",
  }),
});

type FormValues = z.infer<typeof schema>;

export default function RegisterPage() {
  const registerUser = useRegister();
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  return (
    <AuthShell footer="Support · Accessibility · © 2024 CENTO Servizi">
      <AuthCard>
        <h1 className="font-display text-2xl font-semibold text-foreground">Create your account</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Join the membership to unlock your premium collection.
        </p>

        <form
          className="mt-6 space-y-4"
          onSubmit={handleSubmit(({ fullName, email, password }) =>
            registerUser.mutate({ fullName, email, password }),
          )}
          noValidate
        >
          <Field
            label="Full name"
            id="fullName"
            placeholder="Arthur Morgan"
            autoComplete="name"
            error={errors.fullName?.message}
            {...register("fullName")}
          />
          <Field
            label="Email address"
            id="email"
            type="email"
            placeholder="name@institution.com"
            autoComplete="email"
            error={errors.email?.message}
            {...register("email")}
          />
          <PasswordField
            label="Password"
            id="password"
            placeholder="Create a password"
            autoComplete="new-password"
            error={errors.password?.message}
            {...register("password")}
          />

          <div className="space-y-1.5 pt-1">
            <div className="flex items-center gap-2">
              <Controller
                control={control}
                name="terms"
                render={({ field }) => (
                  <Checkbox
                    id="terms"
                    checked={field.value === true}
                    onCheckedChange={(checked) => field.onChange(checked === true)}
                  />
                )}
              />
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
            {errors.terms ? (
              <p className="text-xs font-medium text-destructive">{errors.terms.message}</p>
            ) : null}
          </div>

          <Button
            type="submit"
            size="xl"
            className="w-full uppercase tracking-wider"
            disabled={registerUser.isPending}
          >
            {registerUser.isPending && <Loader2 className="animate-spin" />}
            {registerUser.isPending ? "Creating account…" : "Create Account"}
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
