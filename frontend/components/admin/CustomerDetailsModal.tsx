"use client";

import { UserRound, MapPin, ShoppingBag, Receipt, Inbox, Ban, UserCheck } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { formatEuro } from "@/lib/admin/format";
import { userStatusLabel, orderStatusLabel, type CustomerDetail, type OrderStatus } from "@/lib/api/models";
import type { UserStatus } from "@/lib/api/types";

type BadgeVariant = "success" | "warning" | "info" | "navy" | "secondary" | "destructive";

const customerStatusVariant: Record<UserStatus, BadgeVariant> = {
  ACTIVE: "success",
  INACTIVE: "secondary",
  SUSPENDED: "destructive",
};

const orderStatusVariant: Record<OrderStatus, BadgeVariant> = {
  PENDING: "warning",
  PROCESSING: "info",
  SHIPPED: "navy",
  DELIVERED: "success",
  CANCELLED: "destructive",
  RETURNED: "warning",
};

/** Customer profile. Presentation only, apart from the suspend/reinstate action. */
export function CustomerDetailsModal({
  customer,
  onClose,
  onToggleSuspend,
}: {
  customer: CustomerDetail | null;
  onClose: () => void;
  /** Toggles the customer between suspended and active. */
  onToggleSuspend: (id: string) => void;
}) {
  return (
    <Dialog
      open={!!customer}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent className="max-w-3xl gap-0">
        {customer && (
          <CustomerDetails
            customer={customer}
            onClose={onClose}
            onToggleSuspend={onToggleSuspend}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-b py-2.5 last:border-b-0 last:pb-0">
      <p className="text-xs font-semibold uppercase tracking-wider text-subtle">{label}</p>
      <p className="mt-0.5 text-sm font-medium wrap-break-word text-foreground">{value}</p>
    </div>
  );
}

function SectionTitle({
  icon: Icon,
  children,
}: {
  icon: typeof UserRound;
  children: React.ReactNode;
}) {
  return (
    <h3 className="flex items-center gap-2 font-display text-sm font-semibold text-foreground">
      <Icon className="size-4 text-primary" />
      {children}
    </h3>
  );
}

function SummaryTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-card p-3 ring-1 ring-foreground/5">
      <p className="text-xs font-semibold uppercase tracking-wider text-subtle">{label}</p>
      <p className="mt-1 font-display text-lg font-semibold text-foreground">{value}</p>
    </div>
  );
}

function CustomerDetails({
  customer,
  onClose,
  onToggleSuspend,
}: {
  customer: CustomerDetail;
  onClose: () => void;
  onToggleSuspend: (id: string) => void;
}) {
  const isSuspended = customer.status === "SUSPENDED";

  const defaultAddress = customer.addresses.find((a) => a.isDefault);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Avatar className="size-12">
          <AvatarFallback className="bg-primary text-sm font-semibold text-primary-foreground">
            {customer.initials}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <DialogTitle className="text-xl">{customer.fullName}</DialogTitle>
            <Badge variant={customerStatusVariant[customer.status]} className="uppercase">
              <span className="size-1.5 rounded-full bg-current" />
              {userStatusLabel[customer.status]}
            </Badge>
            {!customer.emailVerified && (
              <Badge variant="warning" className="uppercase">
                Unverified
              </Badge>
            )}
          </div>
          <DialogDescription className="mt-0.5">
            Customer since {new Date(customer.createdAt).toLocaleDateString()}
          </DialogDescription>
        </div>
      </div>

      {/* Customer information + delivery address */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl bg-muted/40 p-4">
          <SectionTitle icon={UserRound}>Customer Information</SectionTitle>
          <div className="mt-2">
            <InfoRow label="Email" value={customer.email} />
            <InfoRow label="Phone" value={customer.phone || "N/A"} />
            <InfoRow label="Account status" value={userStatusLabel[customer.status]} />
            <InfoRow label="Member since" value={new Date(customer.createdAt).toLocaleDateString()} />
          </div>
        </div>

        <div className="rounded-xl bg-muted/40 p-4">
          <SectionTitle icon={MapPin}>Delivery Address</SectionTitle>
          <div className="mt-3 rounded-lg bg-card p-3 ring-1 ring-foreground/5">
            {defaultAddress ? (
              <>
                <Badge variant="secondary" className="uppercase">
                  Default shipping
                </Badge>
                <address className="mt-2 text-sm not-italic text-foreground">
                  {defaultAddress.lines.map((line, i) => (
                    <span
                      key={i}
                      className={i === 0 ? "block font-semibold" : "block text-muted-foreground"}
                    >
                      {line}
                    </span>
                  ))}
                </address>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">No default address set</p>
            )}
          </div>
        </div>
      </div>

      {/* Order summary */}
      <div className="rounded-xl bg-muted/40 p-4">
        <SectionTitle icon={Receipt}>Order Summary</SectionTitle>
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <SummaryTile label="Total orders" value={String(customer.totalOrders)} />
          <SummaryTile label="Total spent" value={formatEuro(customer.totalSpent)} />
          <SummaryTile label="Avg. order value" value={formatEuro(customer.averageOrderValue)} />
        </div>
      </div>

      {/* Recent orders */}
      <div className="rounded-xl bg-muted/40 p-4">
        <SectionTitle icon={ShoppingBag}>Recent Orders</SectionTitle>

        {customer.recentOrders.length > 0 ? (
          <div className="mt-3 overflow-x-auto">
            <table className="w-full min-w-110 text-sm">
              <thead className="border-b text-xs font-semibold uppercase tracking-wider text-subtle">
                <tr>
                  <th className="py-2 pr-2 text-left">Order ID</th>
                  <th className="px-2 py-2 text-left">Date</th>
                  <th className="px-2 py-2 text-right">Total</th>
                  <th className="py-2 pl-2 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {customer.recentOrders.map((order) => (
                  <tr key={order.id}>
                    <td className="py-2.5 pr-2 font-medium whitespace-nowrap text-foreground">
                      {order.orderNumber}
                    </td>
                    <td className="px-2 py-2.5 whitespace-nowrap text-muted-foreground">
                      {new Date(order.date).toLocaleDateString()}
                    </td>
                    <td className="px-2 py-2.5 text-right font-semibold whitespace-nowrap text-foreground">
                      {formatEuro(order.total)}
                    </td>
                    <td className="py-2.5 pl-2">
                      <div className="flex justify-end">
                        <Badge variant={orderStatusVariant[order.status]}>
                          {orderStatusLabel[order.status]}
                        </Badge>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="mt-4 flex flex-col items-center gap-2 py-6 text-center text-sm text-subtle">
            <Inbox className="size-7 text-muted-foreground" />
            This customer hasn&apos;t placed any orders yet.
          </p>
        )}
      </div>

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between">
        <Button
          type="button"
          variant={isSuspended ? "outline" : "destructive"}
          size="xl"
          onClick={() => onToggleSuspend(customer.id)}
        >
          {isSuspended ? <UserCheck /> : <Ban />}
          {isSuspended ? "Reinstate Customer" : "Suspend Customer"}
        </Button>
        <Button type="button" variant="outline" size="xl" onClick={onClose}>
          Close
        </Button>
      </div>
    </div>
  );
}
