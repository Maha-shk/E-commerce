import { TicketPercent } from "lucide-react";
import { SettingsSection } from "@/components/admin/settings/SettingsSection";
import { SettingsField } from "@/components/admin/settings/SettingsField";
import { SettingsSelectField } from "@/components/admin/settings/SettingsSelectField";
import { ToggleRowGroup } from "@/components/admin/settings/ToggleRow";
import { Divider } from "@/components/admin/settings/Divider";
import { discountToggles, couponExpirationOptions } from "@/lib/admin/settings";

export function DiscountsPromotionsSection() {
  return (
    <SettingsSection
      id="discounts-promotions"
      icon={TicketPercent}
      title="Discounts & Promotions"
      description="Control coupon codes, automatic discounts, and reward programs."
    >
      <ToggleRowGroup items={discountToggles} />

      <Divider />

      <div className="grid gap-5 sm:grid-cols-2">
        <SettingsField
          id="max-discount"
          label="Maximum Discount Percentage"
          type="number"
          trailing="%"
          defaultValue="50"
        />
        <SettingsSelectField
          id="coupon-expiration"
          label="Coupon Expiration Default"
          options={couponExpirationOptions}
          defaultValue="30 days"
        />
      </div>
    </SettingsSection>
  );
}
