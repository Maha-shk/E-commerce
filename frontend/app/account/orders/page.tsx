"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronLeft,
  ChevronRight,
  Loader2,
  RotateCw,
  Search,
  ShoppingBag,
  TriangleAlert,
  X,
} from "lucide-react";
import { AccountShell } from "@/components/account/AccountShell";
import { AccountPageHeader } from "@/components/account/AccountPageHeader";
import { SectionCard } from "@/components/account/SectionCard";
import { AccountEmptyState } from "@/components/account/AccountEmptyState";
import { OrderStatusBadge } from "@/components/account/OrderStatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useMyOrders } from "@/lib/hooks/use-account";
import { useDebounce } from "@/lib/hooks/use-debounce";
import { formatMoney, formatShortDate } from "@/lib/format";
import { cn } from "@/lib/utils";

const STATUS_OPTIONS = [
  { value: "All", label: "All" },
  { value: "PENDING", label: "Pending" },
  { value: "PROCESSING", label: "Processing" },
  { value: "SHIPPED", label: "Shipped" },
  { value: "DELIVERED", label: "Delivered" },
  { value: "CANCELLED", label: "Cancelled" },
  { value: "RETURNED", label: "Returned" },
] as const;

const PAGE_SIZE = 10;

/** Window of page numbers to render, centred on the current page. */
function pageWindow(page: number, totalPages: number, size = 5) {
  const count = Math.min(size, totalPages);
  const start = Math.min(
    Math.max(1, page - Math.floor(count / 2)),
    Math.max(1, totalPages - count + 1),
  );
  return Array.from({ length: count }, (_, i) => start + i);
}

