"use client";

import { useState } from "react";
import { Search, Download, FileSearch, X } from "lucide-react";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { NativeSelect } from "@/components/ui/select-native";
import { ReportStatusBadge } from "@/components/admin/ReportStatusBadge";
import { AdminStatCard } from "@/components/admin/AdminStatCard";
import { TablePagination } from "@/components/admin/TablePagination";
import { TableEmptyState } from "@/components/admin/TableEmptyState";
import { ErrorState, TableSkeleton } from "@/components/admin/QueryState";
import { useReport } from "@/lib/hooks/use-admin";
import { downloadCsv } from "@/lib/admin/csv";
import { formatEuro } from "@/lib/admin/format";
import { cn } from "@/lib/utils";

type ReportTabKey = "orders" | "sales" | "products";

const reportTabs: { key: ReportTabKey; label: string }[] = [
  { key: "orders", label: "Orders" },
  { key: "sales", label: "Sales" },
  { key: "products", label: "Products" },
];

/** `ReportRow.status` is a closed union, so these are the only values. */
const statusOptions = ["Completed", "Processing", "Returned"] as const;

const PAGE_SIZE = 10;

export default function ReportsPage() {
  const [tab, setTab] = useState<ReportTabKey>("orders");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [status, setStatus] = useState("All");
  const [page, setPage] = useState(1);

  const { data: view, isPending, isFetching, isError, error, refetch } = useReport({
    tab,
    from: undefined,
    to: undefined,
    category: category === "All" ? undefined : category,
  });

  /** Any filter change invalidates the current page number. */
  function resetPage<T>(setter: (value: T) => void) {
    return (value: T) => {
      setter(value);
      setPage(1);
    };
  }

  /** Category options come from the active report — they differ per tab. */
  const categoryOptions = view ? Array.from(new Set(view.rows.map((r) => r.detail))) : [];

  const filteredRows = view
    ? view.rows.filter((row) => {
        const q = search.trim().toLowerCase();
        const matchesSearch =
          !q ||
          row.title.toLowerCase().includes(q) ||
          row.reference.toLowerCase().includes(q) ||
          row.subtitle.toLowerCase().includes(q);
        const matchesCategory = category === "All" || row.detail === category;
        const matchesStatus = status === "All" || row.status === status;
        return matchesSearch && matchesCategory && matchesStatus;
      })
    : [];

  // The report endpoint returns the whole set, so paging is done here. Every
  // matching row used to render at once, which is what made the table unusable
  // on a busy period.
  const totalPages = Math.max(1, Math.ceil(filteredRows.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const rows = filteredRows.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const hasFilters = Boolean(search) || category !== "All" || status !== "All";

  function handleTabChange(key: ReportTabKey) {
    setTab(key);
    setPage(1);
    // Filters are scoped to a report, so reset them when switching.
    setSearch("");
    setCategory("All");
    setStatus("All");
  }

  function clearFilters() {
    setSearch("");
    setCategory("All");
    setStatus("All");
    setPage(1);
  }

  /** Exports every filtered row, not just the page on screen. */
  function handleExport() {
    if (!view) return;

    downloadCsv(
      `report-${tab}.csv`,
      [
        view.columns.primary,
        "Detail line",
        view.columns.reference,
        view.columns.detail,
        "Status",
        view.columns.amount,
      ],
      filteredRows.map((row) => [
        row.title,
        row.subtitle,
        row.reference,
        row.detail,
        row.status,
        row.amount.toFixed(2),
      ]),
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reports"
        subtitle="Break down orders, sales and product performance."
        action={
          <Button
            size="lg"
            variant="outline"
            onClick={handleExport}
            disabled={filteredRows.length === 0}
            // The header button had no onClick at all — it did nothing.
            title="Download every filtered row as CSV"
          >
            <Download className="size-4" aria-hidden />
            Export report
          </Button>
        }
      />

      {/* Report tabs */}
      <div role="tablist" aria-label="Report" className="flex flex-wrap gap-x-6 gap-y-1 border-b border-border">
        {reportTabs.map((v) => {
          const active = v.key === tab;
          return (
            <button
              key={v.key}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => handleTabChange(v.key)}
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

      {/* Summary metrics. `ReportView.metrics` carries no trend data, so the
          old MetricCard rendered a fabricated "N/A" trend line under every
          figure — a row of indicators that indicated nothing. */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {isPending
          ? Array.from({ length: 4 }).map((_, i) => (
              <AdminStatCard key={i} label="" value="" loading />
            ))
          : (view?.metrics ?? []).map((metric) => (
              <AdminStatCard
                key={metric.label}
                label={metric.label}
                value={String(metric.value)}
              />
            ))}
      </div>

      <Card className="gap-0 py-0">
        {/* Toolbar */}
        <div className="flex flex-col gap-3 border-b border-border p-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <h2 className="mr-1 text-base font-semibold tracking-tight text-foreground">
              Detailed Report
            </h2>

            <NativeSelect
              aria-label="Filter by category"
              className="h-10 w-auto min-w-40"
              value={category}
              onChange={(e) => resetPage(setCategory)(e.target.value)}
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
              className="h-10 w-auto min-w-36"
              value={status}
              onChange={(e) => resetPage(setStatus)(e.target.value)}
            >
              <option value="All">All statuses</option>
              {statusOptions.map((s) => (
                <option key={s} value={s}>
                  {s}
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
              aria-label="Search this report"
              placeholder="Search this report…"
              className={cn("h-10 bg-card pl-9", search && "pr-9")}
              value={search}
              onChange={(e) => resetPage(setSearch)(e.target.value)}
            />
            {search ? (
              <button
                type="button"
                onClick={() => resetPage(setSearch)("")}
                aria-label="Clear search"
                className="absolute top-1/2 right-1.5 flex size-7 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
              >
                <X className="size-4" aria-hidden />
              </button>
            ) : null}
          </div>
        </div>

        {/* The page had no error or loading state at all: a failed request and
            an in-flight one both showed "No entries match your filters". */}
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
            <table className="w-full min-w-3xl text-sm">
              <thead className="border-b border-border bg-muted/50 text-xs font-semibold tracking-wider text-subtle uppercase">
                <tr>
                  {/* The avatar sat in its own column headed "Image". */}
                  <th className="px-5 py-3 text-left">{view?.columns.primary ?? "Item"}</th>
                  <th className="px-3 py-3 text-left">{view?.columns.reference ?? "Reference"}</th>
                  <th className="px-3 py-3 text-left">{view?.columns.detail ?? "Detail"}</th>
                  <th className="px-3 py-3 text-left">Status</th>
                  <th className="px-5 py-3 text-right">{view?.columns.amount ?? "Amount"}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {isPending ? (
                  <TableSkeleton rows={PAGE_SIZE} columns={5} />
                ) : rows.length === 0 ? (
                  <TableEmptyState
                    colSpan={5}
                    icon={FileSearch}
                    title="No entries found"
                    description={
                      hasFilters
                        ? "No rows match your filters."
                        : "This report has no data for the current period."
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
                  rows.map((row) => (
                    <tr key={row.id} className="transition-colors hover:bg-muted/40">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <Avatar aria-hidden className="size-9">
                            <AvatarFallback className="bg-muted text-xs font-semibold text-foreground">
                              {row.initials}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <p className="truncate font-medium text-foreground">{row.title}</p>
                            <p className="truncate text-xs text-subtle">{row.subtitle}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap text-muted-foreground tabular-nums">
                        {row.reference}
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap text-muted-foreground">
                        {row.detail}
                      </td>
                      <td className="px-3 py-3">
                        <ReportStatusBadge status={row.status} />
                      </td>
                      <td
                        className={cn(
                          "px-5 py-3 text-right font-medium whitespace-nowrap tabular-nums",
                          row.amount < 0 ? "text-destructive" : "text-foreground",
                        )}
                      >
                        {formatEuro(row.amount)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {!isError && rows.length > 0 ? (
          <TablePagination
            page={safePage}
            pageSize={PAGE_SIZE}
            total={filteredRows.length}
            totalPages={totalPages}
            rowsOnPage={rows.length}
            onPageChange={setPage}
            noun="entries"
          />
        ) : null}
      </Card>
    </div>
  );
}
