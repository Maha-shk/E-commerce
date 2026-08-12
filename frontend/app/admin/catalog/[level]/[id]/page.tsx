"use client";

import { use, useState } from "react";
import Link from "next/link";
import { notFound, useRouter } from "next/navigation";
import {
  ArrowUpDown,
  Boxes,
  FolderTree,
  Layers,
  Pencil,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AdminStatCard, StatChip } from "@/components/admin/AdminStatCard";
import { TablePagination } from "@/components/admin/TablePagination";
import { TableEmptyState } from "@/components/admin/TableEmptyState";
import { ErrorState, TableSkeleton } from "@/components/admin/QueryState";
import { ProductThumb } from "@/components/admin/ProductThumb";
import { CatalogBreadcrumb } from "@/components/admin/catalog/CatalogBreadcrumb";
import { CatalogNodeTable } from "@/components/admin/catalog/CatalogNodeTable";
import { CatalogNodeModal } from "@/components/admin/catalog/CatalogNodeModal";
import { DeleteNodeDialog } from "@/components/admin/catalog/DeleteNodeDialog";
import { ReorderNodesDialog } from "@/components/admin/catalog/ReorderNodesDialog";
import { useCatalogChildren, useCatalogNode } from "@/lib/hooks/use-catalog";
import { useProducts } from "@/lib/hooks/use-admin";
import { useDebounce } from "@/lib/hooks/use-debounce";
import { getApiErrorStatus } from "@/lib/api/client";
import { formatEuro } from "@/lib/admin/format";
import { stockStatusLabel, type StockStatus } from "@/lib/api/models";
import {
  catalogLevelHref,
  catalogStatusLabel,
  isCatalogSegment,
  levelForKey,
  levelForSegment,
  productsBeneathHref,
  type CatalogLevelSpec,
  type CatalogNode,
} from "@/lib/api/catalog";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 10;

/**
 * One node, and what is inside it.
 *
 * The same component for all four levels: a Category showing its companies, a
 * Company showing its product types, and so on. A Model has no child level —
 * it reports `childLevel: null` — so it shows its products instead.
 */
export default function CatalogNodePage({
  params,
}: {
  params: Promise<{ level: string; id: string }>;
}) {
  const { level: segment, id } = use(params);

  if (!isCatalogSegment(segment)) notFound();
  const level = levelForSegment(segment)!;

  return <NodeDetail key={id} level={level} id={id} />;
}

function NodeDetail({ level, id }: { level: CatalogLevelSpec; id: string }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<CatalogNode | null>(null);

  const {
    data: node,
    isPending,
    isError,
    error,
    refetch,
  } = useCatalogNode(level.segment, id);

  if (isError) {
    return (
      <div className="space-y-6">
        <NotFoundOrError level={level} error={error} onRetry={() => refetch()} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* The header renders as soon as the node lands, without waiting for the
          children request underneath it. */}
      {isPending || !node ? (
        <NodeHeaderSkeleton />
      ) : (
        <>
          <CatalogBreadcrumb trail={node.breadcrumb} />

          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <p className="text-xs font-semibold tracking-wider text-subtle uppercase">
                {node.levelLabel}
              </p>
              <h1 className="mt-1 truncate font-display text-2xl font-semibold text-foreground">
                {node.name}
              </h1>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <Badge
                  variant={node.status === "ARCHIVED" ? "secondary" : "success"}
                  className="h-6 px-2.5"
                >
                  <span className="size-1.5 rounded-full bg-current" />
                  {catalogStatusLabel[node.status]}
                </Badge>
                {node.visibility === "HIDDEN" ? (
                  <Badge variant="secondary" className="h-6 px-2.5">
                    Hidden from storefront
                  </Badge>
                ) : null}
                {node.isPlaceholder ? (
                  <Badge variant="warning" className="h-6 px-2.5">
                    Needs filing
                  </Badge>
                ) : null}
                <span className="text-xs text-subtle">/{node.slug}</span>
              </div>
              {node.description ? (
                <p className="mt-2 max-w-prose text-sm text-muted-foreground">
                  {node.description}
                </p>
              ) : null}
            </div>

            <div className="flex shrink-0 items-center gap-2">
              <Button variant="outline" size="lg" onClick={() => setEditing(true)}>
                <Pencil className="size-4" aria-hidden />
                Edit
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                onClick={() => setPendingDelete(node)}
              >
                <Trash2 className="size-4" aria-hidden />
                Delete
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
            <AdminStatCard
              label={level.child ? level.child.labelPlural : "Products here"}
              value={
                level.child
                  ? node.childCount.toLocaleString()
                  : (node.productCount?.toLocaleString() ?? "—")
              }
              caption="Directly inside"
              corner={
                <StatChip className="bg-accent text-primary">
                  <Layers className="size-4" aria-hidden />
                </StatChip>
              }
            />
            <AdminStatCard
              label="Products beneath"
              value={node.productCount?.toLocaleString() ?? "—"}
              caption="Anywhere under this node"
              corner={
                <StatChip className="bg-success-muted text-success">
                  <Boxes className="size-4" aria-hidden />
                </StatChip>
              }
            />
            {level.holdsProducts && node.releaseYear ? (
              <AdminStatCard
                label="Release year"
                value={String(node.releaseYear)}
                caption="Model year"
                corner={
                  <StatChip className="bg-muted text-muted-foreground">
                    <FolderTree className="size-4" aria-hidden />
                  </StatChip>
                }
              />
            ) : null}
          </div>

          {/* A Model's children are products, which live on their own screen. */}
          {level.child ? (
            <ChildLevelSection node={node} level={level} />
          ) : (
            <ModelProductsSection node={node} />
          )}

          <CatalogNodeModal
            open={editing}
            onClose={() => setEditing(false)}
            level={level}
            node={node}
          />
        </>
      )}

      <DeleteNodeDialog
        node={pendingDelete}
        onClose={() => setPendingDelete(null)}
        // The node is gone, so this page is too — go back to its level list.
        onDeleted={() => router.push(catalogLevelHref(level.segment))}
      />
    </div>
  );
}

