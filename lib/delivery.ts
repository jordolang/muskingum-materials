/**
 * Delivery utility functions for distance and fee calculation
 */

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface DeliverySettings {
  zoneRadiusMiles: number;
  baseFee: number;
  perMileRate: number;
}

export interface DeliveryFeeResult {
  withinZone: boolean;
  distance: number;
  fee: number;
  breakdown?: {
    baseFee: number;
    distanceFee: number;
  };
}

/**
 * Calculate the distance between two geographic coordinates using the Haversine formula
 * @param from Starting coordinates
 * @param to Destination coordinates
 * @returns Distance in miles
 */
export function calculateDistance(from: Coordinates, to: Coordinates): number {
  const R = 3959; // Earth's radius in miles
  const dLat = toRadians(to.lat - from.lat);
  const dLng = toRadians(to.lng - from.lng);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(from.lat)) *
      Math.cos(toRadians(to.lat)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  return Math.round(distance * 100) / 100; // Round to 2 decimal places
}

/**
 * Convert degrees to radians
 * @param degrees Angle in degrees
 * @returns Angle in radians
 */
function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Calculate delivery fee based on distance and delivery settings
 * @param distance Distance in miles
 * @param settings Delivery zone and pricing configuration
 * @returns Delivery fee calculation result
 */
export function calculateDeliveryFee(
  distance: number,
  settings: DeliverySettings
): DeliveryFeeResult {
  const withinZone = distance <= settings.zoneRadiusMiles;

  if (!withinZone) {
    return {
      withinZone: false,
      distance,
      fee: 0,
    };
  }

  const baseFee = settings.baseFee;
  const distanceFee = distance * settings.perMileRate;
  const totalFee = baseFee + distanceFee;

  return {
    withinZone: true,
    distance,
    fee: Math.round(totalFee * 100) / 100, // Round to 2 decimal places
    breakdown: {
      baseFee,
      distanceFee: Math.round(distanceFee * 100) / 100,
    },
  };
}

/**
 * Calculate delivery fee from coordinates and settings
 * @param from Starting coordinates (business location)
 * @param to Destination coordinates (delivery address)
 * @param settings Delivery zone and pricing configuration
 * @returns Delivery fee calculation result
 */
export function calculateDeliveryFeeFromCoordinates(
  from: Coordinates,
  to: Coordinates,
  settings: DeliverySettings
): DeliveryFeeResult {
  const distance = calculateDistance(from, to);
  return calculateDeliveryFee(distance, settings);
}

/**
 * Format distance for display
 * @param distance Distance in miles
 * @returns Formatted distance string
 */
export function formatDistance(distance: number): string {
  return `${distance.toFixed(1)} mi`;
}

/**
 * Format delivery fee breakdown for display
 * @param result Delivery fee calculation result
 * @returns Human-readable fee breakdown
 */
export function formatDeliveryFeeBreakdown(result: DeliveryFeeResult): string {
  if (!result.withinZone) {
    return "Outside delivery zone";
  }

  if (!result.breakdown) {
    return `$${result.fee.toFixed(2)}`;
  }

  return `Base: $${result.breakdown.baseFee.toFixed(2)} + Distance: $${result.breakdown.distanceFee.toFixed(2)} = $${result.fee.toFixed(2)}`;
}
