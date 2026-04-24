"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin, Pencil, Undo2, Trash2, Loader2 } from "lucide-react";

interface PlannerMapProps {
  onAreaChange: (areaSqFt: number) => void;
}

// Extend window for Google Maps callback
declare global {
  interface Window {
    initPlannerMap?: () => void;
  }
}

const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "";
const US_CENTER = { lat: 39.8283, lng: -98.5795 };

interface PolygonData {
  polygon: google.maps.Polygon;
  label: google.maps.Marker;
  areaSqFt: number;
}

export function PlannerMap({ onAreaChange }: PlannerMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const drawingManagerRef = useRef<google.maps.drawing.DrawingManager | null>(null);
  const polygonsRef = useRef<PolygonData[]>([]);
  const selectedRef = useRef<number>(-1);
  const autocompleteInputRef = useRef<HTMLInputElement>(null);

  const [loaded, setLoaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [addressEntered, setAddressEntered] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const [polygonCount, setPolygonCount] = useState(0);

  // Calculate total area from all polygons
  const updateTotalArea = useCallback(() => {
    const total = polygonsRef.current.reduce((sum, p) => sum + p.areaSqFt, 0);
    onAreaChange(total);
  }, [onAreaChange]);

  // Update a polygon's label
  function updatePolygonLabel(data: PolygonData) {
    const path = data.polygon.getPath();
    if (!path || path.getLength() < 3) return;

    const area = google.maps.geometry.spherical.computeArea(path);
    const areaSqFt = Math.round(area * 10.7639);
    data.areaSqFt = areaSqFt;

    // Position label at polygon center
    const bounds = new google.maps.LatLngBounds();
    path.forEach((pt) => bounds.extend(pt));
    const center = bounds.getCenter();

    data.label.setPosition(center);
    data.label.setLabel({
      text: `${areaSqFt.toLocaleString()} ft²`,
      color: "#ffffff",
      fontSize: "13px",
      fontWeight: "bold",
    });
  }

  // Select a polygon (highlight it)
  function selectPolygon(index: number) {
    // Deselect previous
    if (selectedRef.current >= 0 && selectedRef.current < polygonsRef.current.length) {
      polygonsRef.current[selectedRef.current].polygon.setOptions({
        strokeColor: "#14532d",
        strokeWeight: 2,
      });
    }

    selectedRef.current = index;

    if (index >= 0 && index < polygonsRef.current.length) {
      polygonsRef.current[index].polygon.setOptions({
        strokeColor: "#EF4444",
        strokeWeight: 3,
      });
    }
  }



  // Undo last polygon
  const undoLast = useCallback(() => {
    if (polygonsRef.current.length === 0) return;

    const last = polygonsRef.current[polygonsRef.current.length - 1];
    last.polygon.setMap(null);
    last.label.setMap(null);
    polygonsRef.current.pop();

    if (selectedRef.current >= polygonsRef.current.length) {
      selectedRef.current = -1;
    }

    setPolygonCount(polygonsRef.current.length);
    updateTotalArea();
  }, [updateTotalArea]);

  // Clear all polygons
  const clearAll = useCallback(() => {
    for (const data of polygonsRef.current) {
      data.polygon.setMap(null);
      data.label.setMap(null);
    }
    polygonsRef.current = [];
    selectedRef.current = -1;
    setPolygonCount(0);
    onAreaChange(0);
  }, [onAreaChange]);

  // Start drawing mode
  function startDrawing() {
    if (!drawingManagerRef.current) return;
    drawingManagerRef.current.setDrawingMode(google.maps.drawing.OverlayType.POLYGON);
    setIsDrawing(true);
  }

  // Load Google Maps script
  useEffect(() => {
    if (!GOOGLE_MAPS_API_KEY) return;
    if (typeof google !== "undefined" && google.maps) {
      setLoaded(true);
      return;
    }

    setLoading(true);

    window.initPlannerMap = () => {
      setLoaded(true);
      setLoading(false);
    };

    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=drawing,geometry,places&callback=initPlannerMap`;
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);

    return () => {
      delete window.initPlannerMap;
    };
  }, []);

  // Initialize map once loaded
  useEffect(() => {
    if (!loaded || !mapContainerRef.current || mapRef.current) return;

    const map = new google.maps.Map(mapContainerRef.current, {
      center: US_CENTER,
      zoom: 5,
      mapTypeId: "satellite",
      tilt: 0,
      disableDefaultUI: true,
      zoomControl: true,
      fullscreenControl: true,
      mapTypeControl: false,
      streetViewControl: false,
    });

    mapRef.current = map;

    // Drawing Manager
    const drawingManager = new google.maps.drawing.DrawingManager({
      drawingMode: null,
      drawingControl: false,
      polygonOptions: {
        fillColor: "#15803d",
        fillOpacity: 0.3,
        strokeColor: "#14532d",
        strokeWeight: 2,
        editable: true,
        draggable: true,
      },
    });

    drawingManager.setMap(map);
    drawingManagerRef.current = drawingManager;

    // Handle new polygon drawn
    google.maps.event.addListener(
      drawingManager,
      "polygoncomplete",
      (polygon: google.maps.Polygon) => {
        drawingManager.setDrawingMode(null);
        setIsDrawing(false);

        const label = new google.maps.Marker({
          map,
          icon: {
            path: google.maps.SymbolPath.CIRCLE,
            scale: 0,
          },
          clickable: false,
        });

        const data: PolygonData = { polygon, label, areaSqFt: 0 };
        updatePolygonLabel(data);

        const idx = polygonsRef.current.length;
        polygonsRef.current.push(data);
        setPolygonCount(polygonsRef.current.length);
        updateTotalArea();

        // Click to select
        polygon.addListener("click", () => {
          selectPolygon(idx);
        });

        // Update on edit
        const path = polygon.getPath();
        const recalc = () => {
          updatePolygonLabel(data);
          updateTotalArea();
        };
        google.maps.event.addListener(path, "set_at", recalc);
        google.maps.event.addListener(path, "insert_at", recalc);
        google.maps.event.addListener(path, "remove_at", recalc);
      },
    );

    // Keyboard shortcuts
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Delete" || e.key === "Backspace") {
        if (
          document.activeElement?.tagName === "INPUT" ||
          document.activeElement?.tagName === "SELECT"
        )
          return;
        e.preventDefault();
        const idx = selectedRef.current;
        if (idx >= 0 && idx < polygonsRef.current.length) {
          const d = polygonsRef.current[idx];
          d.polygon.setMap(null);
          d.label.setMap(null);
          polygonsRef.current.splice(idx, 1);
          selectedRef.current = -1;
          setPolygonCount(polygonsRef.current.length);
          // Recalc total area
          const total = polygonsRef.current.reduce((s, p) => s + p.areaSqFt, 0);
          onAreaChange(total);
        }
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "z") {
        e.preventDefault();
        if (polygonsRef.current.length > 0) {
          const last = polygonsRef.current[polygonsRef.current.length - 1];
          last.polygon.setMap(null);
          last.label.setMap(null);
          polygonsRef.current.pop();
          if (selectedRef.current >= polygonsRef.current.length) {
            selectedRef.current = -1;
          }
          setPolygonCount(polygonsRef.current.length);
          const total = polygonsRef.current.reduce((s, p) => s + p.areaSqFt, 0);
          onAreaChange(total);
        }
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [loaded, onAreaChange, updateTotalArea]);

  // Initialize Places autocomplete
  useEffect(() => {
    if (!loaded || !autocompleteInputRef.current || !mapRef.current) return;

    const autocomplete = new google.maps.places.Autocomplete(
      autocompleteInputRef.current,
      {
        types: ["address"],
        componentRestrictions: { country: "us" },
        fields: ["formatted_address", "geometry"],
      },
    );

    autocomplete.addListener("place_changed", () => {
      const place = autocomplete.getPlace();
      if (!place.geometry?.location || !mapRef.current) return;

      mapRef.current.panTo(place.geometry.location);
      mapRef.current.setZoom(20);
      setAddressEntered(true);
    });
  }, [loaded]);

  if (!GOOGLE_MAPS_API_KEY) {
    return (
      <Card className="h-full flex items-center justify-center min-h-[500px]">
        <CardContent className="text-center">
          <MapPin className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">
            Google Maps API Key Required
          </h3>
          <p className="text-sm text-muted-foreground">
            Set <code>NEXT_PUBLIC_GOOGLE_MAPS_API_KEY</code> in your environment
            to enable the Gravel Planner.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full overflow-hidden">
      <div className="relative h-full flex flex-col">
        {/* Address Bar */}
        <div className="p-3 border-b bg-background flex items-center gap-2">
          <MapPin className="h-4 w-4 text-muted-foreground shrink-0" />
          <Input
            ref={autocompleteInputRef}
            type="text"
            placeholder="Enter your property address..."
            className="flex-1"
          />
        </div>

        {/* Toolbar */}
        {addressEntered && (
          <div className="absolute top-16 left-3 z-10 flex gap-1.5">
            <Button
              size="sm"
              variant={isDrawing ? "default" : "secondary"}
              onClick={startDrawing}
              className="gap-1.5 shadow-md"
            >
              <Pencil className="h-3.5 w-3.5" />
              Draw Area
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={undoLast}
              disabled={polygonCount === 0}
              className="gap-1.5 shadow-md"
            >
              <Undo2 className="h-3.5 w-3.5" />
              Undo
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={clearAll}
              disabled={polygonCount === 0}
              className="gap-1.5 shadow-md"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Clear
            </Button>
          </div>
        )}

        {/* Map Container */}
        <div ref={mapContainerRef} className="flex-1 min-h-[450px] lg:min-h-[550px]">
          {loading && (
            <div className="h-full flex items-center justify-center bg-muted/30">
              <div className="text-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">
                  Loading map...
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Overlay when no address entered */}
        {loaded && !addressEntered && (
          <div className="absolute inset-0 top-[52px] flex items-center justify-center bg-black/30 z-[5]">
            <div className="bg-background rounded-lg p-6 text-center shadow-lg max-w-sm mx-4">
              <MapPin className="h-8 w-8 text-primary mx-auto mb-3" />
              <h3 className="font-semibold mb-1">
                Enter your address to get started
              </h3>
              <p className="text-sm text-muted-foreground">
                Type your property address above to view the satellite map and
                begin drawing your project area.
              </p>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
