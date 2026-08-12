"use client";

import Link from "next/link";
import {
  ChevronRight,
  FolderTree,
  Pencil,
  Plus,
  Trash2,
  type LucideIcon,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TablePagination } from "@/components/admin/TablePagination";
import { TableEmptyState } from "@/components/admin/TableEmptyState";
import { ErrorState, TableSkeleton } from "@/components/admin/QueryState";
import {
  catalogNodeHref,
  catalogStatusLabel,
  levelForKey,
  productsBeneathHref,
  type CatalogLevelSpec,
  type CatalogNode,
} from "@/lib/api/catalog";
import { catalogGlyph } from "@/lib/catalog-icons";
import { cn } from "@/lib/utils";

/**
 * The list of nodes at one level.
 *
 * Written once and used by every level: the categories screen, the companies
 * inside a category, the product types inside a company, and so on. What
 * differs between them is data — the level's labels, and what its children are
 * called — not markup, so there is one table rather than four.
 */
export function CatalogNodeTable({
  level,
  nodes,
  isPending,
  isFetching,
  isError,
  error,
  onRetry,
  page,
  pageSize,
  total,
  totalPages,
  onPageChange,
  hasFilters,
  onClearFilters,
  onEdit,
  onDelete,
  onCreate,
  emptyTitle,
  emptyDescription,
  emptyIcon = FolderTree,
}: {
  level: CatalogLevelSpec;
  nodes: CatalogNode[];
  isPending: boolean;
  isFetching: boolean;
  isError: boolean;
  error: unknown;
  onRetry: () => void;
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  hasFilters: boolean;
  onClearFilters: () => void;
  onEdit: (node: CatalogNode) => void;
  onDelete: (node: CatalogNode) => void;
  onCreate: () => void;
  emptyTitle: string;
  emptyDescription: string;
  emptyIcon?: LucideIcon;
}) {
  // A Model's "children" are products, which live on another screen.
  const childColumnLabel = level.child?.labelPlural ?? "Products";
  const columnCount = 5;

  if (isError) {
    return (
      <div className="p-5">
        <ErrorState error={error} onRetry={onRetry} />
      </div>
    );
  }

  return (
    <>
      <div
        // Dim rather than unmount while the next page loads, so the table
        // doesn't collapse to skeletons on every keystroke.
        className={cn(
          "overflow-x-auto transition-opacity duration-150",
          isFetching && !isPending && "opacity-60",
        )}
      >
        <table className="w-full min-w-3xl text-sm">
          <thead className="border-b border-border bg-muted/50 text-xs font-semibold tracking-wider text-subtle uppercase">
            <tr>
              <th className="px-5 py-3 text-left">{level.label}</th>
              <th className="px-3 py-3 text-left">Status</th>
              <th className="px-3 py-3 text-right">{childColumnLabel}</th>
              <th className="px-3 py-3 text-right">Products</th>
              <th className="px-5 py-3 text-right">Actions</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-border">
            {isPending ? (
              <TableSkeleton rows={pageSize} columns={columnCount} />
            ) : nodes.length === 0 ? (
              <TableEmptyState
                colSpan={columnCount}
                icon={emptyIcon}
                title={emptyTitle}
                description={emptyDescription}
                action={
                  hasFilters ? (
                    <Button variant="outline" onClick={onClearFilters}>
                      Clear filters
                    </Button>
                  ) : (
                    <Button onClick={onCreate}>
                      <Plus className="size-4" aria-hidden />
                      New {level.label}
                    </Button>
                  )
                }
              />
            ) : (
              nodes.map((node) => (
                <NodeRow
                  key={node.id}
                  node={node}
                  level={level}
                  onEdit={() => onEdit(node)}
                  onDelete={() => onDelete(node)}
                />
              ))
            )}
          </tbody>
        </table>
      </div>

      {nodes.length > 0 ? (
        <TablePagination
          page={page}
          pageSize={pageSize}
          total={total}
          totalPages={totalPages}
          rowsOnPage={nodes.length}
          onPageChange={onPageChange}
          noun={level.labelPlural.toLowerCase()}
        />
      ) : null}
    </>
  );
}

