/**
 * Addresses are stored as a positional `lines` array:
 * [street, apartment, city, state, postcode].
 *
 * Older records were saved with empty optional fields stripped out, so a 3- or
 * 4-element array has to be mapped back onto the 5 slots. Both the address book
 * and checkout had their own copy of this logic and they had already drifted;
 * this is the single implementation.
 */

export type AddressFields = {
  address: string;
  apartment: string;
  city: string;
  state: string;
  postalCode: string;
};

/** Normalises any stored `lines` array to exactly 5 positional slots. */
export function normaliseAddressLines(stored: string[] = []): string[] {
  const at = (i: number) => stored[i] || "";

  switch (stored.length) {
    case 4: // apartment was empty: [street, city, state, postcode]
      return [at(0), "", at(1), at(2), at(3)];
    case 3: // minimal: [street, city, postcode]
      return [at(0), "", at(1), "", at(2)];
    default:
      return [at(0), at(1), at(2), at(3), at(4)];
  }
}

/** Same normalisation, shaped for a named-field form. */
export function addressLinesToFields(stored: string[] = []): AddressFields {
  const [address, apartment, city, state, postalCode] = normaliseAddressLines(stored);
  return { address, apartment, city, state, postalCode };
}

/** Human-readable one-liner, e.g. for a summary card or a <select> option. */
export function formatAddressLine(lines: string[] = []): string {
  return lines.filter(Boolean).join(", ");
}
