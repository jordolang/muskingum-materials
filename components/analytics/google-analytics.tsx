"use client";

import Script from "next/script";

// Accept only real GA4 measurement IDs (G-XXXXXXXXXX). Anything else — blank,
// placeholders like "your_ga_id", or legacy UA-* IDs — disables the component
// so we never inject a broken <script> tag (and trip CSP in the process).
const GA_ID_PATTERN = /^G-[A-Z0-9]{4,}$/;

export function GoogleAnalytics() {
  const gaId = process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS_ID;
  if (!gaId || !GA_ID_PATTERN.test(gaId)) return null;

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
        strategy="afterInteractive"
      />
      <Script id="google-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}

          gtag('consent', 'default', {
            'ad_storage': 'denied',
            'ad_user_data': 'denied',
            'ad_personalization': 'denied',
            'analytics_storage': 'denied'
          });

          gtag('js', new Date());
          gtag('config', '${gaId}');
        `}
      </Script>
    </>
  );
}
