"use client";

import Script from "next/script";

// Accept only real GA4 measurement IDs (G-XXXXXXXXXX). Anything else — blank,
// placeholders like "your_ga_id", or legacy UA-* IDs — disables the component
// so we never inject a broken <script> tag (and trip CSP in the process).
const GA_ID_PATTERN = /^G-[A-Z0-9]{4,}$/;

export function GoogleAnalytics() {
  const gaId = process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS_ID || "G-5N79W1SG59";
  if (!gaId || !GA_ID_PATTERN.test(gaId)) return null;

  return (
    <>
      {/*
        1. Define dataLayer / gtag, set consent defaults, then configure the tag.
           All commands are queued into dataLayer BEFORE gtag.js loads (it is
           async), so the consent defaults are always processed first.

           Consent defaults deny everything. The restore-from-localStorage
           block immediately issues an update if the visitor previously accepted.
       */}
      <Script id="gtag-consent-init" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}

          gtag('consent', 'default', {
            'ad_storage': 'denied',
            'ad_user_data': 'denied',
            'ad_personalization': 'denied',
            'analytics_storage': 'denied'
          });

          (function(){
            try {
              var stored = localStorage.getItem('cookie-consent');
              if (stored === 'granted') {
                gtag('consent', 'update', {
                  'ad_storage': 'granted',
                  'ad_user_data': 'granted',
                  'ad_personalization': 'granted',
                  'analytics_storage': 'granted'
                });
              }
            } catch(e) {}
          })();

          gtag('js', new Date());
          gtag('config', '${gaId}');
        `}
      </Script>

      {/* 2. Load the Google tag (gtag.js) — async, processes the queued commands above. */}
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
        strategy="afterInteractive"
      />
    </>
  );
}
