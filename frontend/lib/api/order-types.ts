/**
 * The public order payload (`GET /public/orders/:orderNumber`).
 *
 * Both the order detail page and the order confirmation page consumed this as
 * `any`, which is how the confirmation page ended up reading fields that don't
 * exist. Typed once, here.
 */
export type PublicOrderItem = {
  id: string;
  productId: string;
  name: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  image: string | null;
};

export type PublicOrder = {
  id: string;
  orderNumber: string;
  customerId: string | null;
  customer: {
    id: string;
    fullName: string;
    email: string;
    phone: string | null;
  } | null;
  status: string;
  paymentMethod: string | null;
  shippingMethod: string | null;
  shippingTracking: string | null;
  /** Free-form string as stored by the backend. */
  shippingAddress: string | null;
  shippingCost: number | string | null;
  discount: number | string | null;
  placedAt: string;
  items: PublicOrderItem[];
  totals: {
    subtotal: number;
    shipping: number;
    discount: number;
    total: number;
  };
  createdAt: string;
  updatedAt: string;
};

/** Progression a normal (non-cancelled) order moves through. */
export const ORDER_STAGES = [
  "PENDING",
  "PROCESSING",
  "SHIPPED",
  "DELIVERED",
] as const;

export type OrderStage = (typeof ORDER_STAGES)[number];

/** Terminal states that never reach DELIVERED. */
export const TERMINAL_STATUSES = ["CANCELLED", "RETURNED", "REFUNDED"];

export function isTerminalStatus(status: string) {
  return TERMINAL_STATUSES.includes(status.toUpperCase());
}

/** Index of the current stage, or -1 when the order ended early. */
export function stageIndex(status: string) {
  return ORDER_STAGES.indexOf(status.toUpperCase() as OrderStage);
}
