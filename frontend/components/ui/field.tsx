import type { ComponentProps, ReactNode } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type FieldProps = ComponentProps<typeof Input> & {
  label: string;
  id: string;
  /** Leading icon element (rendered inside the field, left). */
  icon?: ReactNode;
  /** Trailing element (e.g. a show/hide password button), right. */
  trailing?: ReactNode;
  /** Right-aligned addon beside the label (e.g. a "Forgot password?" link). */
  labelAddon?: ReactNode;
  /** Validation message rendered beneath the field. */
  error?: string;
  wrapperClassName?: string;
};

/**
 * Labelled input built on shadcn <Label> + <Input>, styled to match the
 * CENTO auth screens: uppercase tracked label + tall rounded field.
 */
export function Field({
  label,
  id,
  icon,
  trailing,
  labelAddon,
  error,
  wrapperClassName,
  className,
  ...props
}: FieldProps) {
  return (
    <div className={cn("space-y-1.5", wrapperClassName)}>
      <div className="flex min-h-5 items-center justify-between gap-2">
        <Label htmlFor={id} className="eyebrow">
          {label}
        </Label>
        {labelAddon}
      </div>
      <div className="relative">
        {icon ? (
          // `left-3` matches the input's own px-3, so the icon and a plain
          // (icon-less) field start their content on the same optical column.
          <span className="pointer-events-none absolute left-3 top-1/2 flex -translate-y-1/2 text-subtle [&_svg]:size-4">
            {icon}
          </span>
        ) : null}
        <Input
          id={id}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${id}-error` : undefined}
          className={cn(
            "h-11 rounded-lg bg-card",
            icon && "pl-10",
            trailing && "pr-11",
            error && "border-destructive focus-visible:ring-destructive/30",
            className,
          )}
          {...props}
        />
        {trailing ? (
          <span className="absolute right-1.5 top-1/2 -translate-y-1/2">{trailing}</span>
        ) : null}
      </div>
      {error ? (
        <p id={`${id}-error`} className="text-xs font-medium text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  );
}
