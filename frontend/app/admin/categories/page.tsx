"use client";

import { useState } from "react";
import Image from "next/image";
import {
  Search,
  Download,
  Plus,
  Pencil,
  Trash2,
  FolderTree,
  Boxes,
  PackageOpen,
  Archive,
  ArchiveRestore,
  X,
} from "lucide-react";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/select-native";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { CategoryModal } from "@/components/admin/CategoryModal";
import { AdminStatCard, StatChip } from "@/components/admin/AdminStatCard";
import { TablePagination } from "@/components/admin/TablePagination";
import { TableEmptyState } from "@/components/admin/TableEmptyState";
import { ErrorState, TableSkeleton } from "@/components/admin/QueryState";
import {
  useCategories,
  useUpdateCategory,
  useDeleteCategory,
} from "@/lib/hooks/use-admin";
import { useDebounce } from "@/lib/hooks/use-debounce";
import { downloadCsv } from "@/lib/admin/csv";
import {
  categoryStatusLabel,
  type Category,
  type CategoryStatus,
} from "@/lib/api/models";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 10;

const statusOptions: CategoryStatus[] = ["ACTIVE", "ARCHIVED"];

/** Category thumbnail, falling back to a folder glyph. */
function CategoryThumb({ src, name }: { src: string | null; name: string }) {
  return (
    <span className="relative flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-muted text-muted-foreground ring-1 ring-foreground/5">
      {src ? (
        <Image src={src} alt="" fill sizes="44px" unoptimized className="object-cover" />
      ) : (
        <FolderTree className="size-5" aria-hidden />
      )}
      <span className="sr-only">{name}</span>
    </span>
  );
}

