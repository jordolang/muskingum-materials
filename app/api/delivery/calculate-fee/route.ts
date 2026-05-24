import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { groq } from "next-sanity";
import { sanityClient } from "@/lib/sanity/client";
import { BUSINESS_INFO } from "@/data/business";
import {
  calculateDeliveryFeeFromCoordinates,
  type DeliverySettings,
  type Coordinates,
} from "@/lib/delivery";

const calculateFeeSchema = z.object({
  address: z.string().min(1, "Address is required"),
});

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

async function geocodeAddress(address: string): Promise<Coordinates | null> {
  if (!process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY) {
    throw new Error("Google Maps API key not configured");
  }

  try {
    const encodedAddress = encodeURIComponent(address);
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodedAddress}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`;

    const response = await fetch(url);
    const data = await response.json();

    if (data.status === "OK" && data.results.length > 0) {
      const location = data.results[0].geometry.location;
      return {
        lat: location.lat,
        lng: location.lng,
      };
    }

    return null;
  } catch (error) {
    console.error("Geocoding error:", error);
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = calculateFeeSchema.parse(body);

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

    // Geocode the address
    const coordinates = await geocodeAddress(data.address);

    if (!coordinates) {
      return NextResponse.json(
        { error: "Unable to find location for the provided address" },
        { status: 400 }
      );
    }

    // Calculate delivery fee
    const businessCoordinates: Coordinates = {
      lat: BUSINESS_INFO.coordinates.lat,
      lng: BUSINESS_INFO.coordinates.lng,
    };

    const result = calculateDeliveryFeeFromCoordinates(
      businessCoordinates,
      coordinates,
      deliverySettings
    );

    return NextResponse.json({
      success: true,
      address: data.address,
      withinZone: result.withinZone,
      distance: result.distance,
      fee: result.fee,
      breakdown: result.breakdown,
      settings: deliverySettings,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.errors },
        { status: 400 }
      );
    }

    if (error instanceof Error && error.message.includes("API key")) {
      return NextResponse.json(
        { error: "Geocoding service not configured" },
        { status: 503 }
      );
    }

    console.error("Delivery fee calculation error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