function NodeRow({
  node,
  level,
  onEdit,
  onDelete,
}: {
  node: CatalogNode;
  level: CatalogLevelSpec;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const isArchived = node.status === "ARCHIVED";
  const isHidden = node.visibility === "HIDDEN";
  const href = catalogNodeHref(levelForKey(node.level).segment, node.id);

  return (
    <tr
      className={cn(
        "transition-colors hover:bg-muted/40",
        isArchived && "opacity-60",
      )}
    >
      <td className="px-5 py-3">
        <div className="flex items-center gap-3">
          <NodeThumb src={node.imageUrl} icon={node.icon} />
          <div className="min-w-0">
            {/* The name opens the node rather than an edit dialog: at every
                level above Model, what you almost always want next is what is
                inside it. Editing is one click away in the actions column. */}
            <Link
              href={href}
              className="flex max-w-full items-center gap-1 truncate font-medium text-foreground hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            >
              <span className="truncate">{node.name}</span>
              <ChevronRight className="size-3.5 shrink-0 text-muted-foreground" aria-hidden />
            </Link>
            <p className="line-clamp-1 text-xs text-subtle">
              {node.description || node.slug}
            </p>
          </div>
        </div>
      </td>

      <td className="px-3 py-3">
        <div className="flex flex-wrap items-center gap-1.5">
          <Badge variant={isArchived ? "secondary" : "success"} className="h-6 px-2.5">
            <span className="size-1.5 rounded-full bg-current" />
            {catalogStatusLabel[node.status]}
          </Badge>
          {/* Hidden is independent of archived, and hiding a branch hides
              everything under it — worth showing, not just on the edit form. */}
          {isHidden ? (
            <Badge variant="secondary" className="h-6 px-2.5">
              Hidden
            </Badge>
          ) : null}
          {/* Invented by the migration, not created by anyone — it needs a
              real name before the catalogue reads honestly. */}
          {node.isPlaceholder ? (
            <Badge variant="warning" className="h-6 px-2.5">
              Needs filing
            </Badge>
          ) : null}
        </div>
      </td>

      <td className="px-3 py-3 text-right whitespace-nowrap tabular-nums">
        {level.child ? (
          <span
            className={
              node.childCount === 0 ? "text-muted-foreground" : "font-medium text-foreground"
            }
          >
            {node.childCount.toLocaleString()}
          </span>
        ) : (
          <span className="text-muted-foreground">—</span>
        )}
      </td>

      <td className="px-3 py-3 text-right whitespace-nowrap tabular-nums">
        {/* null means the roll-up was skipped, which is not the same as zero —
            an em dash rather than a confident "0" nobody asked for. */}
        {node.productCount === null ? (
          <span className="text-subtle">—</span>
        ) : node.productCount > 0 ? (
          <Link
            href={productsBeneathHref(node.level, node.id)}
            className="font-medium text-foreground hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            {node.productCount.toLocaleString()}
          </Link>
        ) : (
          <span className="text-muted-foreground">0</span>
        )}
      </td>

      <td className="px-5 py-3">
        <div className="flex items-center justify-end gap-1">
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={`Edit ${node.name}`}
            onClick={onEdit}
          >
            <Pencil />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={`Delete ${node.name}`}
            className="text-destructive hover:bg-destructive/10 hover:text-destructive"
            onClick={onDelete}
          >
            <Trash2 />
          </Button>
        </div>
      </td>
    </tr>
  );
}

/**
 * Node image, then its chosen icon, then a generic glyph.
 *
 * That order is what `Category.icon` is for — a deliberate stand-in when there
 * is no artwork, rather than every row showing the same folder.
 */
function NodeThumb({ src, icon }: { src: string | null; icon?: string | null }) {
  return (
    <span className="relative flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-muted text-muted-foreground ring-1 ring-foreground/5">
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element -- arbitrary remote
        // host; next/image would need every CDN allow-listed in next.config.
        <img src={src} alt="" className="size-full object-cover" />
      ) : (
        catalogGlyph(icon, FolderTree)
      )}
    </span>
  );
}
