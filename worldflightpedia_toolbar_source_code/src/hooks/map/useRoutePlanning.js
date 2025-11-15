/**
 * useRoutePlanning - Encapsulates POI normalization, route ordering, and live segment updates.
 *
 * Responsibilities:
 * - Normalize incoming raw POIs into {id, lat, lon, title}
 * - Compute an ordered route from current plane/user position using nearestNeighborOrder
 * - Draw static (future) route segments and update a dynamic current segment polyline
 * - Detect arrival at next POI, mark segment visited (red), trigger SimVars, auto-pause
 *
 * Returns route-related state for consumers while managing Leaflet layer groups internally.
 *
 * Inputs contract:
 * @param {Object} params
 * @param {import('react').MutableRefObject<any>} params.mapRef - Leaflet map ref
 * @param {import('react').MutableRefObject<any>} params.planeMarkerRef - Plane marker ref
 * @param {{lat?:number, lon?:number}} params.userCoords - Fallback user coordinates if plane marker not placed yet
 * @param {Array<any>} params.pois - Raw POIs
 * @param {Object} params.palette - Theme palette (optional accent color)
 * @param {number} [params.arrivalThresholdKm=0.2] - Distance threshold to consider POI reached
 * @param {function} [params.onArrive] - Optional callback when a POI is reached (receives POI)
 * @param {import('react').MutableRefObject<boolean>} [params.pauseRef] - Ref to track pause state (syncs with UI button)
 * @param {import('react').MutableRefObject<function>} [params.updatePauseButtonRef] - Ref to function that updates pause button UI
 *
 * Output:
 * { remainingPois, orderedRoute, completedSegments }
 */

import { useState, useEffect, useRef } from "react";
import L from "leaflet";
import { nearestNeighborOrder, normalizePois } from "../../utils/geo/routeUtils";
import { haversine } from "../../utils/geo/haversine";

/**
 * Main route-planning hook.
 * @returns {{
 *   remainingPois: Array<{id:string, lat:number, lon:number, title:string}>,
 *   orderedRoute: Array<{id:string, lat:number, lon:number, title:string}>,
 *   completedSegments: Array<{from:[number,number], to:[number,number]}>,
 * }}
 */
