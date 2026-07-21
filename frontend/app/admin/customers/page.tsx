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
  customers,
  customerStatuses,
  type Customer,
  type CustomerStatus,
} from "@/lib/admin/customers";

const PAGE_SIZE = 5;

const statusVariant: Record<CustomerStatus, "success" | "secondary"> = {
  Active: "success",
  Inactive: "secondary",
};

export default function CustomersPage() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"All" | CustomerStatus>("All");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Customer | null>(null);

  const avgSpend = useMemo(() => {
    const total = customers.reduce((sum, c) => sum + c.totalSpent, 0);
    return customers.length ? total / customers.length : 0;
  }, []);

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
  }, [search, status]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const start = (currentPage - 1) * PAGE_SIZE;
  const paged = filtered.slice(start, start + PAGE_SIZE);

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

      {/* Customers table */}
      <Card className="gap-0 overflow-hidden py-0">
        {/* Toolbar */}
        <div className="flex flex-col gap-3 border-b p-5 lg:flex-row lg:items-center lg:justify-between">
          <h2 className="font-display text-lg font-semibold text-foreground">All Customers</h2>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="relative sm:w-64">
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
            <NativeSelect
              aria-label="Filter by account status"
              className="h-10 sm:w-40"
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
            <SortButton />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full min-w-230 text-sm">
            <thead className="border-b bg-muted/50 text-xs font-semibold uppercase tracking-wider text-subtle">
              <tr>
                <th className="px-5 py-3 text-left">Customer Name</th>
                <th className="px-2 py-3 text-left">Email Address</th>
                <th className="px-2 py-3 text-left">Phone</th>
                <th className="px-2 py-3 text-right">Orders</th>
                <th className="px-2 py-3 text-right">Total Spending</th>
                <th className="px-2 py-3 text-left">Status</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {paged.map((customer) => (
                <tr key={customer.id} className="hover:bg-muted/30">
                  <td className="px-5 py-4">
                    <button
                      type="button"
                      onClick={() => setSelected(customer)}
                      className="flex items-center gap-3 rounded-lg text-left outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
                    >
                      <Avatar aria-hidden className="size-9">
                        <AvatarFallback className="bg-muted text-xs font-semibold text-foreground">
                          {customer.initials}
                        </AvatarFallback>
                      </Avatar>
                      <span className="font-semibold whitespace-nowrap text-foreground hover:underline">
                        {customer.name}
                      </span>
                    </button>
                  </td>
                  <td className="px-2 py-4 whitespace-nowrap text-muted-foreground">
                    {customer.email}
                  </td>
                  <td className="px-2 py-4 whitespace-nowrap text-muted-foreground">
                    {customer.phone}
                  </td>
                  <td className="px-2 py-4 text-right font-medium text-foreground">
                    {customer.totalOrders}
                  </td>
                  <td className="px-2 py-4 text-right font-semibold whitespace-nowrap text-foreground">
                    {formatEuro(customer.totalSpent)}
                  </td>
                  <td className="px-2 py-4">
                    <Badge variant={statusVariant[customer.status]} className="uppercase">
                      <span className="size-1.5 rounded-full bg-current" />
                      {customer.status}
                    </Badge>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex justify-end">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelected(customer)}
                        aria-label={`View details for ${customer.name}`}
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
                    <UsersRound className="mx-auto mb-2 size-8 text-muted-foreground" />
                    No customers match your filters.
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
              ? "No customers to show"
              : `Showing ${start + 1} to ${start + paged.length} of ${filtered.length} customers`}
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

      <CustomerDetailsModal customer={selected} onClose={() => setSelected(null)} />
    </div>
  );
}
