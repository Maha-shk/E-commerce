"use client";

import { useState } from "react";
import {
  Search,
  Download,
  Plus,
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
import { EditDiscountModal } from "@/components/admin/EditDiscountModal";
import { SortButton } from "@/components/admin/SortButton";
import {
  useDiscounts,
  useCreateDiscount,
  useUpdateDiscount,
  useDeleteDiscount,
} from "@/lib/hooks/use-admin";
import { useDebounce } from "@/lib/hooks/use-debounce";
import { discountTypeLabel, type Discount, type DiscountCategory } from "@/lib/api/models";

const PAGE_SIZE = 5;

const statusVariant: Record<DiscountCategory, "success" | "info" | "secondary"> = {
  ACTIVE: "success",
  SCHEDULED: "info",
  ARCHIVED: "secondary",
};

const statusOptions: DiscountCategory[] = ["ACTIVE", "SCHEDULED", "ARCHIVED"];

function formatDiscountValue(discount: Discount): string {
  if (discount.type === "PERCENTAGE") {
    return `${discount.value}%`;
  }
  return `€${discount.value.toFixed(2)}`;
}

export default function DiscountsPage() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"All" | DiscountCategory>("All");
  const [page, setPage] = useState(1);
  const [modalTarget, setModalTarget] = useState<Discount | "new" | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Discount | null>(null);

  const debouncedSearch = useDebounce(search);

  const { data, isLoading, isError, error, refetch } = useDiscounts({
    page,
    limit: PAGE_SIZE,
    search: debouncedSearch || undefined,
    category: status === "All" ? undefined : status,
  });

  const createDiscount = useCreateDiscount();
  const updateDiscount = useUpdateDiscount();
  const deleteDiscount = useDeleteDiscount();

  const discounts = data?.data ?? [];
  const totalPages = data?.meta.totalPages ?? 1;

  function withPageReset<T>(setter: (value: T) => void) {
    return (value: T) => {
      setter(value);
      setPage(1);
    };
  }

  function handleConfirmDelete() {
    if (!pendingDelete) return;
    deleteDiscount.mutate(pendingDelete.id);
    setPendingDelete(null);
  }

  function handleExport() {
    const header = ["Discount Name", "Code", "Type", "Value", "Status", "Usage"];
    const rows = discounts.map((d) => [
      d.name,
      d.code,
      d.type,
      formatDiscountValue(d),
      d.status,
      `${d.usageCount}/${d.usageLimit}`,
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
              Create Discount
            </Button>
          </div>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card className="p-5">
          <div className="flex items-center gap-3">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
              <TicketX className="size-5" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">Total Campaigns</p>
              <p className="font-display text-2xl font-semibold text-foreground">
                {data?.meta.total ?? 0}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex items-center gap-3">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-success-muted text-success">
              <TicketX className="size-5" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">Active</p>
              <p className="font-display text-2xl font-semibold text-foreground">
                {discounts.filter((d) => d.category === "ACTIVE").length}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex items-center gap-3">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-info-muted text-info">
              <TicketX className="size-5" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">Scheduled</p>
              <p className="font-display text-2xl font-semibold text-foreground">
                {discounts.filter((d) => d.category === "SCHEDULED").length}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Section heading */}
      <h2 className="font-display text-lg font-semibold text-foreground">All Campaigns</h2>

      {/* Discounts table */}
      <Card className="gap-0 overflow-hidden py-0">
        {/* Toolbar */}
        <div className="flex flex-col gap-3 border-b p-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <NativeSelect
              aria-label="Filter by status"
              className="w-auto min-w-36"
              value={status}
              onChange={(e) => withPageReset(setStatus)(e.target.value as "All" | DiscountCategory)}
            >
              <option value="All">All statuses</option>
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
                placeholder="Search by name or code…"
                className="h-10 rounded-lg bg-card pl-9"
                value={search}
                onChange={(e) => withPageReset(setSearch)(e.target.value)}
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
                <th className="px-5 py-3 text-left">Name</th>
                <th className="px-2 py-3 text-left">Code</th>
                <th className="px-2 py-3 text-left">Type</th>
                <th className="px-2 py-3 text-left">Value</th>
                <th className="px-2 py-3 text-left">Validity</th>
                <th className="px-2 py-3 text-left">Status</th>
                <th className="px-2 py-3 text-right">Usage</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {discounts.map((discount) => (
                <tr key={discount.id} className="hover:bg-muted/30">
                  <td className="px-5 py-3">
                    <p className="font-semibold text-foreground">{discount.name}</p>
                  </td>
                  <td className="px-2 py-3">
                    <code className="rounded-md bg-muted px-2 py-0.5 text-xs font-semibold text-foreground">
                      {discount.code}
                    </code>
                  </td>
                  <td className="px-2 py-3 text-muted-foreground">
                    {discountTypeLabel[discount.type]}
                  </td>
                  <td className="px-2 py-3 font-semibold whitespace-nowrap text-foreground">
                    {formatDiscountValue(discount)}
                  </td>
                  <td className="px-2 py-3 whitespace-nowrap text-muted-foreground">
                    {new Date(discount.startDate).toLocaleDateString()} - {new Date(discount.endDate).toLocaleDateString()}
                  </td>
                  <td className="px-2 py-3">
                    <Badge variant={statusVariant[discount.category]}>
                      {discount.status}
                    </Badge>
                  </td>
                  <td className="px-2 py-3 text-right text-muted-foreground">
                    {discount.usageCount}/{discount.usageLimit}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => setModalTarget(discount)}
                        aria-label={`Edit ${discount.name}`}
                      >
                        <Pencil />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => setPendingDelete(discount)}
                        aria-label={`Delete ${discount.name}`}
                        className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                      >
                        <Trash2 />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}

              {discounts.length === 0 && !isLoading && (
                <tr>
                  <td colSpan={8} className="px-4 py-14 text-center text-sm text-subtle">
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
            Showing {discounts.length} of {data?.meta.total ?? 0} discounts
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

      <EditDiscountModal
        target={modalTarget}
        onClose={() => setModalTarget(null)}
        onCreate={(body) => {
          createDiscount.mutate(body);
        }}
        onUpdate={({ id, body }) => {
          updateDiscount.mutate({ id, body });
        }}
      />

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
