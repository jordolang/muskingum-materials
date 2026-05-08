"use client";

import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import {
  MapPin,
  Pencil,
  Undo2,
  Trash2,
  Loader2,
  Ruler,
  LayoutGrid,
  Map as MapIcon,
  Truck,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

declare global {
  interface Window {
    initEstimatorMap?: () => void;
  }
}

const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "";
const US_CENTER = { lat: 39.8283, lng: -98.5795 };

const DEPTH_OPTIONS = [
  { label: '2" — Light coverage', value: 2 },
  { label: '3" — Walking paths', value: 3 },
  { label: '4" — Standard driveway', value: 4 },
  { label: '5" — Heavy traffic', value: 5 },
  { label: '6" — Commercial grade', value: 6 },
] as const;

const PROJECT_PRESETS = [
  { name: "Single Car Driveway", length: 20, width: 10, depth: 4, icon: "🚗" },
  { name: "Double Car Driveway", length: 20, width: 20, depth: 4, icon: "🚙" },
  { name: "Long Driveway", length: 50, width: 12, depth: 4, icon: "🛤️" },
  { name: "Garden Path", length: 20, width: 3, depth: 3, icon: "🌿" },
  { name: "Patio Area", length: 12, width: 12, depth: 4, icon: "🏡" },
  { name: "Parking Pad", length: 10, width: 10, depth: 4, icon: "🅿️" },
] as const;

type EstimatorMode = "map" | "dimensions" | "preset";

interface PolygonData {
  polygon: google.maps.Polygon;
  label: google.maps.Marker;
  areaSqFt: number;
}

interface EstimateResult {
  cubicFeet: number;
  cubicYards: number;
  tons: number;
  truckloads: number;
  source: "map" | "dimensions";
}

interface ProjectEstimatorProps {
  onAddressChange: (address: string) => void;
  onEstimateChange: (estimate: EstimateResult | null) => void;
}

function calculateFromArea(areaSqFt: number, depthIn: number): EstimateResult {
  const cubicFeet = areaSqFt * (depthIn / 12);
  const cubicYards = cubicFeet / 27;
  const tons = cubicYards * 1.4;
  const truckloads = Math.max(1, Math.ceil(tons / 20));
  return { cubicFeet, cubicYards, tons, truckloads, source: "map" };
}

function calculateFromDimensions(
  lengthFt: number,
  widthFt: number,
  depthIn: number,
): EstimateResult {
  return {
    ...calculateFromArea(lengthFt * widthFt, depthIn),
    source: "dimensions",
  };
}

export function ProjectEstimator({
  onAddressChange,
  onEstimateChange,
}: ProjectEstimatorProps) {
  // Address state
  const [address, setAddress] = useState("");
  const addressInputRef = useRef<HTMLInputElement | null>(null);

  // Mode tabs
  const [mode, setMode] = useState<EstimatorMode>("preset");
  const [depth, setDepth] = useState(4);

  // Map state
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const drawingManagerRef = useRef<google.maps.drawing.DrawingManager | null>(null);
  const polygonsRef = useRef<PolygonData[]>([]);
  const selectedRef = useRef<number>(-1);

  const [mapsScriptLoaded, setMapsScriptLoaded] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const [polygonCount, setPolygonCount] = useState(0);
  const [drawnAreaSqFt, setDrawnAreaSqFt] = useState(0);

  // Dimensions state
  const [length, setLength] = useState("");
  const [width, setWidth] = useState("");

  // Compute the active estimate
  const estimate = useMemo<EstimateResult | null>(() => {
    if (mode === "map" && drawnAreaSqFt > 0) {
      return calculateFromArea(drawnAreaSqFt, depth);
    }
    if (mode === "dimensions" || mode === "preset") {
      const l = parseFloat(length);
      const w = parseFloat(width);
      if (l > 0 && w > 0 && depth > 0) {
        return calculateFromDimensions(l, w, depth);
      }
    }
    return null;
  }, [mode, drawnAreaSqFt, depth, length, width]);

  // Bubble estimate up
  useEffect(() => {
    onEstimateChange(estimate);
  }, [estimate, onEstimateChange]);

  // Bubble address up
  useEffect(() => {
    onAddressChange(address);
  }, [address, onAddressChange]);

  // Apply a project preset to dimension fields
  function applyPreset(preset: (typeof PROJECT_PRESETS)[number]) {
    setLength(String(preset.length));
    setWidth(String(preset.width));
    setDepth(preset.depth);
    setMode("preset");
  }

  // ---------- Map: load script ----------
  // NOTE: deliberately runs once with `[]` deps. The global `initEstimatorMap`
  // callback must survive React re-renders until Google's bootstrap fetches
  // and invokes it; reactive deps + cleanup would delete the callback before
  // the script fires (TypeError, map never loads in production).
  useEffect(() => {
    if (!GOOGLE_MAPS_API_KEY) return;
    if (typeof google !== "undefined" && google.maps) {
      setMapsScriptLoaded(true);
      return;
    }

    window.initEstimatorMap = () => {
      setMapsScriptLoaded(true);
    };

    const existing = document.querySelector<HTMLScriptElement>(
      'script[data-estimator-maps="true"]',
    );
    if (existing) {
      // Another instance already added the script; wait for the global callback.
      return;
    }

    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=drawing,geometry,places&callback=initEstimatorMap`;
    script.async = true;
    script.defer = true;
    script.dataset.estimatorMaps = "true";
    document.head.appendChild(script);
    // Intentionally no cleanup that deletes window.initEstimatorMap —
    // the script is loaded asynchronously and needs the global to remain.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---------- Map: address autocomplete (always wired so address can flow even before opening map) ----------
  useEffect(() => {
    if (!mapsScriptLoaded || !addressInputRef.current) return;

    const ac = new google.maps.places.Autocomplete(addressInputRef.current, {
      types: ["address"],
      componentRestrictions: { country: "us" },
      fields: ["formatted_address", "geometry"],
    });

    const listener = ac.addListener("place_changed", () => {
      const place = ac.getPlace();
      if (place.formatted_address) {
        setAddress(place.formatted_address);
      }
      if (place.geometry?.location && mapRef.current) {
        mapRef.current.panTo(place.geometry.location);
        mapRef.current.setZoom(20);
      }
    });

    return () => {
      google.maps.event.removeListener(listener);
    };
  }, [mapsScriptLoaded]);

  // ---------- Map: helpers ----------
  const recalcDrawnArea = useCallback(() => {
    const total = polygonsRef.current.reduce((sum, p) => sum + p.areaSqFt, 0);
    setDrawnAreaSqFt(total);
  }, []);

  function updatePolygonLabel(data: PolygonData) {
    const path = data.polygon.getPath();
    if (!path || path.getLength() < 3) return;
    const area = google.maps.geometry.spherical.computeArea(path);
    const areaSqFt = Math.round(area * 10.7639);
    data.areaSqFt = areaSqFt;

    const bounds = new google.maps.LatLngBounds();
    path.forEach((pt) => bounds.extend(pt));
    data.label.setPosition(bounds.getCenter());
    data.label.setLabel({
      text: `${areaSqFt.toLocaleString()} ft²`,
      color: "#ffffff",
      fontSize: "13px",
      fontWeight: "bold",
    });
  }

  function startDrawing() {
    if (!drawingManagerRef.current) return;
    drawingManagerRef.current.setDrawingMode(
      google.maps.drawing.OverlayType.POLYGON,
    );
    setIsDrawing(true);
  }

  const undoLast = useCallback(() => {
    if (polygonsRef.current.length === 0) return;
    const last = polygonsRef.current.pop();
    if (last) {
      last.polygon.setMap(null);
      last.label.setMap(null);
    }
    if (selectedRef.current >= polygonsRef.current.length) {
      selectedRef.current = -1;
    }
    setPolygonCount(polygonsRef.current.length);
    recalcDrawnArea();
  }, [recalcDrawnArea]);

  const clearAll = useCallback(() => {
    for (const data of polygonsRef.current) {
      data.polygon.setMap(null);
      data.label.setMap(null);
    }
    polygonsRef.current = [];
    selectedRef.current = -1;
    setPolygonCount(0);
    setDrawnAreaSqFt(0);
  }, []);

  // ---------- Map: clear cached ref / polygons when leaving map mode so we re-init cleanly on return ----------
  useEffect(() => {
    if (mode !== "map") {
      mapRef.current = null;
      drawingManagerRef.current = null;
      polygonsRef.current = [];
      selectedRef.current = -1;
      setPolygonCount(0);
      setDrawnAreaSqFt(0);
      setIsDrawing(false);
    }
  }, [mode]);

  // ---------- Map: instantiate when in map mode ----------
  useEffect(() => {
    if (mode !== "map") return;
    if (!mapsScriptLoaded || !mapContainerRef.current || mapRef.current) return;

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

    const drawingManager = new google.maps.drawing.DrawingManager({
      drawingMode: null,
      drawingControl: false,
      polygonOptions: {
        fillColor: "#f59e0b",
        fillOpacity: 0.3,
        strokeColor: "#92400e",
        strokeWeight: 2,
        editable: true,
        draggable: true,
      },
    });
    drawingManager.setMap(map);
    drawingManagerRef.current = drawingManager;

    google.maps.event.addListener(
      drawingManager,
      "polygoncomplete",
      (polygon: google.maps.Polygon) => {
        drawingManager.setDrawingMode(null);
        setIsDrawing(false);

        const label = new google.maps.Marker({
          map,
          icon: { path: google.maps.SymbolPath.CIRCLE, scale: 0 },
          clickable: false,
        });

        const data: PolygonData = { polygon, label, areaSqFt: 0 };
        updatePolygonLabel(data);

        const idx = polygonsRef.current.length;
        polygonsRef.current.push(data);
        setPolygonCount(polygonsRef.current.length);
        recalcDrawnArea();

        polygon.addListener("click", () => {
          selectedRef.current = idx;
        });

        const path = polygon.getPath();
        const recalc = () => {
          updatePolygonLabel(data);
          recalcDrawnArea();
        };
        google.maps.event.addListener(path, "set_at", recalc);
        google.maps.event.addListener(path, "insert_at", recalc);
        google.maps.event.addListener(path, "remove_at", recalc);
      },
    );

  }, [mode, mapsScriptLoaded, recalcDrawnArea]);

  return (
    <div className="space-y-6 p-5">
      {/* Address */}
      <div>
        <label
          htmlFor="estimator-address"
          className="text-sm font-semibold mb-1.5 block flex items-center gap-1.5"
        >
          <MapPin className="h-4 w-4 text-amber-600" />
          Project Address
          <span className="text-destructive">*</span>
        </label>
        <Input
          id="estimator-address"
          ref={addressInputRef}
          type="text"
          placeholder="Start typing your project address..."
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          className="h-11"
          autoComplete="off"
        />
        <p className="text-xs text-muted-foreground mt-1.5">
          We use your address to map your project, calculate delivery distance,
          and unlock the next steps.
        </p>
      </div>

      {/* Mode selector — animated reveal once address is entered */}
      <div
        className={cn(
          "transition-all duration-500 overflow-hidden",
          address.length > 0
            ? "opacity-100 max-h-[3000px]"
            : "opacity-0 max-h-0 pointer-events-none",
        )}
      >
        <div className="space-y-5 pt-1 animate-in fade-in slide-in-from-top-2 duration-500">
          <div>
            <p className="text-sm font-semibold mb-2 flex items-center gap-1.5">
              <Sparkles className="h-4 w-4 text-amber-600" />
              How would you like to estimate?
            </p>
            <div className="grid grid-cols-3 gap-2">
              <ModeButton
                active={mode === "preset"}
                onClick={() => setMode("preset")}
                icon={<LayoutGrid className="h-4 w-4" />}
                label="Common project"
              />
              <ModeButton
                active={mode === "dimensions"}
                onClick={() => setMode("dimensions")}
                icon={<Ruler className="h-4 w-4" />}
                label="Enter dimensions"
              />
              <ModeButton
                active={mode === "map"}
                onClick={() => setMode("map")}
                icon={<MapIcon className="h-4 w-4" />}
                label="Draw on map"
                disabled={!GOOGLE_MAPS_API_KEY}
              />
            </div>
            {mode === "map" && !GOOGLE_MAPS_API_KEY && (
              <p className="text-xs text-amber-700 mt-2">
                Map drawing is unavailable — Google Maps key not configured.
              </p>
            )}
          </div>

          {/* Depth (always available once a mode is selected) */}
          <div>
            <label
              htmlFor="estimator-depth"
              className="text-xs font-medium text-muted-foreground block mb-1"
            >
              Depth of material
            </label>
            <Select
              value={String(depth)}
              onValueChange={(val) => setDepth(Number(val))}
            >
              <SelectTrigger id="estimator-depth" className="h-10">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DEPTH_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={String(opt.value)}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* PRESET MODE */}
          {mode === "preset" && (
            <div className="animate-in fade-in slide-in-from-top-1 duration-300">
              <p className="text-sm font-medium mb-2.5">
                Pick a project that matches yours
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {PROJECT_PRESETS.map((preset) => {
                  const isSelected =
                    String(preset.length) === length &&
                    String(preset.width) === width &&
                    preset.depth === depth;
                  return (
                    <button
                      key={preset.name}
                      type="button"
                      onClick={() => applyPreset(preset)}
                      className={cn(
                        "h-auto p-3 rounded-lg border-2 text-left transition-all hover:border-amber-500 hover:bg-amber-50",
                        isSelected
                          ? "border-amber-500 bg-amber-50 shadow-sm"
                          : "border-border bg-background",
                      )}
                    >
                      <span className="text-xl">{preset.icon}</span>
                      <p className="font-semibold mt-1.5 text-sm leading-tight">
                        {preset.name}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {preset.length}&apos; × {preset.width}&apos; ×{" "}
                        {preset.depth}&quot;
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* DIMENSIONS MODE */}
          {mode === "dimensions" && (
            <div className="animate-in fade-in slide-in-from-top-1 duration-300">
              <p className="text-sm font-medium mb-2.5">
                Enter your project dimensions
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label
                    htmlFor="estimator-length"
                    className="text-xs font-medium text-muted-foreground block mb-1"
                  >
                    Length (feet)
                  </label>
                  <Input
                    id="estimator-length"
                    type="number"
                    placeholder="20"
                    value={length}
                    onChange={(e) => setLength(e.target.value)}
                    min="0"
                    className="h-10"
                  />
                </div>
                <div>
                  <label
                    htmlFor="estimator-width"
                    className="text-xs font-medium text-muted-foreground block mb-1"
                  >
                    Width (feet)
                  </label>
                  <Input
                    id="estimator-width"
                    type="number"
                    placeholder="10"
                    value={width}
                    onChange={(e) => setWidth(e.target.value)}
                    min="0"
                    className="h-10"
                  />
                </div>
              </div>
            </div>
          )}

          {/* MAP MODE */}
          {mode === "map" && GOOGLE_MAPS_API_KEY && (
            <div className="animate-in fade-in slide-in-from-top-1 duration-300">
              <p className="text-sm font-medium mb-2.5">
                Draw your project area on the satellite map
              </p>
              <div className="relative rounded-lg border bg-muted/30 overflow-hidden">
                <div className="absolute top-3 left-3 z-10 flex flex-wrap gap-1.5">
                  <Button
                    size="sm"
                    type="button"
                    variant={isDrawing ? "default" : "secondary"}
                    onClick={startDrawing}
                    disabled={!mapsScriptLoaded}
                    className="gap-1.5 shadow-md"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    {isDrawing ? "Click to add points…" : "Draw area"}
                  </Button>
                  <Button
                    size="sm"
                    type="button"
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
                    type="button"
                    variant="secondary"
                    onClick={clearAll}
                    disabled={polygonCount === 0}
                    className="gap-1.5 shadow-md"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Clear
                  </Button>
                </div>

                <div
                  ref={mapContainerRef}
                  className="h-[360px] w-full bg-stone-200"
                />

                {!mapsScriptLoaded && (
                  <div className="absolute inset-0 flex items-center justify-center bg-stone-200/80">
                    <div className="text-center">
                      <Loader2 className="h-6 w-6 animate-spin text-amber-600 mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">
                        Loading satellite map…
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <p className="text-xs text-muted-foreground mt-2">
                Click the map to drop points around the perimeter of your
                project. Double-click to close the shape. You can draw multiple
                areas.
              </p>
            </div>
          )}

          {/* RESULT */}
          {estimate ? (
            <div
              key={`${mode}-${estimate.tons.toFixed(1)}`}
              className="rounded-xl border border-amber-300 bg-gradient-to-br from-amber-50 to-orange-50 p-5 animate-in fade-in zoom-in-95 duration-500"
            >
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-bold text-sm uppercase tracking-wide text-amber-900">
                  Recommended Material
                </h4>
                <Badge variant="secondary" className="text-[10px] uppercase">
                  Rough estimate
                </Badge>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <ResultStat
                  value={estimate.tons.toFixed(1)}
                  label="Tons"
                  primary
                />
                <ResultStat
                  value={estimate.cubicYards.toFixed(1)}
                  label="Cubic Yards"
                />
                <ResultStat
                  value={estimate.cubicFeet.toFixed(0)}
                  label="Cubic Feet"
                />
                <ResultStat
                  value={String(estimate.truckloads)}
                  label={`Truckload${estimate.truckloads !== 1 ? "s" : ""}`}
                  icon={<Truck className="h-4 w-4 text-amber-700" />}
                />
              </div>

              <div className="mt-4 pt-3 border-t border-amber-200/70 text-xs text-amber-900/80 space-y-1">
                <p>
                  <strong>Heads up:</strong> this is informational only — it
                  isn&apos;t added to your order. Use it as a guide when
                  selecting materials below. Order ~5–10% extra for compaction
                  and waste.
                </p>
                <p className="text-[11px] opacity-80">
                  Based on ~1.4 tons / cubic yard average aggregate density and
                  20-ton trucks.
                </p>
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-dashed bg-muted/30 p-5 text-center text-sm text-muted-foreground">
              {mode === "map"
                ? "Draw an area on the map to see your estimate."
                : "Pick a project or enter dimensions to see your estimate."}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

interface ModeButtonProps {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  disabled?: boolean;
}

function ModeButton({ active, onClick, icon, label, disabled }: ModeButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "flex flex-col items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg border-2 text-xs font-medium transition-all",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        active
          ? "border-amber-500 bg-amber-50 text-amber-900 shadow-sm"
          : "border-border bg-background hover:border-amber-300 hover:bg-amber-50/50",
      )}
    >
      <span className={cn(active ? "text-amber-700" : "text-muted-foreground")}>
        {icon}
      </span>
      {label}
    </button>
  );
}

interface ResultStatProps {
  value: string;
  label: string;
  primary?: boolean;
  icon?: React.ReactNode;
}

function ResultStat({ value, label, primary, icon }: ResultStatProps) {
  return (
    <div className="text-center">
      <div className="flex items-center justify-center gap-1">
        {icon}
        <p
          className={cn(
            "text-2xl font-bold tabular-nums",
            primary ? "text-amber-700" : "text-stone-800",
          )}
        >
          {value}
        </p>
      </div>
      <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-semibold mt-0.5">
        {label}
      </p>
    </div>
  );
}

export type { EstimateResult };
