"use client";

import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect } from "react";
import { AuthShell, AuthCard } from "@/components/auth/AuthShell";
import { Field } from "@/components/ui/field";
import { PasswordField } from "@/components/auth/PasswordField";
import { Button } from "@/components/ui/button";
import { useLogin } from "@/lib/hooks/use-auth";
import { useState } from "react";
import { useAuthStore } from "@/lib/stores/auth-store";
import { authApi } from "@/lib/api/services/auth";
import { toast } from "sonner";
import { getApiErrorMessage } from "@/lib/api/client";
import { isAdminRole } from "@/lib/api/types";

const schema = z.object({
  email: z.string().min(1, "Email is required").email("Enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

type FormValues = z.infer<typeof schema>;

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect');
  const setSession = useAuthStore((s) => s.setSession);
  const [isPending, setIsPending] = useState(false);
  const [showOrderTrackingInfo, setShowOrderTrackingInfo] = useState(false);

  const {
    register,
    handleSubmit,
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
      const data = await authApi.login(values);
      setSession(data);

      // Check if there's a pending order from guest checkout
      const pendingOrderId = sessionStorage.getItem('pendingOrderId');

      if (pendingOrderId && redirect === 'order-confirmation') {
        // Clear the pending order data
        sessionStorage.removeItem('pendingOrderId');
        sessionStorage.removeItem('pendingOrderEmail');

        toast.success(`Welcome back, ${data.user.fullName.split(' ')[0]}! Your order is ready for tracking.`);

        // Redirect to order confirmation
        router.push(`/order-confirmation/${pendingOrderId}`);
      } else {
        // Default behavior: redirect based on role
        // NOTE: This is the ONLY place for role-based redirects
        // Registration creates customers only, admins created separately
        toast.success(`Welcome back, ${data.user.fullName.split(' ')[0]}!`);
        router.push(isAdminRole(data.user.role) ? "/admin/dashboard" : "/account");
      }
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    } finally {
      setIsPending(false);
    }
  };

  return (
    <AuthShell footer="Established 2024">
      <AuthCard>
        <h1 className="font-display text-2xl font-semibold text-foreground">Welcome back</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Sign in to access your bespoke hardware collection.
        </p>

        {showOrderTrackingInfo && (
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              🔔 Sign in to track your recent order and get updates on delivery status.
            </p>
          </div>
        )}

        <form
          className="mt-6 space-y-4"
          onSubmit={handleSubmit(onSubmit)}
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
            disabled={isPending}
          >
            {isPending && <Loader2 className="animate-spin" />}
            {isPending ? "Signing in…" : "Sign In"}
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

// Wrap with Suspense boundary to handle useSearchParams
export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#FBF9F8] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
