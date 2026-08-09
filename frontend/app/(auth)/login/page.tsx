"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { AuthShell, AuthCard } from "@/components/auth/AuthShell";
import { AuthNotice } from "@/components/auth/AuthNotice";
import { Field } from "@/components/ui/field";
import { PasswordField } from "@/components/auth/PasswordField";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/lib/stores/auth-store";
import { authApi } from "@/lib/api/services/auth";
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
  const setSession = useAuthStore((s) => s.setSession);
  const [isPending, setIsPending] = useState(false);

  const redirect = searchParams.get("redirect");
  const next = searchParams.get("next");

  /*
   * Derived from the URL, not read out of sessionStorage in an effect.
   *
   * The banner used to be driven by a `useEffect` that read
   * `sessionStorage.pendingOrderId` and called `setState` — an extra render on
   * every visit, and a lint error. Checkout already routes guests here as
   * `/login?redirect=order-confirmation`, so the URL says everything the
   * banner needs. sessionStorage is still read at submit time, where the
   * actual order id lives.
   */
  const fromCheckout = redirect === "order-confirmation";

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = async (values: FormValues) => {
    setIsPending(true);

    try {
      const data = await authApi.login(values);
      setSession(data);

      const firstName = data.user.fullName.split(" ")[0];
      const pendingOrderId = sessionStorage.getItem("pendingOrderId");

      if (fromCheckout && pendingOrderId) {
        sessionStorage.removeItem("pendingOrderId");
        sessionStorage.removeItem("pendingOrderEmail");

        toast.success(`Welcome back, ${firstName}! Your order is ready to track.`);
        router.push(`/order-confirmation/${pendingOrderId}`);
        return;
      }

      toast.success(`Welcome back, ${firstName}!`);

      // `next` is set by AdminGuard when it bounces an unauthenticated admin.
      // Role-based routing is deliberately centralised here.
      if (next?.startsWith("/")) {
        router.push(next);
        return;
      }
      router.push(isAdminRole(data.user.role) ? "/admin/dashboard" : "/account");
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    } finally {
      setIsPending(false);
    }
  };

  // Carry the checkout context across to registration, so a guest who clicks
  // "Create an account" doesn't lose the thread of what they were doing.
  const registerHref = fromCheckout
    ? "/register?redirect=order-confirmation"
    : "/register";

  return (
    <AuthShell>
      <AuthCard>
        <h1 className="text-2xl font-semibold tracking-tight">Welcome back</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Sign in to your account to continue.
        </p>

        {fromCheckout ? (
          <AuthNotice>
            Sign in to track your recent order and get delivery updates.
          </AuthNotice>
        ) : null}

        <form className="mt-6 space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
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
            placeholder="Enter your password"
            autoComplete="current-password"
            error={errors.password?.message}
            labelAddon={
              <Link
                href="/forgot-password"
                className="rounded-md text-xs font-medium text-primary hover:underline"
              >
                Forgot password?
              </Link>
            }
            {...register("password")}
          />
          {/* Was `uppercase tracking-wider` — SHOUTING, the same issue flagged
              on the admin dropdowns. */}
          <Button type="submit" size="xl" className="w-full" disabled={isPending}>
            {isPending ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
            {isPending ? "Signing in…" : "Sign in"}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          New to {"CENTO"}?{" "}
          <Link href={registerHref} className="font-semibold text-primary hover:underline">
            Create an account
          </Link>
        </p>
      </AuthCard>
    </AuthShell>
  );
}

function LoginFallback() {
  return (
    <AuthShell>
      <AuthCard className="flex justify-center py-16">
        <Loader2 className="size-6 animate-spin text-muted-foreground" aria-hidden />
      </AuthCard>
    </AuthShell>
  );
}

export default function LoginPage() {
  // useSearchParams needs a Suspense boundary to keep the route prerenderable.
  return (
    <Suspense fallback={<LoginFallback />}>
      <LoginForm />
    </Suspense>
  );
}
