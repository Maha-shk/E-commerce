"use client";

import { useState, type ComponentType, type ReactNode } from "react";
import type { LucideProps } from "lucide-react";
import {
  Check,
  Copy,
  MapPin,
  Pencil,
  Receipt,
  ShoppingBasket,
  Truck,
  UserRound,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { OrderStatusBadge } from "@/components/admin/OrderBadges";
import { formatDateTime, formatEuro } from "@/lib/admin/format";
import type { Order } from "@/lib/api/models";
import { cn } from "@/lib/utils";

/**
 * Read-only order breakdown.
 *
 * Rewritten against the test report. The previous version stacked four
 * identical `bg-muted/40` boxes with no hierarchy, forced a horizontal scroll
 * on the items table inside the dialog (`min-w-140` in a `max-w-3xl` shell),
 * and had no height limit — a 20-line order grew taller than the viewport with
 * no way to scroll. It also dead-ended: to change anything you had to close it
 * and find the pencil in the row behind.
 */
export function OrderDetailsModal({
  order,
  onClose,
  onChangeStatus,
}: {
  order: Order | null;
  onClose: () => void;
  /** Hands off to the status modal without making the admin re-find the row. */
  onChangeStatus?: (order: Order) => void;
}) {
  return (
    <Dialog
      open={!!order}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      {/* Capped height with the body scrolling internally, so the header and
          the action bar stay put on a long order. */}
      <DialogContent className="flex max-h-[90vh] max-w-3xl flex-col gap-0 p-0 sm:p-0">
        {order ? (
          <OrderDetails order={order} onClose={onClose} onChangeStatus={onChangeStatus} />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

/** Value that can be copied to the clipboard with one click. */
function CopyValue({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard permission denied — the value is still selectable on screen.
    }
  };

  return (
    <button
      type="button"
      onClick={copy}
      title={`Copy ${label.toLowerCase()}`}
      className="group inline-flex max-w-full items-center gap-1.5 rounded-md text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
    >
      <span className="truncate">{value}</span>
      {copied ? (
        <Check className="size-3.5 shrink-0 text-success" aria-hidden />
      ) : (
        <Copy
          className="size-3.5 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100"
          aria-hidden
        />
      )}
      <span className="sr-only">{copied ? "Copied" : `Copy ${label}`}</span>
    </button>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="min-w-0">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <div className="mt-0.5 text-sm font-medium wrap-break-word text-foreground">
        {children}
      </div>
    </div>
  );
}

function Section({
  icon: Icon,
  title,
  children,
  className,
}: {
  icon: ComponentType<LucideProps>;
  title: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("rounded-xl border border-border", className)}>
      <div className="flex items-center gap-2 border-b border-border px-4 py-3">
        <Icon className="size-4 shrink-0 text-muted-foreground" aria-hidden />
        <h3 className="text-sm font-semibold tracking-tight text-foreground">{title}</h3>
      </div>
      <div className="p-4">{children}</div>
    </section>
  );
}

function OrderDetails({
  order,
  onClose,
  onChangeStatus,
}: {
  order: Order;
  onClose: () => void;
  onChangeStatus?: (order: Order) => void;
}) {
  const { totals } = order;
  const itemCount = order.items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <>
      {/* Header — sticky */}
      <div className="shrink-0 border-b border-border px-6 pt-6 pb-4">
        <div className="flex flex-wrap items-center gap-2.5">
          <DialogTitle className="text-xl tracking-tight tabular-nums">
            Order {order.orderNumber}
          </DialogTitle>
          <OrderStatusBadge status={order.status} />
        </div>
        <DialogDescription className="mt-1">
          Placed {formatDateTime(order.placedAt)} · {order.items.length}{" "}
          {order.items.length === 1 ? "line" : "lines"} · {itemCount}{" "}
          {itemCount === 1 ? "unit" : "units"}
        </DialogDescription>
      </div>

      {/* Body — the only scrolling region */}
      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-6 py-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <Section icon={UserRound} title="Customer">
            <div className="space-y-3">
              <Field label="Name">{order.customer?.fullName || "Unknown"}</Field>
              <Field label="Email">
                {order.customer?.email ? (
                  <CopyValue value={order.customer.email} label="email" />
                ) : (
                  <span className="text-muted-foreground">—</span>
                )}
              </Field>
              <Field label="Phone">
                {order.customer?.phone ? (
                  <CopyValue value={order.customer.phone} label="phone" />
                ) : (
                  <span className="text-muted-foreground">—</span>
                )}
              </Field>
            </div>
          </Section>

          <Section icon={Truck} title="Shipping">
            <div className="space-y-3">
              <Field label="Method">
                {order.shippingMethod || <span className="text-muted-foreground">—</span>}
              </Field>
              <Field label="Tracking number">
                {order.shippingTracking ? (
                  <CopyValue value={order.shippingTracking} label="tracking number" />
                ) : (
                  <span className="text-muted-foreground">Not available</span>
                )}
              </Field>
              <Field label="Address">
                {order.shippingAddress.length > 0 ? (
                  <address className="flex gap-2 not-italic">
                    <MapPin className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" aria-hidden />
                    <span>
                      {order.shippingAddress.filter(Boolean).map((line, i) => (
                        <span key={i} className="block">
                          {line}
                        </span>
                      ))}
                    </span>
                  </address>
                ) : (
                  <span className="text-muted-foreground">—</span>
                )}
              </Field>
            </div>
          </Section>
        </div>

        {/* Items — a plain list, not a min-width table that forces the dialog
            to scroll sideways. */}
        <Section icon={ShoppingBasket} title={`Items (${order.items.length})`} className="[&>div:last-child]:p-0">
          <ul className="divide-y divide-border">
            {order.items.map((item) => (
              <li key={item.id} className="flex items-start justify-between gap-4 px-4 py-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-foreground">{item.name}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {item.sku ? <span className="tabular-nums">SKU {item.sku} · </span> : null}
                    <span className="tabular-nums">
                      {item.quantity} × {formatEuro(item.unitPrice)}
                    </span>
                  </p>
                </div>
                <p className="shrink-0 text-sm font-semibold tabular-nums text-foreground">
                  {formatEuro(item.lineTotal)}
                </p>
              </li>
            ))}
          </ul>
        </Section>

        <Section icon={Receipt} title="Summary">
          <dl className="space-y-2.5 text-sm">
            <div className="flex items-center justify-between gap-4">
              <dt className="text-muted-foreground">Subtotal</dt>
              <dd className="font-medium tabular-nums">{formatEuro(totals.subtotal)}</dd>
            </div>
            <div className="flex items-center justify-between gap-4">
              <dt className="text-muted-foreground">Shipping</dt>
              <dd
                className={cn(
                  "font-medium tabular-nums",
                  totals.shipping === 0 && "text-success",
                )}
              >
                {totals.shipping === 0 ? "Free" : formatEuro(totals.shipping)}
              </dd>
            </div>
            {totals.discount > 0 ? (
              <div className="flex items-center justify-between gap-4">
                <dt className="text-muted-foreground">Discount</dt>
                <dd className="font-medium tabular-nums text-success">
                  −{formatEuro(totals.discount)}
                </dd>
              </div>
            ) : null}
            <div className="flex items-center justify-between gap-4">
              <dt className="text-muted-foreground">Payment method</dt>
              <dd className="font-medium">{order.paymentMethod || "—"}</dd>
            </div>

            <div className="mt-1 flex items-center justify-between gap-4 border-t border-border pt-3">
              <dt className="text-base font-semibold tracking-tight">Total</dt>
              <dd className="text-lg font-semibold tabular-nums">{formatEuro(totals.total)}</dd>
            </div>
          </dl>
        </Section>
      </div>

      {/* Action bar — sticky. The modal used to dead-end on a Close button. */}
      <div className="flex shrink-0 items-center justify-end gap-2 border-t border-border px-6 py-4">
        <Button type="button" variant="outline" onClick={onClose}>
          Close
        </Button>
        {onChangeStatus ? (
          <Button type="button" onClick={() => onChangeStatus(order)}>
            <Pencil className="size-4" aria-hidden />
            Change status
          </Button>
        ) : null}
      </div>
    </>
  );
}
