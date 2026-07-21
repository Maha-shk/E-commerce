"use client";

import { useMemo, useState } from "react";
import {
  Search,
  Download,
  Eye,
  Pencil,
  ChevronLeft,
  ChevronRight,
  Inbox,
  Clock,
  CheckCircle2,
  Wallet,
} from "lucide-react";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { NativeSelect } from "@/components/ui/select-native";
import { OrderStatusBadge } from "@/components/admin/OrderBadges";
import { ChangeOrderStatusModal } from "@/components/admin/ChangeOrderStatusModal";
import { OrderDetailsModal } from "@/components/admin/OrderDetailsModal";
import { SortButton } from "@/components/admin/SortButton";
import {
  orders,
  orderStatuses,
  orderTotals,
  formatEuro,
  type Order,
  type OrderStatus,
} from "@/lib/admin/orders";

const PAGE_SIZE = 5;

function StatCard({
  label,
  value,
  corner,
}: {
  label: string;
  value: string;
  corner: React.ReactNode;
}) {
  return (
    <Card>
      <CardContent className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-subtle">{label}</p>
          <p className="mt-2 font-display text-2xl font-semibold text-foreground">{value}</p>
        </div>
        {corner}
      </CardContent>
    </Card>
  );
}

export default function OrdersPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"All" | OrderStatus>("All");
  const [page, setPage] = useState(1);

  const [statusTarget, setStatusTarget] = useState<Order | null>(null);
  const [detailsTarget, setDetailsTarget] = useState<Order | null>(null);

  const stats = useMemo(() => {
    const pending = orders.filter((o) => o.status === "Pending").length;
    const delivered = orders.filter((o) => o.status === "Delivered").length;
    // Revenue counts only orders that were actually paid for.
    const revenue = orders
      .filter((o) => o.paymentStatus === "Paid")
      .reduce((sum, o) => sum + orderTotals(o).total, 0);
    return { total: orders.length, pending, delivered, revenue };
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return orders.filter((o) => {
      const matchesSearch =
        !q ||
        o.id.toLowerCase().includes(q) ||
        o.customer.name.toLowerCase().includes(q) ||
        o.customer.email.toLowerCase().includes(q);
      const matchesStatus = statusFilter === "All" || o.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [search, statusFilter]);

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

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Total Orders"
          value={stats.total.toLocaleString()}
          corner={<Badge variant="success">+8%</Badge>}
        />
        <StatCard
          label="Pending"
          value={stats.pending.toLocaleString()}
          corner={
            <span className="flex size-9 items-center justify-center rounded-full bg-warning-muted text-warning">
              <Clock className="size-4" />
            </span>
          }
        />
        <StatCard
          label="Delivered"
          value={stats.delivered.toLocaleString()}
          corner={
            <span className="flex size-9 items-center justify-center rounded-full bg-success-muted text-success">
              <CheckCircle2 className="size-4" />
            </span>
          }
        />
        <StatCard
          label="Revenue"
          value={formatEuro(stats.revenue)}
          corner={
            <span className="flex size-9 items-center justify-center rounded-full bg-success-muted text-success">
              <Wallet className="size-4" />
            </span>
          }
        />
      </div>

      {/* Section heading */}
      <h2 className="font-display text-lg font-semibold text-foreground">All Orders</h2>

      {/* Orders table */}
      <Card className="gap-0 overflow-hidden py-0">
        {/* Toolbar: filters left, search + sort right */}
        <div className="flex flex-col gap-3 border-b p-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <NativeSelect
              aria-label="Filter by order status"
              className="w-auto min-w-36"
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value as "All" | OrderStatus);
                setPage(1);
              }}
            >
              <option value="All">All statuses</option>
              {orderStatuses.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </NativeSelect>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative flex-1 sm:w-72 sm:flex-none">
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
            <SortButton />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-205 text-sm">
            <thead className="border-b bg-muted/50 text-xs font-semibold uppercase tracking-wider text-subtle">
              <tr>
                <th className="px-5 py-3 text-left">Image</th>
                <th className="px-2 py-3 text-left">Customer</th>
                <th className="px-2 py-3 text-left">Order ID</th>
                <th className="px-2 py-3 text-left">Date</th>
                <th className="px-2 py-3 text-left">Status</th>
                <th className="px-2 py-3 text-right">Total Amount</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {paged.map((order) => (
                <tr key={order.id} className="hover:bg-muted/30">
                  <td className="px-5 py-3">
                    <Avatar aria-hidden className="size-11">
                      <AvatarFallback className="bg-muted text-xs font-semibold text-foreground">
                        {order.customer.initials}
                      </AvatarFallback>
                    </Avatar>
                  </td>
                  <td className="px-2 py-3">
                    <p className="font-semibold text-foreground">{order.customer.name}</p>
                    <p className="line-clamp-1 text-xs text-subtle">{order.customer.email}</p>
                  </td>
                  <td className="px-2 py-3 font-medium whitespace-nowrap text-muted-foreground">
                    {order.id}
                  </td>
                  <td className="px-2 py-3 whitespace-nowrap text-muted-foreground">{order.date}</td>
                  <td className="px-2 py-3">
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
                  <td className="px-2 py-3 text-right font-semibold whitespace-nowrap text-foreground">
                    {formatEuro(orderTotals(order).total)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => setDetailsTarget(order)}
                        aria-label={`View details for order ${order.id}`}
                      >
                        <Eye />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => setStatusTarget(order)}
                        aria-label={`Change status for order ${order.id}`}
                      >
                        <Pencil />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}

              {paged.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-14 text-center text-sm text-subtle">
                    <Inbox className="mx-auto mb-2 size-8 text-muted-foreground" />
                    No orders match your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex flex-col gap-3 border-t px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-subtle">
            Showing {paged.length} of {filtered.length} orders
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
