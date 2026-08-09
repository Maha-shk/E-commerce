"use client";

import Link from "next/link";
import { type LegalSection } from "@/components/customer/LegalPage";
import { LegalDocument } from "@/components/customer/LegalDocument";
import { site, siteAddressLine } from "@/lib/site";

/**
 * NOTE FOR THE STORE OWNER
 * -----------------------------------------------------------------------
 * This is a clear, honest starting point that describes what the app in
 * this repository actually does — but it is NOT legal advice and has not
 * been reviewed by a lawyer. Have it checked against the regulations that
 * apply to you (GDPR, CCPA, …) and fill in the placeholders in lib/site.ts
 * before you publish.
 */
const SECTIONS: LegalSection[] = [
  {
    id: "overview",
    title: "Overview",
    body: (
      <p>
        This policy explains what personal information {site.name} collects when you
        use this store, why we collect it, and what choices you have. We only collect
        what we need to take an order, deliver it, and support you afterwards.
      </p>
    ),
  },
  {
    id: "what-we-collect",
    title: "Information we collect",
    body: (
      <>
        <h3>Information you give us</h3>
        <ul>
          <li>
            <strong>Account details</strong> — your name, email address and, if you add
            one, a phone number.
          </li>
          <li>
            <strong>Delivery addresses</strong> — saved in your address book so checkout
            is faster next time.
          </li>
          <li>
            <strong>Order information</strong> — the products you buy, quantities and
            the delivery method you choose.
          </li>
          <li>
            <strong>Messages</strong> — anything you send us through the contact form or
            by email.
          </li>
        </ul>

        <h3>Information collected automatically</h3>
        <ul>
          <li>
            <strong>Session data</strong> — a sign-in token stored in your browser so you
            stay logged in between visits.
          </li>
          <li>
            <strong>Cart data</strong> — the contents of your basket, kept so it survives
            a page refresh.
          </li>
        </ul>

        <h3>What we do not collect</h3>
        <p>
          We never see or store your full card number. Payments are handled by our
          payment processor, which collects those details directly.
        </p>
      </>
    ),
  },
  {
    id: "how-we-use-it",
    title: "How we use your information",
    body: (
      <ul>
        <li>To process, fulfil and deliver your orders.</li>
        <li>To send transactional messages such as order confirmations and shipping updates.</li>
        <li>To let you sign in, and to keep your account secure.</li>
        <li>To respond when you contact support.</li>
        <li>To detect and prevent fraud or abuse of the store.</li>
      </ul>
    ),
  },
  {
    id: "sharing",
    title: "Who we share it with",
    body: (
      <>
        <p>
          We do not sell your personal information. We share it only with the service
          providers needed to run the store, and only as far as they need it:
        </p>
        <ul>
          <li><strong>Payment processor</strong> — to take payment securely.</li>
          <li><strong>Delivery carriers</strong> — to get your order to your address.</li>
          <li><strong>Email provider</strong> — to send order and account emails.</li>
          <li><strong>Hosting and storage providers</strong> — to run the site itself.</li>
        </ul>
        <p>
          We may also disclose information where the law requires it, or to protect our
          rights or the safety of others.
        </p>
      </>
    ),
  },
  {
    id: "retention",
    title: "How long we keep it",
    body: (
      <p>
        We keep account and order records for as long as your account is open, and
        afterwards only for as long as we are required to for tax, accounting and legal
        purposes. You can ask us to delete your account at any time — see below.
      </p>
    ),
  },
  {
    id: "your-rights",
    title: "Your rights",
    body: (
      <>
        <p>Depending on where you live, you may have the right to:</p>
        <ul>
          <li>Access the personal information we hold about you.</li>
          <li>Correct anything that is inaccurate.</li>
          <li>Ask us to delete your account and associated data.</li>
          <li>Object to, or ask us to restrict, certain kinds of processing.</li>
          <li>Receive a copy of your data in a portable format.</li>
        </ul>
        <p>
          You can update your name, phone number and addresses yourself from{" "}
          <Link href="/account/profile">your profile</Link>. For anything else, email{" "}
          <a href={`mailto:${site.email.privacy}`}>{site.email.privacy}</a> and we will
          respond as quickly as we can.
        </p>
      </>
    ),
  },
  {
    id: "cookies",
    title: "Cookies and local storage",
    body: (
      <p>
        We use browser storage for the things the store cannot work without: keeping you
        signed in and remembering your cart. These are not used for advertising or
        cross-site tracking. Clearing your browser storage will sign you out and empty
        your cart.
      </p>
    ),
  },
  {
    id: "security",
    title: "Security",
    body: (
      <p>
        Traffic to this site is encrypted in transit, passwords are stored hashed rather
        than in plain text, and access to order data is restricted to staff accounts. No
        system is perfectly secure, so please use a strong, unique password and tell us
        immediately if you think your account has been accessed by someone else.
      </p>
    ),
  },
  {
    id: "children",
    title: "Children",
    body: (
      <p>
        This store is not intended for children, and we do not knowingly collect
        information from anyone under 16. If you believe a child has given us personal
        information, contact us and we will delete it.
      </p>
    ),
  },
  {
    id: "changes",
    title: "Changes to this policy",
    body: (
      <p>
        If we make significant changes we will update the date at the top of this page
        and, where appropriate, let you know by email. Continuing to use the store after
        a change means you accept the updated policy.
      </p>
    ),
  },
  {
    id: "contact",
    title: "Contact us",
    body: (
      <>
        <p>Questions about this policy or your data:</p>
        <ul>
          <li>
            Email: <a href={`mailto:${site.email.privacy}`}>{site.email.privacy}</a>
          </li>
          <li>Post: {site.name}, {siteAddressLine}</li>
        </ul>
      </>
    ),
  },
];

export default function PrivacyPage() {
  return (
    <LegalDocument
      id="privacy"
      title="Privacy Policy"
      intro={`How ${site.name} collects, uses and protects your personal information.`}
      fallbackSections={SECTIONS}
    />
  );
}
