import { Bell } from "lucide-react";
import { SettingsSection } from "@/components/admin/settings/SettingsSection";
import { ToggleRowGroup } from "@/components/admin/settings/ToggleRow";
import { Divider } from "@/components/admin/settings/Divider";
import { customerNotifications, adminNotifications } from "@/lib/admin/settings";

export function NotificationSettingsSection() {
  return (
    <SettingsSection
      id="notifications"
      icon={Bell}
      title="Notification Settings"
      description="Choose which alerts are sent to customers and to your team."
    >
      <div className="space-y-3">
        <p className="text-sm font-medium text-muted-foreground">Customer Notifications</p>
        <ToggleRowGroup items={customerNotifications} />
      </div>

      <Divider />

      <div className="space-y-3">
        <p className="text-sm font-medium text-muted-foreground">Admin Notifications</p>
        <ToggleRowGroup items={adminNotifications} />
      </div>
    </SettingsSection>
  );
}
