"use client";

import { useState } from "react";
import Link from "next/link";
import { Scale, FileText, PenLine, ExternalLink, RotateCcw } from "lucide-react";
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
import { Badge } from "@/components/ui/badge";
import { LEGAL_DOCUMENTS, type LegalDocumentMeta } from "@/lib/legal/documents";

interface LegalPoliciesSectionProps {
  data?: Record<string, unknown>;
  onChange?: (id: string, value: unknown) => void;
}

/** Stored per document under the `legal` settings group. */
type StoredDocument = { body: string; updatedAt: string };

function readStored(
  data: Record<string, unknown> | undefined,
  id: string,
): StoredDocument | null {
  const stored = data?.[id];
  if (
    stored &&
    typeof stored === "object" &&
    typeof (stored as StoredDocument).body === "string" &&
    (stored as StoredDocument).body.trim()
  ) {
    return stored as StoredDocument;
  }
  return null;
}

export function LegalPoliciesSection({ data, onChange }: LegalPoliciesSectionProps) {
  const [editing, setEditing] = useState<LegalDocumentMeta | null>(null);
  const [body, setBody] = useState("");

  const openEditor = (doc: LegalDocumentMeta) => {
    /*
     * Pre-fill with what is actually published.
     *
     * The editor used to open on an empty textarea, so "Edit Content" really
     * meant "replace everything from scratch". It now loads the admin's saved
     * copy, or — the first time — the wording the live page ships with.
     */
    setBody(readStored(data, doc.id)?.body ?? doc.defaultBody);
    setEditing(doc);
  };

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
      description="The customer-facing policy pages linked in your storefront footer."
    >
      <div className="divide-y divide-border rounded-lg border border-border">
        {LEGAL_DOCUMENTS.map((doc) => {
          const stored = readStored(data, doc.id);
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
                <p className="flex flex-wrap items-center gap-2 text-sm font-semibold text-foreground">
                  {doc.name}
                  {stored ? (
                    <Badge variant="secondary" className="h-5 px-2 text-xs">
                      Edited
                    </Badge>
                  ) : null}
                </p>
                <p className="text-xs text-subtle">
                  {updated ? `Last edited ${updated}` : "Using the built-in wording"}
                </p>
              </div>

              <Button asChild variant="ghost" size="sm" className="shrink-0">
                <Link href={doc.route} target="_blank" rel="noreferrer">
                  <ExternalLink className="size-4" aria-hidden />
                  <span className="sr-only sm:not-sr-only">View</span>
                </Link>
              </Button>

              <Button
                type="button"
                variant="outline"
                size="sm"
                className="shrink-0"
                onClick={() => openEditor(doc)}
              >
                <PenLine className="size-4" aria-hidden />
                Edit content
              </Button>
            </div>
          );
        })}
      </div>

      <Dialog open={!!editing} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent className="sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>{editing?.name}</DialogTitle>
            <DialogDescription>
              Start a section with <code>## </code>, leave a blank line between
              paragraphs, and begin a bullet with <code>- </code>. Section
              headings become the contents list on the page.
            </DialogDescription>
          </DialogHeader>

          <Textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={18}
            className="mt-2 font-mono text-sm"
            aria-label={`${editing?.name} content`}
          />

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <p className="text-xs text-subtle tabular-nums">
                {body.trim().length.toLocaleString()} characters
              </p>
              {editing && body !== editing.defaultBody ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground"
                  onClick={() => setBody(editing.defaultBody)}
                >
                  <RotateCcw className="size-3.5" aria-hidden />
                  Reset to default
                </Button>
              ) : null}
            </div>

            <div className="flex gap-3">
              <Button type="button" variant="outline" onClick={() => setEditing(null)}>
                Cancel
              </Button>
              <Button type="button" onClick={applyEdit} disabled={!body.trim()}>
                Apply
              </Button>
            </div>
          </div>

          <p className="mt-1 text-xs text-subtle">
            Applying stages the change — use <strong>Save changes</strong> at the
            top of Settings to publish it to the storefront.
          </p>
        </DialogContent>
      </Dialog>
    </SettingsSection>
  );
}
