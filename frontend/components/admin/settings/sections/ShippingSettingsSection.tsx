import { Truck } from "lucide-react";
import { SettingsSection } from "@/components/admin/settings/SettingsSection";
import { SettingsField } from "@/components/admin/settings/SettingsField";
import { ToggleRow } from "@/components/admin/settings/ToggleRow";
import { Divider } from "@/components/admin/settings/Divider";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { shippingMethods, shippingRegions } from "@/lib/admin/settings";

interface ShippingSettingsSectionProps {
  data?: Record<string, unknown>;
  onChange?: (id: string, value: unknown) => void;
}

export function ShippingSettingsSection({ data, onChange }: ShippingSettingsSectionProps) {
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

  const handleShippingMethodToggle = (methodId: string, checked: boolean) => {
    handleChange(`shipping-method-${methodId}`, checked);
  };

  const handleRegionToggle = (region: string, checked: boolean) => {
    handleChange(`shipping-region-${region}`, checked);
  };

  return (
    <SettingsSection
      id="shipping"
      icon={Truck}
      title="Shipping Settings"
      description="Manage delivery methods, rates, and where you ship to."
    >
      <ToggleRow
        id="enable-shipping"
        label="Enable shipping"
        description="Turn off to run the storefront as pickup-only."
        defaultChecked
        checked={getToggleValue("enable-shipping", true)}
        onChange={handleChange}
      />

      <div className="grid gap-5 sm:grid-cols-2">
        <SettingsField
          id="free-shipping-threshold"
          label="Free Shipping Threshold"
          type="number"
          icon={<span className="text-sm font-semibold">€</span>}
          value={getValue("free-shipping-threshold", "75")}
          onChange={(e) => handleChange("free-shipping-threshold", e.target.value)}
        />
        <SettingsField
          id="flat-shipping-rate"
          label="Flat Shipping Rate"
          type="number"
          icon={<span className="text-sm font-semibold">€</span>}
          value={getValue("flat-shipping-rate", "4.99")}
          onChange={(e) => handleChange("flat-shipping-rate", e.target.value)}
        />
      </div>

      <Divider />

      {/* Shipping methods */}
      <div className="space-y-2">
        <p className="text-sm font-medium text-muted-foreground">Shipping Methods</p>
        <div className="divide-y rounded-lg border">
          {shippingMethods.map((method) => (
            <label
              key={method.id}
              htmlFor={`ship-${method.id}`}
              className="flex cursor-pointer items-center justify-between gap-4 p-3.5"
            >
              <span>
                <span className="block text-sm font-semibold text-foreground">{method.name}</span>
                <span className="block text-xs text-subtle">{method.description}</span>
              </span>
              <span className="flex shrink-0 items-center gap-3">
                <span className="text-sm font-semibold text-foreground">{method.price}</span>
                <Switch
                  id={`ship-${method.id}`}
                  checked={getToggleValue(`shipping-method-${method.id}`, method.defaultChecked)}
                  onCheckedChange={(checked) => handleShippingMethodToggle(method.id, checked)}
                />
              </span>
            </label>
          ))}
        </div>
      </div>

      <SettingsField
        id="delivery-estimation"
        label="Delivery Estimation"
        value={getValue("delivery-estimation", "3–5 business days")}
        onChange={(e) => handleChange("delivery-estimation", e.target.value)}
        hint="Shown on the product and checkout pages."
      />

      <Divider />

      <ToggleRow
        id="international-shipping"
        label="International shipping"
        description="Allow orders to be shipped outside your home country."
        defaultChecked
        checked={getToggleValue("international-shipping", true)}
        onChange={handleChange}
      />

      {/* Shipping regions */}
      <div className="space-y-2">
        <p className="text-sm font-medium text-muted-foreground">Shipping Regions</p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {shippingRegions.map((region, i) => (
            <label key={region} className="group flex items-center gap-2 text-sm text-foreground">
              <Checkbox
                id={`region-${i}`}
                checked={getToggleValue(`shipping-region-${region}`, i < 2)}
                onCheckedChange={(checked) => handleRegionToggle(region, checked as boolean)}
              />
              <span>{region}</span>
            </label>
          ))}
        </div>
      </div>
    </SettingsSection>
  );
}
