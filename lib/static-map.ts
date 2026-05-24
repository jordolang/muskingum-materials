/**
 * Builders for Google Static Maps API URLs that capture a customer's
 * project-site outline so we can show it on the order receipt, in the
 * confirmation email, and on admin order pages.
 *
 * The Static Maps API URL is just a regular HTTPS image URL. The browser
 * (or email client) requests it from Google directly, so the project
 * boundary is rendered without us having to host any tiles.
 */

export interface LatLng {
  lat: number;
  lng: number;
}

export type PolygonPath = LatLng[];

interface BuildSatelliteMapUrlInput {
  center?: LatLng | null;
  zoom?: number;
  polygons?: PolygonPath[];
  size?: { width: number; height: number };
  scale?: 1 | 2;
}

const STATIC_MAPS_BASE = "https://maps.googleapis.com/maps/api/staticmap";
const POLYGON_FILL_COLOR = "0xf59e0b66"; // amber-500 with ~40% alpha
const POLYGON_STROKE_COLOR = "0x92400ecc"; // amber-800 with high alpha
const POLYGON_STROKE_WEIGHT = 2;

/**
 * Encodes a sequence of lat/lng points using Google's polyline encoding
 * algorithm. This is the same algorithm Google publishes at
 * https://developers.google.com/maps/documentation/utilities/polylinealgorithm
 * and is what `path=enc:...` expects in the Static Maps API.
 */
export function encodePolyline(path: PolygonPath): string {
  let lastLat = 0;
  let lastLng = 0;
  let result = "";

  for (const point of path) {
    const lat = Math.round(point.lat * 1e5);
    const lng = Math.round(point.lng * 1e5);
    result += encodeSignedNumber(lat - lastLat);
    result += encodeSignedNumber(lng - lastLng);
    lastLat = lat;
    lastLng = lng;
  }

  return result;
}

function encodeSignedNumber(num: number): string {
  let sgnNum = num << 1;
  if (num < 0) sgnNum = ~sgnNum;
  return encodeUnsignedNumber(sgnNum);
}

function encodeUnsignedNumber(num: number): string {
  let encoded = "";
  let value = num;
  while (value >= 0x20) {
    encoded += String.fromCharCode((0x20 | (value & 0x1f)) + 63);
    value >>= 5;
  }
  encoded += String.fromCharCode(value + 63);
  return encoded;
}

/**
 * Builds a Static Maps URL with satellite imagery and one filled polygon
 * per outlined project area. Returns null if the API key is missing,
 * since the URL would be unauthenticated and useless.
 */
export function buildSatelliteMapUrl(input: BuildSatelliteMapUrlInput): string | null {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  if (!apiKey) return null;

  const size = input.size ?? { width: 640, height: 400 };
  const scale = input.scale ?? 2;
  const polygons = input.polygons ?? [];
  const params = new URLSearchParams();

  params.set("size", `${size.width}x${size.height}`);
  params.set("scale", String(scale));
  params.set("maptype", "satellite");

  if (input.center) {
    params.set("center", `${input.center.lat},${input.center.lng}`);
  }
  if (input.zoom !== undefined) {
    params.set("zoom", String(input.zoom));
  }

  // Build a `path=` query param per polygon. URLSearchParams supports
  // multiple values for the same key when we use `append`.
  for (const polygon of polygons) {
    if (polygon.length < 3) continue;
    // Static Maps requires polygons to be closed for fillcolor to render.
    const ring = polygonIsClosed(polygon) ? polygon : [...polygon, polygon[0]];
    const encoded = encodePolyline(ring);
    params.append(
      "path",
      `color:${POLYGON_STROKE_COLOR}|fillcolor:${POLYGON_FILL_COLOR}|weight:${POLYGON_STROKE_WEIGHT}|enc:${encoded}`,
    );
  }

  // If no polygons but we have a center, drop a marker so the image
  // still tells the customer where their property is.
  if (polygons.length === 0 && input.center) {
    params.set("markers", `color:0x92400e|${input.center.lat},${input.center.lng}`);
  }

  params.set("key", apiKey);

  return `${STATIC_MAPS_BASE}?${params.toString()}`;
}

function polygonIsClosed(polygon: PolygonPath): boolean {
  if (polygon.length < 2) return false;
  const first = polygon[0];
  const last = polygon[polygon.length - 1];
  return first.lat === last.lat && first.lng === last.lng;
}
