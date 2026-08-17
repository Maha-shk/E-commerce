"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Search,
  Download,
  Plus,
  Boxes,
  PackageSearch,
  PackageX,
  AlertTriangle,
  RefreshCw,
  Wallet,
  X,
} from "lucide-react";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/select-native";
import { UpdateStockModal } from "@/components/admin/UpdateStockModal";
import { AdminStatCard, StatChip } from "@/components/admin/AdminStatCard";
import { StockDemandCard } from "@/components/admin/StockDemandCard";
import { TablePagination } from "@/components/admin/TablePagination";
import { TableEmptyState } from "@/components/admin/TableEmptyState";
import { ErrorState, TableSkeleton } from "@/components/admin/QueryState";
import {
  useInventory,
  useInventoryStats,
  useAdjustStock,
} from "@/lib/hooks/use-admin";
import { useCatalogList } from "@/lib/hooks/use-catalog";
import { useDebounce } from "@/lib/hooks/use-debounce";
import { downloadCsv } from "@/lib/admin/csv";
import { formatCompact, formatDate, formatEuro, formatRelative } from "@/lib/admin/format";
import { stockStatusLabel, type InventoryItem, type StockStatus } from "@/lib/api/models";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 10;

const statusVariant: Record<StockStatus, "success" | "warning" | "destructive"> = {
  IN_STOCK: "success",
  LOW_STOCK: "warning",
  OUT_OF_STOCK: "destructive",
};

const statusOptions: StockStatus[] = ["IN_STOCK", "LOW_STOCK", "OUT_OF_STOCK"];

/**
 * Stock level against the reorder threshold.
 *
 * Replaces a dead "Image" column — `InventoryItem` carries no image field, so
 * that column rendered the same package icon on every row and told the admin
 * nothing. On an inventory screen, how close a line is to reordering is the
 * information actually worth the width.
 */
function StockLevel({ stock, threshold }: { stock: number; threshold: number }) {
  // Full bar at 3× the reorder threshold — beyond that the exact figure
  // matters more than the bar, and the number is right beside it.
  const ceiling = Math.max(threshold * 3, 1);
  const pct = Math.min(100, (stock / ceiling) * 100);

  const tone =
    stock === 0 ? "bg-destructive" : stock <= threshold ? "bg-warning" : "bg-success";

  return (
    // Bar first, figure last. The column header is right-aligned, so the
    // rightmost thing in the cell has to be the number — it previously sat to
    // the LEFT of the bar in a fixed-width box, which left the digits floating
    // mid-cell and never lining up with the header or with each other.
    <div className="flex items-center justify-end gap-3">
      <span
        className="h-1.5 w-16 shrink-0 overflow-hidden rounded-full bg-muted"
        role="img"
        aria-label={`${stock} in stock, reorder at ${threshold}`}
      >
        <span
          className={cn("block h-full rounded-full transition-all duration-300", tone)}
          style={{ width: `${Math.max(pct, stock > 0 ? 4 : 0)}%` }}
        />
      </span>
      {/* Fixed width + tabular figures so the ones column lines up down the
          table however many digits each row has. */}
      <span className="w-12 text-right font-medium tabular-nums text-foreground">
        {stock.toLocaleString()}
      </span>
    </div>
  );
}

