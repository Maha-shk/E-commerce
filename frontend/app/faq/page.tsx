"use client";

import { useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { ChevronDown, MessageCircleQuestion, Search, X } from "lucide-react";
import { CustomerPageShell } from "@/components/customer/CustomerPageShell";
import { PageIntro } from "@/components/customer/PageIntro";
import { EmptyState } from "@/components/customer/StateBlock";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatMoney } from "@/lib/format";
import { site } from "@/lib/site";
import { cn } from "@/lib/utils";

type Faq = {
  q: string;
  /** Plain-text copy of the answer, used for search. */
  keywords: string;
  a: ReactNode;
};

const GROUPS: { heading: string; items: Faq[] }[] = [
  {
    heading: "Orders",
    items: [
      {
        q: "How do I track my order?",
        keywords: "track order status shipping tracking email",
        a: (
          <p>
            Every order gets a confirmation email, then a second email with tracking once
            it ships. You can also see live status any time under{" "}
            <Link href="/account/orders">My Orders</Link>.
          </p>
        ),
      },
      {
        q: "Can I change or cancel my order?",
        keywords: "change cancel amend modify order",
        a: (
          <p>
            Usually yes, as long as it hasn&apos;t shipped yet — <Link href="/contact">contact us</Link>{" "}
            with your order number as soon as you can. Once it&apos;s on its way, our{" "}
            <Link href="/returns">returns process</Link> applies instead.
          </p>
        ),
      },
      {
        q: "Do I need an account to buy something?",
        keywords: "account guest checkout register sign up required",
        a: (
          <p>
            You can browse and fill a cart without one, but you&apos;ll need an account
            to complete checkout — that&apos;s what lets you track the order and handle
            returns afterwards.
          </p>
        ),
      },
    ],
  },
  {
    heading: "Shipping",
    items: [
      {
        q: "How long does delivery take?",
        keywords: "delivery time how long standard express days",
        a: (
          <p>
            Standard delivery is 5–7 business days and Express is 2–3, counted from the
            day your order ships. Full details are on our{" "}
            <Link href="/shipping">Shipping page</Link>.
          </p>
        ),
      },
      {
        q: "How much is shipping?",
        keywords: "shipping cost price free delivery charge",
        a: (
          <p>
            Standard delivery is {formatMoney(10)}, and{" "}
            <strong>free on orders over {formatMoney(site.freeShippingThreshold)}</strong>.
            Express is {formatMoney(14.99)}. The exact figure for your basket is shown at
            checkout before you pay.
          </p>
        ),
      },
      {
        q: "My parcel hasn't arrived. What now?",
        keywords: "lost missing parcel late delayed not arrived",
        a: (
          <p>
            If tracking hasn&apos;t moved for a few business days, or it says delivered
            and you don&apos;t have it, <Link href="/contact">get in touch</Link>. We
            will open an enquiry with the carrier and resolve it.
          </p>
        ),
      },
    ],
  },
  {
    heading: "Returns & refunds",
    items: [
      {
        q: "What's your return policy?",
        keywords: "return policy window days send back",
        a: (
          <p>
            You have {site.returnWindowDays} days from delivery to start a return on most
            items, provided they&apos;re unused and in their original packaging. See{" "}
            <Link href="/returns">Returns &amp; Refunds</Link> for the full details.
          </p>
        ),
      },
      {
        q: "How long do refunds take?",
        keywords: "refund time how long money back",
        a: (
          <p>
            Once we&apos;ve received and inspected your return, refunds go back to your
            original payment method within 5–10 business days, depending on your bank.
          </p>
        ),
      },
      {
        q: "Who pays for return shipping?",
        keywords: "return shipping cost who pays postage",
        a: (
          <p>
            We do, if the item was faulty, damaged or incorrect. If you&apos;ve simply
            changed your mind, return postage is yours.
          </p>
        ),
      },
    ],
  },
  {
    heading: "Payment & account",
    items: [
      {
        q: "Is it safe to pay on this site?",
        keywords: "safe secure payment card details stripe security",
        a: (
          <p>
            Yes. Payments are handled by our payment processor and card details never
            reach our servers. Traffic to the site is encrypted throughout.
          </p>
        ),
      },
      {
        q: "What currency are prices in?",
        keywords: "currency euro eur price tax vat",
        a: (
          <p>
            All prices are shown in {site.currency} and include applicable taxes unless
            stated otherwise.
          </p>
        ),
      },
      {
        q: "I've forgotten my password.",
        keywords: "forgot password reset login cant sign in",
        a: (
          <p>
            Use the <Link href="/forgot-password">password reset link</Link> on the sign-in
            page and we&apos;ll email you a code to set a new one.
          </p>
        ),
      },
      {
        q: "How do I delete my account?",
        keywords: "delete account remove data close gdpr privacy",
        a: (
          <p>
            Email <a href={`mailto:${site.email.privacy}`}>{site.email.privacy}</a> and
            we&apos;ll take care of it. See our{" "}
            <Link href="/privacy">Privacy Policy</Link> for what happens to your data.
          </p>
        ),
      },
    ],
  },
];

