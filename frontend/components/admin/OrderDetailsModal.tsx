"use client";

import { UserRound, Truck, ShoppingBasket, Receipt, Package } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { OrderStatusBadge } from "@/components/admin/OrderBadges";
import { formatEuro } from "@/lib/admin/format";
import { orderStatusLabel, type Order } from "@/lib/api/models";

/** Read-only order breakdown. Presentation only — nothing is editable. */
export function OrderDetailsModal({
  order,
  onClose,
}: {
  order: Order | null;
  onClose: () => void;
}) {
  return (
    <Dialog
      open={!!order}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent className="max-w-3xl gap-0">
        {order && <OrderDetails order={order} onClose={onClose} />}
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

function OrderDetails({ order, onClose }: { order: Order; onClose: () => void }) {
  const totals = order.totals;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <div className="flex flex-wrap items-center gap-2.5">
          <DialogTitle className="text-2xl">Order {order.orderNumber}</DialogTitle>
          <OrderStatusBadge status={order.status} />
        </div>
        <DialogDescription className="mt-1">
          Placed on {new Date(order.placedAt).toLocaleDateString()} at{" "}
          {new Date(order.placedAt).toLocaleTimeString()}
        </DialogDescription>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {/* Customer */}
        <div className="rounded-xl bg-muted/40 p-4">
          <SectionTitle icon={UserRound}>Customer Info</SectionTitle>
          <div className="mt-2 divide-y">
            <InfoRow label="Name" value={order.customer?.fullName || "Unknown"} />
            <InfoRow label="Email" value={order.customer?.email || "N/A"} />
            <InfoRow label="Phone" value={order.customer?.phone || "N/A"} />
          </div>
        </div>

        {/* Shipping */}
        <div className="rounded-xl bg-muted/40 p-4">
          <SectionTitle icon={Truck}>Shipping Info</SectionTitle>
          <div className="mt-2 divide-y">
            <InfoRow label="Method" value={order.shippingMethod || "N/A"} />
            <InfoRow label="Tracking #" value={order.shippingTracking || "Not available"} />
            <div className="py-2.5">
              <p className="text-xs font-semibold uppercase tracking-wider text-subtle">
                Shipping Address
              </p>
              <address className="mt-0.5 text-sm font-medium not-italic text-foreground">
                {order.shippingAddress.map((line, i) => (
                  <span key={i} className="block">
                    {line}
                  </span>
                ))}
              </address>
            </div>
          </div>
        </div>
      </div>

      {/* Items */}
      <div className="rounded-xl bg-muted/40 p-4">
        <SectionTitle icon={ShoppingBasket}>Order Items</SectionTitle>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-140 text-sm">
            <thead className="border-b text-xs font-semibold uppercase tracking-wider text-subtle">
              <tr>
                <th className="py-2 pr-2 text-left">Product</th>
                <th className="px-2 py-2 text-left">SKU</th>
                <th className="px-2 py-2 text-right">Unit Price</th>
                <th className="px-2 py-2 text-right">Qty</th>
                <th className="py-2 pl-2 text-right">Subtotal</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {order.items.map((item) => (
                <tr key={item.id}>
                  <td className="py-3 pr-2">
                    <div className="flex items-center gap-3">
                      <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-linear-to-br from-accent to-muted text-primary">
                        <Package className="size-4" />
                      </span>
                      <span className="font-medium text-foreground">{item.name}</span>
                    </div>
                  </td>
                  <td className="px-2 py-3 whitespace-nowrap text-muted-foreground">{item.sku}</td>
                  <td className="px-2 py-3 text-right whitespace-nowrap text-muted-foreground">
                    {formatEuro(item.unitPrice)}
                  </td>
                  <td className="px-2 py-3 text-right text-muted-foreground">{item.quantity}</td>
                  <td className="py-3 pl-2 text-right font-semibold whitespace-nowrap text-foreground">
                    {formatEuro(item.lineTotal)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Summary */}
      <div className="rounded-xl bg-muted/40 p-4">
        <SectionTitle icon={Receipt}>Order Summary</SectionTitle>
        <div className="mt-3 space-y-2 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Subtotal</span>
            <span className="font-medium text-foreground">{formatEuro(totals.subtotal)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Shipping</span>
            <span className="font-medium text-foreground">
              {totals.shipping === 0 ? "Free" : formatEuro(totals.shipping)}
            </span>
          </div>
          {totals.discount > 0 && (
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Discount</span>
              <span className="font-medium text-success">−{formatEuro(totals.discount)}</span>
            </div>
          )}
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Payment method</span>
            <span className="font-medium text-foreground">{order.paymentMethod || "N/A"}</span>
          </div>
          <div className="mt-1 flex items-center justify-between border-t pt-3">
            <span className="font-display text-base font-semibold text-foreground">Total</span>
            <span className="font-display text-lg font-semibold text-foreground">
              {formatEuro(totals.total)}
            </span>
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <Button type="button" variant="outline" size="xl" onClick={onClose}>
          Close
        </Button>
      </div>
    </div>
  );
}
