"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Search,
  Download,
  Plus,
  TrendingUp,
  ChevronLeft,
  ChevronRight,
  Package,
  PackageSearch,
  RefreshCw,
} from "lucide-react";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/select-native";
import { UpdateStockModal } from "@/components/admin/UpdateStockModal";
import {
  useInventory,
  useInventoryStats,
  useAdjustStock,
} from "@/lib/hooks/use-admin";
import { useDebounce } from "@/lib/hooks/use-debounce";
import { useCategories } from "@/lib/hooks/use-admin";
import { stockStatusLabel, type InventoryItem, type StockStatus } from "@/lib/api/models";
import { formatCompact } from "@/lib/admin/format";

const PAGE_SIZE = 5;

const statusVariant: Record<StockStatus, "success" | "warning" | "destructive"> = {
  IN_STOCK: "success",
  LOW_STOCK: "warning",
  OUT_OF_STOCK: "destructive",
};

const statusOptions: StockStatus[] = ["IN_STOCK", "LOW_STOCK", "OUT_OF_STOCK"];

function compactUsd(value: number): string {
  return `$${new Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: 0,
  }).format(value)}`;
}

export default function InventoryPage() {
  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState("All");
  const [status, setStatus] = useState<"All" | StockStatus>("All");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<InventoryItem | null>(null);

  const debouncedSearch = useDebounce(search);

  const { data, isLoading, isError, error, refetch } = useInventory({
    page,
    limit: PAGE_SIZE,
    search: debouncedSearch || undefined,
    categoryId: categoryId === "All" ? undefined : categoryId,
    status: status === "All" ? undefined : status,
  });

  const { data: stats } = useInventoryStats();
  const { data: categoriesData } = useCategories({ limit: 100 });
  const adjustStock = useAdjustStock();

  const inventory = data?.data ?? [];
  const totalPages = data?.meta.totalPages ?? 1;
  const categories = categoriesData?.data ?? [];

  function withPageReset<T>(setter: (value: T) => void) {
    return (value: T) => {
      setter(value);
      setPage(1);
    };
  }

  function handleExport() {
    const header = ["Name", "SKU", "Category", "Stock", "Status", "Last Updated"];
    const rows = inventory.map((i) => [
      i.name,
      i.sku,
      i.category || "N/A",
      String(i.stock),
      stockStatusLabel[i.status],
      new Date(i.lastUpdated).toLocaleDateString(),
    ]);
    const csv = [header, ...rows]
      .map((row) => row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "inventory.csv";
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Inventory Overview"
        subtitle="Real-time stock levels and availability tracking."
        action={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="xl" onClick={handleExport}>
              <Download />
              Export Data
            </Button>
            <Button asChild size="xl">
              <Link href="/products/new">
                <Plus />
                Add Product
              </Link>
            </Button>
          </div>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card>
          <CardContent className="flex flex-col gap-1">
            <p className="text-xs font-semibold uppercase tracking-wider text-subtle">Total SKU</p>
            <div className="flex items-baseline gap-2">
              <p className="font-display text-2xl font-semibold text-foreground">
                {(stats?.totalProducts ?? 0).toLocaleString()}
              </p>
              <span className="text-xs font-medium text-subtle">Products</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex flex-col gap-1">
            <p className="text-xs font-semibold uppercase tracking-wider text-subtle">Out of Stock</p>
            <div className="flex items-baseline gap-2">
              <p className="font-display text-2xl font-semibold text-destructive">
                {stats?.outOfStock ?? 0}
              </p>
              <span className="text-xs font-medium text-subtle">Items flagged</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex flex-col gap-1">
            <p className="text-xs font-semibold uppercase tracking-wider text-subtle">Low Stock</p>
            <div className="flex items-baseline gap-2">
              <p className="font-display text-2xl font-semibold text-warning">
                {stats?.lowStock ?? 0}
              </p>
              <span className="text-xs font-medium text-subtle">Reorder soon</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex flex-col gap-1">
            <p className="text-xs font-semibold uppercase tracking-wider text-subtle">Total Value</p>
            <div className="flex items-baseline gap-2">
              <p className="font-display text-2xl font-semibold text-foreground">
                {compactUsd(stats?.totalValue ?? 0)}
              </p>
              <span className="text-xs font-medium text-subtle">USD Est.</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Section heading */}
      <h2 className="font-display text-lg font-semibold text-foreground">All Inventories</h2>

      {/* Inventory table */}
      <Card className="gap-0 overflow-hidden py-0">
        {/* Toolbar: filters left, search + sort right */}
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
              aria-label="Filter by stock status"
              className="w-auto min-w-36"
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
          </div>

          <div className="flex items-center gap-2">
            <div className="relative flex-1 sm:w-72 sm:flex-none">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-subtle" />
              <Input
                type="search"
                placeholder="Search by name or SKU…"
                className="h-10 rounded-lg bg-card pl-9"
                value={search}
                onChange={(e) => withPageReset(setSearch)(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full min-w-240 text-sm">
            <thead className="border-b bg-muted/50 text-xs font-semibold uppercase tracking-wider text-subtle">
              <tr>
                <th className="px-5 py-3 text-left">Image</th>
                <th className="px-2 py-3 text-left">Product Name</th>
                <th className="px-2 py-3 text-left">SKU</th>
                <th className="px-2 py-3 text-left">Category</th>
                <th className="px-2 py-3 text-left">Status</th>
                <th className="px-2 py-3 text-left">Stock</th>
                <th className="px-2 py-3 text-left">Last Updated</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {inventory.map((item) => (
                <tr key={item.id} className="hover:bg-muted/30">
                  <td className="px-5 py-3">
                    <span className="flex size-11 items-center justify-center rounded-lg bg-linear-to-br from-accent to-muted text-primary">
                      <Package className="size-5" />
                    </span>
                  </td>
                  <td className="px-2 py-3">
                    <p className="font-semibold text-foreground">{item.name}</p>
                  </td>
                  <td className="px-2 py-3 whitespace-nowrap text-muted-foreground">{item.sku}</td>
                  <td className="px-2 py-3 whitespace-nowrap text-muted-foreground">
                    {item.category || "N/A"}
                  </td>
                  <td className="px-2 py-3">
                    <Badge variant={statusVariant[item.status]}>
                      <span className="size-1.5 rounded-full bg-current" />
                      {stockStatusLabel[item.status]}
                    </Badge>
                  </td>
                  <td className="px-2 py-3 font-semibold whitespace-nowrap text-foreground">
                    {item.stock.toLocaleString()}
                  </td>
                  <td className="px-2 py-3 whitespace-nowrap text-muted-foreground">
                    {new Date(item.lastUpdated).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelected(item)}
                        aria-label={`Update stock for ${item.name}`}
                      >
                        <RefreshCw />
                        Update Stock
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}

              {inventory.length === 0 && !isLoading && (
                <tr>
                  <td colSpan={8} className="px-4 py-14 text-center text-sm text-subtle">
                    <PackageSearch className="mx-auto mb-2 size-8 text-muted-foreground" />
                    No products match your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex flex-col gap-3 border-t px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-subtle">
            Showing {inventory.length} of {data?.meta.total ?? 0} products
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

      <UpdateStockModal
        item={selected}
        onClose={() => setSelected(null)}
        onSave={(adjustment) => {
          if (selected) {
            adjustStock.mutate({
              productId: selected.id,
              ...adjustment,
            });
          }
        }}
      />
    </div>
  );
}
