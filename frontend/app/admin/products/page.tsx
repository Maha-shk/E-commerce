"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Search,
  Download,
  Plus,
  Pencil,
  Trash2,
  Boxes,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  X,
} from "lucide-react";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/select-native";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { ProductThumb } from "@/components/admin/ProductThumb";
import { AdminStatCard, StatChip } from "@/components/admin/AdminStatCard";
import { TablePagination } from "@/components/admin/TablePagination";
import { TableEmptyState } from "@/components/admin/TableEmptyState";
import { ErrorState, TableSkeleton } from "@/components/admin/QueryState";
import {
  useCategories,
  useDeleteProduct,
  useInventoryStats,
  useProducts,
} from "@/lib/hooks/use-admin";
import { useDebounce } from "@/lib/hooks/use-debounce";
import { formatCompact, formatEuro } from "@/lib/admin/format";
import { downloadCsv } from "@/lib/admin/csv";
import { stockStatusLabel, type Product, type StockStatus } from "@/lib/api/models";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 10;

const statusVariant: Record<StockStatus, "success" | "warning" | "destructive"> = {
  IN_STOCK: "success",
  LOW_STOCK: "warning",
  OUT_OF_STOCK: "destructive",
};

const statusOptions: StockStatus[] = ["IN_STOCK", "LOW_STOCK", "OUT_OF_STOCK"];

