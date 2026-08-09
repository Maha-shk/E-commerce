"use client";

import { useQuery } from "@tanstack/react-query";
import { LegalPage, type LegalSection } from "@/components/customer/LegalPage";
import { publicService } from "@/lib/api/services/public";
import { parseLegalBody, type LegalDocumentId } from "@/lib/legal/documents";

/**
 * Renders a legal page, preferring the admin's edited copy.
 *
 * The Settings editor used to write to a value nothing read, so an admin could
 * rewrite the Privacy Policy and the published page would not change. This
 * checks for an override and falls back to the page's own built-in sections,
 * which keeps the richer default markup intact until someone actually edits it.
 */
export function LegalDocument({
  id,
  title,
  intro,
  fallbackSections,
}: {
  id: LegalDocumentId;
  title: string;
  intro?: React.ReactNode;
  fallbackSections: LegalSection[];
}) {
  const { data } = useQuery({
    queryKey: ["legal", id],
    queryFn: () => publicService.getLegalDocument(id),
    // Policy text changes rarely; don't refetch it on every focus.
    staleTime: 10 * 60_000,
    refetchOnWindowFocus: false,
  });

  const override = data?.body?.trim() ? data : null;

  const sections: LegalSection[] = override
    ? parseLegalBody(override.body).map((section) => ({
        id: section.id,
        title: section.title,
        body: (
          <>
            {section.blocks.map((block, index) =>
              block.kind === "ul" ? (
                <ul key={index}>
                  {block.items.map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              ) : (
                <p key={index}>{block.text}</p>
              ),
            )}
          </>
        ),
      }))
    : fallbackSections;

  return (
    <LegalPage
      title={title}
      intro={intro}
      sections={sections}
      // Show when the admin last edited it, not the app-wide policy date.
      {...(override?.updatedAt ? { updated: override.updatedAt } : {})}
    />
  );
}
