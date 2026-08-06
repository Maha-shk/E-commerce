"use client";

import Link from "next/link";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect } from "react";
import { AuthShell, AuthCard } from "@/components/auth/AuthShell";
import { Field } from "@/components/ui/field";
import { PasswordField } from "@/components/auth/PasswordField";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { authApi } from "@/lib/api/services/auth";
import { toast } from "sonner";
import { getApiErrorMessage } from "@/lib/api/client";
import { useState } from "react";

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

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect');
  const [isPending, setIsPending] = useState(false);
  const [showOrderTrackingInfo, setShowOrderTrackingInfo] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  useEffect(() => {
    // Check if user was redirected from checkout after placing an order
    const pendingOrderId = sessionStorage.getItem('pendingOrderId');
    if (pendingOrderId) {
      setShowOrderTrackingInfo(true);
    }
  }, []);

  const onSubmit = async (values: FormValues) => {
    setIsPending(true);

    try {
      const result = await authApi.register(values);
      toast.success(result.message);

      // Check if there's a pending order from guest checkout
      const pendingOrderId = sessionStorage.getItem('pendingOrderId');

      if (pendingOrderId && redirect === 'order-confirmation') {
        // Store email for verification redirect
        sessionStorage.setItem('registerEmail', values.email);
        sessionStorage.setItem('redirectAfterVerification', 'order-confirmation');

        // Keep the pending order data intact - don't clear it!
        // It will be used after login to redirect to order confirmation

        router.push(`/verify-otp?email=${encodeURIComponent(values.email)}`);
      } else {
        router.push(`/verify-otp?email=${encodeURIComponent(values.email)}`);
      }
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    } finally {
      setIsPending(false);
    }
  };

  return (
    <AuthShell footer="Support · Accessibility · © 2024 CENTO Servizi">
      <AuthCard>
        <h1 className="font-display text-2xl font-semibold text-foreground">Create your account</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Join the membership to unlock your premium collection.
        </p>

        {showOrderTrackingInfo && (
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              🔔 Create an account to track your recent order and get delivery updates.
            </p>
          </div>
        )}

        <form
          className="mt-6 space-y-4"
          onSubmit={handleSubmit(onSubmit)}
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
            disabled={isPending}
          >
            {isPending && <Loader2 className="animate-spin" />}
            {isPending ? "Creating account…" : "Create Account"}
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

// Wrap with Suspense boundary to handle useSearchParams
export default function RegisterPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#FBF9F8] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    }>
      <RegisterForm />
    </Suspense>
  );
}
