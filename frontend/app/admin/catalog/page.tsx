"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Boxes,
  Building2,
  ChevronRight,
  ClipboardList,
  FolderTree,
  Layers,
  PackageOpen,
  Search,
  Shapes,
  Smartphone,
  X,
} from "lucide-react";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AdminStatCard, StatChip } from "@/components/admin/AdminStatCard";
import { ErrorState, LoadingState } from "@/components/admin/QueryState";
import { useCatalogStats, useCatalogTree } from "@/lib/hooks/use-catalog";
import { useDebounce } from "@/lib/hooks/use-debounce";
import {
  catalogLevelHref,
  catalogNodeHref,
  levelForKey,
  productsBeneathHref,
  type CatalogTreeNode,
} from "@/lib/api/catalog";
import { catalogGlyph } from "@/lib/catalog-icons";
import { cn } from "@/lib/utils";

/**
 * The catalogue at a glance: how big each level is, and the tree itself.
 *
 * The tree comes back nested and already pruned by the server when searching —
 * a branch is kept when it matches or contains a match, with the ancestors
 * leading to it — so filtering here is a query param, not client-side work.
 */
export default function CatalogOverviewPage() {
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search);

  const { data: stats, isPending: statsPending } = useCatalogStats();
  const {
    data: tree,
    isPending,
    isFetching,
    isError,
    error,
    refetch,
  } = useCatalogTree({
    depth: 3,
    search: debouncedSearch || undefined,
  });

  const isSearching = Boolean(debouncedSearch);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Catalogue"
        subtitle="Category → Company → Product Type → Model. Products attach to a model."
        action={
          <Button asChild size="lg">
            <Link href={catalogLevelHref("categories")}>
              <FolderTree className="size-4" aria-hidden />
              Manage categories
            </Link>
          </Button>
        }
      />

      {/* One card per level, each a way in. */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-5">
        <LevelStatCard
          href={catalogLevelHref("categories")}
          label="Categories"
          value={stats?.categories}
          loading={statsPending}
          icon={FolderTree}
          tone="bg-accent text-primary"
        />
        <LevelStatCard
          href={catalogLevelHref("companies")}
          label="Companies"
          value={stats?.companies}
          loading={statsPending}
          icon={Building2}
          tone="bg-accent text-primary"
        />
        <LevelStatCard
          href={catalogLevelHref("product-types")}
          label="Product Types"
          value={stats?.productTypes}
          loading={statsPending}
          icon={Shapes}
          tone="bg-accent text-primary"
        />
        <LevelStatCard
          href={catalogLevelHref("models")}
          label="Models"
          value={stats?.models}
          loading={statsPending}
          icon={Smartphone}
          tone="bg-accent text-primary"
        />
        <LevelStatCard
          href="/admin/products"
          label="Products"
          value={stats?.products}
          loading={statsPending}
          icon={Boxes}
          tone="bg-success-muted text-success"
        />
      </div>

      {/* The migration invented these so every product had a parent. They are
          the clean-up list, and distinct from "empty models" below — a model an
          admin created but hasn't stocked is empty, not unfiled. */}
      {stats && stats.placeholders.total > 0 ? (
        <div className="flex flex-col gap-3 rounded-xl border border-warning/25 bg-warning-muted p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex gap-3">
            <ClipboardList className="mt-0.5 size-5 shrink-0 text-warning" aria-hidden />
            <div>
              <p className="text-sm font-semibold text-warning">
                {stats.placeholders.total} placeholder{" "}
                {stats.placeholders.total === 1 ? "node" : "nodes"} need filing
              </p>
              <p className="mt-0.5 text-sm text-warning/90">
                The migration created these so existing products had somewhere
                to sit. Renaming one files it.
              </p>
            </div>
          </div>

          <div className="flex shrink-0 flex-wrap gap-2">
            {stats.placeholders.productTypes > 0 ? (
              <Button asChild variant="outline" size="sm">
                <Link href={`${catalogLevelHref("product-types")}?isPlaceholder=true`}>
                  {stats.placeholders.productTypes} product type
                  {stats.placeholders.productTypes === 1 ? "" : "s"}
                </Link>
              </Button>
            ) : null}
            {stats.placeholders.models > 0 ? (
              <Button asChild variant="outline" size="sm">
                <Link href={`${catalogLevelHref("models")}?isPlaceholder=true`}>
                  {stats.placeholders.models} model
                  {stats.placeholders.models === 1 ? "" : "s"}
                </Link>
              </Button>
            ) : null}
          </div>
        </div>
      ) : null}

      {stats && stats.emptyModels > 0 ? (
        <AdminStatCard
          label="Empty models"
          value={stats.emptyModels.toLocaleString()}
          caption="Models with no products — created but not yet stocked"
          tone="warning"
          corner={
            <StatChip className="bg-warning-muted text-warning">
              <PackageOpen className="size-4" aria-hidden />
            </StatChip>
          }
        />
      ) : null}

      <Card className="gap-0 py-0">
        <div className="flex flex-col gap-3 border-b border-border p-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-base font-semibold tracking-tight text-foreground">
              Hierarchy
            </h2>
            <p className="mt-0.5 text-sm text-muted-foreground">
              {isSearching
                ? "Branches that match, with the path leading to them."
                : "Every level, top to bottom."}
            </p>
          </div>

          <div className="relative w-full lg:w-72">
            <Search
              className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-subtle"
              aria-hidden
            />
            <Input
              type="text"
              inputMode="search"
              aria-label="Search the catalogue"
              placeholder="Search the whole tree…"
              className={cn("h-10 bg-card pl-9", search && "pr-9")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search ? (
              <button
                type="button"
                onClick={() => setSearch("")}
                aria-label="Clear search"
                className="absolute top-1/2 right-1.5 flex size-7 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
              >
                <X className="size-4" aria-hidden />
              </button>
            ) : null}
          </div>
        </div>

        {isError ? (
          <div className="p-5">
            <ErrorState error={error} onRetry={() => refetch()} />
          </div>
        ) : isPending ? (
          <LoadingState label="Loading the catalogue…" />
        ) : (tree?.length ?? 0) === 0 ? (
          <div className="flex flex-col items-center gap-3 px-4 py-16 text-center">
            <span className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
              <FolderTree className="size-6" aria-hidden />
            </span>
            <div>
              <p className="text-base font-semibold text-foreground">
                {isSearching ? `Nothing matches “${debouncedSearch}”` : "The catalogue is empty"}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {isSearching
                  ? "Try a different term."
                  : "Start with a category — Electronics, Furniture, Hardware."}
              </p>
            </div>
            {isSearching ? (
              <Button variant="outline" onClick={() => setSearch("")}>
                Clear search
              </Button>
            ) : (
              <Button asChild>
                <Link href={catalogLevelHref("categories")}>New Category</Link>
              </Button>
            )}
          </div>
        ) : (
          <ul
            className={cn(
              "divide-y divide-border transition-opacity duration-150",
              isFetching && "opacity-60",
            )}
          >
            {tree!.map((branch) => (
              <li key={branch.id} className="p-2 sm:p-3">
                <TreeBranch node={branch} defaultOpen={isSearching} />
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}

function LevelStatCard({
  href,
  label,
  value,
  loading,
  icon: Icon,
  tone,
}: {
  href: string;
  label: string;
  value?: number;
  loading: boolean;
  icon: typeof FolderTree;
  tone: string;
}) {
  return (
    <Link
      href={href}
      className="rounded-xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
    >
      <AdminStatCard
        label={label}
        value={(value ?? 0).toLocaleString()}
        caption="View all"
        loading={loading}
        corner={
          <StatChip className={tone}>
            <Icon className="size-4" aria-hidden />
          </StatChip>
        }
      />
    </Link>
  );
}

/**
 * One node and its descendants.
 *
 * Collapsed by default so a large catalogue opens as a readable list of
 * categories rather than a wall of every model you stock — but expanded while
 * searching, since a pruned result you have to click open is just a list of
 * categories again.
 */
function TreeBranch({
  node,
  depth = 0,
  defaultOpen = false,
}: {
  node: CatalogTreeNode;
  depth?: number;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const hasChildren = node.children.length > 0;
  const segment = levelForKey(node.level).segment;
  const isDimmed = node.status === "ARCHIVED" || node.visibility === "HIDDEN";

  return (
    <div>
      <div
        className="flex items-center gap-1.5 rounded-lg py-1.5 pr-2 hover:bg-muted/40"
        style={{ paddingLeft: `${depth * 1.25 + 0.25}rem` }}
      >
        {hasChildren ? (
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-label={`${open ? "Collapse" : "Expand"} ${node.name}`}
            className="flex size-6 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            <ChevronRight
              className={cn("size-4 transition-transform", open && "rotate-90")}
              aria-hidden
            />
          </button>
        ) : (
          <span className="size-6 shrink-0" />
        )}

        <Link
          href={catalogNodeHref(segment, node.id)}
          className={cn(
            "flex min-w-0 flex-1 items-center gap-2 rounded-md py-0.5 text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
            isDimmed && "opacity-60",
          )}
        >
          {/* A category's chosen icon, or the generic level glyph. */}
          {catalogGlyph(node.icon, Layers, "size-3.5 shrink-0 text-muted-foreground")}
          <span className="truncate font-medium text-foreground hover:text-primary">
            {node.name}
          </span>
          <span className="shrink-0 text-xs text-subtle">{node.levelLabel}</span>
          {isDimmed ? (
            <span className="shrink-0 text-xs text-warning">
              {node.status === "ARCHIVED" ? "Archived" : "Hidden"}
            </span>
          ) : null}
          {node.isPlaceholder ? (
            <span className="shrink-0 text-xs text-warning">Needs filing</span>
          ) : null}
        </Link>

        {node.productCount > 0 ? (
          <Link
            href={productsBeneathHref(node.level, node.id)}
            className="shrink-0 rounded-md px-2 py-0.5 text-xs font-medium text-muted-foreground tabular-nums transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            title={`${node.productCount} products beneath ${node.name}`}
          >
            {node.productCount.toLocaleString()}
          </Link>
        ) : (
          <span className="shrink-0 px-2 py-0.5 text-xs text-subtle tabular-nums">0</span>
        )}
      </div>

      {open && hasChildren ? (
        <div>
          {node.children.map((child) => (
            <TreeBranch
              key={child.id}
              node={child}
              depth={depth + 1}
              defaultOpen={defaultOpen}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}
