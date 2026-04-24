import type { Metadata } from "next";
import { Inter, Outfit } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { ChatWidgetLoader } from "@/components/chat/chat-widget-loader";
import { GoogleAnalytics } from "@/components/analytics/google-analytics";
import { CookieConsent } from "@/components/analytics/cookie-consent";
import "./globals.css";

// Preview Vercel builds don't have NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY set,
// and ClerkProvider throws "Missing publishableKey" during _not-found
// prerender. Match the middleware's existing pattern of only engaging
// Clerk when a real publishable key is present.
const clerkPublishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
const hasClerk = Boolean(
  clerkPublishableKey &&
    clerkPublishableKey !== "your_clerk_publishable_key",
);

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
  const tree = (
    <html lang="en" suppressHydrationWarning>
      <body className={`${fontSans.variable} ${fontHeading.variable} font-sans antialiased`}>
        <div className="flex min-h-screen flex-col">
          <Navbar />
          <main className="flex-1">{children}</main>
          <Footer />
        </div>
        <ChatWidgetLoader />
        <GoogleAnalytics />
        <CookieConsent />
      </body>
    </html>
  );

  return hasClerk ? <ClerkProvider>{tree}</ClerkProvider> : tree;
}