export function useRoutePlanning({
  mapRef,
  planeMarkerRef,
  userCoords,
  pois,
  palette,
  arrivalThresholdKm = 0.2,
  onArrive,
  pauseRef,
  updatePauseButtonRef
}) {
  const [remainingPois, setRemainingPois] = useState([]);
  const [orderedRoute, setOrderedRoute] = useState([]);
  const [completedSegments, setCompletedSegments] = useState([]);

  // Internal refs for dynamic/static segments & visited tracking
  const visitedIdsRef = useRef(new Set());
  const currentSegmentGroupRef = useRef(null);
  const staticSegmentsGroupRef = useRef(null);
  const visitedSegmentsGroupRef = useRef(null);
  const currentSegmentLineRef = useRef(null);
  const routeMirrorRef = useRef([]); // Mirror orderedRoute for interval closure
  const loopRef = useRef(null);

  /** Normalize incoming POIs and regenerate complete route */
  useEffect(() => {
    const map = mapRef.current;
    if (!map) {
      console.log("[useRoutePlanning] Map not ready yet");
      return;
    }

    // Step 1: Normalize POIs
    const valid = normalizePois(pois);
    console.log("[useRoutePlanning] Normalized POIs:", valid.length);
    setRemainingPois(valid);
    setCompletedSegments([]);
    
    // Step 2: Clear all previous state and layers
    if (visitedIdsRef.current) visitedIdsRef.current.clear();
    if (currentSegmentLineRef.current) currentSegmentLineRef.current = null;
    
    // Clear all layer groups
    if (currentSegmentGroupRef.current) {
      currentSegmentGroupRef.current.clearLayers();
      console.log("[useRoutePlanning] Cleared current segment group");
    }
    if (staticSegmentsGroupRef.current) {
      staticSegmentsGroupRef.current.clearLayers();
      console.log("[useRoutePlanning] Cleared static segments group");
    }
    if (visitedSegmentsGroupRef.current) {
      visitedSegmentsGroupRef.current.clearLayers();
      console.log("[useRoutePlanning] Cleared visited segments group");
    }

    // Step 3: Exit early if no valid POIs
    if (!valid || valid.length === 0) {
      console.log("[useRoutePlanning] No valid POIs, clearing route");
      setOrderedRoute([]);
      return;
    }

    // Step 4: Determine starting coordinate
    let startLat, startLon;
    const planeLatLng = planeMarkerRef.current?.getLatLng?.();
    if (planeLatLng) {
      startLat = planeLatLng.lat;
      startLon = planeLatLng.lng;
      console.log("[useRoutePlanning] Start from plane marker:", startLat, startLon);
    } else if (typeof userCoords.lat === 'number' && typeof userCoords.lon === 'number') {
      startLat = userCoords.lat;
      startLon = userCoords.lon;
      console.log("[useRoutePlanning] Start from userCoords:", startLat, startLon);
    } else {
      console.log("[useRoutePlanning] No valid starting position");
      setOrderedRoute([]);
      return;
    }
    const start = { lat: startLat, lon: startLon };

    // Step 5: Compute ordered route
    const ordered = nearestNeighborOrder(start, valid);
    console.log("[useRoutePlanning] Ordered route computed:", ordered.length, "POIs");
    setOrderedRoute(ordered);

    // Step 6: Ensure layer groups exist
    if (!visitedSegmentsGroupRef.current) {
      visitedSegmentsGroupRef.current = L.layerGroup().addTo(map);
      console.log("[useRoutePlanning] Created visited segments group");
    }
    if (!currentSegmentGroupRef.current) {
      currentSegmentGroupRef.current = L.layerGroup().addTo(map);
      console.log("[useRoutePlanning] Created current segment group");
    }
    if (!staticSegmentsGroupRef.current) {
      staticSegmentsGroupRef.current = L.layerGroup().addTo(map);
      console.log("[useRoutePlanning] Created static segments group");
    }

    // Step 7: Draw static route segments (dashed green lines)
    if (ordered.length > 1) {
      console.log("[useRoutePlanning] Drawing", ordered.length - 1, "static segments");
      for (let i = 0; i < ordered.length - 1; i++) {
        const from = ordered[i];
        const to = ordered[i + 1];
        const seg = L.polyline([[from.lat, from.lon], [to.lat, to.lon]], {
          color: "#00E46A",
          weight: 4,
          opacity: 0.8,
          smoothFactor: 1,
          dashArray: '10, 5',
          interactive: false,
          pane: 'overlayPane'
        });
        // Add directly to map first to visibility
        seg.addTo(map);
        // Then add to group for management
        staticSegmentsGroupRef.current.addLayer(seg);
      }
      console.log("[useRoutePlanning] Static segments drawn successfully");
    } else {
      console.log("[useRoutePlanning] Not enough POIs for segments (need at least 2)");
    }

    // Step 8: Fit map bounds to show entire route
    try {
      const coords = [[start.lat, start.lon], ...ordered.map(p => [p.lat, p.lon])];
      const bounds = L.latLngBounds(coords);
      map.fitBounds(bounds, { padding: [60, 60] });
      console.log("[useRoutePlanning] Map bounds fitted");
    } catch (err) {
      console.error("[useRoutePlanning] Error fitting bounds:", err);
    }
  }, [pois, userCoords]);

  /** Keep mirror of orderedRoute for interval loop */
  useEffect(() => {
    routeMirrorRef.current = Array.isArray(orderedRoute) ? orderedRoute : [];
  }, [orderedRoute]);

  /** Real-time loop: update dynamic segment & handle arrivals */
  useEffect(() => {
    // Clear previous loop
    if (loopRef.current) {
      clearInterval(loopRef.current);
      loopRef.current = null;
    }

    loopRef.current = setInterval(() => {
      const map = mapRef.current;
      const marker = planeMarkerRef.current;
      const route = routeMirrorRef.current;
      if (!map || !marker) return;

      if (!route || route.length === 0) {
        if (currentSegmentLineRef.current && currentSegmentGroupRef.current) {
          try { currentSegmentGroupRef.current.removeLayer(currentSegmentLineRef.current); } catch (_) {}
          currentSegmentLineRef.current = null;
        }
        return;
      }

      const target = route[0];
      if (!target) return;
      const planeLatLng = marker.getLatLng();
      if (!planeLatLng) return;

      // Ensure dynamic group
      if (!currentSegmentGroupRef.current && mapRef.current) {
        currentSegmentGroupRef.current = L.layerGroup().addTo(mapRef.current);
      }

      // Check Start Flight (L:WFP_StartFlight); if not active, stop tracking UI
      let flightTrackingActive = false;
      try {
        if (typeof SimVar?.GetSimVarValue === 'function') {
          const rawValue = SimVar.GetSimVarValue("L:WFP_StartFlight", "Bool");
          flightTrackingActive = rawValue === 1;
          console.log(`[useRoutePlanning Loop] L:WFP_StartFlight raw: ${rawValue}, active: ${flightTrackingActive}`);
        } else {
          console.warn("[useRoutePlanning Loop] SimVar.GetSimVarValue not available");
        }
      } catch (e) {
        console.error("[useRoutePlanning Loop] Error reading L:WFP_StartFlight:", e);
      }

      if (!flightTrackingActive) {
        console.log("[useRoutePlanning Loop] Flight tracking INACTIVE - skipping update");
        if (currentSegmentLineRef.current && currentSegmentGroupRef.current) {
          try { currentSegmentGroupRef.current.removeLayer(currentSegmentLineRef.current); } catch (_) {}
          currentSegmentLineRef.current = null;
        }
        return;
      }
      
      console.log("[useRoutePlanning Loop] Flight tracking ACTIVE - processing route");

      const latlngs = [[planeLatLng.lat, planeLatLng.lng], [target.lat, target.lon]];

      // Update/create dynamic polyline
      if (currentSegmentLineRef.current) {
        try { currentSegmentLineRef.current.setLatLngs(latlngs); } catch (_) {}
      } else {
        currentSegmentLineRef.current = L.polyline(latlngs, {
          color: palette?.accent || "#00bcd4",
          weight: 3,
          opacity: 0.9,
          smoothFactor: 1,
          noClip: true
        });
        currentSegmentGroupRef.current.addLayer(currentSegmentLineRef.current);
      }

      // Arrival detection
      const distKm = haversine(planeLatLng.lat, planeLatLng.lng, target.lat, target.lon);
      if (distKm <= arrivalThresholdKm && !visitedIdsRef.current.has(target.id)) {
        visitedIdsRef.current.add(target.id);

        const planePos = marker.getLatLng();
        const targetPos = [target.lat, target.lon];

        // Pulse custom L:Var for arrival (wrapped in try for robustness)
        try {
          SimVar.SetSimVarValue("L:WFP_NextPoi", "Bool", 1);
          setTimeout(() => {
            try { SimVar.SetSimVarValue("L:WFP_NextPoi", "Bool", 0); } catch (_) {}
          }, 1000);
        } catch (e) {
          console.warn("[useRoutePlanning] Error setting L:WFP_NextPoi", e);
        }

        // Auto-pause MSFS only if Start Flight is active; sync UI button
        try {
          let startActive = false;
          try {
            if (typeof SimVar?.GetSimVarValue === 'function') {
              const rawValue = SimVar.GetSimVarValue("L:WFP_StartFlight", "Bool");
              startActive = rawValue === 1;
              console.log(`[useRoutePlanning Arrival] L:WFP_StartFlight raw: ${rawValue}, active: ${startActive}`);
            } else {
              console.warn("[useRoutePlanning Arrival] SimVar.GetSimVarValue not available");
            }
          } catch (e) {
            console.error("[useRoutePlanning Arrival] Error reading L:WFP_StartFlight:", e);
          }

          if (startActive) {
            console.log("[useRoutePlanning Arrival] Triggering auto-pause");
            if (typeof SimVar?.SetSimVarValue === 'function') {
              SimVar.SetSimVarValue("K:PAUSE_SET", "Bool", 1);
              console.log("[useRoutePlanning Arrival]  K:PAUSE_SET sent");
            }
            if (pauseRef) pauseRef.current = true;
            if (typeof updatePauseButtonRef?.current === 'function') {
              try { updatePauseButtonRef.current(); } catch (_) {}
            }
          } else {
            console.log("[useRoutePlanning Arrival]  Auto-pause skipped - Start Flight not active");
          }
        } catch (e) {
          console.warn("[useRoutePlanning] Error auto-pausing on arrival", e);
        }

        // Clear dynamic line (next tick will create new one)
        if (currentSegmentLineRef.current && currentSegmentGroupRef.current) {
          try { currentSegmentGroupRef.current.removeLayer(currentSegmentLineRef.current); } catch (_) {}
          currentSegmentLineRef.current = null;
        }

        // Rebuild static segments excluding first leg
        if (staticSegmentsGroupRef.current && route.length > 1) {
          staticSegmentsGroupRef.current.clearLayers();
          for (let i = 1; i < route.length - 1; i++) {
            const from = route[i];
            const to = route[i + 1];
            const seg = L.polyline([[from.lat, from.lon], [to.lat, to.lon]], {
              color: "#006b4a",
              weight: 5,
              opacity: 0.8,
              smoothFactor: 1,
              noClip: true,
              dashArray: '10, 10'
            });
            staticSegmentsGroupRef.current.addLayer(seg);
          }
        }

        setCompletedSegments(prev => [...prev, { from: [planePos.lat, planePos.lng], to: targetPos }]);
        setRemainingPois(prev => prev.filter(p => p.id !== target.id));
        
        // Update route mirror immediately so next tick sees updated route
        routeMirrorRef.current = routeMirrorRef.current.filter(p => p.id !== target.id);
        console.log("[useRoutePlanning] Route updated, remaining POIs:", routeMirrorRef.current.length);
        
        onArrive?.(target);
      }
    }, 1000);

    return () => {
      if (loopRef.current) clearInterval(loopRef.current);
      loopRef.current = null;
    };
  }, [palette, arrivalThresholdKm, onArrive]);

  // Cleanup on total unmount: clear groups
  useEffect(() => {
    return () => {
      currentSegmentGroupRef.current?.clearLayers();
      staticSegmentsGroupRef.current?.clearLayers();
      visitedSegmentsGroupRef.current?.clearLayers();
    };
  }, []);

  return { remainingPois, orderedRoute, completedSegments };
}
