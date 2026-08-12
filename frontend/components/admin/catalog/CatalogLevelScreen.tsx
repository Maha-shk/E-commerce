"use client";

import { useState } from "react";
import { ArrowUpDown, FolderTree, Plus, Search, X } from "lucide-react";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/select-native";
import { CatalogNodeTable } from "@/components/admin/catalog/CatalogNodeTable";
import { CatalogNodeModal } from "@/components/admin/catalog/CatalogNodeModal";
import { DeleteNodeDialog } from "@/components/admin/catalog/DeleteNodeDialog";
import { ReorderNodesDialog } from "@/components/admin/catalog/ReorderNodesDialog";
import { useCatalogList } from "@/lib/hooks/use-catalog";
import { useDebounce } from "@/lib/hooks/use-debounce";
import {
  type CatalogLevelSpec,
  type CatalogNode,
  type CatalogStatus,
} from "@/lib/api/catalog";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 10;

/** How the list is scoped to the migration's invented nodes. */
type FilingFilter = "All" | "true" | "false";

/**
 * Every level of the catalogue, through one screen.
 *
 * `/admin/catalog/categories`, `/companies`, `/product-types` and `/models`
 * all render this. The four levels take the same fields, the same filters and
 * the same CRUD, so what changes between them is the label on the button.
 */
export function CatalogLevelScreen({
  level,
  /** From `?isPlaceholder=` — the overview's "needs filing" banner links here. */
  initialFiling = "All",
}: {
  level: CatalogLevelSpec;
  initialFiling?: FilingFilter;
}) {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"All" | CatalogStatus>("All");
  const [filing, setFiling] = useState<FilingFilter>(initialFiling);
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState<CatalogNode | "new" | null>(null);
  const [pendingDelete, setPendingDelete] = useState<CatalogNode | null>(null);
  const [reordering, setReordering] = useState(false);

  const debouncedSearch = useDebounce(search);

  const { data, isPending, isFetching, isError, error, refetch } = useCatalogList(
    level.segment,
    {
      page,
      limit: PAGE_SIZE,
      search: debouncedSearch || undefined,
      status: status === "All" ? undefined : status,
      isPlaceholder: filing === "All" ? undefined : filing === "true",
    },
  );

  const nodes = data?.data ?? [];
  const total = data?.meta.total ?? 0;
  const totalPages = data?.meta.totalPages ?? 1;
  const hasFilters = Boolean(search) || status !== "All" || filing !== "All";

  /** Any filter change resets to the first page. */
  function withPageReset<T>(setter: (value: T) => void) {
    return (value: T) => {
      setter(value);
      setPage(1);
    };
  }

  function clearFilters() {
    setSearch("");
    setStatus("All");
    setFiling("All");
    setPage(1);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={level.labelPlural}
        subtitle={subtitleFor(level.key)}
        action={
          <div className="flex items-center gap-2">
            {/* Only offered for categories here: at the lower levels, siblings
                are the children of one parent, so ordering belongs on that
                parent's page where the set is unambiguous. */}
            {!level.parent ? (
              <Button variant="outline" size="lg" onClick={() => setReordering(true)}>
                <ArrowUpDown className="size-4" aria-hidden />
                Order
              </Button>
            ) : null}
            <Button size="lg" onClick={() => setEditing("new")}>
              <Plus className="size-4" aria-hidden />
              New {level.label}
            </Button>
          </div>
        }
      />

      <Card className="gap-0 py-0">
        <div className="flex flex-col gap-3 border-b border-border p-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <h2 className="mr-1 text-base font-semibold tracking-tight text-foreground">
              All {level.labelPlural}
              {total > 0 ? (
                <span className="ml-2 text-sm font-normal text-muted-foreground tabular-nums">
                  {total.toLocaleString()}
                </span>
              ) : null}
            </h2>

            <NativeSelect
              aria-label="Filter by status"
              className="h-10 w-auto min-w-36"
              value={status}
              onChange={(e) =>
                withPageReset(setStatus)(e.target.value as "All" | CatalogStatus)
              }
            >
              <option value="All">All statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="ARCHIVED">Archived</option>
            </NativeSelect>

            {/* The migration invented nodes so every product had a parent.
                They are real rows, so they are filtered, not hidden. */}
            <NativeSelect
              aria-label="Filter by filing state"
              className="h-10 w-auto min-w-40"
              value={filing}
              onChange={(e) =>
                withPageReset(setFiling)(e.target.value as FilingFilter)
              }
            >
              <option value="All">Everything</option>
              <option value="true">Needs filing</option>
              <option value="false">Genuine only</option>
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
              aria-label={`Search ${level.labelPlural.toLowerCase()}`}
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

        <CatalogNodeTable
          level={level}
          nodes={nodes}
          isPending={isPending}
          isFetching={isFetching}
          isError={isError}
          error={error}
          onRetry={() => refetch()}
          page={page}
          pageSize={PAGE_SIZE}
          total={total}
          totalPages={totalPages}
          onPageChange={setPage}
          hasFilters={hasFilters}
          onClearFilters={clearFilters}
          onCreate={() => setEditing("new")}
          onEdit={setEditing}
          onDelete={setPendingDelete}
          emptyIcon={FolderTree}
          emptyTitle={
            filing === "true" && !search && status === "All"
              ? "Nothing left to file"
              : hasFilters
                ? `No ${level.labelPlural.toLowerCase()} match your filters`
                : emptyTitleFor(level.key)
          }
          emptyDescription={
            filing === "true" && !search && status === "All"
              ? `Every ${level.label.toLowerCase()} here was created deliberately.`
              : hasFilters
                ? search
                  ? `Nothing matches “${search.trim()}”.`
                  : "Try a different filter."
                : emptyDescriptionFor(level.key)
          }
        />
      </Card>

      <CatalogNodeModal
        open={editing !== null}
        onClose={() => setEditing(null)}
        level={level}
        node={editing && editing !== "new" ? editing : undefined}
      />

      <DeleteNodeDialog node={pendingDelete} onClose={() => setPendingDelete(null)} />

      <ReorderNodesDialog
        open={reordering}
        onClose={() => setReordering(false)}
        level={level}
      />
    </div>
  );
}

/* Copy is per level, and each line names the level above it — "no companies"
   means nothing until you know a company belongs to a category. */

function subtitleFor(key: string): string {
  switch (key) {
    case "CATEGORY":
      return "The top of the catalogue. Every company belongs to one.";
    case "COMPANY":
      return "The brands you stock, each inside a category.";
    case "PRODUCT_TYPE":
      return "What a company makes — phones, tablets, laptops.";
    default:
      return "The specific models products attach to.";
  }
}

function emptyTitleFor(key: string): string {
  switch (key) {
    case "CATEGORY":
      return "No categories yet";
    case "COMPANY":
      return "No companies yet";
    case "PRODUCT_TYPE":
      return "No product types yet";
    default:
      return "No models yet";
  }
}

function emptyDescriptionFor(key: string): string {
  switch (key) {
    case "CATEGORY":
      return "Start your catalogue with a category — Electronics, Furniture, Hardware.";
    case "COMPANY":
      return "Add the brands you stock. Each one sits inside a category.";
    case "PRODUCT_TYPE":
      return "A product type groups what a company makes — Mobile Phones, Tablets.";
    default:
      return "A model is what products attach to — Galaxy S25, iPhone 17.";
  }
}
