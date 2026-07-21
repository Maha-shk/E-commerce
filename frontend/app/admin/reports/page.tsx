import { CalendarClock, Download, ListFilter, Columns3, ChevronLeft, ChevronRight } from "lucide-react";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { NativeSelect } from "@/components/ui/select-native";
import { MetricCard } from "@/components/admin/MetricCard";
import { ReportStatusBadge } from "@/components/admin/ReportStatusBadge";
import { SortButton } from "@/components/admin/SortButton";
import {
  reportTabs,
  reportCategories,
  reportStatusOptions,
  reportMetrics,
  transactions,
  formatEuro,
} from "@/lib/admin/reports";
import { cn } from "@/lib/utils";

/** Compact field label used inside the filter panel. */
const fieldLabelClass = "text-xs font-medium text-subtle";
const controlClass = "h-11 rounded-lg bg-muted/40";

export default function ReportsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Reports Analytics"
        subtitle="Comprehensive data visualization and export tools."
        action={
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button variant="outline" size="xl">
              <CalendarClock />
              Schedule Report
            </Button>
            <Button size="xl">
              <Download />
              Export Data
            </Button>
          </div>
        }
      />

      {/* Report tabs (presentational) */}
      <div className="flex gap-6 overflow-x-auto border-b">
        {reportTabs.map((tab, i) => {
          const active = i === 0;
          return (
            <span
              key={tab}
              aria-current={active ? "page" : undefined}
              className={cn(
                "-mb-px whitespace-nowrap border-b-2 px-1 pb-3 text-sm font-medium transition-colors",
                active
                  ? "border-primary text-foreground"
                  : "border-transparent text-subtle hover:text-foreground",
              )}
            >
              {tab}
            </span>
          );
        })}
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="grid gap-4 lg:grid-cols-2">
          {/* Date range */}
          <div className="space-y-2">
            <label htmlFor="report-start" className={fieldLabelClass}>
              Date Range
            </label>
            <div className="flex items-center gap-3">
              <Input
                id="report-start"
                type="date"
                aria-label="Start date"
                className={cn(controlClass, "min-w-0 flex-1")}
              />
              <span className="shrink-0 text-sm text-subtle">to</span>
              <Input
                id="report-end"
                type="date"
                aria-label="End date"
                className={cn(controlClass, "min-w-0 flex-1")}
              />
            </div>
          </div>

          {/* Category + status */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label htmlFor="report-category" className={fieldLabelClass}>
                Category
              </label>
              <NativeSelect id="report-category" className={controlClass} defaultValue="All Categories">
                {reportCategories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </NativeSelect>
            </div>
            <div className="space-y-2">
              <label htmlFor="report-status" className={fieldLabelClass}>
                Status
              </label>
              <NativeSelect id="report-status" className={controlClass} defaultValue="Completed">
                {reportStatusOptions.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </NativeSelect>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary metrics */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {reportMetrics.map((metric) => (
          <MetricCard key={metric.label} {...metric} />
        ))}
      </div>

      {/* Detailed breakdown */}
      <Card className="gap-0 overflow-hidden py-0">
        {/* Toolbar */}
        <div className="flex flex-col gap-3 border-b p-5 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="font-display text-lg font-semibold text-foreground">Detailed Breakdown</h2>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <ListFilter />
              Filters
            </Button>
            <Button variant="outline" size="sm">
              <Columns3 />
              Columns
            </Button>
            <SortButton size="icon-sm" />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full min-w-200 text-sm">
            <thead className="border-b bg-muted/50 text-xs font-semibold uppercase tracking-wider text-subtle">
              <tr>
                <th className="px-5 py-3 text-left">Transaction ID</th>
                <th className="px-2 py-3 text-left">Customer Name</th>
                <th className="px-2 py-3 text-left">Date</th>
                <th className="px-2 py-3 text-left">Product Category</th>
                <th className="px-2 py-3 text-left">Amount</th>
                <th className="px-5 py-3 text-left">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {transactions.map((tx) => (
                <tr key={tx.id} className="hover:bg-muted/30">
                  <td className="px-5 py-4 font-semibold whitespace-nowrap text-foreground">
                    {tx.id}
                  </td>
                  <td className="px-2 py-4">
                    <div className="flex items-center gap-2.5">
                      <Avatar className="size-8">
                        <AvatarFallback className="bg-muted text-xs font-semibold text-foreground">
                          {tx.customer.initials}
                        </AvatarFallback>
                      </Avatar>
                      <span className="whitespace-nowrap font-medium text-foreground">
                        {tx.customer.name}
                      </span>
                    </div>
                  </td>
                  <td className="px-2 py-4 whitespace-nowrap text-muted-foreground">{tx.date}</td>
                  <td className="px-2 py-4 whitespace-nowrap text-muted-foreground">{tx.category}</td>
                  <td className="px-2 py-4 font-semibold whitespace-nowrap text-foreground">
                    {formatEuro(tx.amount)}
                  </td>
                  <td className="px-5 py-4">
                    <ReportStatusBadge status={tx.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination (static) */}
        <div className="flex flex-col gap-3 border-t px-5 py-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-subtle">Showing 1–10 of 2,492 entries</p>
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
