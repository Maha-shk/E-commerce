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
  wrapperClassName,
  className,
  ...props
}: FieldProps) {
  return (
    <div className={cn("space-y-2", wrapperClassName)}>
      <div className="flex items-center justify-between gap-2">
        <Label htmlFor={id} className="text-xs font-semibold uppercase tracking-wider text-subtle">
          {label}
        </Label>
        {labelAddon}
      </div>
      <div className="relative">
        {icon ? (
          <span className="pointer-events-none absolute left-3.5 top-1/2 flex -translate-y-1/2 text-subtle [&_svg]:size-4">
            {icon}
          </span>
        ) : null}
        <Input
          id={id}
          className={cn("h-11 rounded-lg bg-card", icon && "pl-10", trailing && "pr-11", className)}
          {...props}
        />
        {trailing ? (
          <span className="absolute right-1.5 top-1/2 -translate-y-1/2">{trailing}</span>
        ) : null}
      </div>
    </div>
  );
}
