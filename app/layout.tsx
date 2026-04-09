import type { Metadata } from "next";
import { Inter, Outfit } from "next/font/google";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { ChatWidget } from "@/components/chat/chat-widget";
import { GoogleAnalytics } from "@/components/analytics/google-analytics";
import { ClerkWrapper } from "@/components/providers/clerk-wrapper";
import "./globals.css";

const fontSans = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

const fontHeading = Outfit({
  subsets: ["latin"],
  variable: "--font-heading",
});

export const metadata: Metadata = {
  title: {
    default: "Muskingum Materials | Sand, Soil & Gravel - Zanesville, OH",
    template: "%s | Muskingum Materials",
  },
  description:
    "Southeast Ohio's resource for sand, soil, and gravel. Family-owned in Zanesville, OH. Fair pricing, delivery available, state-approved scales. Call (740) 319-0183.",
  keywords: [
    "gravel",
    "sand",
    "soil",
    "aggregate",
    "Zanesville",
    "Ohio",
    "delivery",
    "landscaping",
    "construction materials",
    "Muskingum Materials",
  ],
  openGraph: {
    title: "Muskingum Materials | Sand, Soil & Gravel",
    description: "Southeast Ohio's resource for sand, soil, and gravel. Family-owned, fair pricing, delivery available.",
    url: "https://muskingummaterials.com",
    siteName: "Muskingum Materials",
    locale: "en_US",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${fontSans.variable} ${fontHeading.variable} font-sans antialiased`}>
        <ClerkWrapper>
          <div className="flex min-h-screen flex-col">
            <Navbar />
            <main className="flex-1">{children}</main>
            <Footer />
          </div>
          <ChatWidget />
        </ClerkWrapper>
        <GoogleAnalytics />
      </body>
    </html>
  );
}
