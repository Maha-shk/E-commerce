"use client";

import Link from "next/link";
import { LegalPage, type LegalSection } from "@/components/customer/LegalPage";
import { formatMoney } from "@/lib/format";
import { site } from "@/lib/site";

/**
 * The delivery options and costs here mirror the ones offered at checkout
 * (app/checkout/page.tsx) and the free-shipping threshold in the cart store.
 * If those change, change them here too — or a customer will be quoted one
 * price on this page and charged another at checkout.
 */
const SECTIONS: LegalSection[] = [
  {
    id: "options",
    title: "Delivery options",
    body: (
      <>
        <table>
          <thead>
            <tr>
              <th>Method</th>
              <th>Estimated time</th>
              <th>Cost</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Standard</td>
              <td>5–7 business days</td>
              <td>
                {formatMoney(10)}
                <br />
                <span className="text-xs text-muted-foreground">
                  Free over {formatMoney(site.freeShippingThreshold)}
                </span>
              </td>
            </tr>
            <tr>
              <td>Express</td>
              <td>2–3 business days</td>
              <td>{formatMoney(14.99)}</td>
            </tr>
          </tbody>
        </table>
        <p>
          The exact cost for your basket is always shown at checkout before you confirm
          and pay.
        </p>
      </>
    ),
  },
  {
    id: "free-shipping",
    title: "Free shipping",
    body: (
      <p>
        Standard delivery is free on orders over{" "}
        <strong>{formatMoney(site.freeShippingThreshold)}</strong>, calculated on the
        order subtotal before tax. Express delivery is charged at the rate above
        regardless of order value.
      </p>
    ),
  },
  {
    id: "processing",
    title: "Order processing",
    body: (
      <>
        <p>
          Orders placed before 2pm on a business day are usually picked and packed the
          same day. Orders placed after that, or at weekends and on public holidays, are
          processed on the next business day.
        </p>
        <p>
          Delivery estimates start from the day your order <em>ships</em>, not the day
          you place it — so allow one processing day on top of the times in the table.
        </p>
      </>
    ),
  },
  {
    id: "tracking",
    title: "Tracking your order",
    body: (
      <>
        <p>
          You will get a confirmation email as soon as your order is placed, and a second
          email with tracking details once it leaves our warehouse.
        </p>
        <p>
          You can also check the current status any time from{" "}
          <Link href="/account/orders">My Orders</Link>.
        </p>
      </>
    ),
  },
  {
    id: "addresses",
    title: "Delivery addresses",
    body: (
      <>
        <p>
          Please double-check your address at checkout. Once an order has shipped we
          cannot redirect it, and a parcel returned to us because of an incorrect address
          may incur a re-delivery cost.
        </p>
        <p>
          Save the addresses you use often in your{" "}
          <Link href="/account/addresses">address book</Link> so they are one click away
          next time.
        </p>
      </>
    ),
  },
  {
    id: "delays",
    title: "Delays and missing parcels",
    body: (
      <>
        <p>
          Delivery times are estimates. Carrier backlogs, severe weather and customs
          checks can all add time, and we are not able to guarantee a delivery date.
        </p>
        <p>
          If your tracking has not moved for several business days, or the parcel is
          marked delivered but you do not have it, contact us — we will open an enquiry
          with the carrier and sort it out.
        </p>
      </>
    ),
  },
  {
    id: "damaged",
    title: "Damaged in transit",
    body: (
      <p>
        Inspect your order when it arrives. If anything is damaged, photograph the
        packaging and the item and contact us within 48 hours of delivery. We will
        arrange a replacement or a full refund at no cost to you — see{" "}
        <Link href="/returns">Returns &amp; Refunds</Link>.
      </p>
    ),
  },
];

export default function ShippingPage() {
  return (
    <LegalPage
      title="Shipping"
      intro="Delivery options, costs and timeframes, and what to do if something goes wrong."
      sections={SECTIONS}
    />
  );
}
