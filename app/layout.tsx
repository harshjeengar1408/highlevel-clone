import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "HighLevel — CRM, funnels & automation",
  description:
    "An open-source GoHighLevel-style platform: contacts, pipelines, conversations, calendars, funnels and marketing automation in one place.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
