"use client";

import { useState } from "react";
import { Search, Download, ChevronLeft, ChevronRight, FileSearch } from "lucide-react";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { NativeSelect } from "@/components/ui/select-native";
import { MetricCard } from "@/components/admin/MetricCard";
import { ReportStatusBadge } from "@/components/admin/ReportStatusBadge";
import { useReport } from "@/lib/hooks/use-admin";
import { cn } from "@/lib/utils";
import { formatEuro } from "@/lib/admin/format";

type ReportTabKey = "orders" | "sales" | "products";

const reportTabs: { key: ReportTabKey; label: string }[] = [
  { key: "orders", label: "Orders" },
  { key: "sales", label: "Sales" },
  { key: "products", label: "Products" },
];

const statusOptions = ["All Statuses", "Completed", "Processing", "Returned"];

export default function ReportsPage() {
  const [tab, setTab] = useState<ReportTabKey>("orders");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [status, setStatus] = useState("All Statuses");

  const { data: view } = useReport({
    tab: tab,
    from: undefined,
    to: undefined,
    category: category === "All" ? undefined : category,
  });

  /** Category options come from the active report — they differ per tab. */
  const categoryOptions = view
    ? Array.from(new Set(view.rows.map((r) => r.detail)))
    : [];

  const rows = view
    ? view.rows.filter((row) => {
        const q = search.trim().toLowerCase();
        const matchesSearch =
          !q ||
          row.title.toLowerCase().includes(q) ||
          row.reference.toLowerCase().includes(q) ||
          row.subtitle.toLowerCase().includes(q);
        const matchesCategory = category === "All" || row.detail === category;
        const matchesStatus = status === "All Statuses" || row.status === status;
        return matchesSearch && matchesCategory && matchesStatus;
      })
    : [];

  function handleTabChange(key: ReportTabKey) {
    setTab(key);
    // Filters are scoped to a report, so reset them when switching.
    setSearch("");
    setCategory("All");
    setStatus("All Statuses");
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reports Analytics"
        subtitle="Comprehensive data visualization and export tools."
        action={
          <Button size="xl">
            <Download />
            Export Data
          </Button>
        }
      />

      {/* Report tabs */}
      <div className="flex flex-wrap gap-x-6 gap-y-1 border-b">
        {reportTabs.map((v) => {
          const active = v.key === tab;
          return (
            <button
              key={v.key}
              type="button"
              onClick={() => handleTabChange(v.key)}
              aria-current={active ? "page" : undefined}
              className={cn(
                "-mb-px whitespace-nowrap border-b-2 px-1 pb-3 text-sm font-medium transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
                active
                  ? "border-primary text-foreground"
                  : "border-transparent text-subtle hover:text-foreground",
              )}
            >
              {v.label}
            </button>
          );
        })}
      </div>

      {/* Summary metrics */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {view?.metrics.map((metric) => (
          <MetricCard
            key={metric.label}
            label={metric.label}
            value={String(metric.value)}
            trend={{ direction: "stable", text: "N/A" }}
          />
        ))}
      </div>

      {/* Section heading */}
      <h2 className="font-display text-lg font-semibold text-foreground">Detailed Report</h2>

      {/* Detailed report */}
      <Card className="gap-0 overflow-hidden py-0">
        {/* Toolbar: filters left, search + sort + schedule right */}
        <div className="flex flex-col gap-3 border-b p-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <NativeSelect
              aria-label="Filter by category"
              className="w-auto min-w-40"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              <option value="All">All categories</option>
              {categoryOptions.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </NativeSelect>

            <NativeSelect
              aria-label="Filter by status"
              className="w-auto min-w-36"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              {statusOptions.map((s) => (
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
                placeholder="Search this report…"
                className="h-10 rounded-lg bg-card pl-9"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
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
                <th className="px-2 py-3 text-left">{view?.columns.primary}</th>
                <th className="px-2 py-3 text-left">{view?.columns.reference}</th>
                <th className="px-2 py-3 text-left">{view?.columns.detail}</th>
                <th className="px-2 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-right">{view?.columns.amount}</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {rows.map((row) => (
                <tr key={row.id} className="hover:bg-muted/30">
                  <td className="px-5 py-3">
                    <Avatar aria-hidden className="size-11">
                      <AvatarFallback className="bg-muted text-xs font-semibold text-foreground">
                        {row.initials}
                      </AvatarFallback>
                    </Avatar>
                  </td>
                  <td className="px-2 py-3">
                    <p className="font-semibold text-foreground">{row.title}</p>
                    <p className="line-clamp-1 text-xs text-subtle">{row.subtitle}</p>
                  </td>
                  <td className="px-2 py-3 font-medium whitespace-nowrap text-muted-foreground">
                    {row.reference}
                  </td>
                  <td className="px-2 py-3 whitespace-nowrap text-muted-foreground">{row.detail}</td>
                  <td className="px-2 py-3">
                    <ReportStatusBadge status={row.status} />
                  </td>
                  <td
                    className={cn(
                      "px-4 py-3 text-right font-semibold whitespace-nowrap",
                      row.amount < 0 ? "text-destructive" : "text-foreground",
                    )}
                  >
                    {formatEuro(row.amount)}
                  </td>
                </tr>
              ))}

              {rows.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-14 text-center text-sm text-subtle">
                    <FileSearch className="mx-auto mb-2 size-8 text-muted-foreground" />
                    No entries match your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination (static) */}
        <div className="flex flex-col gap-3 border-t px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-subtle">
            Showing {rows.length} of {view?.totalEntries ?? 0} entries
          </p>
          <div className="flex items-center gap-1">
            <Button variant="outline" size="icon-sm" aria-label="Previous page" disabled>
              <ChevronLeft />
            </Button>
            <Button size="icon-sm" aria-current="page">
              1
            </Button>
            <Button variant="outline" size="icon-sm">
              2
            </Button>
            <Button variant="outline" size="icon-sm">
              3
            </Button>
            <Button variant="outline" size="icon-sm" aria-label="Next page">
              <ChevronRight />
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
