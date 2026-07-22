"use client";

import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, Loader2, Mail } from "lucide-react";
import { AuthShell, AuthCard } from "@/components/auth/AuthShell";
import { Field } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useForgotPassword } from "@/lib/hooks/use-auth";

const schema = z.object({
  email: z.string().min(1, "Email is required").email("Enter a valid email address"),
});

type FormValues = z.infer<typeof schema>;

export default function ForgotPasswordPage() {
  const forgotPassword = useForgotPassword();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  return (
    <AuthShell footer="Secure authentication portal © 2024">
      <AuthCard>
        <h1 className="font-display text-2xl font-semibold text-foreground">Forgot password</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Enter your email address and we&apos;ll send you a 6-digit code to reset your password.
        </p>

        <form
          className="mt-6 space-y-4"
          onSubmit={handleSubmit((values) => forgotPassword.mutate(values))}
          noValidate
        >
          <Field
            label="Email address"
            id="email"
            type="email"
            placeholder="e.g. julian.vane@cento.tech"
            autoComplete="email"
            icon={<Mail />}
            error={errors.email?.message}
            {...register("email")}
          />
          <Button
            type="submit"
            size="xl"
            className="w-full uppercase tracking-wider"
            disabled={forgotPassword.isPending}
          >
            {forgotPassword.isPending && <Loader2 className="animate-spin" />}
            {forgotPassword.isPending ? "Sending…" : "Send Reset Code"}
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
