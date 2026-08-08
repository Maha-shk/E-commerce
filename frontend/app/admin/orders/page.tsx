"use client";

import { useState } from "react";
import {
  Search,
  Download,
  Eye,
  Pencil,
  Inbox,
  Clock,
  CheckCircle2,
  Wallet,
  ShoppingCart,
  X,
} from "lucide-react";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { NativeSelect } from "@/components/ui/select-native";
import { OrderStatusBadge } from "@/components/admin/OrderBadges";
import { ChangeOrderStatusModal } from "@/components/admin/ChangeOrderStatusModal";
import { OrderDetailsModal } from "@/components/admin/OrderDetailsModal";
import { AdminStatCard, StatChip } from "@/components/admin/AdminStatCard";
import { TablePagination } from "@/components/admin/TablePagination";
import { TableEmptyState } from "@/components/admin/TableEmptyState";
import { ErrorState, TableSkeleton } from "@/components/admin/QueryState";
import { useOrders, useOrderStats, useUpdateOrderStatus } from "@/lib/hooks/use-admin";
import { useDebounce } from "@/lib/hooks/use-debounce";
import { downloadCsv } from "@/lib/admin/csv";
import { formatDate, formatEuro, initialsOf } from "@/lib/admin/format";
import { orderStatusLabel, type Order, type OrderStatus } from "@/lib/api/models";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 10;

const statusOptions: OrderStatus[] = [
  "PENDING",
  "PROCESSING",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
  "RETURNED",
];

