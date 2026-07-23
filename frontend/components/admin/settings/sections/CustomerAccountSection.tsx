import { UserCog } from "lucide-react";
import { SettingsSection } from "@/components/admin/settings/SettingsSection";
import { ToggleRowGroup } from "@/components/admin/settings/ToggleRow";
import { SettingsSelectField } from "@/components/admin/settings/SettingsSelectField";
import { Divider } from "@/components/admin/settings/Divider";
import { customerAccountToggles, passwordStrengthOptions, sessionTimeoutOptions } from "@/lib/admin/settings";

interface CustomerAccountSectionProps {
  data?: Record<string, unknown>;
  onChange?: (id: string, value: unknown) => void;
}

export function CustomerAccountSection({ data, onChange }: CustomerAccountSectionProps) {
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

  const togglesWithValues = customerAccountToggles.map((toggle) => ({
    ...toggle,
    defaultChecked: getToggleValue(toggle.id, toggle.defaultChecked),
  }));

  return (
    <SettingsSection
      id="customer-accounts"
      icon={UserCog}
      title="Customer Account Settings"
      description="Control how customers register, sign in, and manage their accounts."
    >
      <ToggleRowGroup
        items={togglesWithValues}
        onChange={handleChange}
      />

      <Divider />

      <div className="grid gap-5 sm:grid-cols-2">
        <SettingsSelectField
          id="password-strength"
          label="Password Strength Requirement"
          options={passwordStrengthOptions}
          value={getValue("password-strength", "Medium")}
          onChange={(value) => handleChange("password-strength", value)}
        />
        <SettingsSelectField
          id="session-timeout"
          label="Session Timeout Duration"
          options={sessionTimeoutOptions}
          value={getValue("session-timeout", "1 hour")}
          onChange={(value) => handleChange("session-timeout", value)}
        />
      </div>
    </SettingsSection>
  );
}
