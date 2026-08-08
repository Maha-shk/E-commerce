"use client";

import { useState } from "react";
import {
  Search,
  Download,
  Plus,
  Pencil,
  Trash2,
  TicketPercent,
  CalendarClock,
  CircleCheck,
  Check,
  Copy,
  X,
} from "lucide-react";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/select-native";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { EditDiscountModal } from "@/components/admin/EditDiscountModal";
import { AdminStatCard, StatChip } from "@/components/admin/AdminStatCard";
import { TablePagination } from "@/components/admin/TablePagination";
import { TableEmptyState } from "@/components/admin/TableEmptyState";
import { ErrorState, TableSkeleton } from "@/components/admin/QueryState";
import {
  useDiscounts,
  useCreateDiscount,
  useUpdateDiscount,
  useDeleteDiscount,
} from "@/lib/hooks/use-admin";
import { useDebounce } from "@/lib/hooks/use-debounce";
import { downloadCsv } from "@/lib/admin/csv";
import { formatDate, formatEuro, titleCase } from "@/lib/admin/format";
import { discountTypeLabel, type Discount, type DiscountCategory } from "@/lib/api/models";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 10;

const statusVariant: Record<Discount["status"], "success" | "info" | "secondary"> = {
  Active: "success",
  Scheduled: "info",
  Expired: "secondary",
};

// ARCHIVED is intentionally absent: it was offered as a filter but nothing in
// the admin can archive a discount, so selecting it only ever showed an empty
// table.
const statusOptions: DiscountCategory[] = ["ACTIVE", "SCHEDULED"];

function formatDiscountValue(discount: Discount): string {
  return discount.type === "PERCENTAGE"
    ? `${discount.value}%`
    : formatEuro(discount.value);
}

/** Promo code with one-click copy — the whole point of this table. */
function DiscountCode({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard blocked — the code is still selectable on screen.
    }
  };

  return (
    <button
      type="button"
      onClick={copy}
      title={`Copy ${code}`}
      className="group inline-flex items-center gap-1.5 rounded-md bg-muted px-2 py-1 font-mono text-xs font-semibold text-foreground transition-colors hover:bg-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
    >
      {code}
      {copied ? (
        <Check className="size-3 shrink-0 text-success" aria-hidden />
      ) : (
        <Copy
          className="size-3 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100"
          aria-hidden
        />
      )}
      <span className="sr-only">{copied ? "Copied" : "Copy code"}</span>
    </button>
  );
}

