import { Mails, User, Mail, Reply } from "lucide-react";
import { SettingsSection } from "@/components/admin/settings/SettingsSection";
import { SettingsField } from "@/components/admin/settings/SettingsField";
import { SettingsSelectField } from "@/components/admin/settings/SettingsSelectField";

const emailTemplates = ["Default", "Minimal", "Bold", "Classic"];

interface EmailConfigurationSectionProps {
  data?: Record<string, unknown>;
  onChange?: (id: string, value: unknown) => void;
}

export function EmailConfigurationSection({ data, onChange }: EmailConfigurationSectionProps) {
  const handleChange = (id: string, value: unknown) => {
    onChange?.(id, value);
  };

  const getValue = (key: string, defaultValue: string) => {
    return (data?.[key] as string) ?? defaultValue;
  };

  return (
    <SettingsSection
      id="email"
      icon={Mails}
      title="Email Configuration"
      description="Set the identity used when transactional emails are sent to customers."
    >
      <div className="grid gap-5 sm:grid-cols-2">
        <SettingsField
          id="sender-name"
          label="Sender Name"
          icon={<User />}
          value={getValue("sender-name", "CENTO Servizi")}
          onChange={(e) => handleChange("sender-name", e.target.value)}
        />
        <SettingsSelectField
          id="email-template"
          label="Email Template Selection"
          options={emailTemplates}
          value={getValue("email-template", "Default")}
          onChange={(value) => handleChange("email-template", value)}
        />
        <SettingsField
          id="sender-email"
          label="Sender Email"
          type="email"
          icon={<Mail />}
          value={getValue("sender-email", "no-reply@centoservizi.com")}
          onChange={(e) => handleChange("sender-email", e.target.value)}
        />
        <SettingsField
          id="reply-to-email"
          label="Reply-To Email"
          type="email"
          icon={<Reply />}
          value={getValue("reply-to-email", "support@centoservizi.com")}
          onChange={(e) => handleChange("reply-to-email", e.target.value)}
        />
      </div>
    </SettingsSection>
  );
}