/**
 * One question. Built on native <details>/<summary>: it's expandable,
 * keyboard-operable and screen-reader-correct with no JavaScript and no
 * accordion library.
 */
function FaqItem({ item }: { item: Faq }) {
  return (
    <details className="group border-b border-border last:border-0">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-4 text-sm font-medium marker:content-none focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring [&::-webkit-details-marker]:hidden">
        <span className="text-pretty">{item.q}</span>
        <ChevronDown
          className="size-4 shrink-0 text-muted-foreground transition-transform duration-200 group-open:rotate-180"
          aria-hidden
        />
      </summary>
      <div className="legal-prose pb-4">{item.a}</div>
    </details>
  );
}

export default function FaqPage() {
  const [query, setQuery] = useState("");

  const groups = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return GROUPS;

    return GROUPS.map((group) => ({
      ...group,
      items: group.items.filter(
        (item) =>
          item.q.toLowerCase().includes(term) || item.keywords.includes(term),
      ),
    })).filter((group) => group.items.length > 0);
  }, [query]);

  const hasResults = groups.length > 0;

  return (
    <CustomerPageShell>
      <PageIntro
        align="center"
        title="Frequently Asked Questions"
        description="Answers to the things customers ask us most. If yours isn't here, just get in touch."
        action={
          <div className="relative w-full max-w-md">
            <Search
              className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden
            />
            <Input
              type="text"
              inputMode="search"
              placeholder="Search questions…"
              aria-label="Search frequently asked questions"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className={cn("h-11 pl-9", query && "pr-9")}
            />
            {query ? (
              <button
                type="button"
                onClick={() => setQuery("")}
                aria-label="Clear search"
                className="absolute top-1/2 right-2 flex size-7 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
              >
                <X className="size-4" aria-hidden />
              </button>
            ) : null}
          </div>
        }
      />

      <div className="mx-auto max-w-3xl">
        {hasResults ? (
          <div className="space-y-6">
            {groups.map((group) => (
              <Card key={group.heading} className="gap-0 py-0">
                <div className="border-b border-border px-6 pt-5 pb-4">
                  <h2 className="text-base font-semibold tracking-tight">
                    {group.heading}
                  </h2>
                </div>
                <div className="px-6">
                  {group.items.map((item) => (
                    <FaqItem key={item.q} item={item} />
                  ))}
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <EmptyState
            bordered
            icon={MessageCircleQuestion}
            title="No matching questions"
            description={`Nothing matches “${query.trim()}”. Try different wording, or ask us directly.`}
            action={
              <>
                <Button variant="outline" onClick={() => setQuery("")}>
                  Clear search
                </Button>
                <Button asChild>
                  <Link href="/contact">Contact Us</Link>
                </Button>
              </>
            }
          />
        )}

        {hasResults ? (
          <Card className="mt-6 gap-0 py-0">
            <div className="flex flex-col items-start gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-base font-semibold tracking-tight">
                  Didn&apos;t find your answer?
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Send us a message — we usually reply within one business day.
                </p>
              </div>
              <Button asChild className="shrink-0">
                <Link href="/contact">Contact Us</Link>
              </Button>
            </div>
          </Card>
        ) : null}
      </div>
    </CustomerPageShell>
  );
}
