"use client";

import { useState } from "react";
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
import { useOrders, useOrderStats, useUpdateOrderStatus } from "@/lib/hooks/use-admin";
import { useDebounce } from "@/lib/hooks/use-debounce";
import { formatEuro } from "@/lib/admin/format";
import { orderStatusLabel, type Order, type OrderStatus } from "@/lib/api/models";

const PAGE_SIZE = 5;

const statusOptions: OrderStatus[] = [
  "PENDING",
  "PROCESSING",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
  "RETURNED",
];

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

  const debouncedSearch = useDebounce(search);

  const { data, isLoading, isError, error, refetch } = useOrders({
    page,
    limit: PAGE_SIZE,
    search: debouncedSearch || undefined,
    status: statusFilter === "All" ? undefined : statusFilter,
  });

  const { data: stats } = useOrderStats();
  const updateOrderStatus = useUpdateOrderStatus();

  const orders = data?.data ?? [];
  const totalPages = data?.meta.totalPages ?? 1;

  function withPageReset<T>(setter: (value: T) => void) {
    return (value: T) => {
      setter(value);
      setPage(1);
    };
  }

  function handleExport() {
    const header = ["Order ID", "Date", "Customer", "Total", "Payment Status", "Order Status"];
    const rows = orders.map((o) => [
      o.orderNumber,
      new Date(o.placedAt).toLocaleDateString(),
      o.customer?.fullName || "",
      o.totals.total.toFixed(2),
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
          value={(stats?.total ?? 0).toLocaleString()}
          corner={<Badge variant="success">All time</Badge>}
        />
        <StatCard
          label="Pending"
          value={(stats?.byStatus?.PENDING ?? 0).toLocaleString()}
          corner={
            <span className="flex size-9 items-center justify-center rounded-full bg-warning-muted text-warning">
              <Clock className="size-4" />
            </span>
          }
        />
        <StatCard
          label="Delivered"
          value={(stats?.byStatus?.DELIVERED ?? 0).toLocaleString()}
          corner={
            <span className="flex size-9 items-center justify-center rounded-full bg-success-muted text-success">
              <CheckCircle2 className="size-4" />
            </span>
          }
        />
        <StatCard
          label="Revenue"
          value={formatEuro(stats?.revenue ?? 0)}
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
              onChange={(e) => withPageReset(setStatusFilter)(e.target.value as "All" | OrderStatus)}
            >
              <option value="All">All statuses</option>
              {statusOptions.map((s) => (
                <option key={s} value={s}>
                  {orderStatusLabel[s]}
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
                onChange={(e) => withPageReset(setSearch)(e.target.value)}
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
              {orders.map((order) => (
                <tr key={order.id} className="hover:bg-muted/30">
                  <td className="px-5 py-3">
                    <Avatar aria-hidden className="size-11">
                      <AvatarFallback className="bg-muted text-xs font-semibold text-foreground">
                        {order.customer?.fullName
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .toUpperCase() || "?"}
                      </AvatarFallback>
                    </Avatar>
                  </td>
                  <td className="px-2 py-3">
                    <p className="font-semibold text-foreground">{order.customer?.fullName || "Unknown"}</p>
                    <p className="line-clamp-1 text-xs text-subtle">{order.customer?.email || ""}</p>
                  </td>
                  <td className="px-2 py-3 font-medium whitespace-nowrap text-muted-foreground">
                    {order.orderNumber}
                  </td>
                  <td className="px-2 py-3 whitespace-nowrap text-muted-foreground">
                    {new Date(order.placedAt).toLocaleDateString()}
                  </td>
                  <td className="px-2 py-3">
                    <button
                      type="button"
                      onClick={() => setStatusTarget(order)}
                      aria-label={`Change status for order ${order.orderNumber}`}
                      title="Change order status"
                      className="rounded-4xl outline-none transition-opacity hover:opacity-75 focus-visible:ring-3 focus-visible:ring-ring/50"
                    >
                      <OrderStatusBadge status={order.status} className="cursor-pointer" />
                    </button>
                  </td>
                  <td className="px-2 py-3 text-right font-semibold whitespace-nowrap text-foreground">
                    {formatEuro(order.totals.total)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => setDetailsTarget(order)}
                        aria-label={`View details for order ${order.orderNumber}`}
                      >
                        <Eye />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => setStatusTarget(order)}
                        aria-label={`Change status for order ${order.orderNumber}`}
                      >
                        <Pencil />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}

              {orders.length === 0 && !isLoading && (
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
            Showing {orders.length} of {data?.meta.total ?? 0} orders
          </p>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon-sm"
              aria-label="Previous page"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              <ChevronLeft />
            </Button>
            {Array.from({ length: totalPages }).map((_, i) => (
              <Button
                key={i}
                variant={page === i + 1 ? "default" : "outline"}
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
              disabled={page >= totalPages}
            >
              <ChevronRight />
            </Button>
          </div>
        </div>
      </Card>

      <ChangeOrderStatusModal
        order={statusTarget}
        onClose={() => setStatusTarget(null)}
        onSave={(updates) => {
          if (statusTarget) {
            updateOrderStatus.mutate({ id: statusTarget.id, ...updates });
          }
        }}
      />
      <OrderDetailsModal order={detailsTarget} onClose={() => setDetailsTarget(null)} />
    </div>
  );
}
