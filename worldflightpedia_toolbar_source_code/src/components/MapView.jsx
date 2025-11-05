/**
 * MapView.jsx - Interactive Map Component with Flight Planning
 * 
 * Main map component that integrates:
 * - Leaflet map with OpenStreetMap tiles
 * - Microsoft Flight Simulator (MSFS) integration via SimVar
 * - Real-time plane tracking and heading display
 * - Automatic route planning using nearest neighbor algorithm
 * - POI markers and Wikipedia integration
 * - Visited route tracking with visual feedback
 * 
 * @component
 * @param {Array} pois - Array of Points of Interest to display
 * @param {Object} userCoords - User/plane coordinates {lat, lon}
 * @param {Object} selectedPoi - Currently selected POI
 * @param {Function} setSelectedPoi - Function to update selected POI
 * @param {Function} setPois - Function to update POI list
 * @param {Function} setUserCoords - Function to update user coordinates
 */

import React, { useEffect, useRef, useState, useCallback } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Box } from "@mui/material";
import FlightIcon from "@mui/icons-material/Flight";
import SearchIcon from "@mui/icons-material/Search";
import { createRoot } from "react-dom/client";
import palette from "../theme/palette";
import MapPopupWikipedia from "./MapPopupWikipedia";

export default function MapView({ pois = [], userCoords = {}, selectedPoi, setSelectedPoi, setPois, setUserCoords }) {
    // Map and layer references
    const containerRef = useRef(null);
    const mapRef = useRef(null);
    const poiLayerRef = useRef(null);
    const planeMarkerRef = useRef(null);
    const routeLayerRef = useRef(null);
    const visitedLayerRef = useRef(null);
    
    // Flight tracking state
    const [followPlane, setFollowPlane] = useState(true);
    const followRef = useRef(followPlane);
    const updateFollowButtonRef = useRef(null); // Reference to button update function
    
    // Route planning state
    const [remainingPois, setRemainingPois] = useState([]);
    const [orderedRoute, setOrderedRoute] = useState([]);
    const [currentTargetIndex, setCurrentTargetIndex] = useState(0);
    const [completedSegments, setCompletedSegments] = useState([]);

    /**
     * Calculates distance between two coordinates using Haversine formula
     * @param {number} lat1 - First latitude in degrees
     * @param {number} lon1 - First longitude in degrees
     * @param {number} lat2 - Second latitude in degrees
     * @param {number} lon2 - Second longitude in degrees
     * @returns {number} Distance in kilometers
     */
    const haversine = (lat1, lon1, lat2, lon2) => {
      const R = 6371; // Earth's radius in kilometers
      const toRad = (v) => (v * Math.PI) / 180;
      const dLat = toRad(lat2 - lat1);
      const dLon = toRad(lon2 - lon1);
      const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
      return 2 * R * Math.asin(Math.sqrt(a));
    };

    /**
     * Orders POIs using nearest neighbor algorithm for optimal route planning
     * @param {Object} start - Starting coordinates {lat, lon}
     * @param {Array} points - Array of POI objects with lat/lon
     * @returns {Array} Ordered array of POIs for optimal route
     */
    const nearestNeighborOrder = useCallback((start, points) => {
      if (!start || !Array.isArray(points)) return [];
      const pts = points.map(p => ({ ...p }));
      const order = [];
      let cur = { lat: start.lat, lon: start.lon };

      // Greedy algorithm: always choose nearest unvisited point
      while (pts.length) {
        let bestIdx = 0;
        let bestDist = Infinity;
        for (let i = 0; i < pts.length; i++) {
          const p = pts[i];
          const d = haversine(cur.lat, cur.lon, p.lat, p.lon);
          if (d < bestDist) {
            bestDist = d;
            bestIdx = i;
          }
        }
        const next = pts.splice(bestIdx, 1)[0];
        order.push(next);
        cur = { lat: next.lat, lon: next.lon };
      }
      return order;
    }, []);

    /**
     * Process and validate incoming POIs
     * Maps POIs to standard format and filters invalid coordinates
     */
    useEffect(() => {
      if (!Array.isArray(pois)) return;
      
      // Map incoming POIs to objects with lat/lon and id/title (avoid mutating original)
      const valid = pois
        .map(p => ({
          id: p.id ?? (p.pageid ?? `${p.lat}-${p.lon}`),
          lat: typeof p.lat === 'number' ? p.lat : (p.lat ?? p.lat),
          lon: typeof p.lon === 'number' ? p.lon : (p.lon ?? p.lon),
          title: p.title ?? p.name ?? p.title
        }))
        .filter(p => typeof p.lat === 'number' && typeof p.lon === 'number');
      
      setRemainingPois(valid);
      setCurrentTargetIndex(0);
      setCompletedSegments([]);
    }, [pois]);

    /**
     * Calculate and draw optimal route from current position to all remaining POIs
     * Updates route visualization on map
     */
    useEffect(() => {
      if (!mapRef.current) return;

      // Determine starting position (plane if available, otherwise user coords)
      let startLat, startLon;
      const planeLatLng = planeMarkerRef.current?.getLatLng?.();
      if (planeLatLng) {
        startLat = planeLatLng.lat;
        startLon = planeLatLng.lng;
      } else if (typeof userCoords.lat === 'number' && typeof userCoords.lon === 'number') {
        startLat = userCoords.lat;
        startLon = userCoords.lon;
      } else {
        return;
      }

      const start = { lat: startLat, lon: startLon };

      // Clear route if no POIs remaining
      if (!remainingPois || remainingPois.length === 0) {
        setOrderedRoute([]);
        if (routeLayerRef.current) routeLayerRef.current.clearLayers();
        return;
      }

      // Calculate optimal route order
      const ordered = nearestNeighborOrder(start, remainingPois);
      setOrderedRoute(ordered);
      setCurrentTargetIndex(0);

      // Create layer groups if they don't exist
      if (!routeLayerRef.current) routeLayerRef.current = L.layerGroup().addTo(mapRef.current);
      if (!visitedLayerRef.current) visitedLayerRef.current = L.layerGroup().addTo(mapRef.current);
      
      const layer = routeLayerRef.current;
      layer.clearLayers();

      // Draw route polyline
      const coords = [[start.lat, start.lon], ...ordered.map(p => [p.lat, p.lon])];
      const poly = L.polyline(coords, {
        color: palette?.accent || "#00bcd4",
        weight: 3,
        opacity: 0.9,
        smoothFactor: 1,
        noClip: true
      });
      layer.addLayer(poly);

      // Fit map bounds to show entire route
      if (coords.length > 1) {
        try {
          const bounds = L.latLngBounds(coords);
          mapRef.current.fitBounds(bounds, { padding: [60, 60] });
        } catch (e) {}
      }
    }, [remainingPois, nearestNeighborOrder, userCoords]);

    /**
     * Monitor plane position and mark POIs as visited when within threshold
     * Updates visited route segments with red color
     * Checks every second for proximity to target POI
     */
    useEffect(() => {
      const interval = setInterval(() => {
        if (!mapRef.current || !planeMarkerRef.current) return;
        if (!orderedRoute || orderedRoute.length === 0) return;
        
        const idx = currentTargetIndex >= 0 ? currentTargetIndex : 0;
        const target = orderedRoute[idx];
        if (!target) return;

        const planeLatLng = planeMarkerRef.current.getLatLng();
        if (!planeLatLng) return;
        
        const distKm = haversine(planeLatLng.lat, planeLatLng.lng, target.lat, target.lon);
        const thresholdKm = 0.2; // 200 meters threshold

        // Mark as visited if within threshold
        if (distKm <= thresholdKm) {
          const planePos = planeMarkerRef.current.getLatLng();
          const targetPos = [target.lat, target.lon];
          
          // Draw completed segment in red
          const completedSegment = L.polyline([[planePos.lat, planePos.lng], targetPos], {
            color: "#ff0000",
            weight: 3,
            opacity: 0.9,
            smoothFactor: 1,
            noClip: true
          });
          
          if (visitedLayerRef.current) {
            visitedLayerRef.current.addLayer(completedSegment);
          }
          
          setCompletedSegments(prev => [...prev, { 
            from: [planePos.lat, planePos.lng], 
            to: targetPos 
          }]);
          
          // Remove visited POI from remaining list
          setRemainingPois(prev => {
            const next = prev.filter(p => p.id !== target.id);
            return next;
          });
          setCurrentTargetIndex(0);
        }
      }, 1000);

      return () => clearInterval(interval);
    }, [orderedRoute, currentTargetIndex]);

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
    const focusOnPoi = (poi) => {
        if (mapRef.current && poi?.lat && poi?.lon) {
            // Disable follow plane mode
            setFollowPlane(false);
            followRef.current = false;
            
            // Update the follow button UI if the update function exists
            if (updateFollowButtonRef.current) {
                updateFollowButtonRef.current();
            }
            
            // Center map on POI with maximum zoom (18 is Leaflet's default max zoom)
            const maxZoom = mapRef.current.getMaxZoom() || 18;
            mapRef.current.setView([poi.lat, poi.lon], maxZoom, {
                animate: true,
                duration: 1
            });
        }
    };

    /**
     * Fetches POIs around current plane position using Wikipedia geosearch API
     * Integrates with MSFS SimVar to get real-time plane coordinates
     * @async
     */
    const fetchPoisAroundPlane = useCallback(async () => {
        try {
            // Get plane coordinates from MSFS SimVar
            const lat = SimVar.GetSimVarValue("PLANE LATITUDE", "degrees");
            const lon = SimVar.GetSimVarValue("PLANE LONGITUDE", "degrees");
            
            if (typeof lat !== "number" || typeof lon !== "number") return;

            setUserCoords({ lat, lon });

            // Wikipedia geosearch API
            const url = `https://en.wikipedia.org/w/api.php?action=query&list=geosearch&gscoord=${lat}|${lon}&gsradius=5000&gslimit=10&format=json&origin=*`;
            
            const res = await fetch(url);
            const data = await res.json();
            if (data.query?.geosearch) {
                setPois(data.query.geosearch);
            }
        } catch (err) {
            console.error("Error fetching POIs:", err);
            setPois([]);
        }
    }, [setPois, setUserCoords]);

    /**
     * Initialize Leaflet map with custom controls and plane marker
     * Creates map instance, adds tiles, and sets up MSFS integration controls
     */
    useEffect(() => {
        // Clean up existing map
        if (mapRef.current) {
            mapRef.current.remove();
            mapRef.current = null;
        }

        if (!containerRef.current) return;
        if (typeof userCoords.lat !== "number" || typeof userCoords.lon !== "number") return;

        // Create map instance
        const map = L.map(containerRef.current, { 
            preferCanvas: true,
            zoomControl: true,
            attributionControl: false
        }).setView([userCoords.lat, userCoords.lon], 13);

        // Add OpenStreetMap tile layer
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
            attribution: '&copy; OpenStreetMap contributors',
        }).addTo(map);

        mapRef.current = map;
        poiLayerRef.current = L.layerGroup().addTo(map);
        visitedLayerRef.current = L.layerGroup().addTo(map);

        // Create custom plane icon with SVG
        const planeIcon = L.divIcon({
            className: "plane-icon",
            html: `
                <svg viewBox="0 0 64 64" class="plane-svg" width="40" height="40">
                    <path fill="${palette?.accent || "#00bcd4"}" d="M30 4 L34 4 L36 22 L56 28 L56 32 L36 34 L34 60 L30 60 L28 34 L8 32 L8 28 L28 22 Z"/>
                    <circle cx="32" cy="10" r="3" fill="#e6f9fc"/>
                </svg>`,
            iconSize: [40, 40],
            iconAnchor: [20, 20],
        });

        planeMarkerRef.current = L.marker([userCoords.lat, userCoords.lon], { icon: planeIcon }).addTo(map);

        /**
         * Custom Leaflet Control: Follow Plane Toggle
         * Allows user to enable/disable automatic map centering on plane
         */
        const FollowControl = L.Control.extend({
            options: { position: "topleft" },
            onAdd: function() {
                const container = L.DomUtil.create("div", "leaflet-bar leaflet-control");
                const btn = L.DomUtil.create("div", "", container);
                btn.title = "Follow plane"; // Translated from "Seguir avión"
                btn.style.width = "30px";
                btn.style.height = "30px";
                btn.style.display = "flex";
                btn.style.alignItems = "center";
                btn.style.justifyContent = "center";
                btn.style.cursor = "pointer";
                btn.style.backgroundColor = "#fff";

                // Create React root for the icon
                const root = createRoot(btn);

                const updateButton = () => {
                    const isFollowing = followRef.current;
                    const iconColor = isFollowing ? (palette?.dark || "#000") : "#000";
                    const bgColor = isFollowing ? (palette?.accent || "#00bcd4") : "#fff";
                    
                    btn.style.backgroundColor = bgColor;
                    
                    // Render Material-UI Flight icon
                    root.render(
                        React.createElement(FlightIcon, {
                            style: { 
                                fontSize: "18px", 
                                color: iconColor,
                                transform: "rotate(45deg)" // Diagonal orientation like a plane in flight
                            }
                        })
                    );
                };
                
                // Store the update function so it can be called externally
                updateFollowButtonRef.current = updateButton;
                updateButton();

                L.DomEvent.on(btn, "click", (e) => {
                    L.DomEvent.stopPropagation(e);
                    L.DomEvent.preventDefault(e);
                    const newVal = !followRef.current;
                    setFollowPlane(newVal);
                    followRef.current = newVal;
                    updateButton();
                });

                L.DomEvent.disableClickPropagation(container);
                L.DomEvent.disableScrollPropagation(container);
                return container;
            }
        });

        /**
         * Custom Leaflet Control: Fetch Nearby POIs
         * Triggers Wikipedia search for POIs near current plane position
         */
        const FetchPoisControl = L.Control.extend({
            options: { position: "topleft" },
            onAdd: function(map) {
                const container = L.DomUtil.create("div", "leaflet-bar leaflet-control");
                const button = L.DomUtil.create("div", "", container);
                button.title = "Search nearby POIs"; // Translated from "Buscar POIs cercanos"
                button.style.width = "30px";
                button.style.height = "30px";
                button.style.display = "flex";
                button.style.alignItems = "center";
                button.style.justifyContent = "center";
                button.style.cursor = "pointer";
                button.style.backgroundColor = "#fff";

                // Create React root for the search icon
                const root = createRoot(button);
                root.render(
                    React.createElement(SearchIcon, {
                        style: { 
                            fontSize: "18px", 
                            color: "#000"
                        }
                    })
                );

                L.DomEvent.on(button, "click", function(e) {
                    L.DomEvent.preventDefault(e);
                    L.DomEvent.stopPropagation(e);
                    fetchPoisAroundPlane();
                });

                L.DomEvent.disableClickPropagation(container);
                L.DomEvent.disableScrollPropagation(container);
                return container;
            }
        });

        // Add custom controls to map
        new FollowControl().addTo(mapRef.current);
        new FetchPoisControl().addTo(mapRef.current);

        // Cleanup on unmount
        return () => {
            map.remove();
            mapRef.current = null;
            poiLayerRef.current = null;
            planeMarkerRef.current = null;
            visitedLayerRef.current = null;
        };
    }, [fetchPoisAroundPlane]);

    /**
     * Real-time plane position and heading update loop
     * Polls MSFS SimVar every second for:
     * - Plane latitude/longitude
     * - Plane heading (for icon rotation)
     * Updates plane marker position and rotation on map
     */
    useEffect(() => {
        const interval = setInterval(() => {
            try {
                // Get plane data from MSFS SimVar
                const lat = SimVar.GetSimVarValue("PLANE LATITUDE", "degrees");
                const lon = SimVar.GetSimVarValue("PLANE LONGITUDE", "degrees");
                const hdg = SimVar.GetSimVarValue("PLANE HEADING DEGREES TRUE", "degrees");

                if (typeof lat === "number" && typeof lon === "number") {
                    if (planeMarkerRef.current) {
                        // Update plane position
                        planeMarkerRef.current.setLatLng([lat, lon]);

                        // Center map on plane if follow mode is enabled
                        if (mapRef.current && followRef.current) {
                            mapRef.current.setView([lat, lon], mapRef.current.getZoom() || 13);
                        }

                        // Rotate plane icon to match heading
                        const el = planeMarkerRef.current.getElement();
                        if (el) {
                            const svg = el.querySelector(".plane-svg");
                            if (svg) svg.style.transform = `rotate(${hdg}deg)`;
                        }
                    }
                }
            } catch (error) {
                console.error("Error getting plane coordinates:", error); // Translated from Spanish
            }
        }, 1000);

        return () => clearInterval(interval);
    }, []);

    /**
     * Render POI markers on the map
     * Creates clickable markers with popups for each POI
     * Updates when POI list or selection changes
     */
    useEffect(() => {
        if (!mapRef.current || !poiLayerRef.current) return;
        const layer = poiLayerRef.current;
        layer.clearLayers();

        // Create POI marker icons - Normal and selected states
        const createPoiIcon = (isSelected = false) => L.divIcon({
            className: "poi-icon",
            html: `
                <svg viewBox="0 0 24 24" width="32" height="32" fill="${isSelected ? '#a80000ff' : '#006b4a'}">
                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                </svg>
            `,
            iconSize: [32, 32],
            iconAnchor: [16, 32], // Anchor at the bottom point of the pin
        });

        const normalIcon = createPoiIcon(false);
        const selectedIcon = createPoiIcon(true);

        // Add marker for each POI
        pois.forEach((poi) => {
            if (typeof poi.lat !== "number" || typeof poi.lon !== "number") return;

            // Check if this POI is currently selected
            const isSelected = selectedPoi && selectedPoi.pageid === poi.pageid;
            const marker = L.marker([poi.lat, poi.lon], { 
                icon: isSelected ? selectedIcon : normalIcon 
            });

            // Handle marker click - select POI and open Wikipedia popup
            marker.on("click", () => {
                if (typeof setSelectedPoi === "function") setSelectedPoi(poi);
            });

            layer.addLayer(marker);
        });

        // Ensure popups appear above other UI elements
        try {
            const panes = mapRef.current.getPanes && mapRef.current.getPanes();
            if (panes && panes.popupPane) panes.popupPane.style.zIndex = 5000;
        } catch (e) {}

        return () => {
            if (layer) layer.clearLayers();
        };
    }, [pois, setSelectedPoi, selectedPoi]);

    return (
        <Box sx={{ 
            position: "absolute",
            top: 93,
            left: 400,
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
            {selectedPoi && (
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
            )}
        </Box>
    );
}



