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

export function OrderSettingsSection() {
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
          defaultValue="Pending"
        />
        <SettingsField
          id="order-number-format"
          label="Order Number Format"
          defaultValue="ORD-{YYYY}-{0000}"
        />
      </div>

      <Divider />

      <ToggleRowGroup items={orderToggles} />

      <Divider />

      <div className="grid gap-5 sm:grid-cols-2">
        <SettingsSelectField
          id="cancellation-window"
          label="Cancellation Time Limit"
          options={cancellationWindowOptions}
          defaultValue="24 hours"
        />
        <SettingsSelectField
          id="return-period"
          label="Return & Refund Period"
          options={returnPeriodOptions}
          defaultValue="30 days"
        />
      </div>
    </SettingsSection>
  );
}
