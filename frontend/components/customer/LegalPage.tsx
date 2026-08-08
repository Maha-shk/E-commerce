"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { Mail } from "lucide-react";
import { CustomerPageShell } from "@/components/customer/CustomerPageShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatLongDate } from "@/lib/format";
import { site } from "@/lib/site";

export type LegalSection = {
  /** Anchor id — also what the contents rail links to. */
  id: string;
  title: string;
  body: ReactNode;
};

/**
 * Shared layout for the long-form policy pages (privacy, terms, shipping,
 * returns).
 *
 * Sections are passed as data rather than markup so the contents rail can be
 * generated from the same source as the headings — the two can't drift, and a
 * new section only has to be written once.
 */
export function LegalPage({
  title,
  intro,
  sections,
  updated = site.policiesUpdated,
}: {
  title: string;
  intro?: ReactNode;
  sections: LegalSection[];
  updated?: string;
}) {
  return (
    <CustomerPageShell>
      <div className="mb-10 max-w-3xl">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{title}</h1>
        <p className="mt-2 text-xs text-muted-foreground">
          Last updated{" "}
          <time dateTime={updated}>{formatLongDate(updated)}</time>
        </p>
        {intro ? (
          <p className="mt-4 text-sm text-muted-foreground text-pretty">{intro}</p>
        ) : null}
      </div>

      <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:gap-12">
        {/* Contents rail. Hidden on small screens, where it would push the
            actual content below the fold. */}
        <nav
          aria-label="On this page"
          className="hidden w-56 shrink-0 lg:sticky lg:top-24 lg:block lg:self-start"
        >
          <p className="eyebrow">On this page</p>
          <ul className="mt-3 space-y-1 border-l border-border">
            {sections.map((section) => (
              <li key={section.id}>
                <a
                  href={`#${section.id}`}
                  className="-ml-px block border-l border-transparent py-1.5 pl-4 text-sm text-muted-foreground transition-colors hover:border-foreground hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                >
                  {section.title}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="min-w-0 max-w-3xl flex-1">
          <Card className="gap-0 py-0">
            <div className="legal-prose p-6 sm:p-8">
              {sections.map((section) => (
                <section key={section.id} aria-labelledby={section.id}>
                  <h2 id={section.id}>{section.title}</h2>
                  {section.body}
                </section>
              ))}
            </div>
          </Card>

          {/* Every policy page ends in the same place: talk to a human. */}
          <Card className="mt-6 gap-0 py-0">
            <div className="flex flex-col items-start gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-base font-semibold tracking-tight">
                  Still have questions?
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Our support team is happy to help.
                </p>
              </div>
              <div className="flex shrink-0 flex-wrap gap-2">
                <Button asChild>
                  <Link href="/contact">Contact Us</Link>
                </Button>
                <Button asChild variant="outline">
                  <a href={`mailto:${site.email.support}`}>
                    <Mail className="size-4" aria-hidden />
                    Email us
                  </a>
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </CustomerPageShell>
  );
}
