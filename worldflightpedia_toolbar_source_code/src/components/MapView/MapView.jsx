

/**
 * MapView.jsx — Interactive Map Component (Flight + POIs)
 *
 * Orchestrates domain hooks to provide:
 * - Leaflet map initialization & custom controls with openmapstreet map.
 * - Live aircraft tracking (position + heading) via SimVar.
 * - Route planning (nearest–neighbor) & dynamic segment rendering.
 * - Wikipedia POI API discovery + marker rendering.
 * - WASM communication (ordered POI coordinates) through CommBus.
 * - Context-driven POI selection + popup details.
 *
 * Props are minimal because POI/user state is consumed from `PoiContext`.
 *
 * @component
 * @param {{lat?:number, lon?:number}} userCoords - Current user/plane coordinates (may be empty initially).
 * @param {(coords:{lat:number, lon:number}) => void} setUserCoords - Setter to update user coordinates.
 */

import React, { useEffect, useRef, useState, useCallback } from "react";
import "leaflet/dist/leaflet.css";
import { Box } from "@mui/material";
import palette from "../../theme/palette";
import MapPopupWikipedia from "../MapPopupWikipedia/MapPopupWikipedia";
import { usePoiContext } from "../context/PoiContext";
import { useCommBus } from "../../hooks/comm/useCommBus";
// normalize and ordering handled inside hooks/utils
import { usePlaneTracking } from "../../hooks/map/usePlaneTracking";
import { useRoutePlanning } from "../../hooks/map/useRoutePlanning";
import { useLeafletMap } from "../../hooks/map/useLeafletMap";
import { usePoiMarkers } from "../../hooks/map/usePoiMarkers";
import { useWikipediaPois } from "../../hooks/wiki/useWikipediaPois";
import { focusOnPoiUtil } from "../../utils/leaflet/focusOnPoi";
import { sendPoisToWasm as sendPoisToWasmUtil } from "../../utils/comm/sendPoisToWasm";

