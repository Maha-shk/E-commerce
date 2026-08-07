/**
 * Formatting helpers for the customer-facing pages.
 *
 * The account screens used to inline `€${value.toFixed(2)}` and a bare
 * `toLocaleDateString(...)` call at every use site, which drifted (some cards
 * showed "Oct 4", others "Oct 04, 2025"). Everything money- and date-shaped
 * goes through here instead.
 */

const money = new Intl.NumberFormat("en-IE", {
  style: "currency",
  currency: "EUR",
});

const shortDate = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

const longDate = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

const monthYear = new Intl.DateTimeFormat("en-GB", {
  month: "long",
  year: "numeric",
});

/** 1234.5 -> "€1,234.50" */
export function formatMoney(value: number): string {
  return money.format(value);
}

/** "2025-10-24T…" -> "24 Oct 2025" */
export function formatShortDate(value: string | Date): string {
  return shortDate.format(new Date(value));
}

/** "2025-10-24T…" -> "24 October 2025" */
export function formatLongDate(value: string | Date): string {
  return longDate.format(new Date(value));
}

/** "2025-10-24T…" -> "October 2025" — used for "Member since". */
export function formatMonthYear(value: string | Date): string {
  return monthYear.format(new Date(value));
}
