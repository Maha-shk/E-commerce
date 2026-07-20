import type { ComponentProps, ReactNode } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type ProfileFieldProps = ComponentProps<typeof Input> & {
  label: string;
  id: string;
  /** Leading icon rendered inside the field, left. */
  icon: ReactNode;
  /** Trailing element (e.g. a lock icon for read-only fields), right. */
  trailing?: ReactNode;
  wrapperClassName?: string;
};

/**
 * Labelled input with a leading icon — the field style used on the admin
 * profile screen. Pass `readOnly` for a visually disabled (locked) field.
 */
export function ProfileField({
  label,
  id,
  icon,
  trailing,
  wrapperClassName,
  className,
  readOnly,
  ...props
}: ProfileFieldProps) {
  return (
    <div className={cn("space-y-2", wrapperClassName)}>
      <label htmlFor={id} className="text-sm font-medium text-muted-foreground">
        {label}
      </label>
      <div className="relative">
        <span className="pointer-events-none absolute left-3.5 top-1/2 flex -translate-y-1/2 text-subtle [&_svg]:size-4">
          {icon}
        </span>
        <Input
          id={id}
          readOnly={readOnly}
          className={cn(
            "h-11 rounded-lg bg-muted/40 pl-10",
            trailing && "pr-10",
            readOnly && "cursor-not-allowed bg-muted/60 text-muted-foreground",
            className,
          )}
          {...props}
        />
        {trailing ? (
          <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-subtle [&_svg]:size-4">
            {trailing}
          </span>
        ) : null}
      </div>
    </div>
  );
}
