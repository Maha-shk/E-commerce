"use client";

import { useMemo, useState } from "react";
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
  inventory,
  inventoryCategories,
  stockStatuses,
  type InventoryItem,
  type StockStatus,
} from "@/lib/admin/inventory";

const PAGE_SIZE = 4;

const statusVariant: Record<StockStatus, "success" | "warning" | "destructive"> = {
  "In Stock": "success",
  "Low Stock": "warning",
  "Out of Stock": "destructive",
};

function compactUsd(value: number): string {
  return `$${new Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: 0,
  }).format(value)}`;
}

export default function InventoryPage() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [status, setStatus] = useState<"All" | StockStatus>("All");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<InventoryItem | null>(null);

  const stats = useMemo(() => {
    const totalSku = inventory.length;
    const outOfStock = inventory.filter((i) => i.status === "Out of Stock").length;
    const lowStock = inventory.filter((i) => i.status === "Low Stock").length;
    const totalValue = inventory.reduce((sum, i) => sum + i.stock * i.unitValue, 0);
    return { totalSku, outOfStock, lowStock, totalValue };
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return inventory.filter((i) => {
      const matchesSearch =
        !q || i.name.toLowerCase().includes(q) || i.sku.toLowerCase().includes(q);
      const matchesCategory = category === "All" || i.category === category;
      const matchesStatus = status === "All" || i.status === status;
      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [search, category, status]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const start = (currentPage - 1) * PAGE_SIZE;
  const paged = filtered.slice(start, start + PAGE_SIZE);

  function resetPage<T>(setter: (v: T) => void) {
    return (value: T) => {
      setter(value);
      setPage(1);
    };
  }

  const setSearchReset = resetPage(setSearch);
  const setCategoryReset = resetPage(setCategory);
  const setStatusReset = resetPage(setStatus as (v: string) => void);

  function handleExport() {
    const header = ["Name", "SKU", "Category", "Stock", "Status", "Last Updated"];
    const rows = filtered.map((i) => [
      i.name,
      i.sku,
      i.category,
      String(i.stock),
      i.status,
      i.lastUpdated,
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
              <Link href="/admin/products/new">
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
                {stats.totalSku.toLocaleString()}
              </p>
              <span className="flex items-center gap-0.5 text-xs font-medium text-success">
                <TrendingUp className="size-3.5" />
                12%
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex flex-col gap-1">
            <p className="text-xs font-semibold uppercase tracking-wider text-subtle">Out of Stock</p>
            <div className="flex items-baseline gap-2">
              <p className="font-display text-2xl font-semibold text-destructive">
                {stats.outOfStock}
              </p>
              <span className="text-xs font-medium text-subtle">Items flagged</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex flex-col gap-1">
            <p className="text-xs font-semibold uppercase tracking-wider text-subtle">Low Stock</p>
            <div className="flex items-baseline gap-2">
              <p className="font-display text-2xl font-semibold text-warning">{stats.lowStock}</p>
              <span className="text-xs font-medium text-subtle">Reorder soon</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex flex-col gap-1">
            <p className="text-xs font-semibold uppercase tracking-wider text-subtle">Total Value</p>
            <div className="flex items-baseline gap-2">
              <p className="font-display text-2xl font-semibold text-foreground">
                {compactUsd(stats.totalValue)}
              </p>
              <span className="text-xs font-medium text-subtle">USD Est.</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Inventory table */}
      <Card className="gap-0 overflow-hidden py-0">
        {/* Toolbar */}
        <div className="flex flex-col gap-3 border-b p-5 lg:flex-row lg:items-center lg:justify-between">
          <h2 className="font-display text-lg font-semibold text-foreground">All Inventory</h2>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="relative sm:w-56">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-subtle" />
              <Input
                type="search"
                placeholder="Search products…"
                className="h-10 rounded-lg bg-card pl-9"
                value={search}
                onChange={(e) => setSearchReset(e.target.value)}
              />
            </div>
            <NativeSelect
              aria-label="Filter by category"
              className="h-10 sm:w-44"
              value={category}
              onChange={(e) => setCategoryReset(e.target.value)}
            >
              <option value="All">All categories</option>
              {inventoryCategories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </NativeSelect>
            <NativeSelect
              aria-label="Filter by stock status"
              className="h-10 sm:w-40"
              value={status}
              onChange={(e) => setStatusReset(e.target.value)}
            >
              <option value="All">All statuses</option>
              {stockStatuses.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </NativeSelect>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full min-w-205 text-sm">
            <thead className="border-b bg-muted/50 text-xs font-semibold uppercase tracking-wider text-subtle">
              <tr>
                <th className="px-5 py-3 text-left">Product</th>
                <th className="px-2 py-3 text-left">Category</th>
                <th className="px-2 py-3 text-left">Stock</th>
                <th className="px-2 py-3 text-left">Status</th>
                <th className="px-2 py-3 text-left">Last Updated</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {paged.map((item) => (
                <tr key={item.id} className="hover:bg-muted/30">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <span className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-linear-to-br from-accent to-muted text-primary">
                        <Package className="size-5" />
                      </span>
                      <div>
                        <p className="font-semibold text-foreground">{item.name}</p>
                        <p className="text-xs text-subtle">SKU: {item.sku}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-2 py-4 whitespace-nowrap text-muted-foreground">
                    {item.category}
                  </td>
                  <td className="px-2 py-4 font-semibold text-foreground">
                    {item.stock.toLocaleString()}
                  </td>
                  <td className="px-2 py-4">
                    <Badge variant={statusVariant[item.status]}>
                      <span className="size-1.5 rounded-full bg-current" />
                      {item.status}
                    </Badge>
                  </td>
                  <td className="px-2 py-4 whitespace-nowrap text-muted-foreground">
                    {item.lastUpdated}
                  </td>
                  <td className="px-5 py-4">
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

              {paged.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-14 text-center text-sm text-subtle">
                    <PackageSearch className="mx-auto mb-2 size-8 text-muted-foreground" />
                    No products match your filters.
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
              ? "No products to show"
              : `Showing ${start + 1} to ${start + paged.length} of ${filtered.length} products`}
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

      <UpdateStockModal item={selected} onClose={() => setSelected(null)} />
    </div>
  );
}