export default function OrdersPage() {
  const router = useRouter();

  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState("");
  const search = useDebounce(searchQuery, 200);

  const { data, isPending, isFetching, isError, refetch } = useMyOrders({
    page,
    limit: PAGE_SIZE,
    status: statusFilter === "All" ? undefined : statusFilter,
  });

  const orders = useMemo(() => data?.orders ?? [], [data]);
  const meta = data?.meta ?? null;
  const totalPages = meta?.totalPages ?? 1;
  const totalOrders = meta?.total ?? orders.length;

  // Search filters the page currently in hand, so paging alongside it would be
  // misleading — the pager is hidden while a query is active.
  const visibleOrders = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return orders;
    return orders.filter((order) => order.orderNumber.toLowerCase().includes(query));
  }, [orders, search]);

  const isSearching = search.trim().length > 0;
  const showPager = !isSearching && !isError && totalPages > 1;

  return (
    <AccountShell loadingLabel="Loading your orders…">
      <AccountPageHeader
        title="My Orders"
        description="View and track everything you've ordered."
      />

      {/* Filters */}
      <SectionCard bodyClassName="p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div
            className="flex flex-wrap items-center gap-2"
            role="group"
            aria-label="Filter orders by status"
          >
            {STATUS_OPTIONS.map((option) => {
              const isSelected = statusFilter === option.value;
              return (
                <Button
                  key={option.value}
                  size="sm"
                  variant={isSelected ? "default" : "outline"}
                  aria-pressed={isSelected}
                  onClick={() => {
                    setStatusFilter(option.value);
                    setPage(1);
                  }}
                >
                  {option.label}
                </Button>
              );
            })}
          </div>

          <div className="relative w-full lg:w-64">
            <Search
              className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden
            />
            <Input
              type="text"
              inputMode="search"
              placeholder="Search order number…"
              aria-label="Search by order number"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={cn("h-10 pl-9", searchQuery && "pr-9")}
            />
            {searchQuery ? (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                aria-label="Clear search"
                className="absolute top-1/2 right-1.5 flex size-7 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
              >
                <X className="size-4" aria-hidden />
              </button>
            ) : null}
          </div>
        </div>
      </SectionCard>

      {/* Table */}
      <SectionCard bodyClassName="p-0">
        {isError ? (
          <AccountEmptyState
            icon={TriangleAlert}
            title="Couldn't load your orders"
            description="Something went wrong on our side. Please try again."
            action={
              <Button variant="outline" onClick={() => refetch()}>
                <RotateCw className="size-4" aria-hidden />
                Retry
              </Button>
            }
          />
        ) : isPending ? (
          <div className="flex flex-col items-center gap-3 py-16">
            <Loader2 className="size-6 animate-spin text-primary" aria-hidden />
            <p className="text-sm text-muted-foreground">Loading orders…</p>
          </div>
        ) : visibleOrders.length === 0 ? (
          <AccountEmptyState
            icon={ShoppingBag}
            title={isSearching ? "No matching orders" : "No orders yet"}
            description={
              isSearching
                ? `Nothing matches “${search.trim()}”. Try a different order number.`
                : "When you place an order it will appear here."
            }
            action={
              isSearching ? (
                <Button variant="outline" onClick={() => setSearchQuery("")}>
                  Clear search
                </Button>
              ) : (
                <Button variant="outline" onClick={() => router.push("/products")}>
                  Start Shopping
                </Button>
              )
            }
          />
        ) : (
          <div
            // Dims (but keeps) the current rows while the next page loads,
            // instead of flashing a spinner and collapsing the layout.
            className={cn(
              "overflow-x-auto transition-opacity duration-150",
              isFetching && "opacity-60",
            )}
          >
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="px-5 py-3 text-left text-xs font-medium tracking-wide text-muted-foreground uppercase">
                    Order
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-medium tracking-wide text-muted-foreground uppercase">
                    Date
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-medium tracking-wide text-muted-foreground uppercase">
                    Status
                  </th>
                  <th className="px-5 py-3 text-right text-xs font-medium tracking-wide text-muted-foreground uppercase">
                    Total
                  </th>
                </tr>
              </thead>
              <tbody>
                {visibleOrders.map((order) => (
                  <tr
                    key={order.id}
                    tabIndex={0}
                    role="link"
                    onClick={() => router.push(`/orders/${order.orderNumber}`)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        router.push(`/orders/${order.orderNumber}`);
                      }
                    }}
                    className="cursor-pointer border-b border-border transition-colors last:border-0 hover:bg-muted/60 focus-visible:bg-muted/60 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring"
                  >
                    <td className="px-5 py-3.5 font-medium whitespace-nowrap">
                      {order.orderNumber}
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap text-muted-foreground">
                      {formatShortDate(order.placedAt)}
                    </td>
                    <td className="px-5 py-3.5">
                      <OrderStatusBadge status={order.status} />
                    </td>
                    <td className="px-5 py-3.5 text-right font-medium tabular-nums whitespace-nowrap">
                      {formatMoney(order.totals.total)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {showPager ? (
          <div className="flex flex-col gap-3 border-t border-border px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted-foreground">
              Showing <span className="font-medium text-foreground">{visibleOrders.length}</span>{" "}
              of <span className="font-medium text-foreground">{totalOrders}</span> orders
              <span className="text-muted-foreground/80">
                {" "}
                · page {page} of {totalPages}
              </span>
            </p>

            <div className="flex items-center gap-1.5">
              <Button
                size="sm"
                variant="outline"
                aria-label="Previous page"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                <ChevronLeft className="size-4" aria-hidden />
                <span className="hidden sm:inline">Previous</span>
              </Button>

              <div className="flex items-center gap-1">
                {pageWindow(page, totalPages).map((pageNum) => (
                  <Button
                    key={pageNum}
                    size="sm"
                    variant={page === pageNum ? "default" : "outline"}
                    aria-label={`Page ${pageNum}`}
                    aria-current={page === pageNum ? "page" : undefined}
                    onClick={() => setPage(pageNum)}
                    // Square, and the same 32px height as the prev/next buttons.
                    className="w-8 px-0 tabular-nums"
                  >
                    {pageNum}
                  </Button>
                ))}
              </div>

              <Button
                size="sm"
                variant="outline"
                aria-label="Next page"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                <span className="hidden sm:inline">Next</span>
                <ChevronRight className="size-4" aria-hidden />
              </Button>
            </div>
          </div>
        ) : null}
      </SectionCard>
    </AccountShell>
  );
}
