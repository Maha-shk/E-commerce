import type { Metadata } from "next";
import "./globals.css";
import { cn } from "@/lib/utils";
import { Providers } from "./providers";

// Use system fonts to avoid Google Fonts network issues in Docker builds
const systemFonts = cn(
  "font-sans antialiased",
  "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif"
);

export const metadata: Metadata = {
  title: "CENTO Servizi — Customer Portal",
  description: "Manage your orders, wishlist, addresses and account.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={cn("min-h-screen", systemFonts)}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
