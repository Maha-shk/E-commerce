"use client";

import { useMemo, useState, type ComponentType } from "react";
import { RotateCcw, Save, Loader2, TriangleAlert } from "lucide-react";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/admin/QueryState";
import { SettingsNav } from "@/components/admin/settings/SettingsNav";
import { StoreInformationSection } from "@/components/admin/settings/sections/StoreInformationSection";
import { CustomerAccountSection } from "@/components/admin/settings/sections/CustomerAccountSection";
import { OrderSettingsSection } from "@/components/admin/settings/sections/OrderSettingsSection";
import { ShippingSettingsSection } from "@/components/admin/settings/sections/ShippingSettingsSection";
import { TaxSettingsSection } from "@/components/admin/settings/sections/TaxSettingsSection";
import { InventorySettingsSection } from "@/components/admin/settings/sections/InventorySettingsSection";
import { NotificationSettingsSection } from "@/components/admin/settings/sections/NotificationSettingsSection";
import { SecuritySettingsSection } from "@/components/admin/settings/sections/SecuritySettingsSection";
import { EmailConfigurationSection } from "@/components/admin/settings/sections/EmailConfigurationSection";
import { LegalPoliciesSection } from "@/components/admin/settings/sections/LegalPoliciesSection";
import { BackupSystemSection } from "@/components/admin/settings/sections/BackupSystemSection";
import { settingsNavItems } from "@/lib/admin/settings";
import { useSettings, useUpdateSettings } from "@/lib/hooks/use-admin";

type SectionProps = {
  data: Record<string, unknown>;
  onChange: (id: string, value: unknown) => void;
};

/**
 * Section id → component, keyed to `settingsNavItems`.
 *
 * All fifteen sections used to render at once — roughly 1,800 lines of form in
 * a single scroll, with the nav as anchor links into it. That is what made the
 * page feel like "too much": nothing was removed, but nothing was focused
 * either. The nav now switches sections, so one panel is on screen at a time
 * and every setting is still reachable.
 */
const SECTIONS: Record<string, ComponentType<SectionProps>> = {
  "store-information": StoreInformationSection,
  "customer-accounts": CustomerAccountSection,
  orders: OrderSettingsSection,
  shipping: ShippingSettingsSection,
  tax: TaxSettingsSection,
  inventory: InventorySettingsSection,
  notifications: NotificationSettingsSection,
  security: SecuritySettingsSection,
  email: EmailConfigurationSection,
  legal: LegalPoliciesSection,
  backup: BackupSystemSection,
};

export default function SettingsPage() {
  const { data: settings, isPending, isError, error, refetch } = useSettings();
  const updateSettings = useUpdateSettings();

  const [activeId, setActiveId] = useState(settingsNavItems[0].id);

  /*
   * Only the edits are held in state; the saved values stay in the query cache
   * underneath.
   *
   * The previous version copied `settings` into `formData` from an effect and
   * flipped a separate `hasChanges` flag from *inside* the `setFormData`
   * updater. Updaters must be pure — React double-invokes them under
   * StrictMode — and the effect meant a fresh fetch could silently overwrite
   * unsaved edits. Deriving removes both problems and the extra render.
   */
  const [draft, setDraft] = useState<Record<string, unknown>>({});

  const formData = useMemo(
    () => ({ ...(settings ?? {}), ...draft }),
    [settings, draft],
  );

  const changedCount = Object.keys(draft).length;
  const hasChanges = changedCount > 0;

  const handleFieldChange = (id: string, value: unknown) =>
    setDraft((prev) => ({ ...prev, [id]: value }));

  const handleSave = () =>
    updateSettings.mutate(formData, { onSuccess: () => setDraft({}) });

  const ActiveSection = SECTIONS[activeId];
  const activeLabel = settingsNavItems.find((i) => i.id === activeId)?.label;

  if (isError) {
    return (
      <div className="space-y-6">
        <PageHeader title="Settings" subtitle="Configure your store." />
        <Card className="gap-0 py-0">
          <div className="p-5">
            <ErrorState error={error} onRetry={() => refetch()} />
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Settings"
        // Was a run-on: "Configure your eCommerce platform, customer
        // experience, security, notifications, and system preferences from one
        // centralized location."
        subtitle="Configure your store, checkout and system preferences."
      />

      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:gap-8">
        <SettingsNav activeId={activeId} onSelect={setActiveId} />

        <div className="min-w-0 flex-1 space-y-6">
          {isPending ? (
            <Card className="gap-0 py-0">
              <div className="flex flex-col items-center gap-3 py-24">
                <Loader2 className="size-6 animate-spin text-muted-foreground" aria-hidden />
                <p className="text-sm text-muted-foreground">Loading settings…</p>
              </div>
            </Card>
          ) : ActiveSection ? (
            <ActiveSection data={formData} onChange={handleFieldChange} />
          ) : null}

          {/* Action bar. Only appears once something has actually changed —
              it used to sit there permanently with three buttons, two of
              which ("Cancel" and "Reset Changes") ran the same function. */}
          {hasChanges ? (
            <div className="sticky bottom-0 flex flex-col-reverse items-stretch gap-3 rounded-xl border border-border bg-card/95 p-4 shadow-soft backdrop-blur sm:flex-row sm:items-center sm:justify-between">
              <p className="flex items-center gap-2 text-sm text-muted-foreground">
                <TriangleAlert className="size-4 shrink-0 text-warning" aria-hidden />
                <span>
                  <span className="font-medium text-foreground tabular-nums">
                    {changedCount}
                  </span>{" "}
                  unsaved {changedCount === 1 ? "change" : "changes"}
                  {activeLabel ? (
                    <span className="hidden sm:inline"> · editing {activeLabel}</span>
                  ) : null}
                </span>
              </p>

              <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setDraft({})}
                  disabled={updateSettings.isPending}
                >
                  <RotateCcw className="size-4" aria-hidden />
                  Discard
                </Button>
                <Button type="button" onClick={handleSave} disabled={updateSettings.isPending}>
                  {updateSettings.isPending ? (
                    <Loader2 className="size-4 animate-spin" aria-hidden />
                  ) : (
                    <Save className="size-4" aria-hidden />
                  )}
                  {updateSettings.isPending ? "Saving…" : "Save changes"}
                </Button>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
