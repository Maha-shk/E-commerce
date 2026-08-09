import { site, siteAddressLine } from "@/lib/site";

/**
 * The legal documents an admin can edit, and the storefront copy each one
 * starts from.
 *
 * `defaultBody` matters as much as the routing here: the Settings editor opens
 * pre-filled with it, so an admin edits the wording that is actually published
 * instead of a blank box. Saving stores an override, which the page then
 * renders in place of its built-in copy.
 *
 * Format is deliberately plain text — `## Heading` starts a section, blank
 * lines separate paragraphs, `- ` makes a bullet. No markup to learn, and it
 * round-trips through a <textarea> unchanged.
 */
export type LegalDocumentId = "privacy" | "terms" | "returns" | "shipping";

export type LegalDocumentMeta = {
  id: LegalDocumentId;
  /** Label in the Settings list. */
  name: string;
  /** Storefront route, so the editor can link straight to the live page. */
  route: string;
  defaultBody: string;
};

const PRIVACY = `## Overview

This policy explains what personal information ${site.name} collects when you use this store, why we collect it, and what choices you have. We only collect what we need to take an order, deliver it, and support you afterwards.

## Information we collect

Information you give us:

- Account details — your name, email address and, if you add one, a phone number.
- Delivery addresses — saved in your address book so checkout is faster next time.
- Order information — the products you buy, quantities and the delivery method you choose.
- Messages — anything you send us through the contact form or by email.

Information collected automatically:

- Session data — a sign-in token stored in your browser so you stay logged in between visits.
- Cart data — the contents of your basket, kept so it survives a page reload.

## How we use your information

We use your information to take and deliver your orders, to keep you updated about them, to answer your questions, and to keep the store secure. We do not sell your personal information.

## Who we share it with

We share only what is necessary with the services that make the store work — payment processing, delivery, and email. Each one receives the minimum needed to do its job.

## How long we keep it

Order records are kept for as long as tax and accounting rules require. Account details are kept until you ask us to delete them.

## Your rights

You can ask us for a copy of your data, ask us to correct it, or ask us to delete it. Contact ${site.email.privacy} and we will respond as quickly as we can.

## Cookies and local storage

We use browser storage to keep you signed in and to remember your basket. We do not use advertising trackers.

## Security

Passwords are stored hashed, never in plain text. Access to customer data is limited to staff who need it.

## Children

This store is not intended for children, and we do not knowingly collect their information.

## Changes to this policy

If this policy changes we will update the date at the top of the page.

## Contact us

Questions about this policy can go to ${site.email.privacy}, or write to us at ${siteAddressLine}.`;

const TERMS = `## Agreement to these terms

By using ${site.name} you agree to these terms. If you do not agree with them, please do not use the store.

## Your account

You are responsible for keeping your password safe and for activity that happens under your account. Tell us straight away if you think someone else has access.

## Products and availability

We try to describe and picture products accurately, but colours and finishes can vary between screens. Availability can change while an item is in your basket.

## Pricing and payment

Prices are shown in ${site.currency} and include applicable tax unless stated otherwise. If a price is listed incorrectly we will contact you before charging you.

## Orders and cancellation

An order is confirmed once you receive our confirmation email. You can ask us to cancel an order at any point before it ships.

## Delivery

Delivery estimates are estimates, not guarantees. Risk passes to you when the parcel is delivered.

## Returns and refunds

You may return most items within ${site.returnWindowDays} days. See the Return Policy for the full details.

## Acceptable use

Do not use the store to break the law, to interfere with its operation, or to attempt to access accounts that are not yours.

## Intellectual property

The content of this store — text, images, and branding — belongs to ${site.name} and may not be reused without permission.

## Liability

We are responsible for losses that follow directly from our failure to meet these terms. We are not liable for indirect or unforeseeable losses.

## Changes to these terms

We may update these terms. Continuing to use the store after a change means you accept the updated version.

## Contact

Questions about these terms can go to ${site.email.general}.`;

