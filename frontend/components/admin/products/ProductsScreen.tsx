"use client";

import { useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  Boxes,
  CheckCircle2,
  Download,
  MoveRight,
  Pencil,
  Plus,
  Search,
  TrendingUp,
  Trash2,
  X,
} from "lucide-react";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/select-native";
import { Checkbox } from "@/components/ui/checkbox";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { MoveProductsDialog } from "@/components/admin/products/MoveProductsDialog";
import { ProductThumb } from "@/components/admin/ProductThumb";
import { AdminStatCard, StatChip } from "@/components/admin/AdminStatCard";
import { TablePagination } from "@/components/admin/TablePagination";
import { TableEmptyState } from "@/components/admin/TableEmptyState";
import { ErrorState, TableSkeleton } from "@/components/admin/QueryState";
import { useDeleteProduct, useInventoryStats, useProducts } from "@/lib/hooks/use-admin";
import { REASSIGN_MAX_IDS } from "@/lib/api/services/admin";
import { useCatalogList, useCatalogNode } from "@/lib/hooks/use-catalog";
import { useDebounce } from "@/lib/hooks/use-debounce";
import { formatCompact, formatEuro } from "@/lib/admin/format";
import { downloadCsv } from "@/lib/admin/csv";
import { stockStatusLabel, type Product, type StockStatus } from "@/lib/api/models";
import { catalogNodeHref, crumbHref } from "@/lib/api/catalog";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 10;

const statusVariant: Record<StockStatus, "success" | "warning" | "destructive"> = {
  IN_STOCK: "success",
  LOW_STOCK: "warning",
  OUT_OF_STOCK: "destructive",
};

const statusOptions: StockStatus[] = ["IN_STOCK", "LOW_STOCK", "OUT_OF_STOCK"];

/** Deep-link filters, e.g. from a node's product count in the catalogue. */
export type ProductScopeFilters = {
  categoryId?: string;
  companyId?: string;
  productTypeId?: string;
  modelId?: string;
};

