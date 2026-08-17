"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
} from "@/components/ui/sheet";
import { useCatalogTree } from "@/lib/hooks/use-customer";
import type { PublicCatalogNode } from "@/lib/api/services/public";
import { catalogGlyph } from "@/lib/catalog-icons";
import { Layers } from "lucide-react";

/** Static destinations, kept below the catalogue so the tree leads. */
const EXTRA_LINKS = [
  { href: "/products", label: "All Products" },
  { href: "/new-arrivals", label: "New Arrivals" },
  { href: "/sales", label: "Sales" },
  { href: "/contact", label: "Contact Us" },
] as const;

/**
 * Where a node in the tree leads.
 *
 * Categories have their own page; everything below is a filter on the product
 * list. `companyId` and friends pull everything beneath them, so tapping a
 * brand shows all of its products rather than only the directly-attached ones.
 */
function hrefFor(node: PublicCatalogNode): string {
  switch (node.level) {
    case "CATEGORY":
      return `/categories/${node.slug}`;
    case "COMPANY":
      return `/products?companyId=${node.id}`;
    case "PRODUCT_TYPE":
      return `/products?productTypeId=${node.id}`;
    default:
      return `/products?modelId=${node.id}`;
  }
}

/**
 * The slide-out catalogue, drilling one level per tap.
 *
 * Modelled on the reference site: brand mark at the top, then a single vertical
 * list. Tapping a row with children replaces the list rather than nesting or
 * expanding, and each panel past the first opens with a Back row — which is
 * what keeps a four-level hierarchy navigable on a phone, where an accordion
 * would leave the shopper scrolling through everything they didn't pick.
 *
 * The whole thing is one `/public/catalog/tree` call. The server already strips
 * archived and hidden branches, so anything reaching this list is safe to show,
 * and adding a category in the admin puts it here with no code change.
 */
export function CatalogDrawer({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  // Depth 3 covers Category → Company → Product Type → Model, so drilling
  // never needs a second request mid-navigation.
  const { data: tree, isPending } = useCatalogTree(3);

  /*
   * The path of opened nodes. The last entry is the panel on screen; empty
   * means the root list. Keeping the trail rather than just the current node
   * is what lets Back walk up one level at a time.
   */
  const [trail, setTrail] = useState<PublicCatalogNode[]>([]);

  const current = trail[trail.length - 1];
  const items = current ? current.children : (tree ?? []);

  function close() {
    onOpenChange(false);
    // Reset after the close animation so the list doesn't visibly jump back
    // to the root while the panel is still sliding out.
    window.setTimeout(() => setTrail([]), 200);
  }

  return (
    <Sheet open={open} onOpenChange={(next) => (next ? onOpenChange(true) : close())}>
      <SheetContent side="left" className="w-[88vw] gap-0 p-0 sm:max-w-sm">
        <div className="flex items-center border-b border-border px-5 py-4">
          <SheetTitle asChild>
            <Link href="/" onClick={close} aria-label="Cento — home">
              <Image
                src="/logos/cento-logo.png"
                alt="Cento"
                width={140}
                height={44}
                className="h-9 w-auto"
              />
            </Link>
          </SheetTitle>
        </div>

        <SheetDescription className="sr-only">
          Browse the catalogue by category, brand, product type and model.
        </SheetDescription>

        <nav className="flex-1 overflow-y-auto" aria-label="Catalogue">
          {/* Back row — the panel's own title doubles as the way up. */}
          {current ? (
            <button
              type="button"
              onClick={() => setTrail((t) => t.slice(0, -1))}
              className="flex w-full items-center gap-2 border-b border-border bg-muted/50 px-5 py-3 text-left transition-colors hover:bg-muted focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring"
            >
              <ChevronLeft className="size-4 shrink-0 text-muted-foreground" aria-hidden />
              <span className="min-w-0">
                <span className="block truncate text-sm font-semibold text-foreground">
                  {current.name}
                </span>
                <span className="block text-xs text-muted-foreground">
                  Back to{" "}
                  {trail.length > 1 ? trail[trail.length - 2].name : "all categories"}
                </span>
              </span>
            </button>
          ) : null}

          {isPending ? (
            <p className="flex items-center gap-2 px-5 py-6 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" aria-hidden />
              Loading catalogue…
            </p>
          ) : null}

          {/* A node that has children opens the next panel; a leaf navigates.
              Both are offered when it has children AND its own page: the row
              drills in, the label goes straight there. */}
          <ul className="divide-y divide-border">
            {current ? (
              <li>
                <Link
                  href={hrefFor(current)}
                  onClick={close}
                  className="flex items-center justify-between gap-3 px-5 py-3 text-sm font-medium text-primary transition-colors hover:bg-muted focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring"
                >
                  View all in {current.name}
                  <ChevronRight className="size-4 shrink-0" aria-hidden />
                </Link>
              </li>
            ) : null}

            {items.map((node) => {
              const hasChildren = node.children.length > 0;

              return (
                <li key={node.id}>
                  {hasChildren ? (
                    <button
                      type="button"
                      onClick={() => setTrail((t) => [...t, node])}
                      className="flex w-full items-center gap-3 px-5 py-3 text-left transition-colors hover:bg-muted focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring"
                    >
                      {node.level === "CATEGORY"
                        ? catalogGlyph(node.icon, Layers, "size-4 shrink-0 text-muted-foreground")
                        : null}
                      <span className="min-w-0 flex-1 truncate text-sm font-medium text-foreground">
                        {node.name}
                      </span>
                      <ChevronRight
                        className="size-4 shrink-0 text-muted-foreground"
                        aria-hidden
                      />
                    </button>
                  ) : (
                    <Link
                      href={hrefFor(node)}
                      onClick={close}
                      className="flex items-center gap-3 px-5 py-3 transition-colors hover:bg-muted focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring"
                    >
                      {node.level === "CATEGORY"
                        ? catalogGlyph(node.icon, Layers, "size-4 shrink-0 text-muted-foreground")
                        : null}
                      <span className="min-w-0 flex-1 truncate text-sm font-medium text-foreground">
                        {node.name}
                      </span>
                    </Link>
                  )}
                </li>
              );
            })}
          </ul>

          {/* Only on the root panel — inside a category these would read as
              part of that category. */}
          {!current ? (
            <ul className="mt-2 divide-y divide-border border-t border-border">
              {EXTRA_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    onClick={close}
                    className="flex items-center px-5 py-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          ) : null}
        </nav>
      </SheetContent>
    </Sheet>
  );
}
