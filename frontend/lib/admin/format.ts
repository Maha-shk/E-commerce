/** Shared money formatting for the admin console. */
export function formatEuro(value: number): string {
  return new Intl.NumberFormat("en-IE", { style: "currency", currency: "EUR" }).format(value);
}

/** Compact form for stat cards, e.g. 84k. */
export function formatCompact(value: number): string {
  return new Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}

/** Short list-view date: "Oct 24, 2024". */
export function formatDate(value: string | Date): string {
  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  });
}

/** Long form used in detail modals: "October 24, 2024 at 2:45 PM". */
export function formatDateTime(value: string | Date): string {
  const date = new Date(value);
  return `${date.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  })} at ${date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  })}`;
}

/** Relative time for "last updated" columns, e.g. "2 hours ago". */
export function formatRelative(value: string | Date): string {
  const diffMs = Date.now() - new Date(value).getTime();
  const minutes = Math.round(diffMs / 60_000);

  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? "" : "s"} ago`;

  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;

  const days = Math.round(hours / 24);
  if (days < 30) return `${days} day${days === 1 ? "" : "s"} ago`;

  return formatDate(value);
}

/** "Elena Bianchi" -> "EB" */
export function initialsOf(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]!.toUpperCase())
    .join("");
}

/**
 * Renders a SCREAMING_SNAKE enum value as readable text, e.g.
 * "FIXED_AMOUNT" -> "Fixed amount". Admin dropdowns were showing the raw
 * database values.
 */
export function titleCase(value: string): string {
  return value
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/^./, (c) => c.toUpperCase());
}
