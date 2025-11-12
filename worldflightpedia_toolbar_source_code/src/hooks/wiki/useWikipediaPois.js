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

export function useWikipediaPois({ setPois, setUserCoords, isReady, sendPoisToWasm }) {
  const fetchPoisAroundPlane = useCallback(async () => {
    // Avoid sending/processing route payloads until CommBus is ready
    if (!isReady) return;

    try {
      // Get plane coordinates from MSFS SimVar
      const lat = SimVar.GetSimVarValue("PLANE LATITUDE", "degrees");
      const lon = SimVar.GetSimVarValue("PLANE LONGITUDE", "degrees");

      if (typeof lat !== "number" || typeof lon !== "number") return;

      setUserCoords({ lat, lon });

      const fetchedPois = await fetchGeoSearch(lat, lon);
      if (fetchedPois && fetchedPois.length) {
        setPois(fetchedPois);
        // Send ordered POI coordinates to WASM using current plane position as start
        sendPoisToWasm(fetchedPois, { lat, lon });
      }
    } catch (err) {
      console.error("[useWikipediaPois] Error fetching POIs:", err);
      setPois([]);
    }
  }, [setPois, setUserCoords, isReady, sendPoisToWasm]);

  return { fetchPoisAroundPlane };
}
