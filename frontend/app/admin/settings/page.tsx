"use client";

import { useEffect, useState } from "react";
import { RotateCcw, Save, Loader2 } from "lucide-react";
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
import { useSettings, useUpdateSettings } from "@/lib/hooks/use-admin";

export default function SettingsPage() {
  const { data: settings, isLoading: isLoadingSettings } = useSettings();
  const updateSettings = useUpdateSettings();
  const [formData, setFormData] = useState<Record<string, unknown>>({});
  const [hasChanges, setHasChanges] = useState(false);

  // Initialize form data when settings are loaded
  useEffect(() => {
    if (settings) {
      setFormData(settings);
    }
  }, [settings]);

  const handleFieldChange = (id: string, value: unknown) => {
    setFormData((prev) => {
      const newData = { ...prev, [id]: value };
      setHasChanges(true);
      return newData;
    });
  };

  const handleSave = () => {
    updateSettings.mutate(formData);
    setHasChanges(false);
  };

  const handleReset = () => {
    if (settings) {
      setFormData(settings);
      setHasChanges(false);
    }
  };

  const handleCancel = () => {
    handleReset();
  };

  if (isLoadingSettings) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Settings"
        subtitle="Configure your eCommerce platform, customer experience, security, notifications, and system preferences from one centralized location."
      />

      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:gap-8">
        <SettingsNav />

        <div className="min-w-0 flex-1 space-y-6">
          <StoreInformationSection
            data={formData}
            onChange={handleFieldChange}
          />
          <CustomerAccountSection
            data={formData}
            onChange={handleFieldChange}
          />
          <OrderSettingsSection
            data={formData}
            onChange={handleFieldChange}
          />
          <ShippingSettingsSection
            data={formData}
            onChange={handleFieldChange}
          />
          <PaymentSettingsSection
            data={formData}
            onChange={handleFieldChange}
          />
          <TaxSettingsSection
            data={formData}
            onChange={handleFieldChange}
          />
          <DiscountsPromotionsSection
            data={formData}
            onChange={handleFieldChange}
          />
          <InventorySettingsSection
            data={formData}
            onChange={handleFieldChange}
          />
          <NotificationSettingsSection
            data={formData}
            onChange={handleFieldChange}
          />
          <SecuritySettingsSection
            data={formData}
            onChange={handleFieldChange}
          />
          <SeoWebsiteSection
            data={formData}
            onChange={handleFieldChange}
          />
          <EmailConfigurationSection
            data={formData}
            onChange={handleFieldChange}
          />
          <AppearanceSettingsSection
            data={formData}
            onChange={handleFieldChange}
          />
          <LegalPoliciesSection
            data={formData}
            onChange={handleFieldChange}
          />
          <BackupSystemSection
            data={formData}
            onChange={handleFieldChange}
          />

          {/* Footer actions */}
          <div className="sticky bottom-0 flex flex-col-reverse items-stretch gap-2 rounded-xl border bg-card/95 p-4 shadow-soft backdrop-blur sm:flex-row sm:justify-end sm:items-center">
            <Button
              type="button"
              variant="ghost"
              size="xl"
              onClick={handleCancel}
              disabled={!hasChanges || updateSettings.isPending}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="outline"
              size="xl"
              onClick={handleReset}
              disabled={!hasChanges || updateSettings.isPending}
            >
              <RotateCcw />
              Reset Changes
            </Button>
            <Button
              type="button"
              size="xl"
              onClick={handleSave}
              disabled={!hasChanges || updateSettings.isPending}
            >
              {updateSettings.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
