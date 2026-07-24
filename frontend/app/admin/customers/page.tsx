"use client";

import { useState } from "react";
import {
  Search,
  Download,
  TrendingUp,
  ChevronLeft,
  ChevronRight,
  UsersRound,
  Eye,
  Ban,
  UserCheck,
} from "lucide-react";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { NativeSelect } from "@/components/ui/select-native";
import { CustomerDetailsModal } from "@/components/admin/CustomerDetailsModal";
import {
  useCustomers,
  useCustomer,
  useUpdateCustomer,
} from "@/lib/hooks/use-admin";
import { useDebounce } from "@/lib/hooks/use-debounce";
import { formatEuro } from "@/lib/admin/format";
import { userStatusLabel, type CustomerListItem } from "@/lib/api/models";
import type { UserStatus } from "@/lib/api/types";

const PAGE_SIZE = 5;

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

  const debouncedSearch = useDebounce(search);

  const { data, isLoading, isError, error, refetch } = useCustomers({
    page,
    limit: PAGE_SIZE,
    search: debouncedSearch || undefined,
    status: status === "All" ? undefined : status,
  });

  const { data: selected } = useCustomer(selectedId);
  const { data: stats } = useCustomers({ limit: 1 }); // For overall stats
  const updateCustomer = useUpdateCustomer();

  const customers = data?.data ?? [];
  const totalPages = data?.meta.totalPages ?? 1;

  function withPageReset<T>(setter: (value: T) => void) {
    return (value: T) => {
      setter(value);
      setPage(1);
    };
  }

  function handleToggleSuspend(customer: CustomerListItem) {
    const newStatus: UserStatus = customer.status === "SUSPENDED" ? "ACTIVE" : "SUSPENDED";
    updateCustomer.mutate({
      id: customer.id,
      body: { status: newStatus },
    });
  }

  function handleExport() {
    const header = ["Name", "Email", "Phone", "Orders", "Total Spent", "Status", "Joined"];
    const rows = customers.map((c) => [
      c.fullName,
      c.email,
      c.phone || "",
      String(c.totalOrders),
      c.totalSpent.toFixed(2),
      c.status,
      new Date(c.createdAt).toLocaleDateString(),
    ]);
    const csv = [header, ...rows]
      .map((row) => row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "customers.csv";
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Customers"
        subtitle="Manage your global client base and spending history."
        action={
          <Button variant="outline" size="xl" onClick={handleExport}>
            <Download />
            Export Data
          </Button>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="flex flex-col gap-1">
            <p className="text-xs font-semibold uppercase tracking-wider text-subtle">
              Total Customers
            </p>
            <div className="flex items-baseline gap-2">
              <p className="font-display text-2xl font-semibold text-foreground">
                {stats?.meta.total ?? 0}
              </p>
              <span className="text-xs font-medium text-subtle">All time</span>
            </div>
            <p className="text-xs text-subtle">Registered users</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex flex-col gap-1">
            <p className="text-xs font-semibold uppercase tracking-wider text-subtle">Avg. Spend</p>
            <div className="flex items-baseline gap-2">
              <p className="font-display text-2xl font-semibold text-foreground">
                {formatEuro(
                  customers.length > 0
                    ? customers.reduce((sum, c) => sum + c.totalSpent, 0) / customers.length
                    : 0,
                )}
              </p>
              <span className="text-xs font-medium text-subtle">Per customer</span>
            </div>
            <p className="text-xs text-subtle">Average lifetime value</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex flex-col gap-1">
            <p className="text-xs font-semibold uppercase tracking-wider text-subtle">
              Active Customers
            </p>
            <div className="flex items-baseline gap-2">
              <p className="font-display text-2xl font-semibold text-foreground">
                {customers.filter((c) => c.status === "ACTIVE").length}
              </p>
              <span className="text-xs font-medium text-success">
                {customers.length > 0
                  ? `${Math.round((customers.filter((c) => c.status === "ACTIVE").length / customers.length) * 100)}%`
                  : "0%"}
              </span>
            </div>
            <p className="text-xs text-subtle">Currently active</p>
          </CardContent>
        </Card>
      </div>

      {/* Section heading */}
      <h2 className="font-display text-lg font-semibold text-foreground">All Customers</h2>

      {/* Customers table */}
      <Card className="gap-0 overflow-hidden py-0">
        {/* Toolbar: filters left, search + sort right */}
        <div className="flex flex-col gap-3 border-b p-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <NativeSelect
              aria-label="Filter by account status"
              className="w-auto min-w-36"
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
          </div>

          <div className="flex items-center gap-2">
            <div className="relative flex-1 sm:w-72 sm:flex-none">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-subtle" />
              <Input
                type="search"
                placeholder="Search by name, email or phone…"
                className="h-10 rounded-lg bg-card pl-9"
                value={search}
                onChange={(e) => withPageReset(setSearch)(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full min-w-205 text-sm">
            <thead className="border-b bg-muted/50 text-xs font-semibold uppercase tracking-wider text-subtle">
              <tr>
                <th className="px-5 py-3 text-left">Image</th>
                <th className="px-2 py-3 text-left">Customer Name</th>
                <th className="px-2 py-3 text-left">Email Address</th>
                <th className="px-2 py-3 text-left">Status</th>
                <th className="px-2 py-3 text-right">Orders</th>
                <th className="px-2 py-3 text-right">Total Spending</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {customers.map((customer) => {
                const isSuspended = customer.status === "SUSPENDED";
                return (
                  <tr key={customer.id} className="hover:bg-muted/30">
                    <td className="px-5 py-3">
                      <Avatar aria-hidden className="size-11">
                        <AvatarFallback className="bg-muted text-xs font-semibold text-foreground">
                          {customer.initials}
                        </AvatarFallback>
                      </Avatar>
                    </td>
                    <td className="px-2 py-3">
                      <button
                        type="button"
                        onClick={() => setSelectedId(customer.id)}
                        className="rounded-lg text-left font-semibold whitespace-nowrap text-foreground outline-none hover:underline focus-visible:ring-3 focus-visible:ring-ring/50"
                      >
                        {customer.fullName}
                      </button>
                    </td>
                    <td className="px-2 py-3 whitespace-nowrap text-muted-foreground">
                      {customer.email}
                    </td>
                    <td className="px-2 py-3">
                      <Badge variant={statusVariant[customer.status]} className="uppercase">
                        <span className="size-1.5 rounded-full bg-current" />
                        {userStatusLabel[customer.status]}
                      </Badge>
                    </td>
                    <td className="px-2 py-3 text-right font-medium text-foreground">
                      {customer.totalOrders}
                    </td>
                    <td className="px-2 py-3 text-right font-semibold whitespace-nowrap text-foreground">
                      {formatEuro(customer.totalSpent)}
                    </td>
                    <td className="px-4 py-3">
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
                          onClick={() => handleToggleSuspend(customer)}
                          aria-label={
                            isSuspended
                              ? `Reinstate ${customer.fullName}`
                              : `Suspend ${customer.fullName}`
                          }
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
              })}

              {customers.length === 0 && !isLoading && (
                <tr>
                  <td colSpan={7} className="px-4 py-14 text-center text-sm text-subtle">
                    <UsersRound className="mx-auto mb-2 size-8 text-muted-foreground" />
                    No customers match your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex flex-col gap-3 border-t px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-subtle">
            Showing {customers.length} of {data?.meta.total ?? 0} customers
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

      <CustomerDetailsModal
        customer={selected ?? null}
        onClose={() => setSelectedId(null)}
        onToggleSuspend={(id) => {
          const customer = customers.find((c) => c.id === id);
          if (customer) handleToggleSuspend(customer);
        }}
      />
    </div>
  );
}
