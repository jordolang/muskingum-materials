import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "cdn.sanity.io" },
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
      { protocol: "https", hostname: "images.unsplash.com" },
    ],
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://*.clerk.accounts.dev https://clerk.com https://js.stripe.com https://*.stripe.com https://core.sanity-cdn.com https://www.googletagmanager.com",
              "script-src-elem 'self' 'unsafe-inline' https://*.clerk.accounts.dev https://clerk.com https://js.stripe.com https://*.stripe.com https://core.sanity-cdn.com https://www.googletagmanager.com",
              "worker-src 'self' blob:",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: blob: https://cdn.sanity.io https://lh3.googleusercontent.com https://images.unsplash.com https://avatars.githubusercontent.com https://source.unsplash.com https://www.googletagmanager.com https://www.google-analytics.com",
              "font-src 'self' data:",
              "connect-src 'self' https://*.clerk.accounts.dev https://clerk.com https://api.stripe.com https://*.stripe.com https://cdn.sanity.io https://*.sanity.io wss://*.api.sanity.io https://*.apicdn.sanity.io https://sanity-cdn.com https://*.sanity-cdn.com https://www.google-analytics.com",
              "frame-src 'self' https://*.clerk.accounts.dev https://js.stripe.com https://*.stripe.com https://*.sanity.io https://*.sanity-cdn.com https://*.sanity.work",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self'",
              "frame-ancestors 'self' https://*.sanity.io https://*.sanity.work https://*.sanity.build",
              "upgrade-insecure-requests",
            ].join("; "),
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=31536000; includeSubDomains",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
