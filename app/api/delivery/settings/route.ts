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
