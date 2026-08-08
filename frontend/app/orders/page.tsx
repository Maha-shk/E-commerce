import { redirect } from "next/navigation";

/**
 * `/orders` was a second, older copy of the customer order list that had
 * drifted from `/account/orders` (different UI, its own pagination, its own
 * bugs). The account area is the canonical location, so this route now just
 * forwards there — existing bookmarks and emails keep working.
 */
export default function OrdersRedirectPage() {
  redirect("/account/orders");
}
