import type { ComponentProps, ReactNode } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type SettingsFieldProps = ComponentProps<typeof Input> & {
  label: string;
  id: string;
  /** Leading icon rendered inside the field, left. Optional — plain fields omit it. */
  icon?: ReactNode;
  /** Trailing text or icon, right (e.g. a unit suffix). */
  trailing?: ReactNode;
  hint?: string;
  wrapperClassName?: string;
  value?: string;
};

/** Labelled input for the settings page — icon is optional, unlike ProfileField. */
export function SettingsField({
  label,
  id,
  icon,
  trailing,
  hint,
  wrapperClassName,
  className,
  value,
  ...props
}: SettingsFieldProps) {
  return (
    <div className={cn("space-y-2", wrapperClassName)}>
      <label htmlFor={id} className="text-sm font-medium text-muted-foreground">
        {label}
      </label>
      <div className="relative">
        {icon ? (
          <span className="pointer-events-none absolute left-3.5 top-1/2 flex -translate-y-1/2 text-subtle [&_svg]:size-4">
            {icon}
          </span>
        ) : null}
        <Input
          id={id}
          value={value}
          className={cn("h-11 rounded-lg bg-muted/40", icon && "pl-10", trailing && "pr-12", className)}
          {...props}
        />
        {trailing ? (
          <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-medium text-subtle [&_svg]:size-4">
            {trailing}
          </span>
        ) : null}
      </div>
      {hint && <p className="text-xs text-subtle">{hint}</p>}
    </div>
  );
}