export default function DiscountsPage() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"All" | DiscountCategory>("All");
  const [page, setPage] = useState(1);
  const [modalTarget, setModalTarget] = useState<Discount | "new" | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Discount | null>(null);

  const debouncedSearch = useDebounce(search);

  const { data, isPending, isFetching, isError, error, refetch } = useDiscounts({
    page,
    limit: PAGE_SIZE,
    search: debouncedSearch || undefined,
    category: status === "All" ? undefined : status,
  });

  /*
   * Real population counts, not counts of the ten rows in view.
   *
   * "Active" and "Scheduled" used to filter the current page and sit beside an
   * all-pages "Total Campaigns" as if the three were comparable.
   */
  const { data: allCount, isLoading: countsLoading } = useDiscounts({ limit: 1 });
  const { data: activeCount } = useDiscounts({ limit: 1, category: "ACTIVE" });
  const { data: scheduledCount } = useDiscounts({ limit: 1, category: "SCHEDULED" });

  const createDiscount = useCreateDiscount();
  const updateDiscount = useUpdateDiscount();
  const deleteDiscount = useDeleteDiscount();

  const discounts = data?.data ?? [];
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

  function handleExport() {
    downloadCsv(
      "discounts.csv",
      ["Name", "Code", "Type", "Value", "Starts", "Ends", "Status"],
      discounts.map((d) => [
        d.name,
        d.code,
        discountTypeLabel[d.type],
        formatDiscountValue(d),
        formatDate(d.startDate),
        formatDate(d.endDate),
        d.status,
      ]),
    );
  }

  function filterByCategory(next: DiscountCategory) {
    setStatus(next);
    setSearch("");
    setPage(1);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Discounts"
        subtitle="Create and manage promotional campaigns across the storefront."
        action={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="lg"
              onClick={handleExport}
              disabled={discounts.length === 0}
              title="Download the discounts on this page as CSV"
            >
              <Download className="size-4" aria-hidden />
              Export page
            </Button>
            <Button size="lg" onClick={() => setModalTarget("new")}>
              <Plus className="size-4" aria-hidden />
              Create Discount
            </Button>
          </div>
        }
      />

      {/* Stats. All three cards previously used the same `TicketX` glyph — an
          "invalid ticket" icon — so the row carried no visual distinction. */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <AdminStatCard
          label="Total campaigns"
          value={(allCount?.meta.total ?? 0).toLocaleString()}
          caption="All time"
          loading={countsLoading}
          corner={
            <StatChip className="bg-accent text-primary">
              <TicketPercent className="size-4" aria-hidden />
            </StatChip>
          }
        />

        <button
          type="button"
          onClick={() => filterByCategory("ACTIVE")}
          className="rounded-xl text-left transition-shadow hover:shadow-card-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        >
          <AdminStatCard
            label="Active"
            value={(activeCount?.meta.total ?? 0).toLocaleString()}
            caption="Tap to filter"
            loading={countsLoading}
            corner={
              <StatChip className="bg-success-muted text-success">
                <CircleCheck className="size-4" aria-hidden />
              </StatChip>
            }
          />
        </button>

        <button
          type="button"
          onClick={() => filterByCategory("SCHEDULED")}
          className="rounded-xl text-left transition-shadow hover:shadow-card-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        >
          <AdminStatCard
            label="Scheduled"
            value={(scheduledCount?.meta.total ?? 0).toLocaleString()}
            caption="Tap to filter"
            loading={countsLoading}
            corner={
              <StatChip className="bg-info-muted text-info">
                <CalendarClock className="size-4" aria-hidden />
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
              All Campaigns
            </h2>

            <NativeSelect
              aria-label="Filter by status"
              className="h-10 w-auto min-w-36"
              value={status}
              onChange={(e) =>
                withPageReset(setStatus)(e.target.value as "All" | DiscountCategory)
              }
            >
              <option value="All">All statuses</option>
              {statusOptions.map((s) => (
                <option key={s} value={s}>
                  {titleCase(s)}
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
              aria-label="Search discounts"
              placeholder="Search by name or code…"
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
                  <th className="px-5 py-3 text-left">Campaign</th>
                  <th className="px-3 py-3 text-left">Code</th>
                  <th className="px-3 py-3 text-left">Type</th>
                  <th className="px-3 py-3 text-right">Value</th>
                  <th className="px-3 py-3 text-left">Runs</th>
                  <th className="px-3 py-3 text-left">Status</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {isPending ? (
                  <TableSkeleton rows={PAGE_SIZE} columns={7} />
                ) : discounts.length === 0 ? (
                  <TableEmptyState
                    colSpan={7}
                    icon={TicketPercent}
                    title="No discounts found"
                    description={
                      hasFilters
                        ? "No campaigns match your filters."
                        : "Create a discount code to run your first promotion."
                    }
                    action={
                      hasFilters ? (
                        <Button variant="outline" onClick={clearFilters}>
                          Clear filters
                        </Button>
                      ) : (
                        <Button onClick={() => setModalTarget("new")}>
                          <Plus className="size-4" aria-hidden />
                          Create Discount
                        </Button>
                      )
                    }
                  />
                ) : (
                  discounts.map((discount) => {
                    const isExpired = discount.status === "Expired";

                    return (
                      <tr
                        key={discount.id}
                        className={cn(
                          "transition-colors hover:bg-muted/40",
                          isExpired && "opacity-70",
                        )}
                      >
                        <td className="px-5 py-3">
                          <button
                            type="button"
                            onClick={() => setModalTarget(discount)}
                            className="block max-w-xs truncate text-left font-medium text-foreground hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                          >
                            {discount.name}
                          </button>
                        </td>
                        <td className="px-3 py-3">
                          <DiscountCode code={discount.code} />
                        </td>
                        <td className="px-3 py-3 whitespace-nowrap text-muted-foreground">
                          {discountTypeLabel[discount.type]}
                        </td>
                        <td className="px-3 py-3 text-right font-medium whitespace-nowrap tabular-nums text-foreground">
                          {formatDiscountValue(discount)}
                        </td>
                        <td className="px-3 py-3 whitespace-nowrap text-muted-foreground tabular-nums">
                          {formatDate(discount.startDate)} – {formatDate(discount.endDate)}
                        </td>
                        <td className="px-3 py-3">
                          <Badge
                            variant={statusVariant[discount.status]}
                            className="h-6 px-2.5"
                          >
                            <span className="size-1.5 rounded-full bg-current" />
                            {discount.status}
                          </Badge>
                        </td>
                        <td className="px-5 py-3">
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
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}

        {!isError && discounts.length > 0 ? (
          <TablePagination
            page={page}
            pageSize={PAGE_SIZE}
            total={total}
            totalPages={totalPages}
            rowsOnPage={discounts.length}
            onPageChange={setPage}
            noun="discounts"
          />
        ) : null}
      </Card>

      <EditDiscountModal
        target={modalTarget}
        onClose={() => setModalTarget(null)}
        onCreate={(body) => createDiscount.mutate(body)}
        onUpdate={({ id, body }) => updateDiscount.mutate({ id, body })}
      />

      <ConfirmDialog
        open={!!pendingDelete}
        onOpenChange={(open) => {
          if (!open) setPendingDelete(null);
        }}
        title="Delete discount?"
        description={
          <>
            <strong className="font-semibold text-foreground">{pendingDelete?.name}</strong> (
            <code className="font-mono">{pendingDelete?.code}</code>) will be permanently
            removed. Customers who try the code will be told it&apos;s invalid.
          </>
        }
        confirmLabel="Delete discount"
        onConfirm={() => {
          if (pendingDelete) deleteDiscount.mutate(pendingDelete.id);
          setPendingDelete(null);
        }}
      />
    </div>
  );
}
