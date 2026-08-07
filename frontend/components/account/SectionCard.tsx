import type { ComponentType, ReactNode } from "react";
import type { LucideProps } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

/**
 * A titled panel.
 *
 * `Card` already applies its own vertical `--card-spacing` padding, so nesting
 * a `p-5` div inside one produced 36px top/bottom against 20px left/right —
 * the lopsided padding that made the old cards look untidy. `py-0 gap-0` hands
 * padding control entirely to this component, so every panel on every tab has
 * the same 20px gutter on all four sides.
 */
export function SectionCard({
  title,
  description,
  icon: Icon,
  action,
  children,
  className,
  bodyClassName,
  /** Draw a hairline between the header and the body (used by tables). */
  divided = false,
}: {
  title?: ReactNode;
  description?: ReactNode;
  icon?: ComponentType<LucideProps>;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
  divided?: boolean;
}) {
  const hasHeader = Boolean(title || description || action);

  return (
    <Card className={cn("gap-0 py-0", className)}>
      {hasHeader ? (
        <div
          className={cn(
            "flex items-center justify-between gap-3 px-5 pt-5 pb-4",
            divided && "border-b border-border pb-4",
          )}
        >
          <div className="flex min-w-0 items-center gap-2">
            {Icon ? (
              <Icon className="size-4 shrink-0 text-muted-foreground" aria-hidden />
            ) : null}
            <div className="min-w-0">
              {title ? <h2 className="section-title truncate">{title}</h2> : null}
              {description ? (
                <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
              ) : null}
            </div>
          </div>
          {action ? <div className="shrink-0">{action}</div> : null}
        </div>
      ) : null}

      <div className={cn("px-5 pb-5", !hasHeader && "pt-5", bodyClassName)}>
        {children}
      </div>
    </Card>
  );
}
