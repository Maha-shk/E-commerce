import { UserCog } from "lucide-react";
import { SettingsSection } from "@/components/admin/settings/SettingsSection";
import { ToggleRowGroup } from "@/components/admin/settings/ToggleRow";
import { SettingsSelectField } from "@/components/admin/settings/SettingsSelectField";
import { Divider } from "@/components/admin/settings/Divider";
import { customerAccountToggles, passwordStrengthOptions, sessionTimeoutOptions } from "@/lib/admin/settings";

export function CustomerAccountSection() {
  return (
    <SettingsSection
      id="customer-accounts"
      icon={UserCog}
      title="Customer Account Settings"
      description="Control how customers register, sign in, and manage their accounts."
    >
      <ToggleRowGroup items={customerAccountToggles} />

      <Divider />

      <div className="grid gap-5 sm:grid-cols-2">
        <SettingsSelectField
          id="password-strength"
          label="Password Strength Requirement"
          options={passwordStrengthOptions}
          defaultValue="Medium"
        />
        <SettingsSelectField
          id="session-timeout"
          label="Session Timeout Duration"
          options={sessionTimeoutOptions}
          defaultValue="1 hour"
        />
      </div>
    </SettingsSection>
  );
}
