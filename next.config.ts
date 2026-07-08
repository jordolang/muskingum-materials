import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Inline the critical CSS for each route and defer the rest, so the
    // render-blocking stylesheet no longer stalls first paint on throttled
    // mobile. Uses the `beasties` package. Directly targets the Lighthouse
    // "render-blocking requests" insight (the largest one on mobile).
    optimizeCss: true,
  },
  webpack: (config, { isServer }) => {
    if (process.env.ANALYZE === "true") {
      try {
        const { BundleAnalyzerPlugin } = require("webpack-bundle-analyzer");
        config.plugins.push(
          new BundleAnalyzerPlugin({
            analyzerMode: "static",
            reportFilename: isServer
              ? "../analyze/server.html"
              : "./analyze/client.html",
            openAnalyzer: !process.env.CI,
          })
        );
      } catch (error) {
        console.warn("webpack-bundle-analyzer not installed. Install it to enable bundle analysis:");
        console.warn("  npm install --save-dev webpack-bundle-analyzer @next/bundle-analyzer");
      }
    }
    return config;
  },
  images: {
    // AVIF first (typically 20-50% smaller than WebP for photos), WebP
    // fallback. Directly targets the Lighthouse "improve image delivery"
    // insight for the hero and gallery photos on throttled mobile.
    formats: ["image/avif", "image/webp"],
    // Cache optimized variants at the edge for a year so repeat views and
    // crawlers don't re-pay the transform cost.
    minimumCacheTTL: 31536000,
    remotePatterns: [
      { protocol: "https", hostname: "cdn.sanity.io" },
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
      { protocol: "https", hostname: "images.unsplash.com" },
    ],
  },
  // Retail/e-commerce surfaces are hidden, not deleted: the page code stays
  // in the repo (dormant) but every route is 301'd away so the pages are
  // unreachable and search engines drop the old pricing/ordering URLs.
  async redirects() {
    return [
      { source: "/order/:path*", destination: "/contact", permanent: true },
      { source: "/catalog", destination: "/products", permanent: true },
      { source: "/catalog/:path*", destination: "/products", permanent: true },
      { source: "/costs", destination: "/contact", permanent: true },
      { source: "/costs/:path*", destination: "/contact", permanent: true },
      { source: "/planner", destination: "/calculators", permanent: true },
      { source: "/recommendations", destination: "/products", permanent: true },
      { source: "/rewards", destination: "/", permanent: true },
      { source: "/account", destination: "/", permanent: true },
      { source: "/account/:path*", destination: "/", permanent: true },
      { source: "/sign-up/:path*", destination: "/", permanent: true },
      { source: "/sign-up", destination: "/", permanent: true },
      { source: "/reviews", destination: "/", permanent: true },
      { source: "/reviews/:path*", destination: "/", permanent: true },
      { source: "/returns", destination: "/contact", permanent: true },
      { source: "/delivery", destination: "/services", permanent: true },
      { source: "/experience", destination: "/", permanent: true },
    ];
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
              "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://*.clerk.accounts.dev https://clerk.com https://js.stripe.com https://*.stripe.com https://core.sanity-cdn.com https://www.googletagmanager.com https://maps.googleapis.com https://maps.gstatic.com https://*.googleapis.com https://*.gstatic.com",
              "script-src-elem 'self' 'unsafe-inline' https://*.clerk.accounts.dev https://clerk.com https://js.stripe.com https://*.stripe.com https://core.sanity-cdn.com https://www.googletagmanager.com https://maps.googleapis.com https://maps.gstatic.com https://*.googleapis.com https://*.gstatic.com",
              "worker-src 'self' blob:",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "img-src 'self' data: blob: https://img.clerk.com https://*.clerk.accounts.dev https://cdn.sanity.io https://lh3.googleusercontent.com https://images.unsplash.com https://avatars.githubusercontent.com https://source.unsplash.com https://www.googletagmanager.com https://www.google-analytics.com https://maps.googleapis.com https://maps.gstatic.com https://*.googleapis.com https://*.gstatic.com https://*.google.com https://streetviewpixels-pa.googleapis.com",
              "font-src 'self' data: https://fonts.gstatic.com",
              "connect-src 'self' https://*.clerk.accounts.dev https://clerk.com https://clerk-telemetry.com https://api.stripe.com https://*.stripe.com https://cdn.sanity.io https://*.sanity.io wss://*.api.sanity.io https://*.apicdn.sanity.io https://sanity-cdn.com https://*.sanity-cdn.com https://www.google-analytics.com https://maps.googleapis.com https://*.googleapis.com https://*.gstatic.com",
              "frame-src 'self' https://*.clerk.accounts.dev https://js.stripe.com https://*.stripe.com https://*.sanity.io https://*.sanity-cdn.com https://*.sanity.work https://www.google.com",
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
          {
            // Both CSP `frame-ancestors` and X-Frame-Options are intentionally set.
            // Modern browsers (Chrome 40+, Firefox 33+, Safari 10+) enforce frame-ancestors
            // from the CSP header; older browsers fall back to X-Frame-Options: SAMEORIGIN.
            // Setting both provides maximum browser compatibility without redundancy.
            key: "X-Frame-Options",
            value: "SAMEORIGIN",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