/* ---- Children (Category → Companies, Company → Product Types, …) ---- */

function ChildLevelSection({
  node,
  level,
}: {
  node: CatalogNode;
  level: CatalogLevelSpec;
}) {
  const childLevel = levelForKey(level.child!.key);

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState<CatalogNode | "new" | null>(null);
  const [pendingDelete, setPendingDelete] = useState<CatalogNode | null>(null);
  const [reordering, setReordering] = useState(false);

  const debouncedSearch = useDebounce(search);

  const { data, isPending, isFetching, isError, error, refetch } = useCatalogChildren(
    level.segment,
    node.id,
    { page, limit: PAGE_SIZE, search: debouncedSearch || undefined },
  );

  const children = data?.data ?? [];
  const hasFilters = Boolean(search);

  return (
    <Card className="gap-0 py-0">
      <div className="flex flex-col gap-3 border-b border-border p-5 lg:flex-row lg:items-center lg:justify-between">
        <h2 className="text-base font-semibold tracking-tight text-foreground">
          {node.childLevelLabel}
          {(data?.meta.total ?? 0) > 0 ? (
            <span className="ml-2 text-sm font-normal text-muted-foreground tabular-nums">
              {data!.meta.total.toLocaleString()}
            </span>
          ) : null}
        </h2>

        <div className="flex items-center gap-2">
          <div className="relative w-full lg:w-64">
            <Search
              className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-subtle"
              aria-hidden
            />
            <Input
              type="text"
              inputMode="search"
              aria-label={`Search ${node.childLevelLabel.toLowerCase()}`}
              placeholder="Search…"
              className={cn("h-10 bg-card pl-9", search && "pr-9")}
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
            {search ? (
              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  setPage(1);
                }}
                aria-label="Clear search"
                className="absolute top-1/2 right-1.5 flex size-7 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
              >
                <X className="size-4" aria-hidden />
              </button>
            ) : null}
          </div>

          {/* The sibling set is unambiguous here — everything inside this
              node — so ordering belongs on this page. */}
          {(data?.meta.total ?? 0) > 1 ? (
            <Button variant="outline" onClick={() => setReordering(true)}>
              <ArrowUpDown className="size-4" aria-hidden />
              Order
            </Button>
          ) : null}

          <Button onClick={() => setEditing("new")}>
            <Plus className="size-4" aria-hidden />
            New {childLevel.label}
          </Button>
        </div>
      </div>

      <CatalogNodeTable
        level={childLevel}
        nodes={children}
        isPending={isPending}
        isFetching={isFetching}
        isError={isError}
        error={error}
        onRetry={() => refetch()}
        page={page}
        pageSize={PAGE_SIZE}
        total={data?.meta.total ?? 0}
        totalPages={data?.meta.totalPages ?? 1}
        onPageChange={setPage}
        hasFilters={hasFilters}
        onClearFilters={() => {
          setSearch("");
          setPage(1);
        }}
        onCreate={() => setEditing("new")}
        onEdit={setEditing}
        onDelete={setPendingDelete}
        emptyTitle={
          hasFilters
            ? `Nothing matches “${search.trim()}”`
            : `No ${node.childLevelLabel.toLowerCase()} in ${node.name} yet`
        }
        // Each empty state names the parent — "no companies yet" alone doesn't
        // tell you which category you are looking at.
        emptyDescription={
          hasFilters
            ? "Try a different search."
            : emptyChildCopy(childLevel.key, node.name)
        }
      />

      <CatalogNodeModal
        open={editing !== null}
        onClose={() => setEditing(null)}
        level={childLevel}
        node={editing && editing !== "new" ? editing : undefined}
        // The parent is fixed by the route: you are already inside it.
        parentId={editing === "new" ? node.id : undefined}
        parentName={node.name}
      />

      <DeleteNodeDialog node={pendingDelete} onClose={() => setPendingDelete(null)} />

      <ReorderNodesDialog
        open={reordering}
        onClose={() => setReordering(false)}
        level={childLevel}
        parentId={node.id}
        parentName={node.name}
      />
    </Card>
  );
}

