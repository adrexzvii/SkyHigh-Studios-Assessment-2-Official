/**
 * sendPoisToWasm
 * Orders POIs using a nearest–neighbor heuristic starting from an explicit start
 * coordinate if provided, otherwise falling back to current plane marker position
 * or the last known user coordinates. Produces a simplified payload containing
 * only lat/lon pairs and dispatches it through the CommBus.
 *
 * Behavior notes:
 * - Silently aborts if CommBus isn't ready.
 * - Filters out POIs missing numeric lat/lon before ordering.
 * - Does not mutate the original `poisArray`.
 *
 * @param {Object} params - Configuration object.
 * @param {Array<{lat:number, lon:number}>} params.poisArray - Raw POIs list (must contain lat/lon).
 * @param {{lat:number, lon:number}} [params.start] - Optional explicit starting coordinate.
 * @param {import('react').RefObject<any>} params.planeMarkerRef - Leaflet plane marker ref (for implicit start).
 * @param {{lat:number, lon:number}} params.userCoords - Fallback coordinate when plane marker not available.
 * @param {boolean} params.isReady - CommBus readiness flag.
 * @param {(eventName:string, payload:any) => void} params.send - CommBus send function.
 * @returns {void}
 */
import { nearestNeighborOrder } from "../geo/routeUtils";

export function sendPoisToWasm({
  poisArray,
  start,
  planeMarkerRef,
  userCoords,
  isReady,
  send,
}) {
  if (!isReady) {
    console.warn("[sendPoisToWasm] CommBus not ready yet");
    return;
  }

  try {
    // Determine start position: prefer explicit start, else plane marker, else userCoords
    let startLat, startLon;
    if (
      start &&
      typeof start.lat === "number" &&
      typeof start.lon === "number"
    ) {
      startLat = start.lat;
      startLon = start.lon;
    } else {
      const planeLatLng = planeMarkerRef?.current?.getLatLng?.();
      if (planeLatLng) {
        startLat = planeLatLng.lat;
        startLon = planeLatLng.lng;
      } else if (
        typeof userCoords?.lat === "number" &&
        typeof userCoords?.lon === "number"
      ) {
        startLat = userCoords.lat;
        startLon = userCoords.lon;
      }
    }

    const startCoord =
      typeof startLat === "number" && typeof startLon === "number"
        ? { lat: startLat, lon: startLon }
        : null;

    // Filter to valid coordinate objects
    const validPois = Array.isArray(poisArray)
      ? poisArray.filter(
          (p) => typeof p?.lat === "number" && typeof p?.lon === "number"
        )
      : [];

    // Order using nearest neighbor if we have a starting point
    const ordered = startCoord
      ? nearestNeighborOrder(startCoord, validPois)
      : validPois;

    // Create simplified JSON with only coordinates
    const poisCoordinates = ordered.map((poi) => ({
      lat: poi.lat,
      lon: poi.lon,
    }));

    // Create payload for WASM
    const payload = {
      type: "POI_COORDINATES",
      data: poisCoordinates,
      count: poisCoordinates.length,
    };

    console.log(
      "[sendPoisToWasm] Sending ordered POI coordinates to WASM:",
      payload
    );

    send("OnMessageFromJs", payload);
    console.log("[sendPoisToWasm] Ordered POI coordinates sent successfully");
  } catch (err) {
    console.error(
      "[sendPoisToWasm] Error preparing ordered POIs for WASM:",
      err
    );
  }
}
