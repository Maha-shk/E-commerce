import type { ComponentType, ReactNode } from "react";
import type { LucideProps } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * One empty/zero-state treatment reused by orders, wishlist and addresses so
 * they don't each invent their own icon size, spacing and copy weight.
 */
export function AccountEmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
  /** Adds the dashed outline used when the empty state stands alone on a page. */
  bordered = false,
}: {
  icon: ComponentType<LucideProps>;
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
  bordered?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center px-6 py-12 text-center",
        bordered && "rounded-xl border border-dashed border-border bg-card",
        className,
      )}
    >
      <span className="mb-4 flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <Icon className="size-6" aria-hidden />
      </span>
      <h3 className="text-base font-semibold tracking-tight">{title}</h3>
      {description ? (
        <p className="mt-1 max-w-sm text-sm text-muted-foreground">{description}</p>
      ) : null}
      {action ? <div className="mt-5 flex flex-wrap justify-center gap-3">{action}</div> : null}
    </div>
  );
}
