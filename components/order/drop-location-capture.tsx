"use client";

import { useEffect, useRef, useState } from "react";
import { UseFormRegister, UseFormWatch, UseFormSetValue, FieldErrors } from "react-hook-form";
import { MapPin, Loader2 } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { ImageUpload } from "@/components/ui/image-upload";
import { Input } from "@/components/ui/input";

// Extend window for Google Maps callback
declare global {
  interface Window {
    initDropLocationMap?: () => void;
  }
}

const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "";

export interface DropLocationData {
  notes?: string;
  photoUrl?: string;
  lat?: number;
  lng?: number;
}

interface DropLocationCaptureProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  register: UseFormRegister<any>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  watch: UseFormWatch<any>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  setValue: UseFormSetValue<any>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  errors: FieldErrors<any>;
  deliveryAddress?: string;
}

export function DropLocationCapture({
  register,
  watch,
  setValue,
  deliveryAddress,
}: DropLocationCaptureProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const markerRef = useRef<google.maps.Marker | null>(null);

  const [loaded, setLoaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);
  const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number } | null>(null);

  const photoUrl = watch("dropLocation.photoUrl");
  const lat = watch("dropLocation.lat");
  const lng = watch("dropLocation.lng");

  // Geocode delivery address to center map
  useEffect(() => {
    if (!deliveryAddress || !GOOGLE_MAPS_API_KEY) return;

    const geocodeAddress = async () => {
      try {
        const geocoder = new google.maps.Geocoder();
        const result = await geocoder.geocode({ address: deliveryAddress });

        if (result.results[0]?.geometry?.location) {
          const location = result.results[0].geometry.location;
          setMapCenter({ lat: location.lat(), lng: location.lng() });
        }
      } catch {
        // Silently fail geocoding - map will use default center
      }
    };

    if (typeof google !== "undefined" && google.maps) {
      geocodeAddress();
    }
  }, [deliveryAddress]);

  // Load Google Maps script
  useEffect(() => {
    if (!GOOGLE_MAPS_API_KEY) {
      setMapError("Google Maps API key not configured");
      setLoading(false);
      return;
    }

    if (typeof google !== "undefined" && google.maps) {
      setLoaded(true);
      return;
    }

    setLoading(true);

    window.initDropLocationMap = () => {
      setLoaded(true);
      setLoading(false);
    };

    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=geometry&callback=initDropLocationMap`;
    script.async = true;
    script.defer = true;
    script.onerror = () => {
      setMapError("Failed to load Google Maps");
      setLoading(false);
    };
    document.head.appendChild(script);

    return () => {
      delete window.initDropLocationMap;
    };
  }, []);

  // Initialize map once loaded
  useEffect(() => {
    if (!loaded || !mapContainerRef.current || mapRef.current) {
      return;
    }

    // Use geocoded center if available, otherwise default center
    const center = mapCenter || { lat: 39.9612, lng: -82.9988 }; // Columbus, OH default

    // Create map
    const map = new google.maps.Map(mapContainerRef.current, {
      center,
      zoom: mapCenter ? 17 : 10,
      mapTypeId: "hybrid",
      disableDefaultUI: false,
      zoomControl: true,
      fullscreenControl: true,
      mapTypeControl: true,
      streetViewControl: true,
    });

    mapRef.current = map;

    // Add click listener to place marker
    map.addListener("click", (event: google.maps.MapMouseEvent) => {
      if (event.latLng) {
        const clickedLat = event.latLng.lat();
        const clickedLng = event.latLng.lng();

        // Update marker position
        if (markerRef.current) {
          markerRef.current.setPosition(event.latLng);
        } else {
          const marker = new google.maps.Marker({
            position: event.latLng,
            map: map,
            title: "Drop Location",
            draggable: true,
            icon: {
              path: google.maps.SymbolPath.CIRCLE,
              scale: 10,
              fillColor: "#ef4444",
              fillOpacity: 1,
              strokeColor: "#ffffff",
              strokeWeight: 3,
            },
          });

          markerRef.current = marker;

          // Update form when marker is dragged
          marker.addListener("dragend", () => {
            const position = marker.getPosition();
            if (position) {
              setValue("dropLocation.lat", position.lat());
              setValue("dropLocation.lng", position.lng());
            }
          });
        }

        // Update form values
        setValue("dropLocation.lat", clickedLat);
        setValue("dropLocation.lng", clickedLng);
      }
    });

    // If there's already a lat/lng in the form, place marker
    if (lat && lng) {
      const position = { lat, lng };
      const marker = new google.maps.Marker({
        position,
        map: map,
        title: "Drop Location",
        draggable: true,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 10,
          fillColor: "#ef4444",
          fillOpacity: 1,
          strokeColor: "#ffffff",
          strokeWeight: 3,
        },
      });

      markerRef.current = marker;
      map.setCenter(position);

      marker.addListener("dragend", () => {
        const markerPosition = marker.getPosition();
        if (markerPosition) {
          setValue("dropLocation.lat", markerPosition.lat());
          setValue("dropLocation.lng", markerPosition.lng());
        }
      });
    }
  }, [loaded, mapCenter, setValue, lat, lng]);

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-top-1 duration-300">
      <div className="flex items-start gap-2">
        <MapPin className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
        <div>
          <h4 className="font-semibold text-foreground">Drop Location</h4>
          <p className="text-sm text-muted-foreground">
            Show us exactly where you&apos;d like the material delivered. This helps our driver
            place it in the right spot.
          </p>
        </div>
      </div>

      <div className="space-y-3">
        <div>
          <label
            htmlFor="drop-location-notes"
            className="text-sm font-medium mb-1 block"
          >
            Drop Location Instructions
          </label>
          <Textarea
            id="drop-location-notes"
            placeholder="e.g., Drop in driveway near garage door, Place on the right side of the house, Pile at edge of lawn near street..."
            rows={3}
            {...register("dropLocation.notes")}
          />
          <p className="text-xs text-muted-foreground mt-1">
            Be as specific as possible to ensure accurate placement
          </p>
        </div>

        <div>
          <label className="text-sm font-medium mb-1 block">
            Photo of Drop Location (Optional)
          </label>
          <ImageUpload
            value={photoUrl}
            onChange={(base64) => setValue("dropLocation.photoUrl", base64)}
            placeholder="Upload a photo showing where to drop the material"
          />
          <p className="text-xs text-muted-foreground mt-1">
            A photo of the exact spot helps our driver get it right the first time
          </p>
        </div>

        <div>
          <label className="text-sm font-medium mb-2 block">
            Pin Drop Location on Map (Optional)
          </label>

          {loading && (
            <div className="flex items-center justify-center min-h-[300px] rounded-lg border-2 border-dashed border-input bg-muted/50">
              <div className="flex flex-col items-center gap-2">
                <Loader2 className="h-6 w-6 animate-spin text-green-700" />
                <p className="text-sm text-muted-foreground">Loading map...</p>
              </div>
            </div>
          )}

          {mapError && (
            <div className="rounded-lg border-2 border-dashed border-input bg-muted/50 p-6">
              <p className="text-sm text-muted-foreground mb-3">{mapError}</p>
              <div className="space-y-2">
                <p className="text-sm font-medium">Enter coordinates manually:</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label
                      htmlFor="drop-location-lat"
                      className="text-xs text-muted-foreground mb-1 block"
                    >
                      Latitude
                    </label>
                    <Input
                      id="drop-location-lat"
                      type="number"
                      step="any"
                      placeholder="39.9612"
                      {...register("dropLocation.lat", { valueAsNumber: true })}
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="drop-location-lng"
                      className="text-xs text-muted-foreground mb-1 block"
                    >
                      Longitude
                    </label>
                    <Input
                      id="drop-location-lng"
                      type="number"
                      step="any"
                      placeholder="-82.9988"
                      {...register("dropLocation.lng", { valueAsNumber: true })}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {!loading && !mapError && (
            <div className="space-y-2">
              <div
                ref={mapContainerRef}
                className="w-full h-[300px] rounded-lg border-2 border-input"
              />
              <p className="text-xs text-muted-foreground">
                Click on the map to drop a pin at your desired drop location. You can drag
                the pin to adjust it.
              </p>
              {lat && lng && (
                <div className="text-xs text-muted-foreground">
                  Selected coordinates: {lat.toFixed(6)}, {lng.toFixed(6)}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
