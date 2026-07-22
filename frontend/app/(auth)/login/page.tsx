"use client";

import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import { AuthShell, AuthCard } from "@/components/auth/AuthShell";
import { Field } from "@/components/ui/field";
import { PasswordField } from "@/components/auth/PasswordField";
import { Button } from "@/components/ui/button";
import { useLogin } from "@/lib/hooks/use-auth";

const schema = z.object({
  email: z.string().min(1, "Email is required").email("Enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

type FormValues = z.infer<typeof schema>;

export default function LoginPage() {
  const login = useLogin();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  return (
    <AuthShell footer="Established 2024">
      <AuthCard>
        <h1 className="font-display text-2xl font-semibold text-foreground">Welcome back</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Sign in to access your bespoke hardware collection.
        </p>

        <form
          className="mt-6 space-y-4"
          onSubmit={handleSubmit((values) => login.mutate(values))}
          noValidate
        >
          <Field
            label="Email address"
            id="email"
            type="email"
            placeholder="name@domain.com"
            autoComplete="email"
            error={errors.email?.message}
            {...register("email")}
          />
          <PasswordField
            label="Password"
            id="password"
            placeholder="••••••••"
            autoComplete="current-password"
            error={errors.password?.message}
            labelAddon={
              <Link
                href="/forgot-password"
                className="text-xs font-semibold uppercase tracking-wider text-primary hover:underline"
              >
                Forgot password?
              </Link>
            }
            {...register("password")}
          />
          <Button
            type="submit"
            size="xl"
            className="w-full uppercase tracking-wider"
            disabled={login.isPending}
          >
            {login.isPending && <Loader2 className="animate-spin" />}
            {login.isPending ? "Signing in…" : "Sign In"}
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
