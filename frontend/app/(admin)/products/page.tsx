"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import {
  Search,
  Download,
  Plus,
  Pencil,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Boxes,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  Package,
} from "lucide-react";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/select-native";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { ErrorState, Skeleton, TableSkeleton } from "@/components/admin/QueryState";
import {
  useCategories,
  useDeleteProduct,
  useInventoryStats,
  useProducts,
} from "@/lib/hooks/use-admin";
import { useDebounce } from "@/lib/hooks/use-debounce";
import { formatCompact, formatEuro } from "@/lib/admin/format";
import { stockStatusLabel, type Product, type StockStatus } from "@/lib/api/models";

const PAGE_SIZE = 5;

const statusVariant: Record<StockStatus, "success" | "warning" | "destructive"> = {
  IN_STOCK: "success",
  LOW_STOCK: "warning",
  OUT_OF_STOCK: "destructive",
};

const statusOptions: StockStatus[] = ["IN_STOCK", "LOW_STOCK", "OUT_OF_STOCK"];

function StatCard({
  label,
  value,
  corner,
  loading,
}: {
  label: string;
  value: string;
  corner: ReactNode;
  loading?: boolean;
}) {
  return (
    <Card>
      <CardContent className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-subtle">{label}</p>
          {loading ? (
            <Skeleton className="mt-2 h-8 w-20" />
          ) : (
            <p className="mt-2 font-display text-2xl font-semibold text-foreground">{value}</p>
          )}
        </div>
        {corner}
      </CardContent>
    </Card>
  );
}

export default function ProductsPage() {
  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState("All");
  const [status, setStatus] = useState<"All" | StockStatus>("All");
  const [page, setPage] = useState(1);
  const [pendingDelete, setPendingDelete] = useState<Product | null>(null);

  const debouncedSearch = useDebounce(search);

  // Filtering and pagination happen server-side.
  const { data, isLoading, isError, error, refetch } = useProducts({
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
  const totalPages = data?.meta.totalPages ?? 1;
  const categories = categoriesData?.data ?? [];

  /** Any filter change resets to the first page. */
  function withPageReset<T>(setter: (value: T) => void) {
    return (value: T) => {
      setter(value);
      setPage(1);
    };
  }

  function handleExport() {
    const header = ["Name", "SKU", "Category", "Status", "Price", "Stock"];
    const rows = products.map((p) => [
      p.name,
      p.sku,
      p.category?.name ?? "",
      stockStatusLabel[p.status],
      p.price.toFixed(2),
      String(p.stock),
    ]);
    const csv = [header, ...rows]
      .map((row) => row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "products.csv";
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Products"
        subtitle="Manage your inventory across all precision service hubs."
        action={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="xl" onClick={handleExport}>
              <Download />
              Export Data
            </Button>
            <Button asChild size="xl">
              <Link href="/admin/products/new">
                <Plus />
                Add Product
              </Link>
            </Button>
          </div>
        }
      />

      {/* Stats (whole-catalog figures, independent of the current filters) */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Total Inventory"
          value={(stats?.totalUnits ?? 0).toLocaleString()}
          loading={statsLoading}
          corner={<Badge variant="success">{stats?.totalProducts ?? 0} SKUs</Badge>}
        />
        <StatCard
          label="In Stock"
          value={((stats?.totalProducts ?? 0) - (stats?.outOfStock ?? 0)).toLocaleString()}
          loading={statsLoading}
          corner={
            <span className="flex size-9 items-center justify-center rounded-full bg-success-muted text-success">
              <CheckCircle2 className="size-4" />
            </span>
          }
        />
        <StatCard
          label="Low Stock"
          value={(stats?.lowStock ?? 0).toLocaleString()}
          loading={statsLoading}
          corner={
            <span className="flex size-9 items-center justify-center rounded-full bg-warning-muted text-warning">
              <AlertTriangle className="size-4" />
            </span>
          }
        />
        <StatCard
          label="Active Value"
          value={`€${formatCompact(stats?.totalValue ?? 0)}`}
          loading={statsLoading}
          corner={
            <span className="flex size-9 items-center justify-center rounded-full bg-success-muted text-success">
              <TrendingUp className="size-4" />
            </span>
          }
        />
      </div>

      <h2 className="font-display text-lg font-semibold text-foreground">All Products</h2>

      <Card className="gap-0 overflow-hidden py-0">
        <div className="flex flex-col gap-3 border-b p-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <NativeSelect
              aria-label="Filter by category"
              className="w-auto min-w-40"
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
              className="w-auto min-w-36"
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
          </div>

          <div className="relative flex-1 sm:w-72 sm:flex-none">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-subtle" />
            <Input
              type="search"
              placeholder="Search by name, SKU or brand…"
              className="h-10 rounded-lg bg-card pl-9"
              value={search}
              onChange={(e) => withPageReset(setSearch)(e.target.value)}
            />
          </div>
        </div>

        {isError ? (
          <ErrorState error={error} onRetry={() => refetch()} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-205 text-sm">
              <thead className="border-b bg-muted/50 text-xs font-semibold uppercase tracking-wider text-subtle">
                <tr>
                  <th className="px-5 py-3 text-left">Image</th>
                  <th className="px-2 py-3 text-left">Product Name</th>
                  <th className="px-2 py-3 text-left">SKU</th>
                  <th className="px-2 py-3 text-left">Category</th>
                  <th className="px-2 py-3 text-left">Status</th>
                  <th className="px-2 py-3 text-right">Price</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {isLoading ? (
                  <TableSkeleton rows={PAGE_SIZE} columns={7} />
                ) : products.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-14 text-center text-sm text-subtle">
                      <Boxes className="mx-auto mb-2 size-8 text-muted-foreground" />
                      No products match your filters.
                    </td>
                  </tr>
                ) : (
                  products.map((product) => (
                    <tr key={product.id} className="hover:bg-muted/30">
                      <td className="px-5 py-3">
                        <span className="flex size-11 items-center justify-center rounded-lg bg-linear-to-br from-accent to-muted text-primary">
                          <Package className="size-5" />
                        </span>
                      </td>
                      <td className="px-2 py-3">
                        <p className="font-semibold text-foreground">{product.name}</p>
                        <p className="line-clamp-1 text-xs text-subtle">{product.description}</p>
                      </td>
                      <td className="px-2 py-3 whitespace-nowrap text-muted-foreground">
                        {product.sku}
                      </td>
                      <td className="px-2 py-3 whitespace-nowrap text-muted-foreground">
                        {product.category?.name ?? "—"}
                      </td>
                      <td className="px-2 py-3">
                        <Badge variant={statusVariant[product.status]}>
                          <span className="size-1.5 rounded-full bg-current" />
                          {stockStatusLabel[product.status]}
                        </Badge>
                      </td>
                      <td className="px-2 py-3 text-right font-semibold whitespace-nowrap text-foreground">
                        {formatEuro(product.price)}
                      </td>
                      <td className="px-4 py-3">
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

        <div className="flex flex-col gap-3 border-t px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-subtle">
            Showing {products.length} of {data?.meta.total ?? 0} products
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
