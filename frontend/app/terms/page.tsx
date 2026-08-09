"use client";

import Link from "next/link";
import { type LegalSection } from "@/components/customer/LegalPage";
import { LegalDocument } from "@/components/customer/LegalDocument";
import { site, siteAddressLine } from "@/lib/site";

/**
 * NOTE FOR THE STORE OWNER
 * -----------------------------------------------------------------------
 * A reasonable, plain-English starting point — not legal advice, and not
 * reviewed by a lawyer. Consumer law (statutory rights, cooling-off periods,
 * distance-selling rules) varies by country and overrides anything written
 * here. Have this reviewed before publishing.
 */
const SECTIONS: LegalSection[] = [
  {
    id: "agreement",
    title: "Agreement to these terms",
    body: (
      <p>
        These terms govern your use of the {site.name} online store. By browsing the
        site or placing an order you agree to them. If you do not agree, please do not
        use the store.
      </p>
    ),
  },
  {
    id: "accounts",
    title: "Your account",
    body: (
      <>
        <p>
          You can browse without an account, but you need one to place an order and
          track it. When you create an account you agree to:
        </p>
        <ul>
          <li>Provide accurate information and keep it up to date.</li>
          <li>Keep your password confidential.</li>
          <li>Take responsibility for activity that happens under your account.</li>
        </ul>
        <p>
          Tell us straight away if you suspect unauthorised use. We may suspend or close
          accounts used for fraud, abuse, or any breach of these terms.
        </p>
      </>
    ),
  },
  {
    id: "products",
    title: "Products and availability",
    body: (
      <>
        <p>
          We try to describe and photograph every product accurately, but colours and
          finishes can appear differently between screens, and specifications may change
          as manufacturers revise their models.
        </p>
        <p>
          Stock levels shown on the site are our best current figure. Availability is
          not guaranteed until your order is confirmed — if an item sells out between
          your order and our confirmation, we will contact you and refund you in full.
        </p>
      </>
    ),
  },
  {
    id: "pricing",
    title: "Pricing and payment",
    body: (
      <>
        <ul>
          <li>All prices are shown in {site.currency} and include applicable taxes unless stated otherwise.</li>
          <li>Shipping is calculated at checkout before you confirm.</li>
          <li>Payment is taken when you place the order.</li>
        </ul>
        <p>
          We take care with pricing, but if a product is listed at an obviously incorrect
          price we reserve the right to cancel the order and refund you in full rather
          than fulfil it at that price. We will always contact you first.
        </p>
      </>
    ),
  },
  {
    id: "orders",
    title: "Orders and cancellation",
    body: (
      <>
        <p>
          Your order is an offer to buy. A contract is formed when we send your order
          confirmation. We may decline an order where the item is unavailable, we cannot
          authorise payment, or we suspect fraud.
        </p>
        <p>
          Need to change or cancel something? Contact us as soon as possible — we can
          usually help before the order ships. Once it has shipped, our{" "}
          <Link href="/returns">returns process</Link> applies instead.
        </p>
      </>
    ),
  },
  {
    id: "delivery",
    title: "Delivery",
    body: (
      <p>
        Delivery options, costs and estimated timeframes are set out on our{" "}
        <Link href="/shipping">Shipping page</Link>. Delivery estimates are estimates,
        not guarantees; carrier delays and events outside our control can affect them.
        Risk in the goods passes to you on delivery.
      </p>
    ),
  },
  {
    id: "returns",
    title: "Returns and refunds",
    body: (
      <p>
        You can return most items within {site.returnWindowDays} days. The full
        conditions, exclusions and process are on our{" "}
        <Link href="/returns">Returns &amp; Refunds page</Link>. Nothing in these terms
        affects your statutory rights, including your rights in respect of faulty goods.
      </p>
    ),
  },
  {
    id: "acceptable-use",
    title: "Acceptable use",
    body: (
      <>
        <p>When using this store, please do not:</p>
        <ul>
          <li>Break the law, or infringe anyone&apos;s rights.</li>
          <li>Attempt to gain unauthorised access to the site, accounts or systems.</li>
          <li>Scrape, mirror or resell the site&apos;s content without permission.</li>
          <li>Interfere with the operation of the site or its security features.</li>
          <li>Submit false, misleading, or abusive content.</li>
        </ul>
      </>
    ),
  },
  {
    id: "ip",
    title: "Intellectual property",
    body: (
      <p>
        The site&apos;s design, text, graphics and logos belong to {site.name} or its
        licensors and are protected by intellectual property law. Product names and
        brand marks belong to their respective owners. You may not reproduce them
        commercially without written permission.
      </p>
    ),
  },
  {
    id: "liability",
    title: "Liability",
    body: (
      <>
        <p>
          The store is provided on an &ldquo;as is&rdquo; basis. We do not warrant that
          it will be uninterrupted or error-free.
        </p>
        <p>
          To the extent permitted by law, we are not liable for indirect or consequential
          loss, and our total liability for any order is limited to the amount you paid
          for it. Nothing here limits liability for death or personal injury caused by
          negligence, for fraud, or for anything else that cannot lawfully be limited.
        </p>
      </>
    ),
  },
  {
    id: "changes",
    title: "Changes to these terms",
    body: (
      <p>
        We may update these terms from time to time. The version in force when you place
        an order is the version that applies to that order. The date at the top of this
        page shows when it was last revised.
      </p>
    ),
  },
  {
    id: "contact",
    title: "Contact",
    body: (
      <>
        <p>Questions about these terms:</p>
        <ul>
          <li>
            Email: <a href={`mailto:${site.email.general}`}>{site.email.general}</a>
          </li>
          <li>Post: {site.name}, {siteAddressLine}</li>
        </ul>
      </>
    ),
  },
];

export default function TermsPage() {
  return (
    <LegalDocument
      id="terms"
      title="Terms of Service"
      intro={`The terms that apply when you shop with ${site.name}.`}
      fallbackSections={SECTIONS}
    />
  );
}
