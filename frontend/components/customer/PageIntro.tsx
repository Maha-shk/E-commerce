import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Title block at the top of a customer page.
 *
 * Sizes were all over the place before — `text-4xl`, `text-4xl md:text-5xl`,
 * `text-2xl md:text-3xl` and `text-3xl` across four sibling pages. One scale
 * now, so page-to-page navigation doesn't resize the heading.
 */
export function PageIntro({
  title,
  description,
  action,
  align = "start",
  className,
}: {
  title: ReactNode;
  description?: ReactNode;
  /** Right-aligned control (search box, button…). */
  action?: ReactNode;
  align?: "start" | "center";
  className?: string;
}) {
  if (align === "center") {
    return (
      <div className={cn("mb-10 text-center", className)}>
        <h1 className="text-2xl font-semibold tracking-tight text-balance sm:text-3xl">
          {title}
        </h1>
        {description ? (
          <p className="mx-auto mt-3 max-w-2xl text-sm text-muted-foreground text-pretty">
            {description}
          </p>
        ) : null}
        {action ? <div className="mt-6 flex justify-center">{action}</div> : null}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between",
        className,
      )}
    >
      <div className="min-w-0">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{title}</h1>
        {description ? (
          <p className="mt-1.5 text-sm text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {action ? <div className="shrink-0 sm:min-w-64">{action}</div> : null}
    </div>
  );
}
