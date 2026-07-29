import "./globals.css";
import type { ReactNode } from "react";

export const metadata = {
  title: "Brand Sync Exceptions",
  description: "Second-line monitoring for webshop-to-BC sync failures",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
