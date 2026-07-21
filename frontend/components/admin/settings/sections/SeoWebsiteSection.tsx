import { Search, Link as LinkIcon } from "lucide-react";
import { SettingsSection } from "@/components/admin/settings/SettingsSection";
import { SettingsField } from "@/components/admin/settings/SettingsField";
import { SettingsTextareaField } from "@/components/admin/settings/SettingsTextareaField";
import { UploadField } from "@/components/admin/settings/UploadField";
import { ToggleRow } from "@/components/admin/settings/ToggleRow";
import { Divider } from "@/components/admin/settings/Divider";

export function SeoWebsiteSection() {
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
        defaultValue="CENTO Servizi — Premium Home & Lifestyle"
      />
      <SettingsTextareaField
        id="meta-description"
        label="Meta Description"
        rows={3}
        defaultValue="Shop premium home and lifestyle essentials, curated for modern Italian living. Free shipping over €75."
        hint="128/160 characters"
      />
      <SettingsField
        id="meta-keywords"
        label="Meta Keywords"
        defaultValue="home decor, lifestyle, italian design, premium essentials"
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
        defaultValue="https://www.centoservizi.com"
      />
      <ToggleRow
        id="robots-indexing"
        label="Allow search engine indexing"
        description="Let Google and other search engines index and rank this site."
        defaultChecked
      />
    </SettingsSection>
  );
}
