/**
 * haversine - Calculate great-circle distance between two geographic points
 *
 * Uses the Haversine formula to compute the shortest distance over the Earth's
 * surface between two points, accounting for spherical geometry.
 *
 * Formula: d = 2R × arcsin(√[sin²(Δφ/2) + cos(φ1) × cos(φ2) × sin²(Δλ/2)])
 * where R = Earth's radius, φ = latitude, λ = longitude
 *
 * @param {number} lat1 - Starting latitude in decimal degrees
 * @param {number} lon1 - Starting longitude in decimal degrees
 * @param {number} lat2 - Ending latitude in decimal degrees
 * @param {number} lon2 - Ending longitude in decimal degrees
 * @returns {number} Distance in kilometers
 *
 * @example
 * // Distance from New York to London
 * const distance = haversine(40.7128, -74.0060, 51.5074, -0.1278);
 * // Returns: ~5570 km
 */
export function haversine(lat1, lon1, lat2, lon2) {
  // Earth's radius in kilometers
  const R = 6371;

  // Convert latitude difference to radians
  const dLat = ((lat2 - lat1) * Math.PI) / 180;

  // Convert longitude difference to radians
  const dLon = ((lon2 - lon1) * Math.PI) / 180;

  // Haversine formula: calculate the "a" term
  // a = sin²(Δφ/2) + cos(φ1) × cos(φ2) × sin²(Δλ/2)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;

  // Final calculation: d = 2R × arcsin(√a)
  return 2 * R * Math.asin(Math.sqrt(a));
}