const RETURNS = `## How to return an item

You have ${site.returnWindowDays} days from delivery to start a return. Contact ${site.email.support} with your order number and we will send you instructions.

Items should come back unused and in their original packaging where possible.

## Refunds

Once we receive and check the item, we refund to the original payment method. Refunds usually appear within five to ten working days, depending on your bank.

## Exchanges

The quickest way to exchange something is to return the original for a refund and place a new order.

## Faulty or incorrect items

If an item arrives faulty or is not what you ordered, tell us within ${site.returnWindowDays} days and we will cover the cost of putting it right.

## Who pays return shipping

We pay return shipping when the item is faulty, damaged, or sent in error. For a change of mind, the return postage is yours.

## What we cannot accept

We cannot accept returns of items that have been damaged after delivery, or of anything sold as final sale.

## Late or missing refunds

If a refund has not arrived after ten working days, check with your bank first, then contact ${site.email.support} and we will chase it.`;

const SHIPPING = `## Delivery options

Standard delivery arrives in three to five working days. Express delivery arrives in one to two working days and is charged at checkout.

## Free shipping

Standard delivery is free on orders over ${site.currency} ${site.freeShippingThreshold}. Express delivery is always charged.

## Order processing

Orders placed on a working day before the afternoon cut-off are usually packed the same day. Orders placed at the weekend are packed on the next working day.

## Tracking your order

When your parcel ships we email a tracking reference. You can also see it on the order page in your account.

## Delivery addresses

Please check your address carefully at checkout. We can change it only while the order is still unshipped.

## Delays and missing parcels

Couriers occasionally run late. If your parcel is more than five working days past its estimate, contact ${site.email.support} and we will open an enquiry.

## Damaged in transit

If a parcel arrives damaged, photograph it before unpacking where you can, and contact ${site.email.support} within ${site.returnWindowDays} days.`;

export const LEGAL_DOCUMENTS: LegalDocumentMeta[] = [
  { id: "privacy", name: "Privacy Policy", route: "/privacy", defaultBody: PRIVACY },
  { id: "terms", name: "Terms & Conditions", route: "/terms", defaultBody: TERMS },
  { id: "returns", name: "Return Policy", route: "/returns", defaultBody: RETURNS },
  { id: "shipping", name: "Shipping Policy", route: "/shipping", defaultBody: SHIPPING },
];

export function getLegalDocument(id: string): LegalDocumentMeta | undefined {
  return LEGAL_DOCUMENTS.find((doc) => doc.id === id);
}

export type ParsedSection = {
  id: string;
  title: string;
  blocks: Array<{ kind: "p"; text: string } | { kind: "ul"; items: string[] }>;
};

/** Turns a heading into a stable anchor id: "How we use it" -> "how-we-use-it". */
function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}

/**
 * Parses the plain-text format into renderable sections.
 *
 * Anything before the first `## Heading` is ignored, so a stray note at the top
 * of the box cannot produce an untitled section in the contents rail.
 */
export function parseLegalBody(body: string): ParsedSection[] {
  const sections: ParsedSection[] = [];
  let current: ParsedSection | null = null;
  let paragraph: string[] = [];
  let bullets: string[] = [];

  const flush = () => {
    if (!current) return;
    if (bullets.length) {
      current.blocks.push({ kind: "ul", items: [...bullets] });
      bullets = [];
    }
    if (paragraph.length) {
      current.blocks.push({ kind: "p", text: paragraph.join(" ").trim() });
      paragraph = [];
    }
  };

  for (const rawLine of body.split(/\r?\n/)) {
    const line = rawLine.trim();

    if (line.startsWith("## ")) {
      flush();
      if (current) sections.push(current);
      const title = line.slice(3).trim();
      current = { id: slugify(title), title, blocks: [] };
      continue;
    }

    if (!current) continue;

    if (line === "") {
      flush();
      continue;
    }

    if (line.startsWith("- ")) {
      // A bullet ends any paragraph that was being collected.
      if (paragraph.length) {
        current.blocks.push({ kind: "p", text: paragraph.join(" ").trim() });
        paragraph = [];
      }
      bullets.push(line.slice(2).trim());
      continue;
    }

    if (bullets.length) {
      current.blocks.push({ kind: "ul", items: [...bullets] });
      bullets = [];
    }
    paragraph.push(line);
  }

  flush();
  if (current) sections.push(current);

  return sections;
}
