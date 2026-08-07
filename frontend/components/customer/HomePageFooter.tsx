"use client";

import Link from "next/link";
import Image from "next/image";
import { Container } from "@/components/customer/Container";
import { SocialLinks } from "@/components/customer/SocialLinks";

const LINK_COLUMNS = [
  {
    heading: "Quick Links",
    links: [
      { href: "/privacy", label: "Privacy Policy" },
      { href: "/terms", label: "Terms of Service" },
      { href: "/contact", label: "Contact Us" },
    ],
  },
  {
    heading: "Support",
    links: [
      { href: "/shipping", label: "Shipping & Returns" },
      { href: "/faq", label: "FAQ" },
      { href: "/returns", label: "Easy Returns" },
    ],
  },
] as const;

export function HomePageFooter() {
  return (
    // Colours were previously six repeated inline `style` objects with raw hex
    // values. `bg-primary`/`text-primary-foreground` are the same navy, and now
    // track the theme like the rest of the app.
    <footer className="mt-auto bg-primary text-primary-foreground/70">
      <Container className="py-12">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-3">
          {/* Brand */}
          <div>
            <Link
              href="/"
              className="inline-block rounded-md focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-current"
              aria-label="Cento — home"
            >
              <Image
                src="/logos/cento-logo.png"
                alt="Cento"
                width={120}
                height={40}
                className="h-10 w-auto brightness-0 invert"
              />
            </Link>

            <p className="mt-4 max-w-xs text-sm">
              Quality audio equipment, delivered across Ireland.
            </p>

            <SocialLinks
              className="mt-5"
              itemClassName="bg-white/10 text-primary-foreground hover:bg-white/20"
            />
          </div>

          {/* Link columns */}
          {LINK_COLUMNS.map((column) => (
            <nav key={column.heading} aria-label={column.heading}>
              <h2 className="text-sm font-semibold tracking-wide text-primary-foreground uppercase">
                {column.heading}
              </h2>
              <ul className="mt-4 space-y-2.5">
                {column.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="rounded-md text-sm transition-colors duration-150 hover:text-primary-foreground focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-current"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <div className="mt-10 border-t border-white/10 pt-6 text-center text-sm text-primary-foreground/50">
          <p>&copy; {new Date().getFullYear()} Cento Servizi. All rights reserved.</p>
        </div>
      </Container>
    </footer>
  );
}
