"use client";

import { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, MapPin, DollarSign, AlertCircle, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const calculatorSchema = z.object({
  address: z.string().min(3, "Please enter a valid address"),
});

type CalculatorFormData = z.infer<typeof calculatorSchema>;

interface DeliveryFeeResult {
  success: boolean;
  address: string;
  withinZone: boolean;
  distance: number;
  fee: number;
  breakdown?: {
    baseFee: number;
    distanceFee: number;
  };
  settings?: {
    zoneRadiusMiles: number;
    baseFee: number;
    perMileRate: number;
  };
}

// Extend window for Google Maps
declare global {
  interface Window {
    initDeliveryCalculator?: () => void;
  }
}

const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "";

export function DeliveryFeeCalculator() {
  const [result, setResult] = useState<DeliveryFeeResult | null>(null);
  const [error, setError] = useState("");
  const [mapsLoaded, setMapsLoaded] = useState(false);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
  } = useForm<CalculatorFormData>({
    resolver: zodResolver(calculatorSchema),
  });

  // Load Google Maps Places API
  useEffect(() => {
    if (!GOOGLE_MAPS_API_KEY) {
      setError("Google Maps API key not configured");
      return;
    }

    if (typeof google !== "undefined" && google.maps && google.maps.places) {
      setMapsLoaded(true);
      return;
    }

    window.initDeliveryCalculator = () => {
      setMapsLoaded(true);
    };

    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places&callback=initDeliveryCalculator`;
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);

    return () => {
      delete window.initDeliveryCalculator;
    };
  }, []);

  // Initialize autocomplete when Maps API is loaded
  useEffect(() => {
    if (!mapsLoaded || !inputRef.current || autocompleteRef.current) {
      return;
    }

    const autocomplete = new google.maps.places.Autocomplete(inputRef.current, {
      types: ["address"],
      componentRestrictions: { country: "us" },
    });

    autocomplete.addListener("place_changed", () => {
      const place = autocomplete.getPlace();
      if (place.formatted_address) {
        setValue("address", place.formatted_address);
      }
    });

    autocompleteRef.current = autocomplete;
  }, [mapsLoaded, setValue]);

  async function onSubmit(data: CalculatorFormData) {
    setError("");
    setResult(null);

    try {
      const response = await fetch("/api/delivery/calculate-fee", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address: data.address }),
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.error || "Failed to calculate delivery fee");
      }

      setResult(responseData);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong. Please try again or call us at (740) 319-0183."
      );
    }
  }

  const { ref: formRef, ...registerProps } = register("address");

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center text-green-900">
          <DollarSign className="h-5 w-5 mr-2" />
          Delivery Fee Calculator
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-1 block" htmlFor="address">
              Delivery Address
            </label>
            <Input
              id="address"
              placeholder="Enter your delivery address"
              {...registerProps}
              ref={(e) => {
                formRef(e);
                inputRef.current = e;
              }}
              disabled={!mapsLoaded}
            />
            {errors.address && (
              <p className="text-xs text-destructive mt-1">{errors.address.message}</p>
            )}
            {!mapsLoaded && (
              <p className="text-xs text-muted-foreground mt-1">
                Loading address autocomplete...
              </p>
            )}
          </div>

          {error && (
            <div className="flex items-start p-3 bg-red-50 border border-red-200 rounded-md">
              <AlertCircle className="h-4 w-4 text-red-600 mr-2 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          <Button type="submit" disabled={isSubmitting || !mapsLoaded} className="w-full">
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Calculating...
              </>
            ) : (
              "Calculate Delivery Fee"
            )}
          </Button>
        </form>

        {result && (
          <div className="mt-6 pt-6 border-t">
            {result.withinZone ? (
              <div className="space-y-4">
                <div className="flex items-start p-3 bg-green-50 border border-green-200 rounded-md">
                  <CheckCircle className="h-5 w-5 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-green-900">
                      We deliver to your location!
                    </p>
                    <p className="text-xs text-green-700 mt-1">
                      <MapPin className="h-3 w-3 inline mr-1" />
                      {result.distance.toFixed(1)} miles from our location
                    </p>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">
                    Delivery Fee Breakdown
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Base Fee:</span>
                      <span className="font-medium">
                        ${result.breakdown?.baseFee.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">
                        Distance Fee ({result.distance.toFixed(1)} mi × $
                        {result.settings?.perMileRate.toFixed(2)}/mi):
                      </span>
                      <span className="font-medium">
                        ${result.breakdown?.distanceFee.toFixed(2)}
                      </span>
                    </div>
                    <div className="border-t pt-2 flex justify-between text-base">
                      <span className="font-semibold text-gray-900">Total Delivery Fee:</span>
                      <span className="font-bold text-green-700">
                        ${result.fee.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>

                <p className="text-xs text-muted-foreground">
                  This fee will be added to your order total at checkout. Actual delivery
                  fees may vary based on access conditions and materials ordered.
                </p>
              </div>
            ) : (
              <div className="flex items-start p-4 bg-amber-50 border border-amber-200 rounded-md">
                <AlertCircle className="h-5 w-5 text-amber-600 mr-3 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-amber-900 mb-1">
                    Outside Standard Delivery Zone
                  </p>
                  <p className="text-sm text-amber-800 mb-2">
                    Your location is {result.distance.toFixed(1)} miles away, outside our
                    standard {result.settings?.zoneRadiusMiles}-mile delivery zone.
                  </p>
                  <p className="text-sm text-amber-900">
                    <strong>Contact us for special delivery arrangements:</strong>
                  </p>
                  <p className="text-sm text-amber-800 mt-1">
                    📞 <a href="tel:7403190183" className="underline">(740) 319-0183</a>
                    <br />
                    📧 <a href="mailto:sales@muskingummaterials.com" className="underline">
                      sales@muskingummaterials.com
                    </a>
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
