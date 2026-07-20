"use client";

import { useMemo, useState, type ReactNode } from "react";
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
import { Checkbox } from "@/components/ui/checkbox";
import { NativeSelect } from "@/components/ui/select-native";
import {
  products as initialProducts,
  productCategories,
  formatCurrency,
  formatCompactCurrency,
  type Product,
  type ProductStatus,
} from "@/lib/admin/products";

const PAGE_SIZE = 5;

const statusVariant: Record<ProductStatus, "success" | "warning" | "destructive"> = {
  "In Stock": "success",
  "Low Stock": "warning",
  "Out of Stock": "destructive",
};

const statusOptions: ProductStatus[] = ["In Stock", "Low Stock", "Out of Stock"];

function StatCard({
  label,
  value,
  corner,
}: {
  label: string;
  value: string;
  corner: ReactNode;
}) {
  return (
    <Card>
      <CardContent className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-subtle">{label}</p>
          <p className="mt-2 font-display text-2xl font-semibold text-foreground">{value}</p>
        </div>
        {corner}
      </CardContent>
    </Card>
  );
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [status, setStatus] = useState<"All" | ProductStatus>("All");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return products.filter((p) => {
      const matchesSearch =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        p.brand.toLowerCase().includes(q);
      const matchesCategory = category === "All" || p.category === category;
      const matchesStatus = status === "All" || p.status === status;
      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [products, search, category, status]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paged = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const stats = useMemo(() => {
    const totalInventory = products.reduce((sum, p) => sum + p.stock, 0);
    const inStock = products
      .filter((p) => p.status === "In Stock")
      .reduce((sum, p) => sum + p.stock, 0);
    const lowStock = products.filter((p) => p.status === "Low Stock").length;
    const activeValue = products.reduce((sum, p) => sum + p.price * p.stock, 0);
    return { totalInventory, inStock, lowStock, activeValue };
  }, [products]);

  function handleSearchChange(value: string) {
    setSearch(value);
    setPage(1);
  }

  function handleCategoryChange(value: string) {
    setCategory(value);
    setPage(1);
  }

  function handleStatusChange(value: string) {
    setStatus(value as "All" | ProductStatus);
    setPage(1);
  }

  function handleDelete(id: string, name: string) {
    if (!window.confirm(`Delete "${name}"? This cannot be undone.`)) return;
    setProducts((prev) => prev.filter((p) => p.id !== id));
    setSelected((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  }

  function toggleSelectAll() {
    setSelected((prev) => {
      const allSelected = paged.length > 0 && paged.every((p) => prev.has(p.id));
      if (allSelected) return new Set();
      return new Set(paged.map((p) => p.id));
    });
  }

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function handleExport() {
    const header = ["Name", "SKU", "Category", "Status", "Price", "Stock"];
    const rows = filtered.map((p) => [
      p.name,
      p.sku,
      p.category,
      p.status,
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

  const allPagedSelected = paged.length > 0 && paged.every((p) => selected.has(p.id));

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

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Total Inventory"
          value={stats.totalInventory.toLocaleString()}
          corner={<Badge variant="success">+12%</Badge>}
        />
        <StatCard
          label="In Stock"
          value={stats.inStock.toLocaleString()}
          corner={
            <span className="flex size-9 items-center justify-center rounded-full bg-success-muted text-success">
              <CheckCircle2 className="size-4" />
            </span>
          }
        />
        <StatCard
          label="Low Stock"
          value={stats.lowStock.toLocaleString()}
          corner={
            <span className="flex size-9 items-center justify-center rounded-full bg-warning-muted text-warning">
              <AlertTriangle className="size-4" />
            </span>
          }
        />
        <StatCard
          label="Active Value"
          value={`€${formatCompactCurrency(stats.activeValue)}`}
          corner={
            <span className="flex size-9 items-center justify-center rounded-full bg-success-muted text-success">
              <TrendingUp className="size-4" />
            </span>
          }
        />
      </div>

      {/* Toolbar: search + filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <NativeSelect
            aria-label="Filter by category"
            className="w-auto min-w-40"
            value={category}
            onChange={(e) => handleCategoryChange(e.target.value)}
          >
            <option value="All">All categories</option>
            {productCategories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </NativeSelect>

          <NativeSelect
            aria-label="Filter by status"
            className="w-auto min-w-36"
            value={status}
            onChange={(e) => handleStatusChange(e.target.value)}
          >
            <option value="All">All statuses</option>
            {statusOptions.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </NativeSelect>
        </div>

        <div className="relative sm:w-72">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-subtle" />
          <Input
            type="search"
            placeholder="Search by name, SKU or brand…"
            className="h-10 rounded-lg bg-card pl-9"
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
          />
        </div>
      </div>

      {/* Table */}
      <Card className="gap-0 overflow-hidden py-0">
        <div className="overflow-x-auto">
          <table className="w-full min-w-205 text-sm">
            <thead className="border-b bg-muted/50 text-xs font-semibold uppercase tracking-wider text-subtle">
              <tr>
                <th className="w-10 px-4 py-3">
                  <Checkbox
                    checked={allPagedSelected}
                    onCheckedChange={toggleSelectAll}
                    aria-label="Select all products on this page"
                  />
                </th>
                <th className="px-2 py-3 text-left">Image</th>
                <th className="px-2 py-3 text-left">Product Name</th>
                <th className="px-2 py-3 text-left">SKU</th>
                <th className="px-2 py-3 text-left">Category</th>
                <th className="px-2 py-3 text-left">Status</th>
                <th className="px-2 py-3 text-left">Price</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {paged.map((product) => (
                <tr key={product.id} className="hover:bg-muted/30">
                  <td className="px-4 py-3">
                    <Checkbox
                      checked={selected.has(product.id)}
                      onCheckedChange={() => toggleSelect(product.id)}
                      aria-label={`Select ${product.name}`}
                    />
                  </td>
                  <td className="px-2 py-3">
                    <span className="flex size-11 items-center justify-center rounded-lg bg-linear-to-br from-accent to-muted text-primary">
                      <Package className="size-5" />
                    </span>
                  </td>
                  <td className="px-2 py-3">
                    <p className="font-semibold text-foreground">{product.name}</p>
                    <p className="line-clamp-1 text-xs text-subtle">{product.description}</p>
                  </td>
                  <td className="px-2 py-3 whitespace-nowrap text-muted-foreground">{product.sku}</td>
                  <td className="px-2 py-3 whitespace-nowrap text-muted-foreground">{product.category}</td>
                  <td className="px-2 py-3">
                    <Badge variant={statusVariant[product.status]}>
                      <span className="size-1.5 rounded-full bg-current" />
                      {product.status}
                    </Badge>
                  </td>
                  <td className="px-2 py-3 font-semibold whitespace-nowrap text-foreground">
                    {formatCurrency(product.price)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <Button asChild variant="ghost" size="icon-sm" aria-label={`Edit ${product.name}`}>
                        <Link href={`/admin/products/${product.id}/edit`}>
                          <Pencil />
                        </Link>
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-label={`Delete ${product.name}`}
                        className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                        onClick={() => handleDelete(product.id, product.name)}
                      >
                        <Trash2 />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}

              {paged.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-14 text-center text-sm text-subtle">
                    <Boxes className="mx-auto mb-2 size-8 text-muted-foreground" />
                    No products match your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col gap-3 border-t px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-subtle">
            Showing {paged.length} of {filtered.length} products
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
    </div>
  );
}
