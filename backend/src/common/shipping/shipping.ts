/**
 * Shipping options and what they cost.
 *
 * The single source of truth for both the checkout quote and the
 * `/public/shipping-methods` endpoint the storefront renders. Keeping the rates
 * here rather than in the client is the same rule the rest of checkout follows:
 * the browser sends a choice, never a price.
 */

export type ShippingMethodCode = 'standard' | 'express';

interface ShippingMethodSpec {
  code: ShippingMethodCode;
  label: string;
  rate: number;
  estimatedDays: number;
  /** Order value above which this method is free. Null = never free. */
  freeOver: number | null;
  description: string;
}

/** Order value above which standard delivery is free. */
export const FREE_SHIPPING_THRESHOLD = 100;

/**
 * Express is always charged — the free-shipping threshold is a standard
 * delivery perk, not a free upgrade.
 */
export const SHIPPING_METHODS: readonly ShippingMethodSpec[] = [
  {
    code: 'standard',
    label: 'Standard Delivery (BRT)',
    rate: 10,
    estimatedDays: 7,
    freeOver: FREE_SHIPPING_THRESHOLD,
    description: `Free on orders over €${FREE_SHIPPING_THRESHOLD}`,
  },
  {
    code: 'express',
    label: 'Express Delivery (DHL)',
    rate: 25,
    estimatedDays: 3,
    freeOver: null,
    description: 'Fastest option, always charged',
  },
] as const;

const BY_CODE = new Map(SHIPPING_METHODS.map((m) => [m.code, m]));

/** Standard is what an unrecognised or absent choice falls back to. */
export const DEFAULT_SHIPPING_METHOD: ShippingMethodCode = 'standard';

export function shippingMethodFor(code?: string): ShippingMethodSpec {
  return BY_CODE.get(code as ShippingMethodCode) ?? BY_CODE.get(DEFAULT_SHIPPING_METHOD)!;
}

/** What a given method costs for a given goods total. */
export function shippingCostFor(subtotal: number, code?: string): number {
  const method = shippingMethodFor(code);
  if (method.freeOver !== null && subtotal >= method.freeOver) return 0;
  return method.rate;
}

/** Human label stored on the order, e.g. "Express Delivery (DHL)". */
export function shippingLabelFor(code?: string): string {
  return shippingMethodFor(code).label;
}

/**
 * The options a storefront should offer, priced against the current basket so
 * the free-shipping line is accurate before the shopper commits.
 */
export function shippingQuotesFor(subtotal: number) {
  return SHIPPING_METHODS.map((method) => {
    const cost = shippingCostFor(subtotal, method.code);
    return {
      code: method.code,
      label: method.label,
      cost,
      isFree: cost === 0,
      estimatedDays: method.estimatedDays,
      freeOver: method.freeOver,
      description: method.description,
      /** How much more to spend to unlock free delivery; null when not applicable. */
      amountToFreeShipping:
        method.freeOver !== null && subtotal < method.freeOver
          ? Number((method.freeOver - subtotal).toFixed(2))
          : null,
    };
  });
}
