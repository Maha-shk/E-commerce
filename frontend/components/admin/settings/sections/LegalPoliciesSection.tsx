"use client";

import { useState } from "react";
import { Scale, FileText, PenLine } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { SettingsSection } from "@/components/admin/settings/SettingsSection";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { legalDocuments, type LegalDocument } from "@/lib/admin/settings";

interface LegalPoliciesSectionProps {
  data?: Record<string, unknown>;
  onChange?: (id: string, value: unknown) => void;
}

/** Stored per document under the `legal` settings group. */
type StoredDocument = { body: string; updatedAt: string };

function readDocument(data: Record<string, unknown> | undefined, id: string) {
  const stored = data?.[id];
  if (stored && typeof stored === "object" && "body" in stored) {
    return stored as StoredDocument;
  }
  return null;
}

export function LegalPoliciesSection({ data, onChange }: LegalPoliciesSectionProps) {
  const [editing, setEditing] = useState<LegalDocument | null>(null);
  const [body, setBody] = useState("");

  const openEditor = (doc: LegalDocument) => {
    setBody(readDocument(data, doc.id)?.body ?? "");
    setEditing(doc);
  };

  /**
   * Writes into the shared settings draft. The page's Save button persists it,
   * so this behaves like every other control on the Settings screen rather
   * than saving on its own and leaving the header out of step.
   */
  const applyEdit = () => {
    if (!editing) return;
    onChange?.(editing.id, {
      body: body.trim(),
      updatedAt: new Date().toISOString(),
    } satisfies StoredDocument);
    setEditing(null);
  };

  return (
    <SettingsSection
      id="legal"
      icon={Scale}
      title="Legal & Policies"
      description="Manage the customer-facing legal documents linked in your storefront footer."
    >
      <div className="divide-y divide-border rounded-lg border border-border">
        {legalDocuments.map((doc) => {
          const stored = readDocument(data, doc.id);
          // The old rows showed a hardcoded date for every document, whether
          // or not anything had ever been written.
          const updated = stored
            ? new Date(stored.updatedAt).toLocaleDateString("en-GB", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })
            : null;

          return (
            <div key={doc.id} className="flex items-center gap-3.5 p-3.5">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-accent text-primary">
                <FileText className="size-4" aria-hidden />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-foreground">{doc.name}</p>
                <p className="text-xs text-subtle">
                  {updated ? `Last updated ${updated}` : "Not written yet"}
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="shrink-0"
                // Previously had no onClick at all — the button was decorative.
                onClick={() => openEditor(doc)}
              >
                <PenLine className="size-4" aria-hidden />
                {stored ? "Edit content" : "Add content"}
              </Button>
            </div>
          );
        })}
      </div>

      <Dialog open={!!editing} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editing?.name}</DialogTitle>
            <DialogDescription>
              Shown to customers on the storefront. Plain text — blank lines
              start a new paragraph.
            </DialogDescription>
          </DialogHeader>

          <Textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={16}
            className="mt-2 font-mono text-sm"
            placeholder={`Write your ${editing?.name.toLowerCase() ?? "document"} here…`}
            aria-label={`${editing?.name} content`}
          />

          <div className="mt-4 flex items-center justify-between gap-3">
            <p className="text-xs text-subtle">
              {body.trim().length.toLocaleString()} characters
            </p>
            <div className="flex gap-3">
              <Button type="button" variant="outline" onClick={() => setEditing(null)}>
                Cancel
              </Button>
              <Button type="button" onClick={applyEdit}>
                Apply
              </Button>
            </div>
          </div>

          <p className="mt-1 text-xs text-subtle">
            Applying stages the change — use <strong>Save changes</strong> at the
            top of Settings to publish it.
          </p>
        </DialogContent>
      </Dialog>
    </SettingsSection>
  );
}
