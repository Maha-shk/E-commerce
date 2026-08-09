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
    <AuthShell>
      <AuthCard>
        <h1 className="text-2xl font-semibold tracking-tight">Forgot your password?</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Enter your email address and we&apos;ll send you a 6-digit code to reset it.
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
            // Was "e.g. julian.vane@cento.tech" — a fictional person at a
            // domain the store doesn't own.
            placeholder="name@example.com"
            autoComplete="email"
            icon={<Mail />}
            error={errors.email?.message}
            {...register("email")}
          />
          <Button
            type="submit"
            size="xl"
            className="w-full"
            disabled={forgotPassword.isPending}
          >
            {forgotPassword.isPending ? (
              <Loader2 className="size-4 animate-spin" aria-hidden />
            ) : null}
            {forgotPassword.isPending ? "Sending…" : "Send reset code"}
          </Button>
        </form>

        <Separator className="my-6" />

        <Link
          href="/login"
          className="flex items-center justify-center gap-2 rounded-md text-sm font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        >
          <ArrowLeft className="size-4" aria-hidden />
          Back to sign in
        </Link>
      </AuthCard>
    </AuthShell>
  );
}