export default function CategoriesPage() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"All" | CategoryStatus>("All");
  const [page, setPage] = useState(1);
  const [modalTarget, setModalTarget] = useState<Category | "new" | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Category | null>(null);

  const debouncedSearch = useDebounce(search);

  const { data, isPending, isFetching, isError, error, refetch } = useCategories({
    page,
    limit: PAGE_SIZE,
    search: debouncedSearch || undefined,
    status: status === "All" ? undefined : status,
  });

  const updateCategory = useUpdateCategory();
  const deleteCategory = useDeleteCategory();

  const categories = data?.data ?? [];
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

  function handleToggleArchive(category: Category) {
    const newStatus: CategoryStatus = category.status === "ACTIVE" ? "ARCHIVED" : "ACTIVE";
    // Send only the field that changed. Spreading the whole category also sent
    // `id`, `createdAt`, `updatedAt` and `products`, and the API rejects
    // unknown properties — so archiving always failed with a 400.
    updateCategory.mutate({ id: category.id, body: { status: newStatus } });
    setModalTarget(null);
  }

  function handleExport() {
    downloadCsv(
      "categories.csv",
      ["ID", "Name", "Slug", "Products", "Status", "Visibility"],
      categories.map((c) => [
        c.id,
        c.name,
        c.slug,
        String(c.products),
        categoryStatusLabel[c.status],
        c.visibility,
      ]),
    );
  }

  // Scoped to the page in view — labelled as such, rather than sitting next to
  // an all-pages total as if the two were comparable.
  const productsOnPage = categories.reduce((sum, c) => sum + c.products, 0);
  const emptyOnPage = categories.filter((c) => c.products === 0).length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Categories"
        subtitle="Organise your catalogue and control what shoppers can browse."
        action={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="lg"
              onClick={handleExport}
              disabled={categories.length === 0}
              title="Download the categories on this page as CSV"
            >
              <Download className="size-4" aria-hidden />
              Export page
            </Button>
            <Button size="lg" onClick={() => setModalTarget("new")}>
              <Plus className="size-4" aria-hidden />
              Add Category
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
        <AdminStatCard
          label="Total categories"
          value={total.toLocaleString()}
          caption="Across all pages"
          loading={isPending}
          corner={
            <StatChip className="bg-accent text-primary">
              <FolderTree className="size-4" aria-hidden />
            </StatChip>
          }
        />
        <AdminStatCard
          label="Products on this page"
          value={productsOnPage.toLocaleString()}
          caption={`Across ${categories.length} ${categories.length === 1 ? "category" : "categories"}`}
          loading={isPending}
          corner={
            <StatChip className="bg-success-muted text-success">
              <Boxes className="size-4" aria-hidden />
            </StatChip>
          }
        />
        <AdminStatCard
          label="Empty on this page"
          value={emptyOnPage.toLocaleString()}
          caption={emptyOnPage > 0 ? "No products assigned" : "All categories in use"}
          tone={emptyOnPage > 0 ? "warning" : "default"}
          loading={isPending}
          corner={
            <StatChip
              className={
                emptyOnPage > 0
                  ? "bg-warning-muted text-warning"
                  : "bg-success-muted text-success"
              }
            >
              <PackageOpen className="size-4" aria-hidden />
            </StatChip>
          }
        />
      </div>

      <Card className="gap-0 py-0">
        {/* Toolbar */}
        <div className="flex flex-col gap-3 border-b border-border p-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <h2 className="mr-1 text-base font-semibold tracking-tight text-foreground">
              All Categories
            </h2>

            <NativeSelect
              aria-label="Filter by status"
              className="h-10 w-auto min-w-36"
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
              aria-label="Search categories"
              placeholder="Search by name or description…"
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

        {/* A failed request used to render the same "No categories match your
            filters" row as a genuinely empty result — telling the admin their
            data was gone when the request had merely errored. */}
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
            <table className="w-full min-w-3xl text-sm">
              <thead className="border-b border-border bg-muted/50 text-xs font-semibold tracking-wider text-subtle uppercase">
                <tr>
                  <th className="px-5 py-3 text-left">Category</th>
                  <th className="px-3 py-3 text-left">Slug</th>
                  <th className="px-3 py-3 text-left">Status</th>
                  <th className="px-3 py-3 text-right">Products</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {isPending ? (
                  <TableSkeleton rows={PAGE_SIZE} columns={5} />
                ) : categories.length === 0 ? (
                  <TableEmptyState
                    colSpan={5}
                    icon={FolderTree}
                    title="No categories found"
                    description={
                      hasFilters
                        ? "No categories match your filters."
                        : "Create your first category to organise the catalogue."
                    }
                    action={
                      hasFilters ? (
                        <Button variant="outline" onClick={clearFilters}>
                          Clear filters
                        </Button>
                      ) : (
                        <Button onClick={() => setModalTarget("new")}>
                          <Plus className="size-4" aria-hidden />
                          Add Category
                        </Button>
                      )
                    }
                  />
                ) : (
                  categories.map((category) => {
                    const isArchived = category.status === "ARCHIVED";

                    return (
                      <tr
                        key={category.id}
                        className={cn(
                          "transition-colors hover:bg-muted/40",
                          isArchived && "opacity-60",
                        )}
                      >
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-3">
                            {/* Real thumbnail. Every row previously showed an
                                icon from a lookup where `health`, `sports`,
                                `toys`, `books`, `automotive`, `grocery` and
                                `pets` were ALL mapped to a warning triangle. */}
                            <CategoryThumb src={category.thumbnailName} name={category.name} />
                            <div className="min-w-0">
                              <button
                                type="button"
                                onClick={() => setModalTarget(category)}
                                className="block max-w-full truncate text-left font-medium text-foreground hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                              >
                                {category.name}
                              </button>
                              {category.description ? (
                                <p className="line-clamp-1 text-xs text-subtle">
                                  {category.description}
                                </p>
                              ) : null}
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-3 whitespace-nowrap text-muted-foreground">
                          {category.slug}
                        </td>
                        <td className="px-3 py-3">
                          <Badge
                            variant={isArchived ? "secondary" : "success"}
                            className="h-6 px-2.5"
                          >
                            <span className="size-1.5 rounded-full bg-current" />
                            {categoryStatusLabel[category.status]}
                          </Badge>
                        </td>
                        <td className="px-3 py-3 text-right whitespace-nowrap tabular-nums">
                          <span
                            className={
                              category.products === 0
                                ? "text-muted-foreground"
                                : "font-medium text-foreground"
                            }
                          >
                            {category.products.toLocaleString()}
                          </span>
                        </td>
                        <td className="px-5 py-3">
                          <div className="flex items-center justify-end gap-1">
                            {/* Archive was only reachable from inside the edit
                                modal — two clicks deep for a routine action. */}
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              disabled={updateCategory.isPending}
                              aria-label={`${isArchived ? "Restore" : "Archive"} ${category.name}`}
                              title={isArchived ? "Restore category" : "Archive category"}
                              onClick={() => handleToggleArchive(category)}
                            >
                              {isArchived ? <ArchiveRestore /> : <Archive />}
                            </Button>
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
                  })
                )}
              </tbody>
            </table>
          </div>
        )}

        {!isError && categories.length > 0 ? (
          <TablePagination
            page={page}
            pageSize={PAGE_SIZE}
            total={total}
            totalPages={totalPages}
            rowsOnPage={categories.length}
            onPageChange={setPage}
            noun="categories"
          />
        ) : null}
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
            permanently removed.
            {pendingDelete && pendingDelete.products > 0 ? (
              <>
                {" "}
                It still has{" "}
                <strong className="font-semibold text-foreground">
                  {pendingDelete.products}
                </strong>{" "}
                product{pendingDelete.products === 1 ? "" : "s"} assigned to it.
              </>
            ) : null}{" "}
            This action cannot be undone.
          </>
        }
        confirmLabel="Delete category"
        onConfirm={() => {
          if (pendingDelete) deleteCategory.mutate(pendingDelete.id);
          setPendingDelete(null);
        }}
      />
    </div>
  );
}