export default function ProductsPage() {
  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState("All");
  const [status, setStatus] = useState<"All" | StockStatus>("All");
  const [page, setPage] = useState(1);
  const [pendingDelete, setPendingDelete] = useState<Product | null>(null);

  const debouncedSearch = useDebounce(search);

  // Filtering and pagination happen server-side.
  const { data, isPending, isFetching, isError, error, refetch } = useProducts({
    page,
    limit: PAGE_SIZE,
    search: debouncedSearch || undefined,
    categoryId: categoryId === "All" ? undefined : categoryId,
    status: status === "All" ? undefined : status,
  });

  const { data: categoriesData } = useCategories({ limit: 100 });
  const { data: stats, isLoading: statsLoading } = useInventoryStats();
  const deleteProduct = useDeleteProduct();

  const products = data?.data ?? [];
  const total = data?.meta.total ?? 0;
  const totalPages = data?.meta.totalPages ?? 1;
  const categories = categoriesData?.data ?? [];

  const hasFilters = Boolean(search) || categoryId !== "All" || status !== "All";

  /** Any filter change resets to the first page. */
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
      "products.csv",
      ["Name", "SKU", "Brand", "Category", "Status", "Price", "Stock"],
      products.map((p) => [
        p.name,
        p.sku,
        p.brand ?? "",
        p.category?.name ?? "",
        stockStatusLabel[p.status],
        p.price.toFixed(2),
        String(p.stock),
      ]),
    );
  }


  return (
    <div className="space-y-6">
      <PageHeader
        title="Products"
        subtitle="Manage your catalogue, pricing and stock levels."
        action={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="lg"
              onClick={handleExport}
              disabled={products.length === 0}
              // Labelled honestly: this writes the rows currently on screen,
              // not the whole catalogue. It used to just say "Export Data".
              title="Download the products on this page as CSV"
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

      {/* Stats (whole-catalog figures, independent of the current filters) */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <AdminStatCard
          label="Total inventory"
          value={(stats?.totalUnits ?? 0).toLocaleString()}
          caption={`${stats?.totalProducts ?? 0} SKUs`}
          loading={statsLoading}
          corner={
            <StatChip className="bg-accent text-primary">
              <Boxes className="size-4" aria-hidden />
            </StatChip>
          }
        />
        <AdminStatCard
          label="In stock"
          value={(
            (stats?.totalProducts ?? 0) -
            (stats?.outOfStock ?? 0) -
            (stats?.lowStock ?? 0)
          ).toLocaleString()}
          caption="Above the reorder point"
          loading={statsLoading}
          corner={
            <StatChip className="bg-success-muted text-success">
              <CheckCircle2 className="size-4" aria-hidden />
            </StatChip>
          }
        />
        <AdminStatCard
          label="Low stock"
          value={(stats?.lowStock ?? 0).toLocaleString()}
          caption="Reorder soon"
          tone={stats?.lowStock ? "warning" : "default"}
          loading={statsLoading}
          corner={
            <StatChip className="bg-warning-muted text-warning">
              <AlertTriangle className="size-4" aria-hidden />
            </StatChip>
          }
        />
        <AdminStatCard
          label="Catalogue value"
          value={`€${formatCompact(stats?.totalValue ?? 0)}`}
          caption="Estimated, at unit value"
          loading={statsLoading}
          corner={
            <StatChip className="bg-success-muted text-success">
              <TrendingUp className="size-4" aria-hidden />
            </StatChip>
          }
        />
      </div>

      <Card className="gap-0 py-0">
        {/* Toolbar. The "All Products" heading used to float outside the card,
            which broke the card-header pattern used everywhere else. */}
        <div className="flex flex-col gap-3 border-b border-border p-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <h2 className="mr-1 text-base font-semibold tracking-tight text-foreground">
              All Products
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
              aria-label="Filter by status"
              className="h-10 w-auto min-w-36"
              value={status}
              onChange={(e) =>
                withPageReset(setStatus)(e.target.value as "All" | StockStatus)
              }
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
              aria-label="Search products"
              placeholder="Search by name, SKU or brand…"
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
            // Dim rather than unmount while the next page loads — the table
            // used to collapse to skeletons on every keystroke and page change.
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
                  <th className="px-3 py-3 text-right">Price</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {isPending ? (
                  <TableSkeleton rows={PAGE_SIZE} columns={7} />
                ) : products.length === 0 ? (
                  <TableEmptyState
                    colSpan={7}
                    icon={Boxes}
                    title="No products found"
                    description={
                      hasFilters
                        ? "No products match your filters."
                        : "Add your first product to get started."
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
                  products.map((product) => (
                    <tr key={product.id} className="transition-colors hover:bg-muted/40">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          {/* The column was literally headed "Image" and showed
                              the same package icon for every single row. */}
                          <ProductThumb src={product.images?.[0]} />
                          <div className="min-w-0">
                            <Link
                              href={`/admin/products/${product.id}/edit`}
                              className="block truncate font-medium text-foreground hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                            >
                              {product.name}
                            </Link>
                            <p className="line-clamp-1 text-xs text-subtle">
                              {product.brand || product.description}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap text-muted-foreground tabular-nums">
                        {product.sku}
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap text-muted-foreground">
                        {product.category?.name ?? "—"}
                      </td>
                      <td className="px-3 py-3">
                        <Badge variant={statusVariant[product.status]} className="h-6 px-2.5">
                          <span className="size-1.5 rounded-full bg-current" />
                          {stockStatusLabel[product.status]}
                        </Badge>
                      </td>
                      <td className="px-3 py-3 text-right whitespace-nowrap tabular-nums text-muted-foreground">
                        {product.stock.toLocaleString()}
                      </td>
                      <td className="px-3 py-3 text-right font-medium whitespace-nowrap tabular-nums text-foreground">
                        {formatEuro(product.price)}
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            asChild
                            variant="ghost"
                            size="icon-sm"
                            aria-label={`Edit ${product.name}`}
                          >
                            <Link href={`/admin/products/${product.id}/edit`}>
                              <Pencil />
                            </Link>
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            aria-label={`Delete ${product.name}`}
                            className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                            onClick={() => setPendingDelete(product)}
                          >
                            <Trash2 />
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

        {!isError && products.length > 0 ? (
          <TablePagination
            page={page}
            pageSize={PAGE_SIZE}
            total={total}
            totalPages={totalPages}
            rowsOnPage={products.length}
            onPageChange={setPage}
            noun="products"
          />
        ) : null}
      </Card>

      <ConfirmDialog
        open={!!pendingDelete}
        onOpenChange={(open) => {
          if (!open) setPendingDelete(null);
        }}
        title="Delete product?"
        description={
          <>
            <strong className="font-semibold text-foreground">{pendingDelete?.name}</strong> will be
            permanently removed. This action cannot be undone.
          </>
        }
        confirmLabel="Delete product"
        onConfirm={() => {
          if (pendingDelete) deleteProduct.mutate(pendingDelete.id);
          setPendingDelete(null);
        }}
      />
    </div>
  );
}
