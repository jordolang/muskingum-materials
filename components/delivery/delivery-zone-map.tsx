"use client";

import { useEffect, useRef, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, MapPin } from "lucide-react";
import { BUSINESS_INFO } from "@/data/business";
import type { DeliverySettings } from "@/lib/delivery";

// Extend window for Google Maps callback
declare global {
  interface Window {
    initDeliveryMap?: () => void;
  }
}

const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "";
const BUSINESS_LOCATION = {
  lat: BUSINESS_INFO.coordinates.lat,
  lng: BUSINESS_INFO.coordinates.lng,
};

export function DeliveryZoneMap() {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const markerRef = useRef<google.maps.Marker | null>(null);
  const circleRef = useRef<google.maps.Circle | null>(null);

  const [loaded, setLoaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [settingsLoading, setSettingsLoading] = useState(true);
  const [deliverySettings, setDeliverySettings] = useState<DeliverySettings | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Fetch delivery settings
  useEffect(() => {
    async function fetchSettings() {
      try {
        const response = await fetch("/api/delivery/settings");
        const data = await response.json();

        if (data.success && data.settings) {
          setDeliverySettings(data.settings);
        } else {
          setError("Unable to load delivery settings");
        }
      } catch (err) {
        console.error("Error fetching delivery settings:", err);
        setError("Unable to load delivery settings");
      } finally {
        setSettingsLoading(false);
      }
    }

    fetchSettings();
  }, []);

  // Load Google Maps script
  useEffect(() => {
    if (!GOOGLE_MAPS_API_KEY) {
      setError("Google Maps API key not configured");
      setLoading(false);
      return;
    }

    if (typeof google !== "undefined" && google.maps) {
      setLoaded(true);
      return;
    }

    setLoading(true);

    window.initDeliveryMap = () => {
      setLoaded(true);
      setLoading(false);
    };

    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=geometry&callback=initDeliveryMap`;
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);

    return () => {
      delete window.initDeliveryMap;
    };
  }, []);

  // Initialize map once loaded
  useEffect(() => {
    if (!loaded || !mapContainerRef.current || mapRef.current || !deliverySettings) {
      return;
    }

    // Create map
    const map = new google.maps.Map(mapContainerRef.current, {
      center: BUSINESS_LOCATION,
      zoom: 10,
      mapTypeId: "roadmap",
      disableDefaultUI: false,
      zoomControl: true,
      fullscreenControl: true,
      mapTypeControl: true,
      streetViewControl: false,
    });

    mapRef.current = map;

    // Add business location marker
    const marker = new google.maps.Marker({
      position: BUSINESS_LOCATION,
      map: map,
      title: BUSINESS_INFO.name,
      icon: {
        path: google.maps.SymbolPath.CIRCLE,
        scale: 8,
        fillColor: "#15803d",
        fillOpacity: 1,
        strokeColor: "#ffffff",
        strokeWeight: 2,
      },
    });

    markerRef.current = marker;

    // Add info window for business marker
    const infoWindow = new google.maps.InfoWindow({
      content: `
        <div style="padding: 8px;">
          <h3 style="margin: 0 0 4px; font-weight: bold;">${BUSINESS_INFO.name}</h3>
          <p style="margin: 0; font-size: 14px;">${BUSINESS_INFO.address}</p>
          <p style="margin: 0; font-size: 14px;">${BUSINESS_INFO.city}, ${BUSINESS_INFO.state} ${BUSINESS_INFO.zip}</p>
        </div>
      `,
    });

    marker.addListener("click", () => {
      infoWindow.open(map, marker);
    });

    // Add delivery zone circle
    const radiusMeters = deliverySettings.zoneRadiusMiles * 1609.34; // Convert miles to meters

    const circle = new google.maps.Circle({
      strokeColor: "#15803d",
      strokeOpacity: 0.8,
      strokeWeight: 2,
      fillColor: "#15803d",
      fillOpacity: 0.15,
      map: map,
      center: BUSINESS_LOCATION,
      radius: radiusMeters,
    });

    circleRef.current = circle;

    // Fit map to show the entire circle
    const bounds = circle.getBounds();
    if (bounds) {
      map.fitBounds(bounds);
    }
  }, [loaded, deliverySettings]);

  if (error) {
    return (
      <Card className="w-full">
        <CardContent className="p-6">
          <div className="flex items-center justify-center text-red-600">
            <MapPin className="h-5 w-5 mr-2" />
            <p>{error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (loading || settingsLoading) {
    return (
      <Card className="w-full">
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-green-700 mr-2" />
            <p>Loading map...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardContent className="p-0">
        <div
          ref={mapContainerRef}
          className="w-full h-[500px] rounded-lg"
          style={{ minHeight: "500px" }}
        />
        {deliverySettings && (
          <div className="p-4 bg-green-50 border-t border-green-100">
            <div className="flex items-center text-sm text-green-800">
              <MapPin className="h-4 w-4 mr-2" />
              <span>
                Delivery available within <strong>{deliverySettings.zoneRadiusMiles} miles</strong> of {BUSINESS_INFO.city}
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