export function ProductsScreen({ scope }: { scope: ProductScopeFilters }) {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"All" | StockStatus>("All");
  const [categoryId, setCategoryId] = useState(scope.categoryId ?? "");
  const [companyId, setCompanyId] = useState(scope.companyId ?? "");
  // The two deepest levels only arrive by link; the toolbar doesn't offer a
  // select for them, so they are shown as a removable chip instead.
  const [productTypeId, setProductTypeId] = useState(scope.productTypeId ?? "");
  const [modelId, setModelId] = useState(scope.modelId ?? "");
  const [page, setPage] = useState(1);
  const [pendingDelete, setPendingDelete] = useState<Product | null>(null);
  /*
   * Selection is keyed by id rather than by row index, so it survives paging
   * and refetches — moving 40 products out of a category means walking several
   * pages, and a selection that resets on each one would be useless for the
   * job it exists to do.
   */
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [moving, setMoving] = useState(false);

  const debouncedSearch = useDebounce(search);

  // Filtering and pagination happen server-side. Any ancestor id pulls
  // everything beneath it, so the four filters compose without a tree walk.
  const { data, isPending, isFetching, isError, error, refetch } = useProducts({
    page,
    limit: PAGE_SIZE,
    search: debouncedSearch || undefined,
    categoryId: categoryId || undefined,
    companyId: companyId || undefined,
    productTypeId: productTypeId || undefined,
    modelId: modelId || undefined,
    status: status === "All" ? undefined : status,
  });

  const { data: categories } = useCatalogList("categories", {
    limit: 100,
    withCounts: false,
    sortBy: "name",
    sortOrder: "asc",
  });

  // Narrowed to the chosen category when there is one; every company otherwise.
  const { data: companies } = useCatalogList("companies", {
    parentId: categoryId || undefined,
    limit: 100,
    withCounts: false,
    sortBy: "name",
    sortOrder: "asc",
  });

  const { data: stats, isLoading: statsLoading } = useInventoryStats();
  const deleteProduct = useDeleteProduct();

  const products = data?.data ?? [];
  const total = data?.meta.total ?? 0;
  const totalPages = data?.meta.totalPages ?? 1;

  const hasFilters =
    Boolean(search) ||
    Boolean(categoryId) ||
    Boolean(companyId) ||
    Boolean(productTypeId) ||
    Boolean(modelId) ||
    status !== "All";

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
    setCategoryId("");
    setCompanyId("");
    setProductTypeId("");
    setModelId("");
    setPage(1);
  }

  function toggleSelected(id: string) {
    setSelected((current) => {
      const next = new Set(current);
      if (!next.delete(id)) next.add(id);
      return next;
    });
  }

  const pageIds = products.map((product) => product.id);
  const allOnPageSelected =
    pageIds.length > 0 && pageIds.every((id) => selected.has(id));

  /** Selects or clears this page only — never rows the admin can't see. */
  function togglePage() {
    setSelected((current) => {
      const next = new Set(current);
      for (const id of pageIds) {
        if (allOnPageSelected) next.delete(id);
        else next.add(id);
      }
      return next;
    });
  }

  function handleExport() {
    downloadCsv(
      "products.csv",
      ["Name", "SKU", "Category", "Company", "Product Type", "Model", "Status", "Price", "Stock"],
      products.map((p) => [
        p.name,
        p.sku,
        p.category.name,
        p.company.name,
        p.productType.name,
        p.model.name,
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
        subtitle="Every part you sell, filed under the model it fits."
        action={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="lg"
              onClick={handleExport}
              disabled={products.length === 0}
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
        <div className="flex flex-col gap-3 border-b border-border p-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <h2 className="mr-1 text-base font-semibold tracking-tight text-foreground">
              All Products
            </h2>

            <NativeSelect
              aria-label="Filter by category"
              className="h-10 w-auto min-w-40"
              value={categoryId}
              onChange={(e) => {
                // A company from the old category would contradict the new one.
                setCompanyId("");
                withPageReset(setCategoryId)(e.target.value);
              }}
            >
              <option value="">All categories</option>
              {(categories?.data ?? []).map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </NativeSelect>

            <NativeSelect
              aria-label="Filter by company"
              className="h-10 w-auto min-w-40"
              value={companyId}
              onChange={(e) => withPageReset(setCompanyId)(e.target.value)}
            >
              <option value="">All companies</option>
              {(companies?.data ?? []).map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </NativeSelect>

            <NativeSelect
              aria-label="Filter by stock status"
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

            {/* Deep-link scopes have no select of their own — named and
                removable, so it is never a mystery why the list is short. */}
            <ScopeChip
              segment="product-types"
              id={productTypeId}
              onClear={() => withPageReset(setProductTypeId)("")}
            />
            <ScopeChip
              segment="models"
              id={modelId}
              onClear={() => withPageReset(setModelId)("")}
            />

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
              // Search reaches into the hierarchy: name, SKU, model name and
              // company name all match.
              placeholder="Search by name, SKU, model or brand…"
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

        {/* Replaces the toolbar's contents while a selection is live, rather
            than appearing alongside it — filtering and acting on a selection
            are different modes, and mixing them invites filtering a selection
            out of view and then acting on it. */}
        {selected.size > 0 ? (
          <div className="flex flex-col gap-3 border-b border-border bg-accent/40 p-5 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm font-medium text-foreground">
              {selected.size.toLocaleString()} product
              {selected.size === 1 ? "" : "s"} selected
              {selected.size > REASSIGN_MAX_IDS ? (
                <span className="ml-2 font-normal text-warning">
                  — more than the {REASSIGN_MAX_IDS} a single move allows
                </span>
              ) : null}
            </p>

            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={() => setSelected(new Set())}>
                Clear selection
              </Button>
              <Button size="sm" onClick={() => setMoving(true)}>
                <MoveRight className="size-4" aria-hidden />
                Move to model…
              </Button>
            </div>
          </div>
        ) : null}

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
            <table className="w-full min-w-5xl text-sm">
              <thead className="border-b border-border bg-muted/50 text-xs font-semibold tracking-wider text-subtle uppercase">
                <tr>
                  <th className="w-10 px-3 py-3 text-left">
                    <Checkbox
                      aria-label={
                        allOnPageSelected ? "Clear this page" : "Select this page"
                      }
                      checked={allOnPageSelected}
                      disabled={products.length === 0}
                      onCheckedChange={togglePage}
                    />
                  </th>
                  <th className="px-5 py-3 text-left">Product</th>
                  <th className="px-3 py-3 text-left">SKU</th>
                  <th className="px-3 py-3 text-left">Model</th>
                  <th className="px-3 py-3 text-left">Category</th>
                  <th className="px-3 py-3 text-left">Status</th>
                  <th className="px-3 py-3 text-right">Stock</th>
                  <th className="px-3 py-3 text-right">Price</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {isPending ? (
                  <TableSkeleton rows={PAGE_SIZE} columns={9} />
                ) : products.length === 0 ? (
                  <TableEmptyState
                    colSpan={9}
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
                    <tr
                      key={product.id}
                      className={cn(
                        "transition-colors hover:bg-muted/40",
                        selected.has(product.id) && "bg-accent/40",
                      )}
                    >
                      <td className="px-3 py-3">
                        <Checkbox
                          aria-label={`Select ${product.name}`}
                          checked={selected.has(product.id)}
                          onCheckedChange={() => toggleSelected(product.id)}
                        />
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <ProductThumb src={product.images?.[0]} />
                          <div className="min-w-0">
                            <Link
                              href={`/admin/products/${product.id}/edit`}
                              className="block truncate font-medium text-foreground hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                            >
                              {product.name}
                            </Link>
                            {/* The Company is the brand now — read-only here,
                                since it follows from the model. */}
                            <p className="line-clamp-1 text-xs text-subtle">
                              {product.company.name}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-3 py-3 whitespace-nowrap text-muted-foreground tabular-nums">
                        {product.sku}
                      </td>

                      <td className="px-3 py-3">
                        <Link
                          href={catalogNodeHref("models", product.modelId)}
                          className="block max-w-44 truncate text-foreground hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                        >
                          {product.model.name}
                        </Link>
                        <p className="max-w-44 truncate text-xs text-subtle">
                          {product.productType.name}
                        </p>
                      </td>

                      <td className="px-3 py-3 whitespace-nowrap">
                        <Link
                          href={catalogNodeHref("categories", product.category.id)}
                          className="text-muted-foreground hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                        >
                          {product.category.name}
                        </Link>
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
            <strong className="font-semibold text-foreground">{pendingDelete?.name}</strong>{" "}
            will be permanently removed, even if it appears in past orders. This
            action cannot be undone.
          </>
        }
        confirmLabel="Delete product"
        onConfirm={() => {
          if (pendingDelete) deleteProduct.mutate(pendingDelete.id);
          setPendingDelete(null);
        }}
      />

      <MoveProductsDialog
        open={moving}
        onClose={() => setMoving(false)}
        productIds={[...selected]}
        onMoved={() => setSelected(new Set())}
      />
    </div>
  );
}

/**
 * A filter that arrived by link rather than from the toolbar, named so the
 * scope is visible. Without it, "products under this product type" looks
 * identical to "the catalogue is nearly empty".
 */
function ScopeChip({
  segment,
  id,
  onClear,
}: {
  segment: "product-types" | "models";
  id: string;
  onClear: () => void;
}) {
  const { data: node } = useCatalogNode(segment, id);

  if (!id) return null;

  return (
    <span className="inline-flex h-10 items-center gap-1.5 rounded-lg bg-accent px-3 text-sm font-medium text-primary">
      {node ? (
        <Link href={crumbHref(node.breadcrumb.at(-1)!)} className="hover:underline">
          {node.levelLabel}: {node.name}
        </Link>
      ) : (
        <span>Filtered</span>
      )}
      <button
        type="button"
        onClick={onClear}
        aria-label="Remove this filter"
        className="rounded-md text-primary/70 transition-colors hover:text-primary"
      >
        <X className="size-3.5" aria-hidden />
      </button>
    </span>
  );
}
