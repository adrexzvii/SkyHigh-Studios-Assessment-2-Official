/**
 * useDistance - Custom hook for calculating distance between user and POI
 * 
 * Calculates the great-circle distance between user coordinates and a point of interest
 * using the Haversine formula. Returns distance in kilometers with 2 decimal precision.
 * 
 * @param {Object} userCoords - User's current position
 * @param {number} userCoords.lat - User latitude
 * @param {number} userCoords.lon - User longitude
 * @param {Object} poi - Point of interest
 * @param {number} poi.lat - POI latitude
 * @param {number} poi.lon - POI longitude
 * @returns {string|null} Distance in kilometers (e.g., "12.34") or null if coordinates unavailable
 * 
 * @example
 * const distance = useDistance(
 *   { lat: 40.7128, lon: -74.0060 },
 *   { lat: 51.5074, lon: -0.1278 }
 * );
 * // distance = "5570.23" (km from NYC to London)
 */

import { useEffect, useState } from "react";
import { haversine } from "../../utils/geo/haversine";

export function useDistance(userCoords, poi) {
  // Distance in kilometers (string with 2 decimals)
  const [distance, setDistance] = useState(null);

  useEffect(() => {
    // Only calculate if both coordinates are available
    if (userCoords?.lat && poi?.lat) {
      // Calculate great-circle distance using Haversine formula
      const d = haversine(userCoords.lat, userCoords.lon, poi.lat, poi.lon);
      
      // Format to 2 decimal places (e.g., "12.34 km")
      setDistance(d.toFixed(2));
    }
  }, [userCoords, poi]); // Re-calculate when coordinates change

  return distance;
}
