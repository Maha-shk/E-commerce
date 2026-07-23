import { Bell } from "lucide-react";
import { SettingsSection } from "@/components/admin/settings/SettingsSection";
import { ToggleRowGroup } from "@/components/admin/settings/ToggleRow";
import { Divider } from "@/components/admin/settings/Divider";
import { customerNotifications, adminNotifications } from "@/lib/admin/settings";

interface NotificationSettingsSectionProps {
  data?: Record<string, unknown>;
  onChange?: (id: string, value: unknown) => void;
}

export function NotificationSettingsSection({ data, onChange }: NotificationSettingsSectionProps) {
  const handleChange = (id: string, value: unknown) => {
    onChange?.(id, value);
  };

  const getToggleValue = (key: string, defaultValue: boolean) => {
    const value = data?.[key];
    if (typeof value === "boolean") return value;
    return defaultValue;
  };

  const customerTogglesWithValues = customerNotifications.map((toggle) => ({
    ...toggle,
    defaultChecked: getToggleValue(toggle.id, toggle.defaultChecked),
  }));

  const adminTogglesWithValues = adminNotifications.map((toggle) => ({
    ...toggle,
    defaultChecked: getToggleValue(toggle.id, toggle.defaultChecked),
  }));

  return (
    <SettingsSection
      id="notifications"
      icon={Bell}
      title="Notification Settings"
      description="Choose which alerts are sent to customers and to your team."
    >
      <div className="space-y-3">
        <p className="text-sm font-medium text-muted-foreground">Customer Notifications</p>
        <ToggleRowGroup
          items={customerTogglesWithValues}
          onChange={handleChange}
        />
      </div>

      <Divider />

      <div className="space-y-3">
        <p className="text-sm font-medium text-muted-foreground">Admin Notifications</p>
        <ToggleRowGroup
          items={adminTogglesWithValues}
          onChange={handleChange}
        />
      </div>
    </SettingsSection>
  );
}
