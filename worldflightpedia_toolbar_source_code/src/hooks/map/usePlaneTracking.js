/**
 * usePlaneTracking - Hook to update plane marker position and heading
 *
 * Polls MSFS SimVars periodically and updates:
 * - plane marker position (lat, lon)
 * - optional map recenter when follow mode is enabled
 * - plane icon rotation according to heading
 *
 * This hook is side-effect only and works through provided refs.
 *
 * Contract
 * - Inputs:
 *   { mapRef, planeMarkerRef, followRef, intervalMs }
 *   - mapRef: React ref to Leaflet map instance (L.Map)
 *   - planeMarkerRef: React ref to Leaflet marker instance (L.Marker) with .getElement()
 *   - followRef: React ref<boolean> indicating whether to auto-center the map on the plane
 *   - intervalMs: optional polling interval in ms (default: 1000)
 * - Outputs: none (mutates marker/map via refs). Returns nothing.
 * - Error modes: if SimVar is unavailable or values invalid, errors are caught and logged.
 */

import { useEffect } from "react";

/**
 * @param {{
 *  mapRef: import('react').MutableRefObject<any>,
 *  planeMarkerRef: import('react').MutableRefObject<any>,
 *  followRef: import('react').MutableRefObject<boolean>,
 *  intervalMs?: number,
 * }} params
 */
/**
 * Side-effect hook; does not return data. Updates marker & map every interval.
 * @returns {void}
 */
export function usePlaneTracking({ mapRef, planeMarkerRef, followRef, intervalMs = 1000 }) {
  useEffect(() => {
    const interval = setInterval(() => {
      try {
        // Read plane data from MSFS SimVars
        const lat = SimVar.GetSimVarValue("PLANE LATITUDE", "degrees");
        const lon = SimVar.GetSimVarValue("PLANE LONGITUDE", "degrees");
        const hdg = SimVar.GetSimVarValue("PLANE HEADING DEGREES TRUE", "degrees");

        if (typeof lat === "number" && typeof lon === "number") {
          const marker = planeMarkerRef?.current;
          if (marker) {
            // Update plane marker position
            marker.setLatLng([lat, lon]);

            // Auto-center map if follow mode is enabled
            const map = mapRef?.current;
            if (map && followRef?.current) {
              map.setView([lat, lon], map.getZoom() || 13);
            }

            // Rotate plane icon according to heading
            const el = marker.getElement?.();
            if (el) {
              const svg = el.querySelector(".plane-svg");
              if (svg && typeof hdg === "number") svg.style.transform = `rotate(${hdg}deg)`;
            }
          }
        }
      } catch (error) {
        // Keep loop resilient: swallow errors and continue
        console.error("[usePlaneTracking] Error reading SimVars:", error);
      }
    }, intervalMs);

    return () => clearInterval(interval);
  }, [mapRef, planeMarkerRef, followRef, intervalMs]);
}
