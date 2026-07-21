import { Store, Mail, Headset, Phone } from "lucide-react";
import { SettingsSection } from "@/components/admin/settings/SettingsSection";
import { SettingsField } from "@/components/admin/settings/SettingsField";
import { SettingsSelectField } from "@/components/admin/settings/SettingsSelectField";
import { SettingsTextareaField } from "@/components/admin/settings/SettingsTextareaField";
import { UploadField } from "@/components/admin/settings/UploadField";
import { currencies, timeZones, languages } from "@/lib/admin/settings";

export function StoreInformationSection() {
  return (
    <SettingsSection
      id="store-information"
      icon={Store}
      title="Store Information"
      description="Basic details customers see across the storefront and receipts."
    >
      <div className="grid gap-5 sm:grid-cols-2">
        <SettingsField id="store-name" label="Store Name" defaultValue="CENTO Servizi" />
        <UploadField label="Store Logo" hint="PNG or SVG, at least 256×256px" shape="square" />

        <SettingsField
          id="store-email"
          label="Store Email"
          type="email"
          icon={<Mail />}
          defaultValue="hello@centoservizi.com"
        />
        <SettingsField
          id="support-email"
          label="Customer Support Email"
          type="email"
          icon={<Headset />}
          defaultValue="support@centoservizi.com"
        />
        <SettingsField
          id="support-phone"
          label="Support Phone Number"
          type="tel"
          icon={<Phone />}
          defaultValue="+39 02 5551 0142"
          wrapperClassName="sm:col-span-2"
        />

        <SettingsTextareaField
          id="business-address"
          label="Business Address"
          rows={3}
          defaultValue={"Via della Spiga, 12\n20121 Milano (MI), Italy"}
          wrapperClassName="sm:col-span-2"
        />
        <SettingsTextareaField
          id="store-description"
          label="Store Description"
          rows={3}
          defaultValue="Premium home and lifestyle essentials, curated for modern Italian living."
          wrapperClassName="sm:col-span-2"
        />

        <SettingsSelectField id="currency" label="Currency" options={currencies} defaultValue="EUR (€)" />
        <SettingsSelectField
          id="time-zone"
          label="Time Zone"
          options={timeZones}
          defaultValue={timeZones[0]}
        />
        <SettingsSelectField id="language" label="Language" options={languages} defaultValue="English" />
      </div>
    </SettingsSection>
  );
}
