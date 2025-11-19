/**
 * useWikipediaPois
 * Returns a memoized function that fetches nearby Wikipedia POIs around the
 * current aircraft position (via SimVar), updates application state, and sends
 * an ordered coordinates payload to the WASM module.
 *
 * Flow:
 * 1. Reads plane latitude/longitude via SimVar.
 * 2. Persists those coordinates with `setUserCoords`.
 * 3. Fetches POIs from Wikipedia GeoSearch API (`fetchGeoSearch`).
 * 4. Updates POI list using `setPois`.
 * 5. Delegates POI ordering & CommBus dispatch to `sendPoisToWasm`.
 *
 * @param {Object} params
 * @param {(pois:Array<any>) => void} params.setPois - Setter to replace current POI collection.
 * @param {(coords:{lat:number, lon:number}) => void} params.setUserCoords - Setter for user/plane coordinates.
 * @param {boolean} params.isReady - CommBus readiness flag; aborts early if false.
 * @param {(pois:Array<any>, start:{lat:number, lon:number}) => void} params.sendPoisToWasm - Utility to dispatch ordered POIs.
 * @returns {{ fetchPoisAroundPlane: () => Promise<void> }} Object containing the fetch function.
 */
import { useCallback } from "react";
import { fetchGeoSearch } from "../../utils/wiki/wikipediaApi";
import { setSimVarSafe } from "../../utils/simvar/simvarUtils";
import { haversine } from "../../utils/geo/haversine";

export function useWikipediaPois({
  setPois,
  setUserCoords,
  isReady,
  sendPoisToWasm,
}) {
  const fetchPoisAroundPlane = useCallback(async () => {
    // Avoid sending/processing route payloads until CommBus is ready
    if (!isReady) return;

    try {
      // Get plane coordinates from MSFS SimVar
      const lat = SimVar.GetSimVarValue("PLANE LATITUDE", "degrees");
      const lon = SimVar.GetSimVarValue("PLANE LONGITUDE", "degrees");

      if (typeof lat !== "number" || typeof lon !== "number") return;

      setUserCoords({ lat, lon });

      // Spawn a cube
      setSimVarSafe("L:WFP_SPAWN_CUBE", "Bool", 1);

      const fetchedPois = await fetchGeoSearch(lat, lon);
      if (fetchedPois && fetchedPois.length) {
        // Remove POIs that are closer than or equal to 0.1 km (100m) to any
        // previously kept POI. This avoids arrival detection failures when
        // POIs are too close together.
        const deduped = [];
        const thresholdKm = 0.1; // 100 meters
        for (const poi of fetchedPois) {
          if (typeof poi.lat !== "number" || typeof poi.lon !== "number")
            continue;
          let tooClose = false;
          for (const kept of deduped) {
            try {
              const d = haversine(poi.lat, poi.lon, kept.lat, kept.lon);
              if (d <= thresholdKm) {
                tooClose = true;
                break;
              }
            } catch (e) {
              // If haversine fails for any reason, skip distance check for this pair
              console.warn("[useWikipediaPois] haversine failed", e);
            }
          }
          if (!tooClose) deduped.push(poi);
        }

        const finalPois = deduped.length ? deduped : fetchedPois;
        // Add timestamp to force React to detect change even if POIs are identical
        const poisWithTimestamp = finalPois.map((poi) => ({
          ...poi,
          _fetchTimestamp: Date.now(),
        }));
        setPois(poisWithTimestamp);
        // Send ordered POI coordinates to WASM using current plane position as start
        sendPoisToWasm(poisWithTimestamp, { lat, lon });
      }
    } catch (err) {
      console.error("[useWikipediaPois] Error fetching POIs:", err);
      setPois([]);
    }
  }, [setPois, setUserCoords, isReady, sendPoisToWasm]);

  return { fetchPoisAroundPlane };
}
