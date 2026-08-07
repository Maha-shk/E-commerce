import type { ReactNode } from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * "Section title ————— View All →" row used at the top of every homepage
 * section. One component so the type scale, the margin below it and the
 * "View All" affordance are identical in all four sections.
 */
export function SectionHeading({
  title,
  description,
  href,
  linkLabel = "View All",
  className,
}: {
  title: ReactNode;
  description?: ReactNode;
  /** Renders the trailing link when provided. */
  href?: string;
  linkLabel?: string;
  className?: string;
}) {
  return (
    <div className={cn("mb-8 flex items-end justify-between gap-4", className)}>
      <div className="min-w-0">
        <h2 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
          {title}
        </h2>
        {description ? (
          <p className="mt-1.5 text-sm text-muted-foreground">{description}</p>
        ) : null}
      </div>

      {href ? (
        <Link
          href={href}
          className="group inline-flex shrink-0 items-center gap-0.5 rounded-md text-sm font-medium text-orange-600 transition-colors hover:text-orange-700 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
        >
          {linkLabel}
          <ChevronRight
            className="size-4 transition-transform duration-150 group-hover:translate-x-0.5"
            aria-hidden
          />
        </Link>
      ) : null}
    </div>
  );
}
