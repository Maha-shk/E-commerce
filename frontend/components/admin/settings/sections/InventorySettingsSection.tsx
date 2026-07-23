import { Warehouse } from "lucide-react";
import { SettingsSection } from "@/components/admin/settings/SettingsSection";
import { SettingsField } from "@/components/admin/settings/SettingsField";
import { SettingsSelectField } from "@/components/admin/settings/SettingsSelectField";
import { ToggleRowGroup } from "@/components/admin/settings/ToggleRow";
import { Divider } from "@/components/admin/settings/Divider";
import { outOfStockVisibilityOptions, stockReservationOptions, inventoryToggles } from "@/lib/admin/settings";

interface InventorySettingsSectionProps {
  data?: Record<string, unknown>;
  onChange?: (id: string, value: unknown) => void;
}

export function InventorySettingsSection({ data, onChange }: InventorySettingsSectionProps) {
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

  const togglesWithValues = inventoryToggles.map((toggle) => ({
    ...toggle,
    defaultChecked: getToggleValue(toggle.id, toggle.defaultChecked),
  }));

  return (
    <SettingsSection
      id="inventory"
      icon={Warehouse}
      title="Inventory Settings"
      description="Set stock thresholds and how out-of-stock items behave."
    >
      <div className="grid gap-5 sm:grid-cols-2">
        <SettingsField
          id="low-stock-threshold"
          label="Low Stock Threshold"
          type="number"
          trailing="units"
          value={getValue("low-stock-threshold", "10")}
          onChange={(e) => handleChange("low-stock-threshold", e.target.value)}
        />
        <SettingsSelectField
          id="out-of-stock-visibility"
          label="Out-of-Stock Visibility"
          options={outOfStockVisibilityOptions}
          value={getValue("out-of-stock-visibility", outOfStockVisibilityOptions[1])}
          onChange={(value) => handleChange("out-of-stock-visibility", value)}
        />
      </div>

      <Divider />

      <ToggleRowGroup
        items={togglesWithValues}
        onChange={handleChange}
      />

      <SettingsSelectField
        id="stock-reservation"
        label="Stock Reservation Duration"
        options={stockReservationOptions}
        value={getValue("stock-reservation", "30 minutes")}
        onChange={(value) => handleChange("stock-reservation", value)}
        wrapperClassName="sm:max-w-xs"
      />
    </SettingsSection>
  );
}
