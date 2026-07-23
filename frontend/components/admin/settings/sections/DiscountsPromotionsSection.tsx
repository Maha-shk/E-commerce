import { TicketPercent } from "lucide-react";
import { SettingsSection } from "@/components/admin/settings/SettingsSection";
import { SettingsField } from "@/components/admin/settings/SettingsField";
import { SettingsSelectField } from "@/components/admin/settings/SettingsSelectField";
import { ToggleRowGroup } from "@/components/admin/settings/ToggleRow";
import { Divider } from "@/components/admin/settings/Divider";
import { discountToggles, couponExpirationOptions } from "@/lib/admin/settings";

interface DiscountsPromotionsSectionProps {
  data?: Record<string, unknown>;
  onChange?: (id: string, value: unknown) => void;
}

export function DiscountsPromotionsSection({ data, onChange }: DiscountsPromotionsSectionProps) {
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

  const togglesWithValues = discountToggles.map((toggle) => ({
    ...toggle,
    defaultChecked: getToggleValue(toggle.id, toggle.defaultChecked),
  }));

  return (
    <SettingsSection
      id="discounts-promotions"
      icon={TicketPercent}
      title="Discounts & Promotions"
      description="Control coupon codes, automatic discounts, and reward programs."
    >
      <ToggleRowGroup
        items={togglesWithValues}
        onChange={handleChange}
      />

      <Divider />

      <div className="grid gap-5 sm:grid-cols-2">
        <SettingsField
          id="max-discount"
          label="Maximum Discount Percentage"
          type="number"
          trailing="%"
          value={getValue("max-discount", "50")}
          onChange={(e) => handleChange("max-discount", e.target.value)}
        />
        <SettingsSelectField
          id="coupon-expiration"
          label="Coupon Expiration Default"
          options={couponExpirationOptions}
          value={getValue("coupon-expiration", "30 days")}
          onChange={(value) => handleChange("coupon-expiration", value)}
        />
      </div>
    </SettingsSection>
  );
}
