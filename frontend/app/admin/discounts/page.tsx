"use client";

import { useMemo, useState } from "react";
import {
  Search,
  Download,
  Plus,
  Tag,
  BarChart3,
  PiggyBank,
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
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/select-native";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { StatCard } from "@/components/admin/StatCard";
import { EditDiscountModal } from "@/components/admin/EditDiscountModal";
import { SortButton } from "@/components/admin/SortButton";
import {
  discounts,
  discountStatuses,
  formatDiscountValue,
  type Discount,
  type DiscountStatus,
} from "@/lib/admin/discounts";

const PAGE_SIZE = 5;

const statusVariant: Record<DiscountStatus, "success" | "info" | "secondary"> = {
  Active: "success",
  Scheduled: "info",
  Expired: "secondary",
};

export default function DiscountsPage() {
  const [campaigns, setCampaigns] = useState<Discount[]>(discounts);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"All" | DiscountStatus>("All");
  const [page, setPage] = useState(1);
  const [modalTarget, setModalTarget] = useState<Discount | "new" | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Discount | null>(null);

  function handleConfirmDelete() {
    if (!pendingDelete) return;
    setCampaigns((prev) => prev.filter((d) => d.id !== pendingDelete.id));
    setPendingDelete(null);
  }

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return campaigns.filter((d) => {
      const matchesSearch =
        !q || d.name.toLowerCase().includes(q) || d.code.toLowerCase().includes(q);
      const matchesStatus = status === "All" || d.status === status;
      return matchesSearch && matchesStatus;
    });
  }, [campaigns, search, status]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const start = (currentPage - 1) * PAGE_SIZE;
  const paged = filtered.slice(start, start + PAGE_SIZE);

  function handleExport() {
    const header = ["Discount Name", "Code", "Type", "Value", "Status", "Usage Limit"];
    const rows = campaigns.map((d) => [
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

      {/* Section heading */}
      <h2 className="font-display text-lg font-semibold text-foreground">All Discounts</h2>

      {/* Campaign list */}
      <Card className="gap-0 overflow-hidden py-0">
        {/* Toolbar: filters left, search + sort right */}
        <div className="flex flex-col gap-3 border-b p-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <NativeSelect
              aria-label="Filter by discount status"
              className="w-auto min-w-36"
              value={status}
              onChange={(e) => {
                setStatus(e.target.value as "All" | DiscountStatus);
                setPage(1);
              }}
            >
              <option value="All">All statuses</option>
              {discountStatuses.map((s) => (
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
                placeholder="Search by name or code…"
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
                <th className="px-2 py-3 text-left">Discount Name</th>
                <th className="px-2 py-3 text-left">Code</th>
                <th className="px-2 py-3 text-left">Type</th>
                <th className="px-2 py-3 text-left">Status</th>
                <th className="px-2 py-3 text-right">Value</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {paged.map((discount) => {
                const Icon = discount.icon;
                return (
                  <tr key={discount.id} className="hover:bg-muted/30">
                    <td className="px-5 py-3">
                      <span className="flex size-11 items-center justify-center rounded-lg bg-linear-to-br from-accent to-muted text-primary">
                        <Icon className="size-5" />
                      </span>
                    </td>
                    <td className="px-2 py-3">
                      <p className="font-semibold text-foreground">{discount.name}</p>
                      <p className="line-clamp-1 text-xs text-subtle">
                        {discount.startDate} – {discount.endDate}
                      </p>
                    </td>
                    <td className="px-2 py-3">
                      <span className="font-mono text-xs font-medium tracking-wide text-muted-foreground">
                        {discount.code}
                      </span>
                    </td>
                    <td className="px-2 py-3 whitespace-nowrap text-muted-foreground">
                      {discount.type}
                    </td>
                    <td className="px-2 py-3">
                      <Badge variant={statusVariant[discount.status]}>
                        <span className="size-1.5 rounded-full bg-current" />
                        {discount.status}
                      </Badge>
                    </td>
                    <td className="px-2 py-3 text-right font-semibold whitespace-nowrap text-foreground">
                      {formatDiscountValue(discount)}
                    </td>
                    <td className="px-4 py-3">
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
                          onClick={() => setPendingDelete(discount)}
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
                  <td colSpan={7} className="px-4 py-14 text-center text-sm text-subtle">
                    <TicketX className="mx-auto mb-2 size-8 text-muted-foreground" />
                    No discounts match your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex flex-col gap-3 border-t px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-subtle">
            Showing {paged.length} of {filtered.length} discounts
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

      <ConfirmDialog
        open={!!pendingDelete}
        onOpenChange={(open) => {
          if (!open) setPendingDelete(null);
        }}
        title="Delete discount?"
        description={
          <>
            <strong className="font-semibold text-foreground">{pendingDelete?.name}</strong> will be
            permanently removed. This action cannot be undone.
          </>
        }
        confirmLabel="Delete discount"
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}
