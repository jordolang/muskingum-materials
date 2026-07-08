"use client";

import { useCallback, useRef, useState } from "react";

/**
 * Click-to-draw polygon drawing for the Google Maps JavaScript API.
 *
 * This replaces `google.maps.drawing.DrawingManager`, which Google removed in
 * Maps JavaScript API v3.65 (see https://developers.google.com/maps/deprecations).
 * The user clicks to drop vertices; the shape is closed by clicking the first
 * (highlighted) vertex or calling `finish()`. On completion an editable,
 * draggable `google.maps.Polygon` is created and handed to `onComplete`, which
 * is responsible for measuring/labelling it and wiring up edit listeners.
 *
 * All in-progress geometry lives in refs, so the single map `click` listener
 * registered by `bindMap` never goes stale across renders.
 */

export interface PolygonStyle {
  fillColor: string;
  fillOpacity: number;
  strokeColor: string;
  strokeWeight: number;
}

interface UsePolygonDrawOptions {
  /** Appearance shared by the in-progress sketch and the finished polygon. */
  style: PolygonStyle;
  /** Called with the finished, editable polygon once the shape is closed. */
  onComplete: (polygon: google.maps.Polygon) => void;
}

export interface PolygonDrawController {
  /** Whether the user is currently placing vertices. */
  isDrawing: boolean;
  /** Number of vertices placed in the in-progress sketch. */
  vertexCount: number;
  /** Register the map (call once, e.g. in the map-init effect). */
  bindMap: (map: google.maps.Map) => void;
  /** Enter drawing mode. */
  begin: () => void;
  /** Close the sketch into a finished polygon (needs 3+ vertices). */
  finish: () => void;
  /** Discard the in-progress sketch without keeping it. */
  cancel: () => void;
}

export function usePolygonDraw({
  style,
  onComplete,
}: UsePolygonDrawOptions): PolygonDrawController {
  const mapRef = useRef<google.maps.Map | null>(null);
  const drawingRef = useRef(false);
  const pathRef = useRef<google.maps.LatLng[]>([]);
  const draftPolygonRef = useRef<google.maps.Polygon | null>(null);
  const vertexMarkersRef = useRef<google.maps.Marker[]>([]);
  const clickListenerRef = useRef<google.maps.MapsEventListener | null>(null);

  // Keep the latest style/callback without re-binding the map click listener.
  const styleRef = useRef(style);
  styleRef.current = style;
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  const [isDrawing, setIsDrawing] = useState(false);
  const [vertexCount, setVertexCount] = useState(0);

  const clearDraft = useCallback(() => {
    draftPolygonRef.current?.setMap(null);
    draftPolygonRef.current = null;
    for (const marker of vertexMarkersRef.current) marker.setMap(null);
    vertexMarkersRef.current = [];
    pathRef.current = [];
    setVertexCount(0);
  }, []);

  const finish = useCallback(() => {
    if (!drawingRef.current || !mapRef.current) return;
    const path = pathRef.current.slice();
    drawingRef.current = false;
    setIsDrawing(false);
    clearDraft();
    // A polygon needs at least three points to enclose any area.
    if (path.length < 3) return;

    const polygon = new google.maps.Polygon({
      map: mapRef.current,
      paths: path,
      editable: true,
      draggable: true,
      ...styleRef.current,
    });
    onCompleteRef.current(polygon);
  }, [clearDraft]);

  const appendVertex = useCallback(
    (latLng: google.maps.LatLng) => {
      if (!mapRef.current) return;
      pathRef.current.push(latLng);
      draftPolygonRef.current?.setPath(pathRef.current);

      // The first vertex is highlighted and clickable so it can close the loop.
      const isFirst = vertexMarkersRef.current.length === 0;
      const marker = new google.maps.Marker({
        map: mapRef.current,
        position: latLng,
        clickable: isFirst,
        zIndex: 2,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: isFirst ? 6 : 4,
          fillColor: isFirst ? "#EF4444" : "#ffffff",
          fillOpacity: 1,
          strokeColor: styleRef.current.strokeColor,
          strokeWeight: 2,
        },
      });
      if (isFirst) marker.addListener("click", () => finish());
      vertexMarkersRef.current.push(marker);
      setVertexCount(pathRef.current.length);
    },
    [finish],
  );

  const begin = useCallback(() => {
    if (!mapRef.current || drawingRef.current) return;
    drawingRef.current = true;
    setIsDrawing(true);
    pathRef.current = [];
    setVertexCount(0);
    draftPolygonRef.current = new google.maps.Polygon({
      map: mapRef.current,
      paths: [],
      clickable: false,
      zIndex: 1,
      ...styleRef.current,
    });
  }, []);

  const cancel = useCallback(() => {
    drawingRef.current = false;
    setIsDrawing(false);
    clearDraft();
  }, [clearDraft]);

  const bindMap = useCallback(
    (map: google.maps.Map) => {
      mapRef.current = map;
      clickListenerRef.current?.remove();
      clickListenerRef.current = map.addListener(
        "click",
        (event: google.maps.MapMouseEvent) => {
          if (!drawingRef.current || !event.latLng) return;
          appendVertex(event.latLng);
        },
      );
    },
    [appendVertex],
  );

  return { isDrawing, vertexCount, bindMap, begin, finish, cancel };
}
