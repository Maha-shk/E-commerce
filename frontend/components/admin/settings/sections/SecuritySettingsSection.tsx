import { ShieldCheck, Laptop, Smartphone, Monitor } from "lucide-react";
import { SettingsSection } from "@/components/admin/settings/SettingsSection";
import { SettingsSelectField } from "@/components/admin/settings/SettingsSelectField";
import { ToggleRowGroup } from "@/components/admin/settings/ToggleRow";
import { Divider } from "@/components/admin/settings/Divider";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { loginAttemptOptions, passwordExpiryOptions, securityToggles, trustedDevices } from "@/lib/admin/settings";

const deviceIcons = { "MacBook Pro · Chrome": Laptop, "iPhone 15 · Safari": Smartphone, "Windows PC · Edge": Monitor } as const;

interface SecuritySettingsSectionProps {
  data?: Record<string, unknown>;
  onChange?: (id: string, value: unknown) => void;
}

export function SecuritySettingsSection({ data, onChange }: SecuritySettingsSectionProps) {
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

  const togglesWithValues = securityToggles.map((toggle) => ({
    ...toggle,
    defaultChecked: getToggleValue(toggle.id, toggle.defaultChecked),
  }));

  return (
    <SettingsSection
      id="security"
      icon={ShieldCheck}
      title="Security Settings"
      description="Protect admin and customer accounts from unauthorized access."
    >
      <label
        htmlFor="two-factor-auth"
        className="flex cursor-pointer items-start justify-between gap-4 rounded-lg border border-input bg-muted/30 p-3.5"
      >
        <span>
          <span className="flex items-center gap-2 text-sm font-semibold text-foreground">
            Two-factor authentication
            <Badge variant="warning">Recommended</Badge>
          </span>
          <span className="mt-0.5 block text-xs leading-relaxed text-subtle">
            Require a one-time code in addition to a password for admin sign-in.
          </span>
        </span>
        <Switch
          id="two-factor-auth"
          checked={getToggleValue("two-factor-auth", false)}
          onCheckedChange={(checked) => handleChange("two-factor-auth", checked)}
          className="mt-0.5 shrink-0"
        />
      </label>

      <div className="grid gap-5 sm:grid-cols-2">
        <SettingsSelectField
          id="login-attempts"
          label="Login Attempt Limits"
          options={loginAttemptOptions}
          value={getValue("login-attempts", "5 attempts")}
          onChange={(value) => handleChange("login-attempts", value)}
        />
        <SettingsSelectField
          id="password-expiry"
          label="Password Expiry Duration"
          options={passwordExpiryOptions}
          value={getValue("password-expiry", "90 days")}
          onChange={(value) => handleChange("password-expiry", value)}
        />
      </div>

      <ToggleRowGroup
        items={togglesWithValues}
        onChange={handleChange}
      />

      <Divider />

      {/* Device management */}
      <div className="space-y-2">
        <p className="text-sm font-medium text-muted-foreground">Device Management</p>
        <div className="divide-y rounded-lg border">
          {trustedDevices.map((device) => {
            const Icon = deviceIcons[device.name as keyof typeof deviceIcons] ?? Laptop;
            return (
              <div key={device.id} className="flex items-center gap-3.5 p-3.5">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-foreground">
                  <Icon className="size-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-2 text-sm font-semibold text-foreground">
                    {device.name}
                    {device.current && <Badge variant="success">This device</Badge>}
                  </p>
                  <p className="text-xs text-subtle">
                    {device.location} · {device.lastActive}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={device.current}
                  className="shrink-0 text-destructive hover:bg-destructive/10 hover:text-destructive"
                >
                  Revoke
                </Button>
              </div>
            );
          })}
        </div>
      </div>
    </SettingsSection>
  );
}
