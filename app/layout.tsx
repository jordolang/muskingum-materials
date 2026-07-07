import type { Metadata } from "next";
import { Inter, Outfit, Anton, JetBrains_Mono } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { ChatWidgetLoader } from "@/components/chat/chat-widget-loader";
import { GoogleAnalytics } from "@/components/analytics/google-analytics";
import { Toaster } from "@/components/ui/toaster";
import { ErrorBoundary } from "@/components/error-boundary";
import { CookieConsent } from "@/components/analytics/cookie-consent";
import { SmoothScroll } from "@/components/smooth-scroll";
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

// Inter is the body font — the only one used for above-the-fold body copy on
// every route — so it stays preloaded (the default) to avoid a text flash.
const fontSans = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

// Outfit (section headings), Anton (hero display) and JetBrains Mono (technical
// labels) are not part of the LCP element, so we skip preloading them. That
// frees the throttled-mobile connection to fetch the LCP hero image first;
// these fonts still load and swap in via `display: swap`.
const fontHeading = Outfit({
  subsets: ["latin"],
  variable: "--font-heading",
  preload: false,
});

const fontDisplay = Anton({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-anton",
  display: "swap",
  preload: false,
});

const fontTech = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
  display: "swap",
  preload: false,
});

export const metadata: Metadata = {
  title: {
    default: "Muskingum Materials | Sand, Gravel & Aggregate Supplier - Zanesville, OH",
    template: "%s | Muskingum Materials",
  },
  description:
    "State approved sand, gravel, and aggregate supplier serving Central and Southeastern Ohio. ODOT approved materials, state-approved scales, up to 20 tons per load. Call (740) 319-0183.",
  keywords: [
    "sand supplier",
    "gravel supplier",
    "aggregate supplier",
    "state approved aggregate",
    "ODOT aggregate",
    "ODOT materials",
    "Central Ohio aggregate",
    "Southeastern Ohio aggregate",
    "Zanesville Ohio",
    "Muskingum Materials",
  ],
  openGraph: {
    title: "Muskingum Materials | ODOT Approved Sand, Gravel & Aggregate",
    description: "State approved sand, gravel, and aggregate supplier serving Central and Southeastern Ohio.",
    url: "https://muskingummaterials.com",
    siteName: "Muskingum Materials",
    locale: "en_US",
    type: "website",
  },
  ...(process.env.NEXT_PUBLIC_GSC_VERIFICATION && {
    verification: {
      google: process.env.NEXT_PUBLIC_GSC_VERIFICATION,
    },
  }),
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const tree = (
    <html lang="en" suppressHydrationWarning>
      <body className={`${fontSans.variable} ${fontHeading.variable} ${fontDisplay.variable} ${fontTech.variable} font-sans antialiased`}>
        <SmoothScroll />
        <div className="flex min-h-screen flex-col">
          <Navbar />
          <main className="flex-1">{children}</main>
          <div className="print:hidden">
            <Footer />
          </div>
        </div>
        <div className="print:hidden">
          <ErrorBoundary componentName="ChatWidget">
            <ChatWidgetLoader />
          </ErrorBoundary>
          <Toaster />
          <CookieConsent />
        </div>
        <GoogleAnalytics />
      </body>
    </html>
  );

  return hasClerk ? <ClerkProvider>{tree}</ClerkProvider> : tree;
}
