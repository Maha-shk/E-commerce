import { Bell } from "lucide-react";
import { SettingsSection } from "@/components/admin/settings/SettingsSection";
import { ToggleRowGroup } from "@/components/admin/settings/ToggleRow";
import { adminNotifications } from "@/lib/admin/settings";

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

  const adminTogglesWithValues = adminNotifications.map((toggle) => ({
    ...toggle,
    defaultChecked: getToggleValue(toggle.id, toggle.defaultChecked),
  }));

  return (
    <SettingsSection
      id="notifications"
      icon={Bell}
      title="Notification Settings"
      description="Choose which alerts are sent to your team."
    >
      {/* The "Customer Notifications" group is gone: customer-facing emails are
          driven by the order and support flows, not by a toggle here. */}
      <ToggleRowGroup items={adminTogglesWithValues} onChange={handleChange} />
    </SettingsSection>
  );
}
