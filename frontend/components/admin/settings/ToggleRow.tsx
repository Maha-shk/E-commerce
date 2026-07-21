import { Switch } from "@/components/ui/switch";
import type { ToggleSetting } from "@/lib/admin/settings";

/** Label + description + switch row, used throughout the settings toggles. */
export function ToggleRow({ id, label, description, defaultChecked }: ToggleSetting) {
  return (
    <label
      htmlFor={id}
      className="flex cursor-pointer items-start justify-between gap-4 rounded-lg border border-input bg-muted/30 p-3.5"
    >
      <span>
        <span className="block text-sm font-semibold text-foreground">{label}</span>
        <span className="mt-0.5 block text-xs leading-relaxed text-subtle">{description}</span>
      </span>
      <Switch id={id} defaultChecked={defaultChecked} className="mt-0.5 shrink-0" />
    </label>
  );
}

/** Vertically stacked group of ToggleRows. */
export function ToggleRowGroup({ items }: { items: ToggleSetting[] }) {
  return (
    <div className="space-y-3">
      {items.map((item) => (
        <ToggleRow key={item.id} {...item} />
      ))}
    </div>
  );
}
