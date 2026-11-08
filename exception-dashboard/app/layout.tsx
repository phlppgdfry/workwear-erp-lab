import "./globals.css";
import type { ReactNode } from "react";

export const metadata = {
  title: "Workwear ERP Lab — Integration support desk",
  description: "Multi-brand integration monitoring for webshop, Business Central and warehouse operations.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
