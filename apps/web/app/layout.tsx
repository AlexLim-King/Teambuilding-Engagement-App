import type { Metadata } from "next";
import { Inter, Oxanium } from "next/font/google";
import "./globals.css";

/* Inter for everything readable — forms, names, body. Excellent at 320px. */
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

/* Oxanium for display only: the team number, the currency, headings. Angular
   and slightly extended, the nearest free match to the Core Apex wordmark.
   Restricted to a few weights to keep the participant bundle small. */
const oxanium = Oxanium({
  variable: "--font-oxanium",
  subsets: ["latin"],
  weight: ["600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Core Apex — Engagement",
  description: "Team formation and peer evaluation for Core Apex events.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${oxanium.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
