"use client";

import Link from "next/link";
import {
  CheckCircle2,
  CircleDot,
  CreditCard,
  MapPin,
  Package,
  Truck,
  XCircle,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { OrderStatusBadge } from "@/components/account/OrderStatusBadge";
import { ProductImage } from "@/components/customer/ProductImage";
import { formatLongDate, formatMoney } from "@/lib/format";
import {
  ORDER_STAGES,
  isTerminalStatus,
  stageIndex,
  type PublicOrder,
} from "@/lib/api/order-types";
import { cn } from "@/lib/utils";

const STAGE_LABELS: Record<string, { title: string; detail: string }> = {
  PENDING: { title: "Order placed", detail: "We've received your order" },
  PROCESSING: { title: "Processing", detail: "Being picked and packed" },
  SHIPPED: { title: "Shipped", detail: "On its way to you" },
  DELIVERED: { title: "Delivered", detail: "Arrived at its destination" },
};

/** Vertical progress rail. Replaces a version that had no terminal-state handling. */
function OrderTimeline({ status, placedAt }: { status: string; placedAt: string }) {
  const terminal = isTerminalStatus(status);
  const current = stageIndex(status);

  if (terminal) {
    return (
      <div className="flex items-start gap-3">
        <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-destructive/10 text-destructive">
          <XCircle className="size-4" aria-hidden />
        </span>
        <div>
          <p className="text-sm font-medium">Order {status.toLowerCase()}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Placed {formatLongDate(placedAt)}
          </p>
        </div>
      </div>
    );
  }

  return (
    <ol className="relative">
      {ORDER_STAGES.map((stage, i) => {
        const done = current >= 0 && i <= current;
        const isCurrent = i === current;
        const label = STAGE_LABELS[stage];
        const isLast = i === ORDER_STAGES.length - 1;

        return (
          <li key={stage} className="relative flex gap-3 pb-6 last:pb-0">
            {/* Connector */}
            {!isLast ? (
              <span
                aria-hidden
                className={cn(
                  "absolute top-8 left-4 h-full w-px -translate-x-1/2",
                  done && !isCurrent ? "bg-primary" : "bg-border",
                )}
              />
            ) : null}

            <span
              className={cn(
                "relative z-10 flex size-8 shrink-0 items-center justify-center rounded-full ring-4 ring-card",
                done ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground",
              )}
            >
              {isCurrent ? (
                <CircleDot className="size-4" aria-hidden />
              ) : done ? (
                <CheckCircle2 className="size-4" aria-hidden />
              ) : (
                <span className="size-2 rounded-full bg-current" />
              )}
            </span>

            <div className="pt-1">
              <p
                className={cn(
                  "text-sm font-medium",
                  done ? "text-foreground" : "text-muted-foreground",
                )}
              >
                {label.title}
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {i === 0 ? formatLongDate(placedAt) : label.detail}
              </p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}

/** Reusable titled panel, matching the account pages. */
function Panel({
  title,
  icon: Icon,
  children,
  className,
  bodyClassName,
}: {
  title: string;
  icon?: typeof Package;
  children: React.ReactNode;
  className?: string;
  bodyClassName?: string;
}) {
  return (
    <Card className={cn("gap-0 py-0", className)}>
      <div className="flex items-center gap-2 border-b border-border px-5 pt-5 pb-4">
        {Icon ? (
          <Icon className="size-4 shrink-0 text-muted-foreground" aria-hidden />
        ) : null}
        <h2 className="text-base font-semibold tracking-tight">{title}</h2>
      </div>
      <div className={cn("px-5 py-5", bodyClassName)}>{children}</div>
    </Card>
  );
}

function SummaryRow({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "success";
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-muted-foreground">{label}</span>
      <span
        className={cn(
          "font-medium tabular-nums",
          tone === "success" && "text-success",
        )}
      >
        {value}
      </span>
    </div>
  );
}

/**
 * Full order view, shared by /orders/[orderNumber] and the order confirmation
 * page — they show the same information and had drifted into two different
 * designs, neither matching the rest of the site.
 */
export function OrderDetail({ order }: { order: PublicOrder }) {
  const { totals } = order;

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="gap-0 py-0">
        <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="field-label">Order number</p>
            <p className="mt-0.5 text-lg font-semibold tracking-tight tabular-nums">
              {order.orderNumber}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Placed {formatLongDate(order.placedAt)}
            </p>
          </div>

          <div className="flex shrink-0 items-center gap-3">
            <OrderStatusBadge status={order.status} />
            <div className="text-right">
              <p className="field-label">Total</p>
              <p className="text-lg font-semibold tabular-nums">
                {formatMoney(totals.total)}
              </p>
            </div>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {/* Items */}
          <Panel
            title={`Items (${order.items.length})`}
            icon={Package}
            bodyClassName="p-0"
          >
            <ul className="divide-y divide-border">
              {order.items.map((item) => (
                <li key={item.id} className="flex items-center gap-4 px-5 py-4">
                  <div className="relative size-16 shrink-0 overflow-hidden rounded-lg bg-muted">
                    <ProductImage src={item.image} sizes="64px" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/products/${item.productId}`}
                      className="rounded-md text-sm font-medium hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                    >
                      <span className="line-clamp-2">{item.name}</span>
                    </Link>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {item.sku ? <>SKU {item.sku} · </> : null}
                      <span className="tabular-nums">
                        {item.quantity} × {formatMoney(item.unitPrice)}
                      </span>
                    </p>
                  </div>

                  <p className="shrink-0 text-sm font-semibold tabular-nums">
                    {formatMoney(item.lineTotal)}
                  </p>
                </li>
              ))}
            </ul>
          </Panel>

          {/* Progress */}
          <Panel title="Order Progress" icon={Truck}>
            <OrderTimeline status={order.status} placedAt={order.placedAt} />

            {order.shippingTracking ? (
              <div className="mt-5 rounded-lg bg-muted px-4 py-3">
                <p className="field-label">Tracking number</p>
                <p className="mt-0.5 text-sm font-medium tabular-nums">
                  {order.shippingTracking}
                </p>
              </div>
            ) : null}
          </Panel>
        </div>

        {/* Right rail */}
        <div className="space-y-6 lg:sticky lg:top-24 lg:self-start">
          <Panel title="Summary" icon={CreditCard}>
            <div className="space-y-3 text-sm">
              <SummaryRow label="Subtotal" value={formatMoney(totals.subtotal)} />
              <SummaryRow
                label="Shipping"
                value={totals.shipping === 0 ? "Free" : formatMoney(totals.shipping)}
                tone={totals.shipping === 0 ? "success" : undefined}
              />
              {totals.discount > 0 ? (
                <SummaryRow
                  label="Discount"
                  value={`−${formatMoney(totals.discount)}`}
                  tone="success"
                />
              ) : null}

              <div className="mt-1 flex items-center justify-between gap-4 border-t border-border pt-4">
                <span className="text-base font-semibold tracking-tight">Total</span>
                <span className="text-lg font-semibold tabular-nums">
                  {formatMoney(totals.total)}
                </span>
              </div>

              {order.paymentMethod ? (
                <p className="pt-1 text-xs text-muted-foreground">
                  Paid by {order.paymentMethod}
                </p>
              ) : null}
            </div>
          </Panel>

          <Panel title="Delivery" icon={MapPin}>
            <div className="space-y-4 text-sm">
              {order.customer ? (
                <div>
                  <p className="field-label">Recipient</p>
                  <p className="mt-0.5 font-medium">{order.customer.fullName}</p>
                  <p className="text-muted-foreground">{order.customer.email}</p>
                  {order.customer.phone ? (
                    <p className="text-muted-foreground tabular-nums">
                      {order.customer.phone}
                    </p>
                  ) : null}
                </div>
              ) : null}

              {order.shippingAddress ? (
                <div>
                  <p className="field-label">Address</p>
                  <p className="mt-0.5 text-pretty text-muted-foreground">
                    {order.shippingAddress}
                  </p>
                </div>
              ) : null}

              {order.shippingMethod ? (
                <div>
                  <p className="field-label">Method</p>
                  <p className="mt-0.5 font-medium">{order.shippingMethod}</p>
                </div>
              ) : null}
            </div>
          </Panel>

          <Button asChild variant="outline" className="w-full">
            <Link href="/account/orders">View all orders</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
