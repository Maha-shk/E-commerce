import { Truck } from "lucide-react";
import { SettingsSection } from "@/components/admin/settings/SettingsSection";
import { SettingsField } from "@/components/admin/settings/SettingsField";
import { ToggleRow } from "@/components/admin/settings/ToggleRow";
import { Divider } from "@/components/admin/settings/Divider";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { shippingMethods, shippingRegions } from "@/lib/admin/settings";

export function ShippingSettingsSection() {
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
      />

      <div className="grid gap-5 sm:grid-cols-2">
        <SettingsField
          id="free-shipping-threshold"
          label="Free Shipping Threshold"
          type="number"
          icon={<span className="text-sm font-semibold">€</span>}
          defaultValue="75"
        />
        <SettingsField
          id="flat-shipping-rate"
          label="Flat Shipping Rate"
          type="number"
          icon={<span className="text-sm font-semibold">€</span>}
          defaultValue="4.99"
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
                <Switch id={`ship-${method.id}`} defaultChecked={method.defaultChecked} />
              </span>
            </label>
          ))}
        </div>
      </div>

      <SettingsField
        id="delivery-estimation"
        label="Delivery Estimation"
        defaultValue="3–5 business days"
        hint="Shown on the product and checkout pages."
      />

      <Divider />

      <ToggleRow
        id="international-shipping"
        label="International shipping"
        description="Allow orders to be shipped outside your home country."
        defaultChecked
      />

      {/* Shipping regions */}
      <div className="space-y-2">
        <p className="text-sm font-medium text-muted-foreground">Shipping Regions</p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {shippingRegions.map((region, i) => (
            <label key={region} className="group flex items-center gap-2 text-sm text-foreground">
              <Checkbox id={`region-${i}`} defaultChecked={i < 2} />
              <span>{region}</span>
            </label>
          ))}
        </div>
      </div>
    </SettingsSection>
  );
}
