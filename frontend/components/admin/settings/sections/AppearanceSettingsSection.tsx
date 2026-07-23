import type { CSSProperties } from "react";
import { Check, Paintbrush } from "lucide-react";
import { SettingsSection } from "@/components/admin/settings/SettingsSection";
import { UploadField } from "@/components/admin/settings/UploadField";
import { ToggleRow } from "@/components/admin/settings/ToggleRow";
import { Divider } from "@/components/admin/settings/Divider";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { cn } from "@/lib/utils";
import { themeOptions, primaryColorSwatches, secondaryColorSwatches } from "@/lib/admin/settings";

interface ColorSwatchPickerProps {
  name: string;
  colors: string[];
  value: string;
  onChange: (value: string) => void;
}

function ColorSwatchPicker({ name, colors, value, onChange }: ColorSwatchPickerProps) {
  return (
    <div className="flex flex-wrap gap-3">
      {colors.map((color) => (
        <label key={color} className="group relative">
          <input
            type="radio"
            name={name}
            value={color}
            checked={color === value}
            onChange={(e) => onChange(e.target.value)}
            className="peer sr-only"
          />
          <span
            className="block size-9 cursor-pointer rounded-full ring-1 ring-inset ring-foreground/10 transition-transform peer-checked:ring-2 peer-checked:ring-offset-2 peer-checked:ring-offset-card peer-focus-visible:ring-2 peer-focus-visible:ring-ring group-hover:scale-105"
            style={{ backgroundColor: color, "--tw-ring-color": color } as CSSProperties}
          />
          <Check className="pointer-events-none absolute inset-0 m-auto size-4 text-white opacity-0 mix-blend-difference peer-checked:opacity-100" />
        </label>
      ))}
    </div>
  );
}

interface AppearanceSettingsSectionProps {
  data?: Record<string, unknown>;
  onChange?: (id: string, value: unknown) => void;
}

export function AppearanceSettingsSection({ data, onChange }: AppearanceSettingsSectionProps) {
  const handleChange = (id: string, value: unknown) => {
    onChange?.(id, value);
  };

  const getValue = (key: string, defaultValue: string) => {
    return (data?.[key] as string) ?? defaultValue;
  };

  const getToggleValue = (key: string, defaultValue: boolean) => {
    const value = data?.[key];
    if (typeof value === "boolean") return value;
    return defaultValue;
  };

  return (
    <SettingsSection
      id="appearance"
      icon={Paintbrush}
      title="Appearance Settings"
      description="Customize the look and feel customers see on the storefront."
    >
      <div className="space-y-3">
        <p className="text-sm font-medium text-muted-foreground">Theme Selection</p>
        <RadioGroup
          value={getValue("theme", "light")}
          onValueChange={(value) => handleChange("theme", value)}
          className="grid grid-cols-1 gap-3 sm:grid-cols-3"
        >
          {themeOptions.map((theme) => (
            <label
              key={theme.id}
              htmlFor={`theme-${theme.id}`}
              className={cn(
                "flex cursor-pointer items-start gap-3 rounded-lg border border-input p-3.5 transition-colors hover:bg-muted/40",
              )}
            >
              <RadioGroupItem id={`theme-${theme.id}`} value={theme.id} className="mt-0.5" />
              <span>
                <span className="block text-sm font-semibold text-foreground">{theme.label}</span>
                <span className="block text-xs text-subtle">{theme.description}</span>
              </span>
            </label>
          ))}
        </RadioGroup>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">Primary Color</p>
          <ColorSwatchPicker
            name="primary-color"
            colors={primaryColorSwatches}
            value={getValue("primary-color", primaryColorSwatches[0])}
            onChange={(value) => handleChange("primary-color", value)}
          />
        </div>
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">Secondary Color</p>
          <ColorSwatchPicker
            name="secondary-color"
            colors={secondaryColorSwatches}
            value={getValue("secondary-color", secondaryColorSwatches[0])}
            onChange={(value) => handleChange("secondary-color", value)}
          />
        </div>
      </div>

      <Divider />

      <UploadField label="Logo Upload" hint="PNG or SVG, at least 256×256px" shape="square" />

      <Divider />

      <ToggleRow
        id="dark-mode-toggle"
        label="Dark Mode Toggle"
        description="Let customers switch the storefront to a dark theme."
        defaultChecked={false}
        checked={getToggleValue("dark-mode-toggle", false)}
        onChange={handleChange}
      />
      <ToggleRow
        id="homepage-banner"
        label="Homepage Banner Visibility"
        description="Show the promotional banner at the top of the homepage."
        defaultChecked
        checked={getToggleValue("homepage-banner", true)}
        onChange={handleChange}
      />
    </SettingsSection>
  );
}
