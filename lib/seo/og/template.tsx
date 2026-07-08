/**
 * Shared Open Graph image template (1200x630).
 *
 * Layout: a dark branded "ad" banner on top (logo, Anton headline, subtitle,
 * phone CTA) with a browser-framed screenshot of the live site rising from
 * the bottom edge — the screenshot shows the look of the site without being
 * the whole image.
 *
 * Used by the per-route `opengraph-image.tsx` files. Fonts and images are
 * read from disk at build/render time (all consuming routes are statically
 * generated), following the Next.js local-asset pattern for `ImageResponse`.
 */

import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { BUSINESS_INFO } from "@/data/business";

export const OG_SIZE = { width: 1200, height: 630 };
export const OG_CONTENT_TYPE = "image/png";

export interface OgTemplateOptions {
  /** Big Anton headline in the banner. Keep under ~45 characters. */
  title: string;
  /** One supporting line under the headline. */
  subtitle: string;
}

const OG_DIR = join(process.cwd(), "lib/seo/og");

async function loadAsset(relativePath: string): Promise<Buffer> {
  return readFile(join(OG_DIR, relativePath));
}

export async function renderOgImage({ title, subtitle }: OgTemplateOptions) {
  const [anton, interSemiBold, interBold, screenshot, logo] =
    await Promise.all([
      loadAsset("fonts/Anton-Regular.ttf"),
      loadAsset("fonts/Inter-SemiBold.ttf"),
      loadAsset("fonts/Inter-Bold.ttf"),
      loadAsset("assets/site-screenshot.jpg"),
      readFile(join(process.cwd(), "public/muskingum-materials-logo-red.png")),
    ]);

  const screenshotSrc = `data:image/jpeg;base64,${screenshot.toString("base64")}`;
  const logoSrc = `data:image/png;base64,${logo.toString("base64")}`;
  const domain = BUSINESS_INFO.website.replace(/^https?:\/\//, "");

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          backgroundColor: "#1c1917",
          backgroundImage:
            "radial-gradient(80% 70% at 20% 0%, rgba(245,158,11,0.32), rgba(28,25,23,0) 70%)",
          fontFamily: "Inter",
        }}
      >
        {/* Ad banner */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            padding: "44px 64px 0 64px",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                backgroundColor: "#ffffff",
                borderRadius: 16,
                padding: "10px 22px",
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- satori element, not DOM */}
              <img src={logoSrc} alt="" height={52} />
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                color: "#fbbf24",
                fontSize: 26,
                fontWeight: 700,
              }}
            >
              <div
                style={{
                  display: "flex",
                  border: "2px solid rgba(251,191,36,0.5)",
                  borderRadius: 999,
                  padding: "10px 24px",
                }}
              >
                {BUSINESS_INFO.phone}
              </div>
            </div>
          </div>

          <div
            style={{
              display: "flex",
              fontFamily: "Anton",
              fontSize: 68,
              lineHeight: 1.05,
              color: "#ffffff",
              textTransform: "uppercase",
              letterSpacing: 1,
              marginTop: 36,
            }}
          >
            {title}
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 16,
              marginTop: 18,
              color: "#d6d3d1",
              fontSize: 27,
              fontWeight: 600,
            }}
          >
            <div
              style={{
                display: "flex",
                width: 46,
                height: 5,
                backgroundColor: "#f59e0b",
                borderRadius: 999,
              }}
            />
            {subtitle}
          </div>
        </div>

        {/* Browser-framed site screenshot peeking up from the bottom */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            width: 1000,
            marginTop: 40,
            marginLeft: 100,
            borderTopLeftRadius: 18,
            borderTopRightRadius: 18,
            overflow: "hidden",
            boxShadow: "0 -12px 60px rgba(0,0,0,0.55)",
            border: "1px solid rgba(255,255,255,0.14)",
            borderBottom: "none",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              backgroundColor: "#2b2826",
              padding: "14px 20px",
            }}
          >
            <div style={{ display: "flex", width: 14, height: 14, borderRadius: 999, backgroundColor: "#f87171" }} />
            <div style={{ display: "flex", width: 14, height: 14, borderRadius: 999, backgroundColor: "#fbbf24" }} />
            <div style={{ display: "flex", width: 14, height: 14, borderRadius: 999, backgroundColor: "#4ade80" }} />
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                flexGrow: 1,
                margin: "0 140px 0 120px",
                backgroundColor: "#1c1917",
                borderRadius: 999,
                padding: "6px 0",
                color: "#a8a29e",
                fontSize: 19,
                fontWeight: 600,
              }}
            >
              {domain}
            </div>
          </div>
          {/* eslint-disable-next-line @next/next/no-img-element -- satori element, not DOM */}
          <img src={screenshotSrc} alt="" width={1000} height={694} />
        </div>
      </div>
    ),
    {
      ...OG_SIZE,
      fonts: [
        { name: "Anton", data: anton, style: "normal", weight: 400 },
        { name: "Inter", data: interSemiBold, style: "normal", weight: 600 },
        { name: "Inter", data: interBold, style: "normal", weight: 700 },
      ],
    },
  );
}
