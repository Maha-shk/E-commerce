"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { AuthShell, AuthCard } from "@/components/auth/AuthShell";
import { AuthNotice } from "@/components/auth/AuthNotice";
import { Field } from "@/components/ui/field";
import { PasswordField } from "@/components/auth/PasswordField";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { authApi } from "@/lib/api/services/auth";
import { getApiErrorMessage } from "@/lib/api/client";

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
    message: "You must accept the terms to continue",
  }),
});

type FormValues = z.infer<typeof schema>;

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, setIsPending] = useState(false);

  // Same as the login screen: the banner is derived from the URL rather than
  // read out of sessionStorage inside an effect.
  const fromCheckout = searchParams.get("redirect") === "order-confirmation";

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = async (values: FormValues) => {
    setIsPending(true);

    try {
      const result = await authApi.register(values);
      toast.success(result.message);

      /*
       * Flow state travels in the URL.
       *
       * This used to branch on sessionStorage and then push the *same* route in
       * both arms — the if and else were byte-for-byte identical apart from two
       * sessionStorage writes that the OTP screen then had to read back. The
       * pending order id stays in sessionStorage (it doesn't belong in a URL);
       * everything else is a query param.
       */
      const params = new URLSearchParams({ email: values.email });
      if (fromCheckout) params.set("redirect", "order-confirmation");

      router.push(`/verify-otp?${params.toString()}`);
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    } finally {
      setIsPending(false);
    }
  };

  const loginHref = fromCheckout ? "/login?redirect=order-confirmation" : "/login";

  return (
    <AuthShell>
      <AuthCard>
        <h1 className="text-2xl font-semibold tracking-tight">Create your account</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Track orders, save addresses and check out faster.
        </p>

        {fromCheckout ? (
          <AuthNotice>
            Create an account to track your recent order and get delivery updates.
          </AuthNotice>
        ) : null}

        <form className="mt-6 space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
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
            placeholder="name@example.com"
            autoComplete="email"
            error={errors.email?.message}
            {...register("email")}
          />
          <PasswordField
            label="Password"
            id="password"
            placeholder="At least 8 characters"
            autoComplete="new-password"
            error={errors.password?.message}
            {...register("password")}
          />

          <div className="space-y-1.5 pt-1">
            {/*
             * `items-start` + a normal label. This was `text-[11px]` (below a
             * readable size) with `whitespace-nowrap` on a sentence long enough
             * to need two lines — so it ran straight off the side of the card
             * on a phone.
             */}
            <div className="flex items-start gap-2.5">
              <Controller
                control={control}
                name="terms"
                render={({ field }) => (
                  <Checkbox
                    id="terms"
                    className="mt-0.5"
                    checked={field.value === true}
                    aria-invalid={errors.terms ? true : undefined}
                    onCheckedChange={(checked) => field.onChange(checked === true)}
                  />
                )}
              />
              <Label htmlFor="terms" className="text-sm leading-snug font-normal text-muted-foreground">
                I accept the{" "}
                {/* Both were `href="#"` — dead links on a consent checkbox. */}
                <Link href="/terms" className="font-medium text-primary hover:underline">
                  Terms of Service
                </Link>{" "}
                and{" "}
                <Link href="/privacy" className="font-medium text-primary hover:underline">
                  Privacy Policy
                </Link>
                .
              </Label>
            </div>
            {errors.terms ? (
              <p className="text-xs font-medium text-destructive">{errors.terms.message}</p>
            ) : null}
          </div>

          <Button type="submit" size="xl" className="w-full" disabled={isPending}>
            {isPending ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
            {isPending ? "Creating account…" : "Create account"}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link href={loginHref} className="font-semibold text-primary hover:underline">
            Sign in
          </Link>
        </p>
      </AuthCard>
    </AuthShell>
  );
}

function RegisterFallback() {
  return (
    <AuthShell>
      <AuthCard className="flex justify-center py-16">
        <Loader2 className="size-6 animate-spin text-muted-foreground" aria-hidden />
      </AuthCard>
    </AuthShell>
  );
}

export default function RegisterPage() {
  // useSearchParams needs a Suspense boundary to keep the route prerenderable.
  return (
    <Suspense fallback={<RegisterFallback />}>
      <RegisterForm />
    </Suspense>
  );
}
