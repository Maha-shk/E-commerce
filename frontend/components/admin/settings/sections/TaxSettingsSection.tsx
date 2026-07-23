import { Receipt } from "lucide-react";
import { SettingsSection } from "@/components/admin/settings/SettingsSection";
import { SettingsField } from "@/components/admin/settings/SettingsField";
import { ToggleRow } from "@/components/admin/settings/ToggleRow";
import { Divider } from "@/components/admin/settings/Divider";
import { regionalTaxRates } from "@/lib/admin/settings";

interface TaxSettingsSectionProps {
  data?: Record<string, unknown>;
  onChange?: (id: string, value: unknown) => void;
}

export function TaxSettingsSection({ data, onChange }: TaxSettingsSectionProps) {
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
      id="tax"
      icon={Receipt}
      title="Tax Settings"
      description="Configure how tax is calculated and displayed at checkout."
    >
      <ToggleRow
        id="tax-calculation"
        label="Enable tax calculation"
        description="Automatically calculate tax on every order."
        defaultChecked
        checked={getToggleValue("tax-calculation", true)}
        onChange={handleChange}
      />

      <div className="grid gap-5 sm:grid-cols-2">
        <SettingsField
          id="default-tax-rate"
          label="Default Tax Percentage"
          type="number"
          trailing="%"
          value={getValue("default-tax-rate", "20")}
          onChange={(e) => handleChange("default-tax-rate", e.target.value)}
        />
        <SettingsField
          id="vat-number"
          label="VAT / GST Number"
          value={getValue("vat-number", "IT12345678901")}
          onChange={(e) => handleChange("vat-number", e.target.value)}
        />
      </div>

      <ToggleRow
        id="tax-inclusive-pricing"
        label="Tax-inclusive pricing"
        description="Display product prices with tax already included."
        defaultChecked
        checked={getToggleValue("tax-inclusive-pricing", true)}
        onChange={handleChange}
      />
      <ToggleRow
        id="regional-tax-rules"
        label="Regional tax rules"
        description="Apply different tax rates depending on the customer's region."
        defaultChecked
        checked={getToggleValue("regional-tax-rules", true)}
        onChange={handleChange}
      />

      <Divider />

      {/* Regional rates preview */}
      <div className="space-y-2">
        <p className="text-sm font-medium text-muted-foreground">Regional Tax Rates</p>
        <div className="divide-y rounded-lg border">
          {regionalTaxRates.map((rate) => (
            <div key={rate.region} className="flex items-center justify-between gap-3 px-3.5 py-2.5">
              <span className="text-sm text-foreground">{rate.region}</span>
              <span className="text-sm font-semibold text-foreground">{rate.rate}</span>
            </div>
          ))}
        </div>
      </div>
    </SettingsSection>
  );
}
