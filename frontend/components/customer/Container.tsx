import type { ElementType, ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * The single horizontal rhythm for every customer-facing page.
 *
 * Pages previously used Tailwind's `container` class while the site header
 * used `max-w-7xl`, so the logo and the page content below it sat on different
 * left edges on wide screens (`container` grows to 1536px at 2xl, `max-w-7xl`
 * caps at 1280px). Everything routes through this now.
 */
export function Container({
  as: Tag = "div",
  className,
  children,
}: {
  as?: ElementType;
  className?: string;
  children: ReactNode;
}) {
  return (
    <Tag className={cn("mx-auto w-full max-w-7xl px-4 sm:px-6", className)}>
      {children}
    </Tag>
  );
}
