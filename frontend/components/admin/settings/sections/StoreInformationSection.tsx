import { Store, Mail, Headset, Phone } from "lucide-react";
import { SettingsSection } from "@/components/admin/settings/SettingsSection";
import { SettingsField } from "@/components/admin/settings/SettingsField";
import { SettingsSelectField } from "@/components/admin/settings/SettingsSelectField";
import { SettingsTextareaField } from "@/components/admin/settings/SettingsTextareaField";
import { UploadField } from "@/components/admin/settings/UploadField";
import { currencies, timeZones, languages } from "@/lib/admin/settings";

interface StoreInformationSectionProps {
  data?: Record<string, unknown>;
  onChange?: (id: string, value: unknown) => void;
}

export function StoreInformationSection({ data, onChange }: StoreInformationSectionProps) {
  const handleChange = (id: string, value: unknown) => {
    onChange?.(id, value);
  };

  const getValue = (key: string, defaultValue: string) => {
    return (data?.[key] as string) ?? defaultValue;
  };

  return (
    <SettingsSection
      id="store-information"
      icon={Store}
      title="Store Information"
      description="Basic details customers see across the storefront and receipts."
    >
      <div className="grid gap-5 sm:grid-cols-2">
        <SettingsField
          id="store-name"
          label="Store Name"
          value={getValue("store-name", "CENTO Servizi")}
          onChange={(e) => handleChange("store-name", e.target.value)}
        />
        <UploadField label="Store Logo" hint="PNG or SVG, at least 256×256px" shape="square" />

        <SettingsField
          id="store-email"
          label="Store Email"
          type="email"
          icon={<Mail />}
          value={getValue("store-email", "hello@centoservizi.com")}
          onChange={(e) => handleChange("store-email", e.target.value)}
        />
        <SettingsField
          id="support-email"
          label="Customer Support Email"
          type="email"
          icon={<Headset />}
          value={getValue("support-email", "support@centoservizi.com")}
          onChange={(e) => handleChange("support-email", e.target.value)}
        />
        <SettingsField
          id="support-phone"
          label="Support Phone Number"
          type="tel"
          icon={<Phone />}
          value={getValue("support-phone", "+39 02 5551 0142")}
          onChange={(e) => handleChange("support-phone", e.target.value)}
          wrapperClassName="sm:col-span-2"
        />

        <SettingsTextareaField
          id="business-address"
          label="Business Address"
          rows={3}
          value={getValue("business-address", "Via della Spiga, 12\n20121 Milano (MI), Italy")}
          onChange={(e) => handleChange("business-address", e.target.value)}
          wrapperClassName="sm:col-span-2"
        />
        <SettingsTextareaField
          id="store-description"
          label="Store Description"
          rows={3}
          value={getValue("store-description", "Premium home and lifestyle essentials, curated for modern Italian living.")}
          onChange={(e) => handleChange("store-description", e.target.value)}
          wrapperClassName="sm:col-span-2"
        />

        <SettingsSelectField
          id="currency"
          label="Currency"
          options={currencies}
          value={getValue("currency", "EUR (€)")}
          onChange={(value) => handleChange("currency", value)}
        />
        <SettingsSelectField
          id="time-zone"
          label="Time Zone"
          options={timeZones}
          value={getValue("time-zone", timeZones[0])}
          onChange={(value) => handleChange("time-zone", value)}
        />
        <SettingsSelectField
          id="language"
          label="Language"
          options={languages}
          value={getValue("language", "English")}
          onChange={(value) => handleChange("language", value)}
        />
      </div>
    </SettingsSection>
  );
}
