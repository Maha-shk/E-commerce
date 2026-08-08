"use client";

import { useState } from "react";
import {
  Search,
  Download,
  UsersRound,
  UserCheck,
  UserX,
  Eye,
  Ban,
  X,
} from "lucide-react";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { NativeSelect } from "@/components/ui/select-native";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { CustomerDetailsModal } from "@/components/admin/CustomerDetailsModal";
import { AdminStatCard, StatChip } from "@/components/admin/AdminStatCard";
import { TablePagination } from "@/components/admin/TablePagination";
import { TableEmptyState } from "@/components/admin/TableEmptyState";
import { ErrorState, TableSkeleton } from "@/components/admin/QueryState";
import { useCustomers, useCustomer, useUpdateCustomer } from "@/lib/hooks/use-admin";
import { useDebounce } from "@/lib/hooks/use-debounce";
import { downloadCsv } from "@/lib/admin/csv";
import { formatDate, formatEuro } from "@/lib/admin/format";
import { userStatusLabel, type CustomerListItem } from "@/lib/api/models";
import type { UserStatus } from "@/lib/api/types";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 10;

const statusVariant: Record<UserStatus, "success" | "secondary" | "destructive"> = {
  ACTIVE: "success",
  INACTIVE: "secondary",
  SUSPENDED: "destructive",
};

const statusOptions: UserStatus[] = ["ACTIVE", "INACTIVE", "SUSPENDED"];

