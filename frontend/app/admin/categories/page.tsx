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
  FolderTree,
  Layers,
  Boxes,
  TriangleAlert,
  type LucideIcon,
} from "lucide-react";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/select-native";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { CategoryModal } from "@/components/admin/CategoryModal";
import {
  useCategories,
  useCreateCategory,
  useUpdateCategory,
  useDeleteCategory,
} from "@/lib/hooks/use-admin";
import { useDebounce } from "@/lib/hooks/use-debounce";
import { categoryStatusLabel, type Category, type CategoryStatus, type CategoryVisibility } from "@/lib/api/models";

const PAGE_SIZE = 5;

const categoryIcons: Record<string, LucideIcon> = {
  fashion: FolderTree,
  electronics: Boxes,
  home: Layers,
  health: TriangleAlert,
  sports: TriangleAlert,
  toys: TriangleAlert,
  books: TriangleAlert,
  automotive: TriangleAlert,
  grocery: TriangleAlert,
  pets: TriangleAlert,
};

const statusOptions: CategoryStatus[] = ["ACTIVE", "ARCHIVED"];

const visibilityOptions: CategoryVisibility[] = ["VISIBLE", "HIDDEN"];

function getIconForKey(iconKey: string | null): LucideIcon {
  return (iconKey && categoryIcons[iconKey]) || FolderTree;
}

export default function CategoriesPage() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"All" | CategoryStatus>("All");
  const [page, setPage] = useState(1);
  const [modalTarget, setModalTarget] = useState<Category | "new" | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Category | null>(null);

  const debouncedSearch = useDebounce(search);

  const { data, isLoading, isError, error, refetch } = useCategories({
    page,
    limit: PAGE_SIZE,
    search: debouncedSearch || undefined,
    status: status === "All" ? undefined : status,
  });

  const createCategory = useCreateCategory();
  const updateCategory = useUpdateCategory();
  const deleteCategory = useDeleteCategory();

  const categories = data?.data ?? [];
  const totalPages = data?.meta.totalPages ?? 1;

  function withPageReset<T>(setter: (value: T) => void) {
    return (value: T) => {
      setter(value);
      setPage(1);
    };
  }

  function handleToggleArchive(category: Category) {
    const newStatus: CategoryStatus = category.status === "ACTIVE" ? "ARCHIVED" : "ACTIVE";
    updateCategory.mutate({
      id: category.id,
      body: { ...category, status: newStatus },
    });
    setModalTarget(null);
  }

  function handleConfirmDelete() {
    if (!pendingDelete) return;
    deleteCategory.mutate(pendingDelete.id);
    setPendingDelete(null);
  }

  function handleExport() {
    const header = ["ID", "Name", "Slug", "Products", "Status", "Visibility"];
    const rows = categories.map((c) => [
      c.id,
      c.name,
      c.slug,
      String(c.products),
      c.status,
      c.visibility,
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
            <Button size="xl" onClick={() => setModalTarget("new")}>
              <Plus />
              Add Category
            </Button>
          </div>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
        <Card>
          <CardContent className="flex flex-col gap-1">
            <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-subtle">
              <FolderTree className="size-4" />
              Total Categories
            </p>
            <div className="flex items-baseline gap-2">
              <p className="font-display text-2xl font-semibold text-foreground">
                {data?.meta.total ?? 0}
              </p>
              <span className="text-xs font-medium text-subtle">Across all pages</span>
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
              {categories.reduce((sum, c) => sum + c.products, 0).toLocaleString()}
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
              <p className="font-display text-2xl font-semibold text-destructive">
                {categories.filter((c) => c.products === 0).length}
              </p>
              <span className="text-xs font-medium text-destructive">Needs attention</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Section heading */}
      <h2 className="font-display text-lg font-semibold text-foreground">All Categories</h2>

      {/* Table */}
      <Card className="gap-0 overflow-hidden py-0">
        {/* Toolbar: filters + search + sort */}
        <div className="flex flex-col gap-3 border-b p-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <NativeSelect
              aria-label="Filter by status"
              className="w-auto min-w-36"
              value={status}
              onChange={(e) => withPageReset(setStatus)(e.target.value as "All" | CategoryStatus)}
            >
              <option value="All">All statuses</option>
              {statusOptions.map((s) => (
                <option key={s} value={s}>
                  {categoryStatusLabel[s]}
                </option>
              ))}
            </NativeSelect>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative flex-1 sm:w-72 sm:flex-none">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-subtle" />
              <Input
                type="search"
                placeholder="Search by name, ID or description…"
                className="h-10 rounded-lg bg-card pl-9"
                value={search}
                onChange={(e) => withPageReset(setSearch)(e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-205 text-sm">
            <thead className="border-b bg-muted/50 text-xs font-semibold uppercase tracking-wider text-subtle">
              <tr>
                <th className="px-5 py-3 text-left">Image</th>
                <th className="px-2 py-3 text-left">Category Name</th>
                <th className="px-2 py-3 text-left">Slug</th>
                <th className="px-2 py-3 text-left">Status</th>
                <th className="px-2 py-3 text-left">Products</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {categories.map((category) => {
                const Icon = getIconForKey(category.icon);
                return (
                  <tr key={category.id} className="hover:bg-muted/30">
                    <td className="px-5 py-3">
                      <span className="flex size-11 items-center justify-center rounded-lg bg-linear-to-br from-accent to-muted text-primary">
                        <Icon className="size-5" />
                      </span>
                    </td>
                    <td className="px-2 py-3">
                      <p className="font-semibold text-foreground">{category.name}</p>
                      <p className="line-clamp-1 text-xs text-subtle">{category.description}</p>
                    </td>
                    <td className="px-2 py-3 whitespace-nowrap text-muted-foreground">
                      {category.slug}
                    </td>
                    <td className="px-2 py-3">
                      <Badge variant={category.status === "ACTIVE" ? "success" : "secondary"}>
                        <span className="size-1.5 rounded-full bg-current" />
                        {categoryStatusLabel[category.status]}
                      </Badge>
                    </td>
                    <td className="px-2 py-3 font-semibold whitespace-nowrap text-foreground">
                      {category.products.toLocaleString()}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          aria-label={`Edit ${category.name}`}
                          onClick={() => setModalTarget(category)}
                        >
                          <Pencil />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          aria-label={`Delete ${category.name}`}
                          className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                          onClick={() => setPendingDelete(category)}
                        >
                          <Trash2 />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {categories.length === 0 && !isLoading && (
                <tr>
                  <td colSpan={6} className="px-4 py-14 text-center text-sm text-subtle">
                    <FolderTree className="mx-auto mb-2 size-8 text-muted-foreground" />
                    No categories match your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex flex-col gap-3 border-t px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-subtle">
            Showing {categories.length} of {data?.meta.total ?? 0} categories
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

      <CategoryModal
        target={modalTarget}
        onClose={() => setModalTarget(null)}
        onToggleArchive={handleToggleArchive}
      />

      <ConfirmDialog
        open={!!pendingDelete}
        onOpenChange={(open) => {
          if (!open) setPendingDelete(null);
        }}
        title="Delete category?"
        description={
          <>
            <strong className="font-semibold text-foreground">{pendingDelete?.name}</strong> will be
            permanently removed. This action cannot be undone.
          </>
        }
        confirmLabel="Delete category"
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}
