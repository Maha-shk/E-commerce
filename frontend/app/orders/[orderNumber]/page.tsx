"use client";

import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, PackageX, ShieldAlert } from "lucide-react";
import { CustomerPageShell } from "@/components/customer/CustomerPageShell";
import { PageIntro } from "@/components/customer/PageIntro";
import { OrderDetail } from "@/components/customer/OrderDetail";
import { EmptyState, LoadingState } from "@/components/customer/StateBlock";
import { Button } from "@/components/ui/button";
import { useSession } from "@/lib/hooks/use-auth";
import { usePublicOrder } from "@/lib/hooks/use-public-order";

export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const orderNumber =
    typeof params.orderNumber === "string" ? params.orderNumber : undefined;

  const { user, isAdmin, hydrated } = useSession();
  const { data: order, isPending, isError } = usePublicOrder(orderNumber);

  /*
   * Access check, evaluated at render rather than inside an effect.
   *
   * The previous version ran this in a `useEffect` that captured
   * `isAuthenticated` from the first render — before the persisted auth store
   * had hydrated — so a signed-in customer could be told the order wasn't
   * theirs simply because the session hadn't loaded yet.
   */
  const stillHydrating = !hydrated;
  const ownerEmail = order?.customer?.email;
  const canView =
    !order ||
    stillHydrating ||
    // Guests reach an order via its (unguessable) order number.
    !user ||
    isAdmin ||
    !ownerEmail ||
    ownerEmail === user.email;

  return (
    <CustomerPageShell>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => router.back()}
        className="mb-4 -ml-2 text-muted-foreground"
      >
        <ChevronLeft className="size-4" aria-hidden />
        Back
      </Button>

      <PageIntro
        title="Order Details"
        description={
          orderNumber ? `Order ${orderNumber}` : "View and track your order."
        }
      />

      {isPending || stillHydrating ? (
        <LoadingState label="Loading order…" />
      ) : isError || !order ? (
        <EmptyState
          bordered
          icon={PackageX}
          title="Order not found"
          description="We couldn't find that order. Check the order number and try again."
          action={
            <Button asChild variant="outline">
              <Link href="/account/orders">View my orders</Link>
            </Button>
          }
        />
      ) : !canView ? (
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
      ) : (
        <OrderDetail order={order} />
      )}
    </CustomerPageShell>
  );
}