function emptyChildCopy(childKey: string, parentName: string): string {
  switch (childKey) {
    case "COMPANY":
      return `Add the brands you stock in ${parentName}.`;
    case "PRODUCT_TYPE":
      return `What does ${parentName} make? Mobile Phones, Tablets, Laptops.`;
    default:
      return `Add the models of ${parentName} you carry.`;
  }
}

/* ---- A Model's products ---- */

function ModelProductsSection({ node }: { node: CatalogNode }) {
  const [page, setPage] = useState(1);

  const { data, isPending, isFetching, isError, error, refetch } = useProducts({
    modelId: node.id,
    page,
    limit: PAGE_SIZE,
  });

  const products = data?.data ?? [];
  const statusVariant: Record<StockStatus, "success" | "warning" | "destructive"> = {
    IN_STOCK: "success",
    LOW_STOCK: "warning",
    OUT_OF_STOCK: "destructive",
  };

  return (
    <Card className="gap-0 py-0">
      <div className="flex flex-col gap-3 border-b border-border p-5 lg:flex-row lg:items-center lg:justify-between">
        <h2 className="text-base font-semibold tracking-tight text-foreground">
          Products
          {(data?.meta.total ?? 0) > 0 ? (
            <span className="ml-2 text-sm font-normal text-muted-foreground tabular-nums">
              {data!.meta.total.toLocaleString()}
            </span>
          ) : null}
        </h2>

        <div className="flex items-center gap-2">
          {products.length > 0 ? (
            <Button asChild variant="outline">
              <Link href={productsBeneathHref("MODEL", node.id)}>Open in Products</Link>
            </Button>
          ) : null}
          <Button asChild>
            <Link href={`/admin/products/new?modelId=${encodeURIComponent(node.id)}`}>
              <Plus className="size-4" aria-hidden />
              New Product
            </Link>
          </Button>
        </div>
      </div>

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
                <th className="px-5 py-3 text-left">Product</th>
                <th className="px-3 py-3 text-left">SKU</th>
                <th className="px-3 py-3 text-left">Status</th>
                <th className="px-3 py-3 text-right">Stock</th>
                <th className="px-5 py-3 text-right">Price</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isPending ? (
                <TableSkeleton rows={5} columns={5} />
              ) : products.length === 0 ? (
                <TableEmptyState
                  colSpan={5}
                  icon={Boxes}
                  title={`No products for ${node.name} yet`}
                  description="Add the parts you sell for this model."
                  action={
                    <Button asChild>
                      <Link
                        href={`/admin/products/new?modelId=${encodeURIComponent(node.id)}`}
                      >
                        <Plus className="size-4" aria-hidden />
                        New Product
                      </Link>
                    </Button>
                  }
                />
              ) : (
                products.map((product) => (
                  <tr key={product.id} className="transition-colors hover:bg-muted/40">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <ProductThumb src={product.images?.[0]} />
                        <Link
                          href={`/admin/products/${product.id}/edit`}
                          className="min-w-0 truncate font-medium text-foreground hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                        >
                          {product.name}
                        </Link>
                      </div>
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap text-muted-foreground tabular-nums">
                      {product.sku}
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
                    <td className="px-5 py-3 text-right font-medium whitespace-nowrap tabular-nums text-foreground">
                      {formatEuro(product.price)}
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
          total={data?.meta.total ?? 0}
          totalPages={data?.meta.totalPages ?? 1}
          rowsOnPage={products.length}
          onPageChange={setPage}
          noun="products"
        />
      ) : null}
    </Card>
  );
}

/* ---- States ---- */

function NodeHeaderSkeleton() {
  return (
    <div className="space-y-4">
      <div className="h-5 w-64 animate-pulse rounded bg-muted" />
      <div className="h-9 w-80 animate-pulse rounded bg-muted" />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
        <div className="h-24 animate-pulse rounded-xl bg-muted" />
        <div className="h-24 animate-pulse rounded-xl bg-muted" />
      </div>
    </div>
  );
}

/**
 * A 404 here is final: the id is either gone or belongs to another store, and
 * the API answers 404 rather than 403 for both so ids can't be probed. Either
 * way there is nothing to retry — the only move is back up to the list.
 */
function NotFoundOrError({
  level,
  error,
  onRetry,
}: {
  level: CatalogLevelSpec;
  error: unknown;
  onRetry: () => void;
}) {
  if (getApiErrorStatus(error) !== 404) {
    return <ErrorState error={error} onRetry={onRetry} />;
  }

  return (
    <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
      <span className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <FolderTree className="size-6" aria-hidden />
      </span>
      <div>
        <p className="text-base font-semibold text-foreground">
          {level.label} not found
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          It has been deleted, or it belongs to a different store.
        </p>
      </div>
      <Button asChild variant="outline">
        <Link href={catalogLevelHref(level.segment)}>
          Back to {level.labelPlural.toLowerCase()}
        </Link>
      </Button>
    </div>
  );
}
