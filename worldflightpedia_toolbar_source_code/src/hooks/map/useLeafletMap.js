/**
 * useLeafletMap - Manages Leaflet map initialization and lifecycle
 *
 * Responsibilities:
 * - Initialize Leaflet map instance with OpenStreetMap tiles
 * - Create and position plane marker with custom SVG icon
 * - Add custom controls (Follow, FetchPOIs, Pause/Play)
 * - Create POI layer group
 * - Handle map resize observation
 * - Clean up resources on unmount
 *
 * @param {Object} params
 * @param {import('react').MutableRefObject<any>} params.containerRef - Map container DOM ref
 * @param {import('react').MutableRefObject<any>} params.mapRef - Map instance ref (output)
 * @param {import('react').MutableRefObject<any>} params.poiLayerRef - POI layer ref (output)
 * @param {import('react').MutableRefObject<any>} params.planeMarkerRef - Plane marker ref (output)
 * @param {import('react').MutableRefObject<any>} params.resizeObserverRef - Resize observer ref
 * @param {{lat: number, lon: number}} params.userCoords - Initial map center coordinates
 * @param {Object} params.palette - Theme palette for controls
 * @param {import('react').MutableRefObject<boolean>} params.followRef - Follow plane state ref
 * @param {Function} params.setFollowPlane - Update follow plane state
 * @param {import('react').MutableRefObject<Function>} params.updateFollowButtonRef - Follow button update callback ref
 * @param {Function} params.fetchPoisAroundPlane - Fetch POIs callback
 * @param {import('react').MutableRefObject<boolean>} params.pauseRef - Pause state ref
 * @param {import('react').MutableRefObject<Function>} params.updatePauseButtonRef - Pause button update callback ref
 * @param {import('react').MutableRefObject<any>} params.pauseBlinkIntervalRef - Pause blink interval ref
 */

import { useEffect } from "react";
import L from "leaflet";
import {
  addFollowControl,
  addFetchPoisControl,
  addPausePlayControl,
  addCustomZoomControl,
} from "../../utils/leaflet/leafletControls";

/**
 * Initializes & maintains a Leaflet map instance. Side-effect only; returns void.
 * @returns {void}
 */
export function useLeafletMap({
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
  pauseBlinkIntervalRef,
}) {
  useEffect(() => {
    // Clean up existing map
    if (mapRef.current) {
      mapRef.current.remove();
      mapRef.current = null;
    }

    if (!containerRef.current) return;
    if (
      typeof userCoords.lat !== "number" ||
      typeof userCoords.lon !== "number"
    )
      return;

    // Create new map instance
    const map = L.map(containerRef.current, {
      preferCanvas: true,
      zoomControl: false,
      attributionControl: false,
    }).setView([userCoords.lat, userCoords.lon], 13);

    // Add OpenStreetMap tile layer
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "&copy; OpenStreetMap contributors",
    }).addTo(map);

    mapRef.current = map;
    poiLayerRef.current = L.layerGroup().addTo(map);

    // Create custom plane icon with SVG
    const planeIcon = L.divIcon({
      className: "plane-icon",
      html: `
        <svg viewBox="0 0 64 64" class="plane-svg" width="40" height="40">
          <path fill="#006b4a" d="M30 4 L34 4 L36 22 L56 28 L56 32 L36 34 L34 60 L30 60 L28 34 L8 32 L8 28 L28 22 Z"/>
          <circle cx="32" cy="10" r="3" fill="#e6f9fc"/>
        </svg>`,
      iconSize: [40, 40],
      iconAnchor: [20, 20],
    });

    planeMarkerRef.current = L.marker([userCoords.lat, userCoords.lon], {
      icon: planeIcon,
    }).addTo(map);

    // Add custom controls (refactored to utils)
    addCustomZoomControl(mapRef.current, { palette });
    addFollowControl(mapRef.current, {
      palette,
      followRef,
      setFollowPlane,
      updateFollowButtonRef,
    });
    addFetchPoisControl(mapRef.current, { fetchPoisAroundPlane });
    addPausePlayControl(mapRef.current, {
      SimVar,
      pauseRef,
      updatePauseButtonRef,
      pauseBlinkIntervalRef,
    });

    // Force initial size calculation (container may have been hidden/sized late)
    try {
      map.invalidateSize();
    } catch (_) {}
    setTimeout(() => {
      try {
        map.invalidateSize();
      } catch (_) {}
    }, 150);

    // Resize observer to keep Leaflet layout correct without manual window resize
    if (containerRef.current && typeof ResizeObserver !== "undefined") {
      resizeObserverRef.current = new ResizeObserver(() => {
        if (mapRef.current) {
          try {
            mapRef.current.invalidateSize();
          } catch (_) {}
        }
      });
      resizeObserverRef.current.observe(containerRef.current);
    }

    // Cleanup on unmount: destroy map & detach observers/intervals
    return () => {
      // Disconnect resize observer first
      if (resizeObserverRef.current) {
        try {
          resizeObserverRef.current.disconnect();
        } catch (_) {}
        resizeObserverRef.current = null;
      }
      // Clear blinking interval if active
      if (pauseBlinkIntervalRef.current) {
        try {
          clearInterval(pauseBlinkIntervalRef.current);
        } catch (_) {}
        pauseBlinkIntervalRef.current = null;
      }
      map.remove();
      mapRef.current = null;
      poiLayerRef.current = null;
      planeMarkerRef.current = null;
    };
  }, [
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
    pauseBlinkIntervalRef,
  ]);
}
