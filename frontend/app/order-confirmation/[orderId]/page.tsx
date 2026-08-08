"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, Mail, PackageX, ShieldAlert, UserPlus } from "lucide-react";
import { CustomerPageShell } from "@/components/customer/CustomerPageShell";
import { OrderDetail } from "@/components/customer/OrderDetail";
import { EmptyState, LoadingState } from "@/components/customer/StateBlock";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useSession } from "@/lib/hooks/use-auth";
import { usePublicOrder } from "@/lib/hooks/use-public-order";

/**
 * Reads the one-shot checkout token exactly once per mount.
 *
 * This is the fix for the "Something went wrong" error. The old page read
 * `sessionStorage` inside an effect and *deleted* the flags on a successful
 * check. React StrictMode double-invokes effects in development, so the first
 * pass consumed the token and the second pass — finding nothing — fell through
 * to "Invalid access - Please complete checkout first".
 *
 * A lazy `useState` initialiser runs once per component instance, so the value
 * survives the second invocation.
 */
function useCheckoutToken(orderId: string | undefined) {
  const [token] = useState(() => {
    if (typeof window === "undefined") return null;

    const justCompleted = sessionStorage.getItem("justCompletedCheckout");
    const recentOrderId = sessionStorage.getItem("recentOrderId");

    // Clear immediately: the token is single-use, and we've captured it.
    sessionStorage.removeItem("justCompletedCheckout");
    sessionStorage.removeItem("recentOrderId");

    return justCompleted === "true" && recentOrderId === orderId ? recentOrderId : null;
  });

  return token;
}

export default function OrderConfirmationPage() {
  const params = useParams();
  const orderId = typeof params.orderId === "string" ? params.orderId : undefined;

  const { user, isAuthenticated, hydrated } = useSession();
  const justCheckedOut = useCheckoutToken(orderId);
  const { data: order, isPending, isError } = usePublicOrder(orderId);

  // Keep the celebratory framing for the whole visit, not just until the
  // first re-render. (State, not a ref: this drives what gets rendered.)
  const [arrivedFromCheckout] = useState(() => Boolean(justCheckedOut));

  const ownerEmail = order?.customer?.email;
  const canView =
    !order ||
    !hydrated ||
    arrivedFromCheckout ||
    !user ||
    !ownerEmail ||
    ownerEmail === user.email;

  if (isPending || !hydrated) {
    return (
      <CustomerPageShell>
        <LoadingState label="Loading your order…" />
      </CustomerPageShell>
    );
  }

  if (isError || !order) {
    return (
      <CustomerPageShell>
        <EmptyState
          bordered
          icon={PackageX}
          title="Order not found"
          description="We couldn't find that order. If you've just checked out, check your email for the confirmation."
          action={
            <Button asChild variant="outline">
              <Link href="/products">Continue shopping</Link>
            </Button>
          }
        />
      </CustomerPageShell>
    );
  }

  if (!canView) {
    return (
      <CustomerPageShell>
        <EmptyState
          bordered
          icon={ShieldAlert}
          title="You can't view this order"
          description="This order belongs to a different account."
          action={
            <Button asChild variant="outline">
              <Link href="/account/orders">View my orders</Link>
            </Button>
          }
        />
      </CustomerPageShell>
    );
  }

  return (
    <CustomerPageShell>
      {/* Success banner */}
      <Card className="mb-6 gap-0 py-0">
        <div className="flex flex-col items-center gap-4 px-6 py-10 text-center">
          <span className="flex size-14 items-center justify-center rounded-full bg-success-muted text-success">
            <CheckCircle2 className="size-7" aria-hidden />
          </span>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              {arrivedFromCheckout ? "Thank you for your order!" : "Order confirmed"}
            </h1>
            <p className="mt-2 max-w-md text-sm text-muted-foreground text-pretty">
              Your order{" "}
              <span className="font-medium text-foreground tabular-nums">
                {order.orderNumber}
              </span>{" "}
              is confirmed. We&apos;ve sent a confirmation to{" "}
              <span className="font-medium text-foreground">
                {order.customer?.email ?? "your email address"}
              </span>
              .
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-3">
            <Button asChild>
              <Link href="/products">Continue Shopping</Link>
            </Button>
            {isAuthenticated ? (
              <Button asChild variant="outline">
                <Link href="/account/orders">Track Order</Link>
              </Button>
            ) : null}
          </div>
        </div>
      </Card>

      {/* Guests get the sign-up nudge *here*, instead of being bounced to
          /login before ever seeing their confirmation. */}
      {!isAuthenticated ? (
        <Card className="mb-6 gap-0 py-0">
          <div className="flex flex-col items-start gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
                <UserPlus className="size-5" aria-hidden />
              </span>
              <div>
                <h2 className="text-base font-semibold tracking-tight">
                  Create an account to track this order
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Sign up with{" "}
                  <span className="font-medium text-foreground">
                    {order.customer?.email ?? "your email"}
                  </span>{" "}
                  to follow its progress and reorder in one click.
                </p>
              </div>
            </div>

            <div className="flex shrink-0 flex-wrap gap-2">
              <Button asChild>
                <Link href="/register">Create Account</Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/login">Sign In</Link>
              </Button>
            </div>
          </div>
        </Card>
      ) : null}

      <OrderDetail order={order} />

      <Card className="mt-6 gap-0 py-0">
        <div className="flex items-center gap-3 p-5 text-sm text-muted-foreground">
          <Mail className="size-4 shrink-0" aria-hidden />
          <p>
            A confirmation email is on its way. Questions about this order?{" "}
            <Link
              href="/contact"
              className="font-medium text-foreground underline underline-offset-4"
            >
              Contact us
            </Link>
            .
          </p>
        </div>
      </Card>
    </CustomerPageShell>
  );
}