export default function OrdersPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"All" | OrderStatus>("All");
  const [page, setPage] = useState(1);

  const [statusTarget, setStatusTarget] = useState<Order | null>(null);
  const [detailsTarget, setDetailsTarget] = useState<Order | null>(null);

  const debouncedSearch = useDebounce(search);

  const { data, isPending, isFetching, isError, error, refetch } = useOrders({
    page,
    limit: PAGE_SIZE,
    search: debouncedSearch || undefined,
    status: statusFilter === "All" ? undefined : statusFilter,
  });

  const { data: stats, isLoading: statsLoading } = useOrderStats();
  const updateOrderStatus = useUpdateOrderStatus();

  const orders = data?.data ?? [];
  const total = data?.meta.total ?? 0;
  const totalPages = data?.meta.totalPages ?? 1;

  const hasFilters = Boolean(search) || statusFilter !== "All";

  function withPageReset<T>(setter: (value: T) => void) {
    return (value: T) => {
      setter(value);
      setPage(1);
    };
  }

  function clearFilters() {
    setSearch("");
    setStatusFilter("All");
    setPage(1);
  }

  function handleExport() {
    downloadCsv(
      "orders.csv",
      ["Order ID", "Date", "Customer", "Email", "Items", "Total", "Status"],
      orders.map((o) => [
        o.orderNumber,
        formatDate(o.placedAt),
        o.customer?.fullName ?? "",
        o.customer?.email ?? "",
        String(o.items.length),
        o.totals.total.toFixed(2),
        orderStatusLabel[o.status],
      ]),
    );
  }

  /** Jump the list to a single status from a stat tile. */
  function filterByStatus(next: OrderStatus) {
    setStatusFilter(next);
    setSearch("");
    setPage(1);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Orders"
        subtitle="Track fulfilment across all customer orders."
        action={
          <Button
            variant="outline"
            size="lg"
            onClick={handleExport}
            disabled={orders.length === 0}
            title="Download the orders on this page as CSV"
          >
            <Download className="size-4" aria-hidden />
            Export page
          </Button>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <AdminStatCard
          label="Total orders"
          value={(stats?.total ?? 0).toLocaleString()}
          caption="All time"
          loading={statsLoading}
          corner={
            <StatChip className="bg-accent text-primary">
              <ShoppingCart className="size-4" aria-hidden />
            </StatChip>
          }
        />

        <button
          type="button"
          onClick={() => filterByStatus("PENDING")}
          className="rounded-xl text-left transition-shadow hover:shadow-card-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        >
          <AdminStatCard
            label="Pending"
            value={(stats?.byStatus?.PENDING ?? 0).toLocaleString()}
            caption="Tap to filter"
            tone={stats?.byStatus?.PENDING ? "warning" : "default"}
            loading={statsLoading}
            corner={
              <StatChip className="bg-warning-muted text-warning">
                <Clock className="size-4" aria-hidden />
              </StatChip>
            }
          />
        </button>

        <button
          type="button"
          onClick={() => filterByStatus("DELIVERED")}
          className="rounded-xl text-left transition-shadow hover:shadow-card-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        >
          <AdminStatCard
            label="Delivered"
            value={(stats?.byStatus?.DELIVERED ?? 0).toLocaleString()}
            caption="Tap to filter"
            loading={statsLoading}
            corner={
              <StatChip className="bg-success-muted text-success">
                <CheckCircle2 className="size-4" aria-hidden />
              </StatChip>
            }
          />
        </button>

        <AdminStatCard
          label="Revenue"
          value={formatEuro(stats?.revenue ?? 0)}
          caption={`${formatEuro(stats?.averageOrderValue ?? 0)} average order`}
          loading={statsLoading}
          corner={
            <StatChip className="bg-success-muted text-success">
              <Wallet className="size-4" aria-hidden />
            </StatChip>
          }
        />
      </div>

      <Card className="gap-0 py-0">
        {/* Toolbar */}
        <div className="flex flex-col gap-3 border-b border-border p-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <h2 className="mr-1 text-base font-semibold tracking-tight text-foreground">
              All Orders
            </h2>

            <NativeSelect
              aria-label="Filter by order status"
              className="h-10 w-auto min-w-36"
              value={statusFilter}
              onChange={(e) =>
                withPageReset(setStatusFilter)(e.target.value as "All" | OrderStatus)
              }
            >
              <option value="All">All statuses</option>
              {statusOptions.map((s) => (
                <option key={s} value={s}>
                  {orderStatusLabel[s]}
                </option>
              ))}
            </NativeSelect>

            {hasFilters ? (
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                <X className="size-4" aria-hidden />
                Clear
              </Button>
            ) : null}
          </div>

          <div className="relative w-full lg:w-72">
            <Search
              className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-subtle"
              aria-hidden
            />
            <Input
              type="text"
              inputMode="search"
              aria-label="Search orders"
              placeholder="Search by order ID or customer…"
              className={cn("h-10 bg-card pl-9", search && "pr-9")}
              value={search}
              onChange={(e) => withPageReset(setSearch)(e.target.value)}
            />
            {search ? (
              <button
                type="button"
                onClick={() => withPageReset(setSearch)("")}
                aria-label="Clear search"
                className="absolute top-1/2 right-1.5 flex size-7 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
              >
                <X className="size-4" aria-hidden />
              </button>
            ) : null}
          </div>
        </div>

        {/* A failed request used to render the same "No orders match your
            filters" row as an empty result, with no retry. */}
        {isError ? (
          <div className="p-5">
            <ErrorState error={error} onRetry={() => refetch()} />
          </div>
        ) : (
          <div
            className={cn(
              "overflow-x-auto transition-opacity duration-150",
              isFetching && !isPending && "opacity-60",
            )}
          >
            <table className="w-full min-w-4xl text-sm">
              <thead className="border-b border-border bg-muted/50 text-xs font-semibold tracking-wider text-subtle uppercase">
                <tr>
                  {/* The avatar used to sit in its own column headed "Image".
                      It belongs with the name it identifies. */}
                  <th className="px-5 py-3 text-left">Customer</th>
                  <th className="px-3 py-3 text-left">Order</th>
                  <th className="px-3 py-3 text-left">Date</th>
                  <th className="px-3 py-3 text-right">Items</th>
                  <th className="px-3 py-3 text-left">Status</th>
                  <th className="px-3 py-3 text-right">Total</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {isPending ? (
                  <TableSkeleton rows={PAGE_SIZE} columns={7} />
                ) : orders.length === 0 ? (
                  <TableEmptyState
                    colSpan={7}
                    icon={Inbox}
                    title="No orders found"
                    description={
                      hasFilters
                        ? "No orders match your filters."
                        : "Orders will appear here as customers check out."
                    }
                    action={
                      hasFilters ? (
                        <Button variant="outline" onClick={clearFilters}>
                          Clear filters
                        </Button>
                      ) : undefined
                    }
                  />
                ) : (
                  orders.map((order) => (
                    <tr key={order.id} className="transition-colors hover:bg-muted/40">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <Avatar aria-hidden className="size-9">
                            <AvatarFallback className="bg-muted text-xs font-semibold text-foreground">
                              {initialsOf(order.customer?.fullName ?? "?")}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <p className="truncate font-medium text-foreground">
                              {order.customer?.fullName || "Unknown"}
                            </p>
                            <p className="truncate text-xs text-subtle">
                              {order.customer?.email || "—"}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-3">
                        <button
                          type="button"
                          onClick={() => setDetailsTarget(order)}
                          className="font-medium whitespace-nowrap tabular-nums text-foreground hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                        >
                          {order.orderNumber}
                        </button>
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap text-muted-foreground">
                        {formatDate(order.placedAt)}
                      </td>
                      <td className="px-3 py-3 text-right whitespace-nowrap tabular-nums text-muted-foreground">
                        {order.items.length}
                      </td>
                      <td className="px-3 py-3">
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
                      <td className="px-3 py-3 text-right font-medium whitespace-nowrap tabular-nums text-foreground">
                        {formatEuro(order.totals.total)}
                      </td>
                      <td className="px-5 py-3">
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
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {!isError && orders.length > 0 ? (
          <TablePagination
            page={page}
            pageSize={PAGE_SIZE}
            total={total}
            totalPages={totalPages}
            rowsOnPage={orders.length}
            onPageChange={setPage}
            noun="orders"
          />
        ) : null}
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
      <OrderDetailsModal
        order={detailsTarget}
        onClose={() => setDetailsTarget(null)}
        onChangeStatus={(order) => {
          setDetailsTarget(null);
          setStatusTarget(order);
        }}
      />
    </div>
  );
}
