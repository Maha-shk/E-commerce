import { ShoppingCart } from "lucide-react";
import { SettingsSection } from "@/components/admin/settings/SettingsSection";
import { SettingsField } from "@/components/admin/settings/SettingsField";
import { SettingsSelectField } from "@/components/admin/settings/SettingsSelectField";
import { ToggleRowGroup } from "@/components/admin/settings/ToggleRow";
import { Divider } from "@/components/admin/settings/Divider";
import {
  defaultOrderStatusOptions,
  cancellationWindowOptions,
  returnPeriodOptions,
  orderToggles,
} from "@/lib/admin/settings";

interface OrderSettingsSectionProps {
  data?: Record<string, unknown>;
  onChange?: (id: string, value: unknown) => void;
}

export function OrderSettingsSection({ data, onChange }: OrderSettingsSectionProps) {
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

  const togglesWithValues = orderToggles.map((toggle) => ({
    ...toggle,
    defaultChecked: getToggleValue(toggle.id, toggle.defaultChecked),
  }));

  return (
    <SettingsSection
      id="orders"
      icon={ShoppingCart}
      title="Order Settings"
      description="Configure how orders are numbered, confirmed, and managed."
    >
      <div className="grid gap-5 sm:grid-cols-2">
        <SettingsSelectField
          id="default-order-status"
          label="Default Order Status"
          options={defaultOrderStatusOptions}
          value={getValue("default-order-status", "Pending")}
          onChange={(value) => handleChange("default-order-status", value)}
        />
        <SettingsField
          id="order-number-format"
          label="Order Number Format"
          value={getValue("order-number-format", "ORD-{YYYY}-{0000}")}
          onChange={(e) => handleChange("order-number-format", e.target.value)}
        />
      </div>

      <Divider />

      <ToggleRowGroup
        items={togglesWithValues}
        onChange={handleChange}
      />

      <Divider />

      <div className="grid gap-5 sm:grid-cols-2">
        <SettingsSelectField
          id="cancellation-window"
          label="Cancellation Time Limit"
          options={cancellationWindowOptions}
          value={getValue("cancellation-window", "24 hours")}
          onChange={(value) => handleChange("cancellation-window", value)}
        />
        <SettingsSelectField
          id="return-period"
          label="Return & Refund Period"
          options={returnPeriodOptions}
          value={getValue("return-period", "30 days")}
          onChange={(value) => handleChange("return-period", value)}
        />
      </div>
    </SettingsSection>
  );
}
