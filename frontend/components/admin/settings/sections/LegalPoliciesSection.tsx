import { Scale, FileText, PenLine } from "lucide-react";
import { SettingsSection } from "@/components/admin/settings/SettingsSection";
import { Button } from "@/components/ui/button";
import { legalDocuments } from "@/lib/admin/settings";

interface LegalPoliciesSectionProps {
  data?: Record<string, unknown>;
  onChange?: (id: string, value: unknown) => void;
}

export function LegalPoliciesSection({ data, onChange }: LegalPoliciesSectionProps) {
  return (
    <SettingsSection
      id="legal"
      icon={Scale}
      title="Legal & Policies"
      description="Manage the customer-facing legal documents linked in your storefront footer."
    >
      <div className="divide-y rounded-lg border">
        {legalDocuments.map((doc) => (
          <div key={doc.id} className="flex items-center gap-3.5 p-3.5">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-accent text-primary">
              <FileText className="size-4" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-foreground">{doc.name}</p>
              <p className="text-xs text-subtle">Last updated {doc.lastUpdated}</p>
            </div>
            <Button type="button" variant="outline" size="sm" className="shrink-0">
              <PenLine />
              Edit Content
            </Button>
          </div>
        ))}
      </div>
    </SettingsSection>
  );
}
