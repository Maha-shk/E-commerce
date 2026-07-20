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
import { orderStatuses, type Order, type OrderStatus } from "@/lib/admin/orders";

/** UI-only fulfilment status modal. Nothing is persisted. */
export function ChangeOrderStatusModal({
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
      <DialogContent className="gap-0">
        {order && <ChangeOrderStatusForm key={order.id} order={order} onClose={onClose} />}
      </DialogContent>
    </Dialog>
  );
}

function ChangeOrderStatusForm({ order, onClose }: { order: Order; onClose: () => void }) {
  const [status, setStatus] = useState<OrderStatus>(order.status);
  const [notify, setNotify] = useState(false);
  const [notes, setNotes] = useState("");

  return (
    <div className="space-y-5">
      <DialogHeader className="text-left">
        <DialogTitle>Update Order Status</DialogTitle>
        <DialogDescription>
          Modify the current fulfillment status for Order {order.id}
        </DialogDescription>
      </DialogHeader>

      {/* Order + customer summary (read-only) */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-input bg-muted/30 p-3.5">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-foreground">{order.id}</p>
          <p className="truncate text-xs text-subtle">Customer: {order.customer.name}</p>
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
          {orderStatuses.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </NativeSelect>
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

      {/* Notes */}
      <div className="space-y-2">
        <label htmlFor="status-notes" className="text-sm font-medium text-muted-foreground">
          Notes <span className="font-normal text-subtle">(optional)</span>
        </label>
        <textarea
          id="status-notes"
          rows={3}
          className="w-full rounded-lg border border-input bg-card px-3 py-2.5 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          placeholder="Add an internal note about this status change…"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-2 sm:flex-row">
        <Button type="button" size="xl" className="flex-1" onClick={onClose}>
          Update Status
        </Button>
        <Button type="button" variant="outline" size="xl" onClick={onClose}>
          Cancel
        </Button>
      </div>

      <p className="flex items-center justify-center gap-1.5 text-center text-xs text-subtle">
        <History className="size-3.5" />
        This action will be logged in the global audit trail for Cento Servizi.
      </p>
    </div>
  );
}
