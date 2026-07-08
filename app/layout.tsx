import type { Metadata } from "next";
import { Inter, Outfit, Anton, JetBrains_Mono } from "next/font/google";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { ChatWidgetLoader } from "@/components/chat/chat-widget-loader";
import { GoogleAnalytics } from "@/components/analytics/google-analytics";
import { Toaster } from "@/components/ui/toaster";
import { ErrorBoundary } from "@/components/error-boundary";
import { CookieConsent } from "@/components/analytics/cookie-consent";
import { SmoothScroll } from "@/components/smooth-scroll";
import { SITE_URL } from "@/lib/site-url";
import "./globals.css";

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
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Muskingum Materials | Sand & Gravel, Zanesville OH",
    template: "%s | Muskingum Materials",
  },
  description:
    "ODOT approved sand, gravel, and aggregate for contractors, municipalities, and commercial projects across Central & Southeastern Ohio. Call (740) 319-0183.",
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
    title: "Muskingum Materials | ODOT Sand & Gravel, Zanesville OH",
    description:
      "ODOT approved sand, gravel, and aggregate serving Central & Southeastern Ohio.",
    url: SITE_URL,
    siteName: "Muskingum Materials",
    locale: "en_US",
    type: "website",
    // Static OG image served from `public/images/og-image.png`. It's a plain
    // asset (no runtime render), so it can't fail for scrapers; `metadataBase`
    // resolves this relative path to an absolute URL for us.
    images: [
      {
        url: "/images/og-image.png",
        alt: "Muskingum Materials — ODOT approved sand, gravel & aggregate supplier in Zanesville, Ohio, serving Central & Southeastern Ohio.",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Muskingum Materials | ODOT Sand & Gravel, Zanesville OH",
    description:
      "ODOT approved sand, gravel, and aggregate serving Central & Southeastern Ohio.",
    images: ["/images/og-image.png"],
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

  // Clerk is intentionally NOT provided at the root — the public site ships no
  // Clerk client JS. Authenticated surfaces (/admin, /sign-in) wrap themselves
  // in ClerkProvider via ClerkGuardedProvider.
  return tree;
}
