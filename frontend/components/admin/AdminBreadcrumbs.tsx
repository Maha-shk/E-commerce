"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { adminNav, isAdminNavActive } from "@/lib/admin/nav";

/** Human labels for the leaf segments the router uses. */
const LEAF_LABELS: Record<string, string> = {
  new: "New",
  edit: "Edit",
};

/**
 * Section + sub-page trail for the topbar.
 *
 * The topbar was a mostly-empty band: a search box floated on the left, two
 * icon buttons sat on the right, and the whole middle was void. This fills it
 * with something useful rather than decorative — on nested routes like
 * `/admin/products/<id>/edit` there was previously nothing at all telling you
 * where you were or offering a way back up.
 *
 * Deliberately not the page title: each page already renders its own `<h1>`
 * through `PageHeader`, and repeating it would just be noise.
 */
export function AdminBreadcrumbs() {
  const pathname = usePathname();

  const section = adminNav.find((item) => isAdminNavActive(pathname, item));
  if (!section) return null;

  // Anything after the section's own href — "new", "edit", or a record id.
  const rest = pathname.slice(section.href.length).split("/").filter(Boolean);
  const leaf = rest.at(-1);
  const leafLabel = leaf ? LEAF_LABELS[leaf] : undefined;

  return (
    <nav aria-label="Breadcrumb" className="hidden min-w-0 sm:block">
      <ol className="flex items-center gap-1.5 text-sm">
        <li className="min-w-0">
          {leafLabel ? (
            <Link
              href={section.href}
              className="rounded-md text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            >
              {section.name}
            </Link>
          ) : (
            <span className="font-medium text-foreground">{section.name}</span>
          )}
        </li>

        {leafLabel ? (
          <>
            <ChevronRight className="size-3.5 shrink-0 text-muted-foreground" aria-hidden />
            <li aria-current="page" className="truncate font-medium text-foreground">
              {leafLabel}
            </li>
          </>
        ) : null}
      </ol>
    </nav>
  );
}
