"use client";

import { useState } from "react";
import { History } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { NativeSelect } from "@/components/ui/select-native";
import { OrderStatusBadge } from "@/components/admin/OrderBadges";
import { orderStatusLabel, type Order, type OrderStatus } from "@/lib/api/models";

type ChangeOrderStatusModalProps = {
  order: Order | null;
  onClose: () => void;
  onSave?: (updates: { status?: OrderStatus; shippingTracking?: string }) => void;
};

export function ChangeOrderStatusModal({ order, onClose, onSave }: ChangeOrderStatusModalProps) {
  return (
    <Dialog
      open={!!order}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent className="gap-0">
        {order && <ChangeOrderStatusForm key={order.id} order={order} onClose={onClose} onSave={onSave} />}
      </DialogContent>
    </Dialog>
  );
}

function ChangeOrderStatusForm({
  order,
  onClose,
  onSave,
}: {
  order: Order;
  onClose: () => void;
  onSave?: (updates: { status?: OrderStatus; shippingTracking?: string }) => void;
}) {
  const [status, setStatus] = useState<OrderStatus>(order.status);
  const [shippingTracking, setShippingTracking] = useState(order.shippingTracking || "");
  const [notify, setNotify] = useState(false);

  const statusOptions: OrderStatus[] = [
    "PENDING",
    "PROCESSING",
    "SHIPPED",
    "DELIVERED",
    "CANCELLED",
    "RETURNED",
  ];

  function handleSave() {
    const updates: { status?: OrderStatus; shippingTracking?: string } = {};

    if (status !== order.status) {
      updates.status = status;
    }
    if (shippingTracking !== order.shippingTracking) {
      updates.shippingTracking = shippingTracking || undefined;
    }

    if (Object.keys(updates).length > 0 && onSave) {
      onSave(updates);
    }
    onClose();
  }

  return (
    <div className="space-y-5">
      <DialogHeader className="text-left">
        <DialogTitle>Update Order Status</DialogTitle>
        <DialogDescription>
          Modify the current fulfillment status for Order {order.orderNumber}
        </DialogDescription>
      </DialogHeader>

      {/* Order + customer summary (read-only) */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-input bg-muted/30 p-3.5">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-foreground">{order.orderNumber}</p>
          <p className="truncate text-xs text-subtle">Customer: {order.customer?.fullName || "Unknown"}</p>
        </div>
        <div className="text-right">
          <OrderStatusBadge status={order.status} />
          <p className="mt-1 text-xs text-subtle">Current Status</p>
        </div>
      </div>

      {/* New status */}
      <div className="space-y-2">
        <label
          htmlFor="order-status"
          className="text-xs font-semibold uppercase tracking-wider text-subtle"
        >
          New Fulfillment Status
        </label>
        <NativeSelect
          id="order-status"
          className="h-11 rounded-lg bg-card"
          value={status}
          onChange={(e) => setStatus(e.target.value as OrderStatus)}
        >
          {statusOptions.map((s) => (
            <option key={s} value={s}>
              {orderStatusLabel[s]}
            </option>
          ))}
        </NativeSelect>
      </div>

      {/* Shipping tracking */}
      <div className="space-y-2">
        <label htmlFor="shipping-tracking" className="text-sm font-medium text-muted-foreground">
          Shipping Tracking Number <span className="font-normal text-subtle">(optional)</span>
        </label>
        <input
          id="shipping-tracking"
          type="text"
          className="w-full rounded-lg border border-input bg-card px-3 py-2.5 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          placeholder="Enter tracking number..."
          value={shippingTracking}
          onChange={(e) => setShippingTracking(e.target.value)}
        />
      </div>

      {/* Notify customer */}
      <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-input bg-muted/30 p-3.5">
        <Checkbox
          checked={notify}
          onCheckedChange={(checked) => setNotify(checked === true)}
          className="mt-0.5"
        />
        <span>
          <span className="block text-sm font-semibold text-foreground">Notify Customer</span>
          <span className="block text-xs leading-relaxed text-subtle">
            Send an automated email update to the customer regarding this status change.
          </span>
        </span>
      </label>

      {/* Actions */}
      <div className="flex flex-col gap-2 sm:flex-row">
        <Button type="button" size="xl" className="flex-1" onClick={handleSave}>
          Update Status
        </Button>
        <Button type="button" variant="outline" size="xl" onClick={onClose}>
          Cancel
        </Button>
      </div>

      <p className="flex items-center justify-center gap-1.5 text-center text-xs text-subtle">
        <History className="size-3.5" />
        This action will be logged in the global audit trail.
      </p>
    </div>
  );
}
