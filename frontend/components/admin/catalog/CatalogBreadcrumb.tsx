"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { crumbHref, type BreadcrumbEntry } from "@/lib/api/catalog";
import { cn } from "@/lib/utils";

/**
 * The ancestor trail for a catalog node or a product.
 *
 * The trail is never assembled here. Every node response, every list row and
 * every product already carries `breadcrumb` root-first including itself, so
 * walking parents client-side would mean one request per level to rebuild
 * something the first response already answered.
 *
 * The final entry is the page you are on and is rendered as text, not a link.
 */
export function CatalogBreadcrumb({
  trail,
  /** Prepended root, since the trail starts at the Category. */
  rootHref = "/admin/catalog",
  rootLabel = "Catalogue",
  /** Rendered after the trail — a product name, say, which is not a node. */
  leaf,
  className,
}: {
  trail: BreadcrumbEntry[];
  rootHref?: string;
  rootLabel?: string;
  leaf?: string;
  className?: string;
}) {
  const crumbClass =
    "rounded-md text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring";

  return (
    <nav aria-label="Breadcrumb" className={cn("min-w-0", className)}>
      <ol className="flex flex-wrap items-center gap-1.5 text-sm">
        <li>
          <Link href={rootHref} className={crumbClass}>
            {rootLabel}
          </Link>
        </li>

        {trail.map((crumb, index) => {
          // Without a leaf, the last crumb is the current page.
          const isCurrent = !leaf && index === trail.length - 1;

          return (
            <li key={crumb.id} className="flex min-w-0 items-center gap-1.5">
              <ChevronRight
                className="size-3.5 shrink-0 text-muted-foreground"
                aria-hidden
              />
              {isCurrent ? (
                <span
                  aria-current="page"
                  className="truncate font-medium text-foreground"
                  title={`${crumb.levelLabel}: ${crumb.name}`}
                >
                  {crumb.name}
                </span>
              ) : (
                <Link
                  href={crumbHref(crumb)}
                  className={cn(crumbClass, "truncate")}
                  title={`${crumb.levelLabel}: ${crumb.name}`}
                >
                  {crumb.name}
                </Link>
              )}
            </li>
          );
        })}

        {leaf ? (
          <li className="flex min-w-0 items-center gap-1.5">
            <ChevronRight
              className="size-3.5 shrink-0 text-muted-foreground"
              aria-hidden
            />
            <span aria-current="page" className="truncate font-medium text-foreground">
              {leaf}
            </span>
          </li>
        ) : null}
      </ol>
    </nav>
  );
}
