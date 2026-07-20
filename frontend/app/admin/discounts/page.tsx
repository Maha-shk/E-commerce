"use client";

import { useMemo, useState } from "react";
import {
  Download,
  Plus,
  Tag,
  BarChart3,
  PiggyBank,
  ListFilter,
  Pencil,
  Trash2,
  ChevronLeft,
  ChevronRight,
  TicketX,
} from "lucide-react";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StatCard } from "@/components/admin/StatCard";
import { EditDiscountModal } from "@/components/admin/EditDiscountModal";
import {
  discounts,
  discountTabs,
  formatDiscountValue,
  type Discount,
  type DiscountCategory,
  type DiscountStatus,
} from "@/lib/admin/discounts";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 5;

const statusVariant: Record<DiscountStatus, "success" | "info" | "secondary"> = {
  Active: "success",
  Scheduled: "info",
  Expired: "secondary",
};

export default function DiscountsPage() {
  const [tab, setTab] = useState<DiscountCategory>("Active");
  const [page, setPage] = useState(1);
  const [modalTarget, setModalTarget] = useState<Discount | "new" | null>(null);

  const filtered = useMemo(() => discounts.filter((d) => d.category === tab), [tab]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const start = (currentPage - 1) * PAGE_SIZE;
  const paged = filtered.slice(start, start + PAGE_SIZE);

  function handleExport() {
    const header = ["Discount Name", "Code", "Type", "Value", "Status", "Usage Limit"];
    const rows = discounts.map((d) => [
      d.name,
      d.code,
      d.type,
      formatDiscountValue(d),
      d.status,
      String(d.usageLimit),
    ]);
    const csv = [header, ...rows]
      .map((row) => row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "discounts.csv";
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Discounts"
        subtitle="Create and manage promotional campaigns across the storefront."
        action={
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button variant="outline" size="xl" onClick={handleExport}>
              <Download />
              Export Data
            </Button>
            <Button size="xl" onClick={() => setModalTarget("new")}>
              <Plus />
              Add Discount
            </Button>
          </div>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          icon={Tag}
          label="Total Active Discounts"
          value="24"
          badge={<Badge variant="success">+12%</Badge>}
        />
        <StatCard icon={BarChart3} label="Total Usage" value="1,482" />
        <StatCard
          icon={PiggyBank}
          label="Revenue Saved"
          value="€12,400"
          badge={<Badge variant="secondary">Target Met</Badge>}
        />
      </div>

      {/* Status tabs */}
      <div className="flex gap-6 overflow-x-auto border-b">
        {discountTabs.map(({ key, count }) => {
          const active = tab === key;
          return (
            <button
              key={key}
              type="button"
              onClick={() => {
                setTab(key);
                setPage(1);
              }}
              aria-current={active ? "page" : undefined}
              className={cn(
                "-mb-px whitespace-nowrap border-b-2 px-1 pb-3 text-sm font-medium transition-colors",
                active
                  ? "border-primary text-foreground"
                  : "border-transparent text-subtle hover:text-foreground",
              )}
            >
              {key} <span className="text-subtle">({count})</span>
            </button>
          );
        })}
      </div>

      {/* Campaign list */}
      <Card className="gap-0 overflow-hidden py-0">
        {/* Toolbar */}
        <div className="flex items-center justify-between gap-3 border-b p-5">
          <h2 className="font-display text-lg font-semibold text-foreground">Campaign List</h2>
          <div className="flex items-center gap-1">
            <Button variant="outline" size="icon" aria-label="Filter campaigns">
              <ListFilter className="size-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              aria-label="Download campaign list"
              onClick={handleExport}
            >
              <Download className="size-4" />
            </Button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full min-w-200 text-sm">
            <thead className="border-b bg-muted/50 text-xs font-semibold uppercase tracking-wider text-subtle">
              <tr>
                <th className="px-5 py-3 text-left">Discount Name</th>
                <th className="px-2 py-3 text-left">Code</th>
                <th className="px-2 py-3 text-left">Type</th>
                <th className="px-2 py-3 text-left">Value</th>
                <th className="px-2 py-3 text-left">Status</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {paged.map((discount) => {
                const Icon = discount.icon;
                return (
                  <tr key={discount.id} className="hover:bg-muted/30">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-accent text-primary">
                          <Icon className="size-4" />
                        </span>
                        <span className="font-semibold whitespace-nowrap text-foreground">
                          {discount.name}
                        </span>
                      </div>
                    </td>
                    <td className="px-2 py-4">
                      <span className="font-mono text-xs font-medium tracking-wide text-muted-foreground">
                        {discount.code}
                      </span>
                    </td>
                    <td className="px-2 py-4 whitespace-nowrap text-muted-foreground">
                      {discount.type}
                    </td>
                    <td className="px-2 py-4 font-semibold whitespace-nowrap text-foreground">
                      {formatDiscountValue(discount)}
                    </td>
                    <td className="px-2 py-4">
                      <Badge variant={statusVariant[discount.status]}>
                        <span className="size-1.5 rounded-full bg-current" />
                        {discount.status}
                      </Badge>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          aria-label={`Edit ${discount.name}`}
                          onClick={() => setModalTarget(discount)}
                        >
                          <Pencil />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          aria-label={`Delete ${discount.name}`}
                          className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                        >
                          <Trash2 />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {paged.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-14 text-center text-sm text-subtle">
                    <TicketX className="mx-auto mb-2 size-8 text-muted-foreground" />
                    No discounts in this category.
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
              ? "No discounts to show"
              : `Showing ${start + 1} to ${start + paged.length} of ${filtered.length} discounts`}
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

      <EditDiscountModal target={modalTarget} onClose={() => setModalTarget(null)} />
    </div>
  );
}
