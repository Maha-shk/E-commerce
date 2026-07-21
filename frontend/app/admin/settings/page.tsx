import { RotateCcw, Save } from "lucide-react";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Button } from "@/components/ui/button";
import { SettingsNav } from "@/components/admin/settings/SettingsNav";
import { StoreInformationSection } from "@/components/admin/settings/sections/StoreInformationSection";
import { CustomerAccountSection } from "@/components/admin/settings/sections/CustomerAccountSection";
import { OrderSettingsSection } from "@/components/admin/settings/sections/OrderSettingsSection";
import { ShippingSettingsSection } from "@/components/admin/settings/sections/ShippingSettingsSection";
import { PaymentSettingsSection } from "@/components/admin/settings/sections/PaymentSettingsSection";
import { TaxSettingsSection } from "@/components/admin/settings/sections/TaxSettingsSection";
import { DiscountsPromotionsSection } from "@/components/admin/settings/sections/DiscountsPromotionsSection";
import { InventorySettingsSection } from "@/components/admin/settings/sections/InventorySettingsSection";
import { NotificationSettingsSection } from "@/components/admin/settings/sections/NotificationSettingsSection";
import { SecuritySettingsSection } from "@/components/admin/settings/sections/SecuritySettingsSection";
import { SeoWebsiteSection } from "@/components/admin/settings/sections/SeoWebsiteSection";
import { EmailConfigurationSection } from "@/components/admin/settings/sections/EmailConfigurationSection";
import { AppearanceSettingsSection } from "@/components/admin/settings/sections/AppearanceSettingsSection";
import { LegalPoliciesSection } from "@/components/admin/settings/sections/LegalPoliciesSection";
import { BackupSystemSection } from "@/components/admin/settings/sections/BackupSystemSection";

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Settings"
        subtitle="Configure your eCommerce platform, customer experience, security, notifications, and system preferences from one centralized location."
      />

      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:gap-8">
        <SettingsNav />

        <div className="min-w-0 flex-1 space-y-6">
          <StoreInformationSection />
          <CustomerAccountSection />
          <OrderSettingsSection />
          <ShippingSettingsSection />
          <PaymentSettingsSection />
          <TaxSettingsSection />
          <DiscountsPromotionsSection />
          <InventorySettingsSection />
          <NotificationSettingsSection />
          <SecuritySettingsSection />
          <SeoWebsiteSection />
          <EmailConfigurationSection />
          <AppearanceSettingsSection />
          <LegalPoliciesSection />
          <BackupSystemSection />

          {/* Footer actions */}
          <div className="sticky bottom-0 flex flex-col-reverse items-stretch gap-2 rounded-xl border bg-card/95 p-4 shadow-soft backdrop-blur sm:flex-row sm:justify-end sm:items-center">
            <Button type="button" variant="ghost" size="xl">
              Cancel
            </Button>
            <Button type="button" variant="outline" size="xl">
              <RotateCcw />
              Reset Changes
            </Button>
            <Button type="button" size="xl">
              <Save />
              Save Changes
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