export default function CustomersPage() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"All" | UserStatus>("All");
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [pendingSuspend, setPendingSuspend] = useState<CustomerListItem | null>(null);

  const debouncedSearch = useDebounce(search);

  const { data, isPending, isFetching, isError, error, refetch } = useCustomers({
    page,
    limit: PAGE_SIZE,
    search: debouncedSearch || undefined,
    status: status === "All" ? undefined : status,
  });

  /*
   * Counts come from the server, not from the page in view.
   *
   * "Active Customers" used to count ACTIVE rows in the current 10 and render a
   * percentage beside it — a figure that looked global but described one page.
   * These are `limit: 1` queries read purely for `meta.total`, so each number
   * is the real population count.
   */
  const { data: allCount, isLoading: countsLoading } = useCustomers({ limit: 1 });
  const { data: activeCount } = useCustomers({ limit: 1, status: "ACTIVE" });
  const { data: suspendedCount } = useCustomers({ limit: 1, status: "SUSPENDED" });

  const { data: selected } = useCustomer(selectedId);
  const updateCustomer = useUpdateCustomer();

  const customers = data?.data ?? [];
  const total = data?.meta.total ?? 0;
  const totalPages = data?.meta.totalPages ?? 1;

  const hasFilters = Boolean(search) || status !== "All";

  function withPageReset<T>(setter: (value: T) => void) {
    return (value: T) => {
      setter(value);
      setPage(1);
    };
  }

  function clearFilters() {
    setSearch("");
    setStatus("All");
    setPage(1);
  }

  function applySuspendToggle(customer: CustomerListItem) {
    const newStatus: UserStatus = customer.status === "SUSPENDED" ? "ACTIVE" : "SUSPENDED";
    updateCustomer.mutate({ id: customer.id, body: { status: newStatus } });
  }

  /** Suspending locks someone out of their account — confirm it first. */
  function requestSuspendToggle(customer: CustomerListItem) {
    if (customer.status === "SUSPENDED") {
      applySuspendToggle(customer);
      return;
    }
    setPendingSuspend(customer);
  }

  function handleExport() {
    downloadCsv(
      "customers.csv",
      ["Name", "Email", "Phone", "Orders", "Total spent", "Status", "Joined"],
      customers.map((c) => [
        c.fullName,
        c.email,
        c.phone || "",
        String(c.totalOrders),
        c.totalSpent.toFixed(2),
        userStatusLabel[c.status],
        formatDate(c.joinedAt || c.createdAt),
      ]),
    );
  }

  function filterByStatus(next: UserStatus) {
    setStatus(next);
    setSearch("");
    setPage(1);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Customers"
        subtitle="Your registered shoppers and their spending history."
        action={
          <Button
            variant="outline"
            size="lg"
            onClick={handleExport}
            disabled={customers.length === 0}
            title="Download the customers on this page as CSV"
          >
            <Download className="size-4" aria-hidden />
            Export page
          </Button>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <AdminStatCard
          label="Total customers"
          value={(allCount?.meta.total ?? 0).toLocaleString()}
          caption="Registered, all time"
          loading={countsLoading}
          corner={
            <StatChip className="bg-accent text-primary">
              <UsersRound className="size-4" aria-hidden />
            </StatChip>
          }
        />

        <button
          type="button"
          onClick={() => filterByStatus("ACTIVE")}
          className="rounded-xl text-left transition-shadow hover:shadow-card-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        >
          <AdminStatCard
            label="Active"
            value={(activeCount?.meta.total ?? 0).toLocaleString()}
            caption="Tap to filter"
            loading={countsLoading}
            corner={
              <StatChip className="bg-success-muted text-success">
                <UserCheck className="size-4" aria-hidden />
              </StatChip>
            }
          />
        </button>

        <button
          type="button"
          onClick={() => filterByStatus("SUSPENDED")}
          className="rounded-xl text-left transition-shadow hover:shadow-card-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        >
          <AdminStatCard
            label="Suspended"
            value={(suspendedCount?.meta.total ?? 0).toLocaleString()}
            caption="Tap to filter"
            tone={suspendedCount?.meta.total ? "destructive" : "default"}
            loading={countsLoading}
            corner={
              <StatChip className="bg-destructive/10 text-destructive">
                <UserX className="size-4" aria-hidden />
              </StatChip>
            }
          />
        </button>
      </div>

      <Card className="gap-0 py-0">
        {/* Toolbar */}
        <div className="flex flex-col gap-3 border-b border-border p-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <h2 className="mr-1 text-base font-semibold tracking-tight text-foreground">
              All Customers
            </h2>

            <NativeSelect
              aria-label="Filter by account status"
              className="h-10 w-auto min-w-36"
              value={status}
              onChange={(e) => withPageReset(setStatus)(e.target.value as "All" | UserStatus)}
            >
              <option value="All">All statuses</option>
              {statusOptions.map((s) => (
                <option key={s} value={s}>
                  {userStatusLabel[s]}
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
              aria-label="Search customers"
              placeholder="Search by name, email or phone…"
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

        {/* A failed request used to fall through to the same "No customers
            match your filters" row as an empty result, with no retry. */}
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
                  {/* The avatar had its own column headed "Image". It belongs
                      with the name it identifies. */}
                  <th className="px-5 py-3 text-left">Customer</th>
                  <th className="px-3 py-3 text-left">Status</th>
                  <th className="px-3 py-3 text-left">Joined</th>
                  <th className="px-3 py-3 text-right">Orders</th>
                  <th className="px-3 py-3 text-right">Total spent</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {isPending ? (
                  <TableSkeleton rows={PAGE_SIZE} columns={6} />
                ) : customers.length === 0 ? (
                  <TableEmptyState
                    colSpan={6}
                    icon={UsersRound}
                    title="No customers found"
                    description={
                      hasFilters
                        ? "No customers match your filters."
                        : "Customers appear here once they register."
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
                  customers.map((customer) => {
                    const isSuspended = customer.status === "SUSPENDED";

                    return (
                      <tr
                        key={customer.id}
                        className={cn(
                          "transition-colors hover:bg-muted/40",
                          isSuspended && "opacity-70",
                        )}
                      >
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-3">
                            <Avatar className="size-9">
                              {/* `avatarUrl` was on the model all along — the
                                  table only ever rendered initials. */}
                              {customer.avatarUrl ? (
                                <AvatarImage src={customer.avatarUrl} alt="" />
                              ) : null}
                              <AvatarFallback className="bg-muted text-xs font-semibold text-foreground">
                                {customer.initials}
                              </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0">
                              <button
                                type="button"
                                onClick={() => setSelectedId(customer.id)}
                                className="block max-w-full truncate text-left font-medium text-foreground hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                              >
                                {customer.fullName}
                              </button>
                              <p className="truncate text-xs text-subtle">{customer.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-3">
                          {/* Was forced to ALL CAPS with `className="uppercase"`. */}
                          <Badge variant={statusVariant[customer.status]} className="h-6 px-2.5">
                            <span className="size-1.5 rounded-full bg-current" />
                            {userStatusLabel[customer.status]}
                          </Badge>
                        </td>
                        <td className="px-3 py-3 whitespace-nowrap text-muted-foreground">
                          {formatDate(customer.joinedAt || customer.createdAt)}
                        </td>
                        <td className="px-3 py-3 text-right whitespace-nowrap tabular-nums">
                          <span
                            className={
                              customer.totalOrders === 0
                                ? "text-muted-foreground"
                                : "font-medium text-foreground"
                            }
                          >
                            {customer.totalOrders}
                          </span>
                        </td>
                        <td className="px-3 py-3 text-right font-medium whitespace-nowrap tabular-nums text-foreground">
                          {formatEuro(customer.totalSpent)}
                        </td>
                        <td className="px-5 py-3">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              onClick={() => setSelectedId(customer.id)}
                              aria-label={`View details for ${customer.fullName}`}
                            >
                              <Eye />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              disabled={updateCustomer.isPending}
                              onClick={() => requestSuspendToggle(customer)}
                              aria-label={
                                isSuspended
                                  ? `Reinstate ${customer.fullName}`
                                  : `Suspend ${customer.fullName}`
                              }
                              title={isSuspended ? "Reinstate account" : "Suspend account"}
                              className={
                                isSuspended
                                  ? "text-success hover:bg-success/10 hover:text-success"
                                  : "text-destructive hover:bg-destructive/10 hover:text-destructive"
                              }
                            >
                              {isSuspended ? <UserCheck /> : <Ban />}
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}

        {!isError && customers.length > 0 ? (
          <TablePagination
            page={page}
            pageSize={PAGE_SIZE}
            total={total}
            totalPages={totalPages}
            rowsOnPage={customers.length}
            onPageChange={setPage}
            noun="customers"
          />
        ) : null}
      </Card>

      <CustomerDetailsModal
        customer={selected ?? null}
        onClose={() => setSelectedId(null)}
        onToggleSuspend={(id) => {
          const customer = customers.find((c) => c.id === id);
          if (customer) requestSuspendToggle(customer);
        }}
      />

      {/* Suspending locks the customer out of their account — it used to fire
          from a single unguarded icon click. */}
      <ConfirmDialog
        open={!!pendingSuspend}
        onOpenChange={(open) => {
          if (!open) setPendingSuspend(null);
        }}
        title="Suspend this account?"
        description={
          <>
            <strong className="font-semibold text-foreground">
              {pendingSuspend?.fullName}
            </strong>{" "}
            will be signed out and blocked from placing orders until you reinstate them.
          </>
        }
        confirmLabel="Suspend account"
        onConfirm={() => {
          if (pendingSuspend) applySuspendToggle(pendingSuspend);
          setPendingSuspend(null);
        }}
      />
    </div>
  );
}
