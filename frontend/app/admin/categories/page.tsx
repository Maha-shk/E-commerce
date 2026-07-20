"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  Search,
  Download,
  Plus,
  Pencil,
  Trash2,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  SlidersHorizontal,
  FolderTree,
  Layers,
  Boxes,
  TriangleAlert,
  Shirt,
  Laptop,
  Sofa,
  HeartPulse,
  Dumbbell,
  Gamepad2,
  BookOpen,
  Car,
  ShoppingBasket,
  PawPrint,
  type LucideIcon,
} from "lucide-react";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  categories as initialCategories,
  type Category,
  type CategoryIconKey,
} from "@/lib/admin/categories";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 4;

const categoryIcons: Record<CategoryIconKey, LucideIcon> = {
  fashion: Shirt,
  electronics: Laptop,
  home: Sofa,
  health: HeartPulse,
  sports: Dumbbell,
  toys: Gamepad2,
  books: BookOpen,
  automotive: Car,
  grocery: ShoppingBasket,
  pets: PawPrint,
};

type TabKey = "all" | "active" | "archived";

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>(initialCategories);
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<TabKey>("all");
  const [sortAsc, setSortAsc] = useState(true);
  const [page, setPage] = useState(1);

  const stats = useMemo(() => {
    const totalSubcategories = categories.reduce((sum, c) => sum + c.subcategories, 0);
    const activeProducts = categories.reduce((sum, c) => sum + c.products, 0);
    const empty = categories.filter((c) => c.products === 0).length;
    const avgPerRoot = categories.length ? totalSubcategories / categories.length : 0;
    return { totalSubcategories, activeProducts, empty, avgPerRoot };
  }, [categories]);

  const tabCounts = useMemo(
    () => ({
      all: categories.length,
      active: categories.filter((c) => c.status === "active").length,
      archived: categories.filter((c) => c.status === "archived").length,
    }),
    [categories],
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = categories.filter((c) => {
      const matchesSearch =
        !q ||
        c.name.toLowerCase().includes(q) ||
        c.id.toLowerCase().includes(q) ||
        c.description.toLowerCase().includes(q);
      const matchesTab = tab === "all" || c.status === tab;
      return matchesSearch && matchesTab;
    });
    return [...list].sort((a, b) =>
      sortAsc ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name),
    );
  }, [categories, search, tab, sortAsc]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const start = (currentPage - 1) * PAGE_SIZE;
  const paged = filtered.slice(start, start + PAGE_SIZE);

  function handleDelete(id: string, name: string) {
    if (!window.confirm(`Delete "${name}"? This cannot be undone.`)) return;
    setCategories((prev) => prev.filter((c) => c.id !== id));
  }

  function handleExport() {
    const header = ["ID", "Name", "Slug", "Subcategories", "Products", "Status"];
    const rows = filtered.map((c) => [
      c.id,
      c.name,
      c.slug,
      String(c.subcategories),
      String(c.products),
      c.status,
    ]);
    const csv = [header, ...rows]
      .map((row) => row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "categories.csv";
    link.click();
    URL.revokeObjectURL(url);
  }

  const tabs: { key: TabKey; label: string }[] = [
    { key: "all", label: "All" },
    { key: "active", label: "Active" },
    { key: "archived", label: "Archived" },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Category Management"
        subtitle="Organize and manage your store's hierarchical structure."
        action={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="xl" onClick={handleExport}>
              <Download />
              Export Data
            </Button>
            <Button asChild size="xl">
              <Link href="/admin/categories/new">
                <Plus />
                Add Category
              </Link>
            </Button>
          </div>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card>
          <CardContent className="flex flex-col gap-1">
            <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-subtle">
              <FolderTree className="size-4" />
              Total Categories
            </p>
            <div className="flex items-baseline gap-2">
              <p className="font-display text-2xl font-semibold text-foreground">
                {categories.length}
              </p>
              <span className="text-xs font-medium text-success">+2 this month</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex flex-col gap-1">
            <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-subtle">
              <Layers className="size-4" />
              Subcategories
            </p>
            <div className="flex items-baseline gap-2">
              <p className="font-display text-2xl font-semibold text-foreground">
                {stats.totalSubcategories}
              </p>
              <span className="text-xs font-medium text-subtle">
                Avg. {stats.avgPerRoot.toFixed(1)} per root
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex flex-col gap-1">
            <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-subtle">
              <Boxes className="size-4" />
              Active Products
            </p>
            <p className="font-display text-2xl font-semibold text-foreground">
              {stats.activeProducts.toLocaleString()}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex flex-col gap-1">
            <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-subtle">
              <TriangleAlert className="size-4" />
              Empty Categories
            </p>
            <div className="flex items-baseline gap-2">
              <p className="font-display text-2xl font-semibold text-destructive">{stats.empty}</p>
              <span className="text-xs font-medium text-destructive">Needs attention</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Table card */}
      <Card className="gap-0 overflow-hidden py-0">
        {/* Card toolbar */}
        <div className="flex flex-col gap-3 border-b p-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="font-display text-lg font-semibold text-foreground">Root Categories</h2>
            <div className="inline-flex items-center gap-1 rounded-full bg-muted p-1">
              {tabs.map((t) => (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => {
                    setTab(t.key);
                    setPage(1);
                  }}
                  className={cn(
                    "rounded-full px-3 py-1 text-xs font-medium transition-colors",
                    tab === t.key
                      ? "bg-card text-foreground shadow-sm"
                      : "text-subtle hover:text-foreground",
                  )}
                >
                  {t.label} ({tabCounts[t.key]})
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative flex-1 sm:w-56 sm:flex-none">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-subtle" />
              <Input
                type="search"
                placeholder="Search categories…"
                className="h-10 rounded-lg bg-card pl-9"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
              />
            </div>
            <Button
              variant="outline"
              size="icon-lg"
              aria-label={sortAsc ? "Sort Z to A" : "Sort A to Z"}
              onClick={() => setSortAsc((v) => !v)}
            >
              <ArrowUpDown className="size-4" />
            </Button>
            <Button variant="outline" size="icon-lg" aria-label="Filter" className="hidden sm:inline-flex">
              <SlidersHorizontal className="size-4" />
            </Button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full min-w-205 text-sm">
            <thead className="border-b bg-muted/50 text-xs font-semibold uppercase tracking-wider text-subtle">
              <tr>
                <th className="px-5 py-3 text-left">Category Name</th>
                <th className="px-2 py-3 text-left">Description</th>
                <th className="px-2 py-3 text-left">Subcategories</th>
                <th className="px-2 py-3 text-left">Total Products</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {paged.map((category) => {
                const Icon = categoryIcons[category.icon];
                return (
                  <tr key={category.id} className="hover:bg-muted/30">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-linear-to-br from-accent to-muted text-primary">
                          <Icon className="size-5" />
                        </span>
                        <div>
                          <p className="font-semibold text-foreground">{category.name}</p>
                          <p className="text-xs text-subtle">ID: {category.id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="max-w-xs px-2 py-4">
                      <p className="truncate text-muted-foreground">{category.description}</p>
                    </td>
                    <td className="px-2 py-4 font-medium text-foreground">{category.subcategories}</td>
                    <td className="px-2 py-4">
                      <Badge variant="secondary" className="rounded-full font-medium">
                        {category.products.toLocaleString()} items
                      </Badge>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          asChild
                          variant="ghost"
                          size="icon-sm"
                          aria-label={`Edit ${category.name}`}
                        >
                          <Link href={`/admin/categories/${category.id}/edit`}>
                            <Pencil />
                          </Link>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          aria-label={`Delete ${category.name}`}
                          className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                          onClick={() => handleDelete(category.id, category.name)}
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
                  <td colSpan={5} className="px-5 py-14 text-center text-sm text-subtle">
                    <FolderTree className="mx-auto mb-2 size-8 text-muted-foreground" />
                    No categories match your filters.
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
              ? "No categories to show"
              : `Showing ${start + 1} to ${start + paged.length} of ${filtered.length} categories`}
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
