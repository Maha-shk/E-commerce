"use client";

import { useMemo, useState } from "react";
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
import { SortButton } from "@/components/admin/SortButton";
import { formatEuro } from "@/lib/admin/format";
import {
  customers as initialCustomers,
  customerStatuses,
  type Customer,
  type CustomerStatus,
} from "@/lib/admin/customers";

const PAGE_SIZE = 5;

const statusVariant: Record<CustomerStatus, "success" | "secondary" | "destructive"> = {
  Active: "success",
  Inactive: "secondary",
  Suspended: "destructive",
};

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>(initialCustomers);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"All" | CustomerStatus>("All");
  const [page, setPage] = useState(1);
  // Track by id so the open modal reflects status changes instead of a stale snapshot.
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const selected = customers.find((c) => c.id === selectedId) ?? null;

  const avgSpend = useMemo(() => {
    const total = customers.reduce((sum, c) => sum + c.totalSpent, 0);
    return customers.length ? total / customers.length : 0;
  }, [customers]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return customers.filter((c) => {
      const matchesSearch =
        !q ||
        c.name.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        c.phone.toLowerCase().includes(q);
      const matchesStatus = status === "All" || c.status === status;
      return matchesSearch && matchesStatus;
    });
  }, [customers, search, status]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const start = (currentPage - 1) * PAGE_SIZE;
  const paged = filtered.slice(start, start + PAGE_SIZE);

  function handleToggleSuspend(id: string) {
    setCustomers((prev) =>
      prev.map((c) =>
        c.id === id ? { ...c, status: c.status === "Suspended" ? "Active" : "Suspended" } : c,
      ),
    );
  }

  function handleExport() {
    const header = ["Name", "Email", "Phone", "Orders", "Total Spent", "Status", "Joined"];
    const rows = filtered.map((c) => [
      c.name,
      c.email,
      c.phone,
      String(c.totalOrders),
      c.totalSpent.toFixed(2),
      c.status,
      c.joinDate,
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
              New Customers
            </p>
            <div className="flex items-baseline gap-2">
              <p className="font-display text-2xl font-semibold text-foreground">+124</p>
              <span className="flex items-center gap-0.5 text-xs font-medium text-success">
                <TrendingUp className="size-3.5" />
                12%
              </span>
            </div>
            <p className="text-xs text-subtle">Compared to last month</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex flex-col gap-1">
            <p className="text-xs font-semibold uppercase tracking-wider text-subtle">Avg. Spend</p>
            <div className="flex items-baseline gap-2">
              <p className="font-display text-2xl font-semibold text-foreground">
                {formatEuro(avgSpend)}
              </p>
              <span className="text-xs font-medium text-subtle">~0%</span>
            </div>
            <p className="text-xs text-subtle">Stable across all segments</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex flex-col gap-1">
            <p className="text-xs font-semibold uppercase tracking-wider text-subtle">
              Retention Rate
            </p>
            <div className="flex items-baseline gap-2">
              <p className="font-display text-2xl font-semibold text-foreground">94.2%</p>
              <span className="flex items-center gap-0.5 text-xs font-medium text-success">
                <TrendingUp className="size-3.5" />
                2.4%
              </span>
            </div>
            <p className="text-xs text-subtle">Highest in Q3 2024</p>
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
              onChange={(e) => {
                setStatus(e.target.value as "All" | CustomerStatus);
                setPage(1);
              }}
            >
              <option value="All">All statuses</option>
              {customerStatuses.map((s) => (
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
                placeholder="Search by name, email or phone…"
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
              {paged.map((customer) => {
                const isSuspended = customer.status === "Suspended";
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
                        {customer.name}
                      </button>
                    </td>
                    <td className="px-2 py-3 whitespace-nowrap text-muted-foreground">
                      {customer.email}
                    </td>
                    <td className="px-2 py-3">
                      <Badge variant={statusVariant[customer.status]} className="uppercase">
                        <span className="size-1.5 rounded-full bg-current" />
                        {customer.status}
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
                          aria-label={`View details for ${customer.name}`}
                        >
                          <Eye />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => handleToggleSuspend(customer.id)}
                          aria-label={
                            isSuspended
                              ? `Reinstate ${customer.name}`
                              : `Suspend ${customer.name}`
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

              {paged.length === 0 && (
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
            Showing {paged.length} of {filtered.length} customers
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

      <CustomerDetailsModal
        customer={selected}
        onClose={() => setSelectedId(null)}
        onToggleSuspend={handleToggleSuspend}
      />
    </div>
  );
}
