/**
 * Single source of truth for store details.
 *
 * The company name, address and support contacts were previously typed by hand
 * into the footer and the contact page, so they could (and did) disagree. The
 * legal pages need the same values, so everything reads from here.
 *
 * ⚠️  These are PLACEHOLDERS. Replace them with the real business details
 *     before going live — they appear in the Privacy Policy and Terms, where
 *     being wrong actually matters.
 */
export const site = {
  name: "Cento Servizi",
  shortName: "Cento",
  tagline: "Quality audio equipment, delivered.",
  description:
    "Cento Servizi supplies professional and consumer audio equipment, with fast delivery and straightforward returns.",

  email: {
    support: "support@cento.local",
    general: "info@cento.local",
    privacy: "privacy@cento.local",
  },

  phone: "+1 (555) 123-4567",
  hours: "Mon–Fri, 9am–6pm EST",

  address: {
    line1: "123 Commerce Street",
    line2: "New York, NY 10001",
  },

  /** Currency the storefront prices in — keep in step with lib/format.ts. */
  currency: "EUR",

  /** Free-shipping threshold, mirroring lib/stores/cart-store.ts. */
  freeShippingThreshold: 100,

  /** Days a customer has to start a return. */
  returnWindowDays: 30,

  /** Shown as "Last updated" on the legal pages. */
  policiesUpdated: "2026-08-08",

  /**
   * Social profiles. These were dead `href="#"` links in the footer and on the
   * contact page. Put your real profile URLs here and they become live; set a
   * value to `null` and that icon is hidden rather than rendered dead.
   */
  social: {
    twitter: "https://twitter.com/",
    instagram: "https://instagram.com/",
    facebook: "https://facebook.com/",
  } as Record<"twitter" | "instagram" | "facebook", string | null>,
} as const;

export const siteAddressLine = `${site.address.line1}, ${site.address.line2}`;
