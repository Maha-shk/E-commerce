import type { ComponentProps } from "react";
import { NativeSelect } from "@/components/ui/select-native";
import { cn } from "@/lib/utils";

type SettingsSelectFieldProps = ComponentProps<typeof NativeSelect> & {
  label: string;
  id: string;
  options: string[];
  wrapperClassName?: string;
};

/** Labelled dropdown for the settings page, backed by the shared NativeSelect. */
export function SettingsSelectField({
  label,
  id,
  options,
  wrapperClassName,
  className,
  ...props
}: SettingsSelectFieldProps) {
  return (
    <div className={cn("space-y-2", wrapperClassName)}>
      <label htmlFor={id} className="text-sm font-medium text-muted-foreground">
        {label}
      </label>
      <NativeSelect id={id} className={cn("h-11 rounded-lg bg-muted/40", className)} {...props}>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </NativeSelect>
    </div>
  );
}
