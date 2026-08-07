import type { ComponentType, ReactNode } from "react";
import type { LucideProps } from "lucide-react";
import { Loader2, PackageOpen, RotateCw, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * Loading / error / empty states for the customer pages.
 *
 * Every page hand-rolled its own with a different spinner size, a different
 * grey and a different amount of padding; this is the one treatment.
 */

export function LoadingState({
  label = "Loading…",
  className,
}: {
  label?: string;
  className?: string;
}) {
  return (
    <div
      role="status"
      className={cn("flex flex-col items-center justify-center gap-3 py-20", className)}
    >
      <Loader2 className="size-7 animate-spin text-muted-foreground" aria-hidden />
      <p className="text-sm text-muted-foreground">{label}</p>
    </div>
  );
}

export function ErrorState({
  title = "Something went wrong",
  description = "We couldn't load this right now. Please try again.",
  onRetry,
  className,
}: {
  title?: string;
  description?: ReactNode;
  onRetry?: () => void;
  className?: string;
}) {
  return (
    <EmptyState
      icon={TriangleAlert}
      tone="warning"
      title={title}
      description={description}
      className={className}
      action={
        onRetry ? (
          <Button variant="outline" onClick={onRetry}>
            <RotateCw className="size-4" aria-hidden />
            Try again
          </Button>
        ) : undefined
      }
    />
  );
}

export function EmptyState({
  icon: Icon = PackageOpen,
  title,
  description,
  action,
  tone = "muted",
  bordered = false,
  className,
}: {
  icon?: ComponentType<LucideProps>;
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  tone?: "muted" | "warning";
  bordered?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center px-6 py-16 text-center",
        bordered && "rounded-xl border border-dashed border-border bg-card",
        className,
      )}
    >
      <span
        className={cn(
          "mb-4 flex size-12 items-center justify-center rounded-full",
          tone === "warning"
            ? "bg-warning-muted text-warning"
            : "bg-muted text-muted-foreground",
        )}
      >
        <Icon className="size-6" aria-hidden />
      </span>
      <h2 className="text-base font-semibold tracking-tight">{title}</h2>
      {description ? (
        <p className="mt-1 max-w-sm text-sm text-muted-foreground text-pretty">
          {description}
        </p>
      ) : null}
      {action ? <div className="mt-5 flex flex-wrap justify-center gap-3">{action}</div> : null}
    </div>
  );
}
