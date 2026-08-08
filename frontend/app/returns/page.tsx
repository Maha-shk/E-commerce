"use client";

import Link from "next/link";
import { LegalPage, type LegalSection } from "@/components/customer/LegalPage";
import { site } from "@/lib/site";

const SECTIONS: LegalSection[] = [
  {
    id: "window",
    title: `The ${site.returnWindowDays}-day return window`,
    body: (
      <>
        <p>
          Changed your mind? You have <strong>{site.returnWindowDays} days</strong> from
          the day your order is delivered to start a return.
        </p>
        <p>
          To be accepted, an item needs to be unused, in the condition you received it,
          and in its original packaging with any accessories and manuals included.
        </p>
      </>
    ),
  },
  {
    id: "how-to",
    title: "How to return an item",
    body: (
      <ol>
        <li>
          Find the order in <Link href="/account/orders">My Orders</Link> and note the
          order number.
        </li>
        <li>
          <Link href="/contact">Contact us</Link> with the order number and which items
          you want to return, and tell us why.
        </li>
        <li>
          We will reply with a return authorisation and the address to send it to.
          Please do not send anything back before you have this — unauthorised returns
          can go astray.
        </li>
        <li>
          Pack the item securely, include the authorisation, and send it with a tracked
          service. Keep the tracking number until your refund arrives.
        </li>
      </ol>
    ),
  },
  {
    id: "refunds",
    title: "Refunds",
    body: (
      <>
        <p>
          Once your return reaches us we inspect it and email you the outcome. Approved
          refunds go back to the original payment method within 5–10 business days,
          depending on your bank.
        </p>
        <p>
          We refund the price of the item. Original shipping costs are refunded only
          where the return is our fault — a faulty, damaged or incorrect item.
        </p>
      </>
    ),
  },
  {
    id: "exchanges",
    title: "Exchanges",
    body: (
      <p>
        The quickest way to exchange something is to return the original for a refund and
        place a new order — that way you are not waiting on the return to clear before
        the replacement ships. If the item was faulty, contact us instead and we will
        arrange a direct replacement.
      </p>
    ),
  },
  {
    id: "faulty",
    title: "Faulty or incorrect items",
    body: (
      <>
        <p>
          If an item arrives faulty, damaged, or is not what you ordered, contact us
          within 48 hours of delivery with photographs. We will cover return shipping and
          send a replacement or a full refund — your choice.
        </p>
        <p>
          This is in addition to your statutory rights, which are not affected by
          anything on this page.
        </p>
      </>
    ),
  },
  {
    id: "return-shipping",
    title: "Who pays return shipping",
    body: (
      <table>
        <thead>
          <tr>
            <th>Reason for return</th>
            <th>Return shipping</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Faulty, damaged or incorrect item</td>
            <td>We pay</td>
          </tr>
          <tr>
            <td>Changed your mind</td>
            <td>You pay</td>
          </tr>
        </tbody>
      </table>
    ),
  },
  {
    id: "exclusions",
    title: "What we can't accept",
    body: (
      <>
        <p>For hygiene, safety and licensing reasons, we cannot accept returns of:</p>
        <ul>
          <li>In-ear headphones and earphones once the seal has been broken.</li>
          <li>Software, downloads and digital licences that have been activated.</li>
          <li>Gift cards.</li>
          <li>Items made or configured to your specification.</li>
          <li>
            Anything returned outside the {site.returnWindowDays}-day window, or returned
            used, incomplete or without its packaging.
          </li>
        </ul>
        <p>None of these exclusions apply where the item is faulty.</p>
      </>
    ),
  },
  {
    id: "late",
    title: "Late or missing refunds",
    body: (
      <p>
        If we have confirmed your refund but it has not appeared, check with your bank or
        card issuer first — processing on their side can take a few extra days. If it has
        been more than 10 business days since our confirmation, contact us and we will
        chase it.
      </p>
    ),
  },
];

export default function ReturnsPage() {
  return (
    <LegalPage
      title="Returns & Refunds"
      intro={`Not right? You have ${site.returnWindowDays} days to send most items back. Here's how it works.`}
      sections={SECTIONS}
    />
  );
}
