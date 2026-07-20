"use client";

import { useMemo, useState } from "react";
import { Search, Download, Eye, ChevronLeft, ChevronRight, Inbox } from "lucide-react";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { NativeSelect } from "@/components/ui/select-native";
import { OrderStatusBadge, PaymentStatusBadge } from "@/components/admin/OrderBadges";
import { ChangeOrderStatusModal } from "@/components/admin/ChangeOrderStatusModal";
import { OrderDetailsModal } from "@/components/admin/OrderDetailsModal";
import {
  orders,
  orderStatuses,
  paymentStatuses,
  orderTotals,
  formatEuro,
  type Order,
  type OrderStatus,
  type PaymentStatus,
} from "@/lib/admin/orders";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 5;

const statusTabs: ("All" | OrderStatus)[] = ["All", ...orderStatuses];

export default function OrdersPage() {
  const [search, setSearch] = useState("");
  const [statusTab, setStatusTab] = useState<"All" | OrderStatus>("All");
  const [payment, setPayment] = useState<"All" | PaymentStatus>("All");
  const [page, setPage] = useState(1);

  const [statusTarget, setStatusTarget] = useState<Order | null>(null);
  const [detailsTarget, setDetailsTarget] = useState<Order | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return orders.filter((o) => {
      const matchesSearch =
        !q ||
        o.id.toLowerCase().includes(q) ||
        o.customer.name.toLowerCase().includes(q) ||
        o.customer.email.toLowerCase().includes(q);
      const matchesStatus = statusTab === "All" || o.status === statusTab;
      const matchesPayment = payment === "All" || o.paymentStatus === payment;
      return matchesSearch && matchesStatus && matchesPayment;
    });
  }, [search, statusTab, payment]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const start = (currentPage - 1) * PAGE_SIZE;
  const paged = filtered.slice(start, start + PAGE_SIZE);

  function handleExport() {
    const header = ["Order ID", "Date", "Customer", "Total", "Payment Status", "Order Status"];
    const rows = filtered.map((o) => [
      o.id,
      o.date,
      o.customer.name,
      orderTotals(o).total.toFixed(2),
      o.paymentStatus,
      o.status,
    ]);
    const csv = [header, ...rows]
      .map((row) => row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "orders.csv";
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Order Management"
        subtitle="Track fulfilment and payment activity across all customer orders."
        action={
          <Button variant="outline" size="xl" onClick={handleExport}>
            <Download />
            Export Data
          </Button>
        }
      />

      {/* Filters */}
      <Card>
        <CardContent className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex flex-wrap items-center gap-1">
            {statusTabs.map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => {
                  setStatusTab(tab);
                  setPage(1);
                }}
                className={cn(
                  "rounded-lg px-4 py-2 text-sm font-medium transition-colors",
                  statusTab === tab
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="relative sm:w-60">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-subtle" />
              <Input
                type="search"
                placeholder="Search by order ID or customer…"
                className="h-10 rounded-lg bg-card pl-9"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
              />
            </div>
            <NativeSelect
              aria-label="Filter by payment status"
              className="h-10 sm:w-44"
              value={payment}
              onChange={(e) => {
                setPayment(e.target.value as "All" | PaymentStatus);
                setPage(1);
              }}
            >
              <option value="All">All payments</option>
              {paymentStatuses.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </NativeSelect>
          </div>
        </CardContent>
      </Card>

      {/* Orders table */}
      <Card className="gap-0 overflow-hidden py-0">
        <div className="overflow-x-auto">
          <table className="w-full min-w-230 text-sm">
            <thead className="border-b bg-muted/50 text-xs font-semibold uppercase tracking-wider text-subtle">
              <tr>
                <th className="px-5 py-3 text-left">Order ID</th>
                <th className="px-2 py-3 text-left">Date</th>
                <th className="px-2 py-3 text-left">Customer</th>
                <th className="px-2 py-3 text-right">Total Amount</th>
                <th className="px-2 py-3 text-left">Payment</th>
                <th className="px-2 py-3 text-left">Status</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {paged.map((order) => (
                <tr key={order.id} className="hover:bg-muted/30">
                  <td className="px-5 py-4 font-semibold whitespace-nowrap text-foreground">
                    {order.id}
                  </td>
                  <td className="px-2 py-4 whitespace-nowrap text-muted-foreground">{order.date}</td>
                  <td className="px-2 py-4">
                    <div className="flex items-center gap-2.5">
                      <Avatar className="size-8">
                        <AvatarFallback className="bg-muted text-xs font-semibold text-foreground">
                          {order.customer.initials}
                        </AvatarFallback>
                      </Avatar>
                      <span className="whitespace-nowrap font-medium text-foreground">
                        {order.customer.name}
                      </span>
                    </div>
                  </td>
                  <td className="px-2 py-4 text-right font-semibold whitespace-nowrap text-foreground">
                    {formatEuro(orderTotals(order).total)}
                  </td>
                  <td className="px-2 py-4">
                    <PaymentStatusBadge status={order.paymentStatus} />
                  </td>
                  <td className="px-2 py-4">
                    <button
                      type="button"
                      onClick={() => setStatusTarget(order)}
                      aria-label={`Change status for order ${order.id}`}
                      title="Change order status"
                      className="rounded-4xl outline-none transition-opacity hover:opacity-75 focus-visible:ring-3 focus-visible:ring-ring/50"
                    >
                      <OrderStatusBadge status={order.status} className="cursor-pointer" />
                    </button>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex justify-end">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setDetailsTarget(order)}
                        aria-label={`View details for order ${order.id}`}
                      >
                        <Eye />
                        View Details
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}

              {paged.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-5 py-14 text-center text-sm text-subtle">
                    <Inbox className="mx-auto mb-2 size-8 text-muted-foreground" />
                    No orders match your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex flex-col gap-3 border-t px-5 py-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-subtle">
            {filtered.length === 0
              ? "No orders to show"
              : `Showing ${start + 1} to ${start + paged.length} of ${filtered.length} orders`}
          </p>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon-sm"
              aria-label="Previous page"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft />
            </Button>
            {Array.from({ length: totalPages }).map((_, i) => (
              <Button
                key={i}
                variant={currentPage === i + 1 ? "default" : "outline"}
                size="icon-sm"
                onClick={() => setPage(i + 1)}
              >
                {i + 1}
              </Button>
            ))}
            <Button
              variant="outline"
              size="icon-sm"
              aria-label="Next page"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              <ChevronRight />
            </Button>
          </div>
        </div>
      </Card>

      <ChangeOrderStatusModal order={statusTarget} onClose={() => setStatusTarget(null)} />
      <OrderDetailsModal order={detailsTarget} onClose={() => setDetailsTarget(null)} />
    </div>
  );
}
