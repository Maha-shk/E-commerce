import { Search, Link as LinkIcon } from "lucide-react";
import { SettingsSection } from "@/components/admin/settings/SettingsSection";
import { SettingsField } from "@/components/admin/settings/SettingsField";
import { SettingsTextareaField } from "@/components/admin/settings/SettingsTextareaField";
import { UploadField } from "@/components/admin/settings/UploadField";
import { ToggleRow } from "@/components/admin/settings/ToggleRow";
import { Divider } from "@/components/admin/settings/Divider";

interface SeoWebsiteSectionProps {
  data?: Record<string, unknown>;
  onChange?: (id: string, value: unknown) => void;
}

export function SeoWebsiteSection({ data, onChange }: SeoWebsiteSectionProps) {
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

  return (
    <SettingsSection
      id="seo-website"
      icon={Search}
      title="SEO & Website Settings"
      description="Control how your storefront appears in search engines and link previews."
    >
      <SettingsField
        id="website-title"
        label="Website Title"
        value={getValue("website-title", "CENTO Servizi — Premium Home & Lifestyle")}
        onChange={(e) => handleChange("website-title", e.target.value)}
      />
      <SettingsTextareaField
        id="meta-description"
        label="Meta Description"
        rows={3}
        value={getValue("meta-description", "Shop premium home and lifestyle essentials, curated for modern Italian living. Free shipping over €75.")}
        onChange={(e) => handleChange("meta-description", e.target.value)}
        hint="128/160 characters"
      />
      <SettingsField
        id="meta-keywords"
        label="Meta Keywords"
        value={getValue("meta-keywords", "home decor, lifestyle, italian design, premium essentials")}
        onChange={(e) => handleChange("meta-keywords", e.target.value)}
        hint="Comma-separated"
      />

      <Divider />

      <div className="grid gap-5 sm:grid-cols-2">
        <UploadField label="Favicon" hint="ICO or PNG, 32×32px" shape="square" />
        <UploadField label="Open Graph Image" hint="PNG or JPG, 1200×630px recommended" shape="banner" />
      </div>

      <Divider />

      <SettingsField
        id="canonical-url"
        label="Canonical URL"
        type="url"
        icon={<LinkIcon />}
        value={getValue("canonical-url", "https://www.centoservizi.com")}
        onChange={(e) => handleChange("canonical-url", e.target.value)}
      />
      <ToggleRow
        id="robots-indexing"
        label="Allow search engine indexing"
        description="Let Google and other search engines index and rank this site."
        defaultChecked
        checked={getToggleValue("robots-indexing", true)}
        onChange={handleChange}
      />
    </SettingsSection>
  );
}
