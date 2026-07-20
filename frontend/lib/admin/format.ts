/** Shared money formatting for the admin console. */
export function formatEuro(value: number): string {
  return new Intl.NumberFormat("en-IE", { style: "currency", currency: "EUR" }).format(value);
}
