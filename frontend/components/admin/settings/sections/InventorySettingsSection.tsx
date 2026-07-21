import { Warehouse } from "lucide-react";
import { SettingsSection } from "@/components/admin/settings/SettingsSection";
import { SettingsField } from "@/components/admin/settings/SettingsField";
import { SettingsSelectField } from "@/components/admin/settings/SettingsSelectField";
import { ToggleRowGroup } from "@/components/admin/settings/ToggleRow";
import { Divider } from "@/components/admin/settings/Divider";
import { outOfStockVisibilityOptions, stockReservationOptions, inventoryToggles } from "@/lib/admin/settings";

export function InventorySettingsSection() {
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
          defaultValue="10"
        />
        <SettingsSelectField
          id="out-of-stock-visibility"
          label="Out-of-Stock Visibility"
          options={outOfStockVisibilityOptions}
          defaultValue={outOfStockVisibilityOptions[1]}
        />
      </div>

      <Divider />

      <ToggleRowGroup items={inventoryToggles} />

      <SettingsSelectField
        id="stock-reservation"
        label="Stock Reservation Duration"
        options={stockReservationOptions}
        defaultValue="30 minutes"
        wrapperClassName="sm:max-w-xs"
      />
    </SettingsSection>
  );
}