export default function InventoryPage() {
  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState("All");
  const [status, setStatus] = useState<"All" | StockStatus>("All");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<InventoryItem | null>(null);

  const debouncedSearch = useDebounce(search);

  const { data, isPending, isFetching, isError, error, refetch } = useInventory({
    page,
    limit: PAGE_SIZE,
    search: debouncedSearch || undefined,
    categoryId: categoryId === "All" ? undefined : categoryId,
    status: status === "All" ? undefined : status,
  });

  const { data: stats, isLoading: statsLoading } = useInventoryStats();
  // The filter still works on Category, three levels above a product — the
  // inventory endpoint resolves the path down to it server-side.
  const { data: categoriesData } = useCatalogList("categories", {
    limit: 100,
    withCounts: false,
    sortBy: "name",
    sortOrder: "asc",
  });
  const adjustStock = useAdjustStock();

  const inventory = data?.data ?? [];
  const total = data?.meta.total ?? 0;
  const totalPages = data?.meta.totalPages ?? 1;
  const categories = categoriesData?.data ?? [];
  const threshold = stats?.lowStockThreshold ?? 10;

  const hasFilters = Boolean(search) || categoryId !== "All" || status !== "All";

  function withPageReset<T>(setter: (value: T) => void) {
    return (value: T) => {
      setter(value);
      setPage(1);
    };
  }

  function clearFilters() {
    setSearch("");
    setCategoryId("All");
    setStatus("All");
    setPage(1);
  }

  function handleExport() {
    downloadCsv(
      "inventory.csv",
      [
        "Name",
        "SKU",
        "Category",
        "Company",
        "Model",
        "Stock",
        "Unit value",
        "Status",
        "Last updated",
      ],
      inventory.map((i) => [
        i.name,
        i.sku,
        i.category.name,
        i.company.name,
        i.model.name,
        String(i.stock),
        i.unitValue.toFixed(2),
        stockStatusLabel[i.status],
        formatDate(i.lastUpdated),
      ]),
    );
  }

  /** Jump straight to the lines that need attention. */
  function showNeedsAttention(next: StockStatus) {
    setStatus(next);
    setCategoryId("All");
    setSearch("");
    setPage(1);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Inventory"
        subtitle="Live stock levels and reorder alerts across the catalogue."
        action={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="lg"
              onClick={handleExport}
              disabled={inventory.length === 0}
              title="Download the rows on this page as CSV"
            >
              <Download className="size-4" aria-hidden />
              Export page
            </Button>
            <Button asChild size="lg">
              <Link href="/admin/products/new">
                <Plus className="size-4" aria-hidden />
                Add Product
              </Link>
            </Button>
          </div>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <AdminStatCard
          label="Total SKUs"
          value={(stats?.totalProducts ?? 0).toLocaleString()}
          caption={`${(stats?.totalUnits ?? 0).toLocaleString()} units on hand`}
          loading={statsLoading}
          corner={
            <StatChip className="bg-accent text-primary">
              <Boxes className="size-4" aria-hidden />
            </StatChip>
          }
        />

        <button
          type="button"
          onClick={() => showNeedsAttention("OUT_OF_STOCK")}
          className="rounded-xl text-left transition-shadow hover:shadow-card-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        >
          <AdminStatCard
            label="Out of stock"
            value={(stats?.outOfStock ?? 0).toLocaleString()}
            caption="Tap to filter"
            tone={stats?.outOfStock ? "destructive" : "default"}
            loading={statsLoading}
            corner={
              <StatChip className="bg-destructive/10 text-destructive">
                <PackageX className="size-4" aria-hidden />
              </StatChip>
            }
          />
        </button>

        <button
          type="button"
          onClick={() => showNeedsAttention("LOW_STOCK")}
          className="rounded-xl text-left transition-shadow hover:shadow-card-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        >
          <AdminStatCard
            label="Low stock"
            value={(stats?.lowStock ?? 0).toLocaleString()}
            caption={`At or below ${threshold} units`}
            tone={stats?.lowStock ? "warning" : "default"}
            loading={statsLoading}
            corner={
              <StatChip className="bg-warning-muted text-warning">
                <AlertTriangle className="size-4" aria-hidden />
              </StatChip>
            }
          />
        </button>

        <AdminStatCard
          label="Stock value"
          // This said "USD Est." and formatted with a "$" — on a store that
          // prices, charges and reports in EUR everywhere else.
          value={`€${formatCompact(stats?.totalValue ?? 0)}`}
          caption="Estimated, at unit value"
          loading={statsLoading}
          corner={
            <StatChip className="bg-success-muted text-success">
              <Wallet className="size-4" aria-hidden />
            </StatChip>
          }
        />
      </div>

      {/* Above the stock table on purpose: this is the prioritised subset of
          it. Renders nothing when nobody is waiting. */}
      <StockDemandCard />

      <Card className="gap-0 py-0">
        {/* Toolbar */}
        <div className="flex flex-col gap-3 border-b border-border p-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <h2 className="mr-1 text-base font-semibold tracking-tight text-foreground">
              Stock Levels
            </h2>

            <NativeSelect
              aria-label="Filter by category"
              className="h-10 w-auto min-w-40"
              value={categoryId}
              onChange={(e) => withPageReset(setCategoryId)(e.target.value)}
            >
              <option value="All">All categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </NativeSelect>

            <NativeSelect
              aria-label="Filter by stock status"
              className="h-10 w-auto min-w-36"
              value={status}
              onChange={(e) => withPageReset(setStatus)(e.target.value as "All" | StockStatus)}
            >
              <option value="All">All statuses</option>
              {statusOptions.map((s) => (
                <option key={s} value={s}>
                  {stockStatusLabel[s]}
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
              aria-label="Search inventory"
              placeholder="Search by name or SKU…"
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

        {/* A failed request used to fall through to the same "No products match
            your filters" row as an empty result. */}
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
                  <th className="px-5 py-3 text-left">Product</th>
                  <th className="px-3 py-3 text-left">SKU</th>
                  <th className="px-3 py-3 text-left">Category</th>
                  <th className="px-3 py-3 text-left">Status</th>
                  <th className="px-3 py-3 text-right">Stock</th>
                  <th className="px-3 py-3 text-right">Unit value</th>
                  <th className="px-3 py-3 text-left">Updated</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {isPending ? (
                  <TableSkeleton rows={PAGE_SIZE} columns={8} />
                ) : inventory.length === 0 ? (
                  <TableEmptyState
                    colSpan={8}
                    icon={PackageSearch}
                    title="No stock records found"
                    description={
                      hasFilters
                        ? "No products match your filters."
                        : "Add a product to start tracking stock."
                    }
                    action={
                      hasFilters ? (
                        <Button variant="outline" onClick={clearFilters}>
                          Clear filters
                        </Button>
                      ) : (
                        <Button asChild>
                          <Link href="/admin/products/new">
                            <Plus className="size-4" aria-hidden />
                            Add Product
                          </Link>
                        </Button>
                      )
                    }
                  />
                ) : (
                  inventory.map((item) => (
                    <tr key={item.id} className="transition-colors hover:bg-muted/40">
                      <td className="px-5 py-3">
                        <Link
                          href={`/admin/products/${item.id}/edit`}
                          className="block max-w-xs truncate font-medium text-foreground hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                        >
                          {item.name}
                        </Link>
                        {/* Which model this part fits — on a stock screen that
                            is usually what disambiguates two similar lines. */}
                        <p className="max-w-xs truncate text-xs text-subtle">
                          {item.company.name} · {item.model.name}
                        </p>
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap text-muted-foreground tabular-nums">
                        {item.sku}
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap text-muted-foreground">
                        {item.category.name}
                      </td>
                      <td className="px-3 py-3">
                        <Badge variant={statusVariant[item.status]} className="h-6 px-2.5">
                          <span className="size-1.5 rounded-full bg-current" />
                          {stockStatusLabel[item.status]}
                        </Badge>
                      </td>
                      <td className="px-3 py-3">
                        <StockLevel stock={item.stock} threshold={threshold} />
                      </td>
                      <td className="px-3 py-3 text-right whitespace-nowrap tabular-nums text-muted-foreground">
                        {formatEuro(item.unitValue)}
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap text-muted-foreground">
                        {/* "2 days ago" beats a bare date when the question is
                            "has anyone touched this recently?" */}
                        <span title={formatDate(item.lastUpdated)}>
                          {formatRelative(item.lastUpdated)}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex justify-end">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelected(item)}
                            aria-label={`Update stock for ${item.name}`}
                          >
                            <RefreshCw className="size-3.5" aria-hidden />
                            Update
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {!isError && inventory.length > 0 ? (
          <TablePagination
            page={page}
            pageSize={PAGE_SIZE}
            total={total}
            totalPages={totalPages}
            rowsOnPage={inventory.length}
            onPageChange={setPage}
            noun="products"
          />
        ) : null}
      </Card>

      <UpdateStockModal
        item={selected}
        onClose={() => setSelected(null)}
        onSave={(adjustment) => {
          if (selected) {
            adjustStock.mutate({ productId: selected.id, ...adjustment });
          }
        }}
      />
    </div>
  );
}
