import type { ComponentProps } from "react";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

type SettingsTextareaFieldProps = ComponentProps<typeof Textarea> & {
  label: string;
  id: string;
  hint?: string;
  wrapperClassName?: string;
};

/** Labelled textarea for the settings page. */
export function SettingsTextareaField({
  label,
  id,
  hint,
  wrapperClassName,
  className,
  ...props
}: SettingsTextareaFieldProps) {
  return (
    <div className={cn("space-y-2", wrapperClassName)}>
      <label htmlFor={id} className="text-sm font-medium text-muted-foreground">
        {label}
      </label>
      <Textarea id={id} className={cn("rounded-lg bg-muted/40", className)} {...props} />
      {hint && <p className="text-xs text-subtle">{hint}</p>}
    </div>
  );
}