export default function MapView({ 
  userCoords = {}, 
  setUserCoords,
}) {
    const { pois = [], selectedPoi, setSelectedPoi, setPois } = usePoiContext();
    const { send, isReady } = useCommBus();
    // Map and layer references
    const containerRef = useRef(null);
    const mapRef = useRef(null);
    const poiLayerRef = useRef(null);
    const planeMarkerRef = useRef(null);
  const resizeObserverRef = useRef(null); // Tracks container size to invalidate Leaflet
  const pauseRef = useRef(false); // Track local pause state for pause/play control
    
    // LocalStorage keys for MapView state
    const LS_KEYS = {
      followPlane: "wfp_map_follow_plane",
      pause: "wfp_map_pause",
      remainingPois: "wfp_map_remaining_pois",
      orderedRoute: "wfp_map_ordered_route",
      completedSegments: "wfp_map_completed_segments",
    };
    
    // Flight tracking state (load from localStorage)
    const [followPlane, setFollowPlane] = useState(() => {
      try {
        const saved = window.localStorage?.getItem(LS_KEYS.followPlane);
        return saved ? JSON.parse(saved) : true;
      } catch { return true; }
    });
    const followRef = useRef(followPlane);
  const updateFollowButtonRef = useRef(null); // Reference to button update function
  const updatePauseButtonRef = useRef(null);  // Reference to pause/play button update function
  const pauseBlinkIntervalRef = useRef(null); // Interval for paused blinking effect
    
    // Route planning handled by custom hook (normalizes, orders, updates segments)
    const { remainingPois, orderedRoute, completedSegments } = useRoutePlanning({
      mapRef,
      planeMarkerRef,
      userCoords,
      pois,
      palette,
      arrivalThresholdKm: 0.1, // 100m threshold for arrival
      pauseRef,
      updatePauseButtonRef
    });

    // Route tracking & arrivals handled entirely by useRoutePlanning hook.

    // Load pause state from localStorage on mount
    useEffect(() => {
      try {
        const savedPause = window.localStorage?.getItem(LS_KEYS.pause);
        if (savedPause !== null) {
          pauseRef.current = JSON.parse(savedPause);
        }
      } catch {}
      
    }, []);

    // Persist followPlane state
    useEffect(() => {
      try {
        window.localStorage?.setItem(LS_KEYS.followPlane, JSON.stringify(followPlane));
      } catch {}
    }, [followPlane]);

    // Persist route planning state (remaining POIs, route, completed segments)
    useEffect(() => {
      try {
        window.localStorage?.setItem(LS_KEYS.remainingPois, JSON.stringify(remainingPois));
        window.localStorage?.setItem(LS_KEYS.orderedRoute, JSON.stringify(orderedRoute));
        window.localStorage?.setItem(LS_KEYS.completedSegments, JSON.stringify(completedSegments));
      } catch {}
    }, [remainingPois, orderedRoute, completedSegments]);

    /**
     * Sync followPlane state with ref for use in Leaflet controls
     */
    useEffect(() => { 
      followRef.current = followPlane; 
    }, [followPlane]);

    /**
     * Centers map on specified POI with animation
     * Disables follow plane mode when manually focusing on a POI
     * @param {Object} poi - POI object with lat/lon coordinates
     */
  const focusOnPoi = useCallback((poi) => {
    focusOnPoiUtil(mapRef.current, poi, { setFollowPlane, followRef, updateFollowButtonRef });
  }, [setFollowPlane]);

  /**
   * Sends POI coordinates to WASM module via callback
   * Orders POIs by shortest path (nearest neighbor) starting from provided start
   * Creates JSON with only lat/lon for each POI
   * @param {Array} poisArray - Array of POI objects
   * @param {{lat:number, lon:number}} [start] - Optional starting coordinate
   */
  /**
   * Sends POIs ordered by shortest path to WASM via provided callback.
   * Falls back to current plane or userCoords if no explicit start is given.
   */
  const sendPoisToWasm = useCallback((poisArray, start) => {
    return sendPoisToWasmUtil({
      poisArray,
      start,
      planeMarkerRef,
      userCoords,
      isReady,
      send,
    });
  }, [send, userCoords, isReady]);

    /**
     * Fetches POIs around current plane position using Wikipedia geosearch API
     * Integrates with MSFS SimVar to get real-time plane coordinates
     * ordered by nearest-neighbor from the current plane position.
     * Sends POI coordinates to WASM module via CommBus
     * @async
     */
  const { fetchPoisAroundPlane } = useWikipediaPois({
    setPois,
    setUserCoords,
    isReady,
    sendPoisToWasm,
  });

    // Initialize Leaflet map with tiles, controls, and plane marker
    useLeafletMap({
      containerRef,
      mapRef,
      poiLayerRef,
      planeMarkerRef,
      resizeObserverRef,
      userCoords,
      palette,
      followRef,
      setFollowPlane,
      updateFollowButtonRef,
      fetchPoisAroundPlane,
      pauseRef,
      updatePauseButtonRef,
      pauseBlinkIntervalRef
    });

    // Plane tracking: updates marker position, heading, and optional map follow
    usePlaneTracking({ mapRef, planeMarkerRef, followRef });

    // Render POI markers with selection states and get popup control function
    const { openPoiPopup } = usePoiMarkers({ 
      mapRef, 
      poiLayerRef, 
      pois, 
      selectedPoi, 
      setSelectedPoi,
      userCoords,
      onFocusPoi: focusOnPoi
    });
    
    // Store openPoiPopup in context for access from PoiList
    useEffect(() => {
      if (window.__openPoiPopup !== openPoiPopup) {
        window.__openPoiPopup = openPoiPopup;
      }
    }, [openPoiPopup]);

    return (
        <Box sx={{ 
            position: "absolute",
            top: 93,
            left: 300,
            right: 0,
            bottom: 0,
            bgcolor: palette.background,
            zIndex: 0
        }}>
            {/* Leaflet map container */}
            <Box
                ref={containerRef}
                sx={{
                    width: "100%",
                    height: "100%",
                    position: 'relative'
                }}
            />

            {/* Wikipedia POI details popup (rendered when POI is selected) */}
            {/* Temporarily disabled - using Leaflet native popups instead */}
            {/* {selectedPoi && (
                <Box sx={{ 
                    position: "absolute",
                    top: 0,
                    left: 0,
                    zIndex: 1200,
                    pointerEvents: "auto"
                }}>
                    <MapPopupWikipedia 
                        poi={selectedPoi}
                        userCoords={userCoords}
                        onFocusPoi={focusOnPoi}
                    />
                </Box>
            )} */}
        </Box>
    );
}