import { NextResponse } from "next/server";
import { groq } from "next-sanity";
import { sanityClient } from "@/lib/sanity/client";
import type { DeliverySettings } from "@/lib/delivery";

interface DeliverySettingsDocument {
  _id: string;
  zoneRadiusMiles: number;
  baseFee: number;
  perMileRate: number;
}

const deliverySettingsQuery = groq`
  *[_type == "deliverySettings"][0] {
    _id,
    zoneRadiusMiles,
    baseFee,
    perMileRate
  }
`;

/**
 * Delivery pricing settings retrieval endpoint.
 *
 * @access public
 * @returns 200 `{ success: true, settings: DeliverySettings }` with delivery zone radius,
 *   base fee, and per-mile rate sourced from Sanity CMS
 * @returns 500 `{ error: "Internal server error" }` when settings fetch fails unexpectedly
 * @see lib/delivery.ts for DeliverySettings type definition
 * @see sanity/schemaTypes/deliverySettings.ts for Sanity schema (if defined)
 * @remarks Falls back to default settings (25 mile radius, $20 base, $1.50/mile) when
 *   Sanity document is missing or CMS is unreachable. Graceful degradation ensures
 *   delivery calculator remains functional even without CMS configuration.
 * @remarks Not rate-limited — settings are static configuration data with minimal
 *   server cost. See rateLimitedEndpoints in middleware.ts for rate-limited routes.
 */
export async function GET() {
  try {
    // Fetch delivery settings from Sanity
    let deliverySettings: DeliverySettings;
    try {
      const settings = await sanityClient.fetch<DeliverySettingsDocument>(
        deliverySettingsQuery
      );

      if (!settings) {
        // Default settings if not configured in Sanity
        deliverySettings = {
          zoneRadiusMiles: 25,
          baseFee: 20,
          perMileRate: 1.5,
        };
      } else {
        deliverySettings = {
          zoneRadiusMiles: settings.zoneRadiusMiles,
          baseFee: settings.baseFee,
          perMileRate: settings.perMileRate,
        };
      }
    } catch (sanityError) {
      console.error("Sanity fetch error:", sanityError);
      // Use default settings if Sanity is not configured
      deliverySettings = {
        zoneRadiusMiles: 25,
        baseFee: 20,
        perMileRate: 1.5,
      };
    }

    return NextResponse.json({
      success: true,
      settings: deliverySettings,
    });
  } catch (error) {
    console.error("Delivery settings fetch error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
