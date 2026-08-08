"use client";

import Link from "next/link";
import Image from "next/image";
import { Mail, MapPin, Phone, ShieldCheck } from "lucide-react";
import { Container } from "@/components/customer/Container";
import { SocialLinks } from "@/components/customer/SocialLinks";
import { site, siteAddressLine } from "@/lib/site";

const COLUMNS = [
  {
    heading: "Shop",
    links: [
      { href: "/products", label: "All Products" },
      { href: "/categories", label: "Categories" },
      { href: "/new-arrivals", label: "New Arrivals" },
      { href: "/best-sellers", label: "Best Sellers" },
      { href: "/sales", label: "Sales" },
    ],
  },
  {
    heading: "Help",
    links: [
      { href: "/contact", label: "Contact Us" },
      { href: "/faq", label: "FAQ" },
      { href: "/shipping", label: "Shipping" },
      { href: "/returns", label: "Returns & Refunds" },
    ],
  },
  {
    heading: "Account",
    links: [
      { href: "/account", label: "My Account" },
      { href: "/account/orders", label: "My Orders" },
      { href: "/account/wishlist", label: "Wishlist" },
      { href: "/cart", label: "Cart" },
    ],
  },
] as const;

const CONTACT = [
  { icon: Mail, text: site.email.support, href: `mailto:${site.email.support}` },
  { icon: Phone, text: site.phone, href: `tel:${site.phone.replace(/[^\d+]/g, "")}` },
  { icon: MapPin, text: siteAddressLine, href: undefined },
] as const;

/** Muted-on-navy link, hovering up to full contrast. */
const FOOTER_LINK =
  "rounded-md text-sm text-primary-foreground/65 transition-colors duration-150 hover:text-primary-foreground focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-current";

export function HomePageFooter() {
  return (
    <footer className="mt-auto bg-primary text-primary-foreground">
      <Container className="pt-14 pb-8">
        {/* Brand + link columns. The brand column is wider so the description
            doesn't wrap awkwardly against three narrow link lists. */}
        <div className="grid grid-cols-2 gap-x-8 gap-y-10 md:grid-cols-4 lg:grid-cols-[1.6fr_repeat(3,1fr)]">
          <div className="col-span-2 md:col-span-4 lg:col-span-1">
            <Link
              href="/"
              className="inline-block rounded-md focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-current"
              aria-label={`${site.shortName} — home`}
            >
              <Image
                src="/logos/cento-logo.png"
                alt={site.shortName}
                width={120}
                height={40}
                className="h-9 w-auto brightness-0 invert"
              />
            </Link>

            <p className="mt-4 max-w-xs text-sm text-primary-foreground/65 text-pretty">
              {site.description}
            </p>

            <SocialLinks
              className="mt-6"
              itemClassName="bg-white/10 text-primary-foreground hover:bg-white/20"
            />
          </div>

          {COLUMNS.map((column) => (
            <nav key={column.heading} aria-label={column.heading}>
              <h2 className="text-xs font-semibold tracking-wider text-primary-foreground uppercase">
                {column.heading}
              </h2>
              <ul className="mt-4 space-y-2.5">
                {column.links.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className={FOOTER_LINK}>
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        {/* Contact strip */}
        <div className="mt-12 grid grid-cols-1 gap-4 border-t border-white/10 pt-8 sm:grid-cols-3">
          {CONTACT.map((item) => {
            const Icon = item.icon;
            const content = (
              <>
                <Icon
                  className="size-4 shrink-0 text-primary-foreground/50"
                  aria-hidden
                />
                <span className="min-w-0 truncate">{item.text}</span>
              </>
            );

            return item.href ? (
              <a
                key={item.text}
                href={item.href}
                className={`flex items-center gap-2.5 ${FOOTER_LINK}`}
              >
                {content}
              </a>
            ) : (
              <p
                key={item.text}
                className="flex items-center gap-2.5 text-sm text-primary-foreground/65"
              >
                {content}
              </p>
            );
          })}
        </div>
      </Container>

      {/* Bottom bar */}
      <div className="border-t border-white/10">
        <Container className="flex flex-col items-center justify-between gap-4 py-5 sm:flex-row">
          <p className="text-xs text-primary-foreground/50">
            &copy; {new Date().getFullYear()} {site.name}. All rights reserved.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
            <Link href="/privacy" className={`${FOOTER_LINK} text-xs`}>
              Privacy Policy
            </Link>
            <Link href="/terms" className={`${FOOTER_LINK} text-xs`}>
              Terms of Service
            </Link>
            <span className="flex items-center gap-1.5 text-xs text-primary-foreground/50">
              <ShieldCheck className="size-3.5" aria-hidden />
              Secure payments
            </span>
          </div>
        </Container>
      </div>
    </footer>
  );
}
