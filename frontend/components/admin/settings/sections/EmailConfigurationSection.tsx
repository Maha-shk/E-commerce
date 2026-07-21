import { Mails, User, Mail, Reply } from "lucide-react";
import { SettingsSection } from "@/components/admin/settings/SettingsSection";
import { SettingsField } from "@/components/admin/settings/SettingsField";
import { SettingsSelectField } from "@/components/admin/settings/SettingsSelectField";

const emailTemplates = ["Default", "Minimal", "Bold", "Classic"];

export function EmailConfigurationSection() {
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
          defaultValue="CENTO Servizi"
        />
        <SettingsSelectField
          id="email-template"
          label="Email Template Selection"
          options={emailTemplates}
          defaultValue="Default"
        />
        <SettingsField
          id="sender-email"
          label="Sender Email"
          type="email"
          icon={<Mail />}
          defaultValue="no-reply@centoservizi.com"
        />
        <SettingsField
          id="reply-to-email"
          label="Reply-To Email"
          type="email"
          icon={<Reply />}
          defaultValue="support@centoservizi.com"
        />
      </div>
    </SettingsSection>
  );
}
