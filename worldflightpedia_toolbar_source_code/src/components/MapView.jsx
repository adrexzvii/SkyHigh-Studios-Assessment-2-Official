// /**
//  * MapView.jsx - Interactive Map Component with Flight Planning
//  * 
//  * Main map component that integrates:
//  * - Leaflet map with OpenStreetMap tiles
//  * - Microsoft Flight Simulator (MSFS) integration via SimVar
//  * - Real-time plane tracking and heading display
//  * - Automatic route planning using nearest neighbor algorithm
//  * - POI markers and Wikipedia integration
//  * - Visited route tracking with visual feedback
//  * - Communicate ordered POI coordinates to the WASM module via callback
//  * 
//  * @component
//  * @param {Array} pois - Array of Points of Interest to display
//  * @param {Object} userCoords - User/plane coordinates {lat, lon}
//  * @param {Object} selectedPoi - Currently selected POI
//  * @param {Function} setSelectedPoi - Function to update selected POI
//  * @param {Function} setPois - Function to update POI list
//  * @param {Function} setUserCoords - Function to update user coordinates
//  */

// import React, { useEffect, useRef, useState, useCallback } from "react";
// import L from "leaflet";
// import "leaflet/dist/leaflet.css";
// import { Box } from "@mui/material";
// import FlightIcon from "@mui/icons-material/Flight";
// import SearchIcon from "@mui/icons-material/Search";
// import PauseIcon from "@mui/icons-material/Pause";
// import PlayArrowIcon from "@mui/icons-material/PlayArrow";
// import { createRoot } from "react-dom/client";
// import palette from "../theme/palette";
// import MapPopupWikipedia from "./MapPopupWikipedia/MapPopupWikipedia";
// import { usePoiContext } from "../components/context/PoiContext";
// import { useCommBus } from "../hooks/useCommBus";

// export default function MapView({ 
    
//     userCoords = {}, 
//     setUserCoords,
//     // onSendToWasm // Callback function to send data to WASM
// }) {
//     const { pois = [], selectedPoi, setSelectedPoi, setPois } = usePoiContext();
//     const { send, isReady } = useCommBus();
//     // Map and layer references
//     const containerRef = useRef(null);
//     const mapRef = useRef(null);
//     const poiLayerRef = useRef(null);
//     const planeMarkerRef = useRef(null);
//     const routeLayerRef = useRef(null);
//     const visitedLayerRef = useRef(null);
//     const currentSegmentRef = useRef(null); // Reference for current active segment
//     const staticSegmentsRef = useRef(null); // Reference for future static segments
//   const visitedIdsRef = useRef(new Set()); // Dedup: prevent multiple "visited" renders
//     const resizeObserverRef = useRef(null); // Tracks container size to invalidate Leaflet
//     const loopRef = useRef(null); // Singleton interval for real-time updates
//     const orderedRouteRef = useRef([]); // Mirror of orderedRoute for the loop
//     const currentSegmentLineRef = useRef(null); // The actual polyline for current segment
//   const pauseRef = useRef(false); // Track local pause state for pause/play control
    
//     // Flight tracking state
//     const [followPlane, setFollowPlane] = useState(true);
//     const followRef = useRef(followPlane);
//   const updateFollowButtonRef = useRef(null); // Reference to button update function
//   const updatePauseButtonRef = useRef(null);  // Reference to pause/play button update function
//   const pauseBlinkIntervalRef = useRef(null); // Interval for paused blinking effect
    
//     // Route planning state
//     const [remainingPois, setRemainingPois] = useState([]);
//     const [orderedRoute, setOrderedRoute] = useState([]);
//     const [completedSegments, setCompletedSegments] = useState([]);

//     /**
//      * Calculates distance between two coordinates using Haversine formula
//      * @param {number} lat1 - First latitude in degrees
//      * @param {number} lon1 - First longitude in degrees
//      * @param {number} lat2 - Second latitude in degrees
//      * @param {number} lon2 - Second longitude in degrees
//      * @returns {number} Distance in kilometers
//      */
//     const haversine = (lat1, lon1, lat2, lon2) => {
//       const R = 6371; // Earth's radius in kilometers
//       const toRad = (v) => (v * Math.PI) / 180;
//       const dLat = toRad(lat2 - lat1);
//       const dLon = toRad(lon2 - lon1);
//       const a =
//         Math.sin(dLat / 2) ** 2 +
//         Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
//       return 2 * R * Math.asin(Math.sqrt(a));
//     };

//     /**
//      * Orders POIs using nearest neighbor algorithm for optimal route planning
//      * @param {Object} start - Starting coordinates {lat, lon}
//      * @param {Array} points - Array of POI objects with lat/lon
//      * @returns {Array} Ordered array of POIs for optimal route
//      */
//     /**
//      * Orders POIs using nearest neighbor heuristic from a starting coordinate.
//      * Complexity ~ O(n^2), good enough for small/medium lists.
//      */
//     const nearestNeighborOrder = useCallback((start, points) => {
//       if (!start || !Array.isArray(points)) return [];
//       const pts = points.map(p => ({ ...p }));
//       const order = [];
//       let cur = { lat: start.lat, lon: start.lon };

//       // Greedy algorithm: always choose nearest unvisited point
//       while (pts.length) {
//         let bestIdx = 0;
//         let bestDist = Infinity;
//         for (let i = 0; i < pts.length; i++) {
//           const p = pts[i];
//           const d = haversine(cur.lat, cur.lon, p.lat, p.lon);
//           if (d < bestDist) {
//             bestDist = d;
//             bestIdx = i;
//           }
//         }
//         const next = pts.splice(bestIdx, 1)[0];
//         order.push(next);
//         cur = { lat: next.lat, lon: next.lon };
//       }
//       return order;
//     }, []);

//     /**
//      * Process and validate incoming POIs
//      * Maps POIs to standard format and filters invalid coordinates
//      */
//     useEffect(() => {
//       if (!Array.isArray(pois)) return;
      
//       // Map incoming POIs to objects with lat/lon and id/title (avoid mutating original)
//       const valid = pois
//         .map(p => ({
//           id: p.id ?? (p.pageid ?? `${p.lat}-${p.lon}`),
//           lat: typeof p.lat === 'number' ? p.lat : (p.lat ?? p.lat),
//           lon: typeof p.lon === 'number' ? p.lon : (p.lon ?? p.lon),
//           title: p.title ?? p.name ?? p.title
//         }))
//         .filter(p => typeof p.lat === 'number' && typeof p.lon === 'number');
      
//       setRemainingPois(valid);
//       setCompletedSegments([]);
//       // Reset visited IDs when the POI list changes
//       if (visitedIdsRef.current) visitedIdsRef.current.clear();
//     }, [pois]);

//     /**
//      * Calculate and draw optimal route from current position to all remaining POIs
//      * Updates route visualization on map with independent segments
//      */
//     useEffect(() => {
//       if (!mapRef.current) return;

//       // Determine starting position (plane if available, otherwise user coords)
//       let startLat, startLon;
//       const planeLatLng = planeMarkerRef.current?.getLatLng?.();
//       if (planeLatLng) {
//         startLat = planeLatLng.lat;
//         startLon = planeLatLng.lng;
//       } else if (typeof userCoords.lat === 'number' && typeof userCoords.lon === 'number') {
//         startLat = userCoords.lat;
//         startLon = userCoords.lon;
//       } else {
//         return;
//       }

//       const start = { lat: startLat, lon: startLon };

//       // Clear route if no POIs remaining
//       if (!remainingPois || remainingPois.length === 0) {
//         setOrderedRoute([]);
//         if (currentSegmentRef.current) currentSegmentRef.current.clearLayers();
//         if (staticSegmentsRef.current) staticSegmentsRef.current.clearLayers();
//         if (visitedIdsRef.current) visitedIdsRef.current.clear();
//         return;
//       }

//       // Calculate optimal route order
//       const ordered = nearestNeighborOrder(start, remainingPois);
//       setOrderedRoute(ordered);

//       // Create layer groups if they don't exist
//       if (!visitedLayerRef.current) visitedLayerRef.current = L.layerGroup().addTo(mapRef.current);
//       if (!currentSegmentRef.current) currentSegmentRef.current = L.layerGroup().addTo(mapRef.current);
//       if (!staticSegmentsRef.current) staticSegmentsRef.current = L.layerGroup().addTo(mapRef.current);
      
//       // Clear previous segments
//       currentSegmentRef.current.clearLayers();
//       staticSegmentsRef.current.clearLayers();

//       // Draw static segments between POIs (not including first segment from plane)
//       if (ordered.length > 1) {
//         for (let i = 0; i < ordered.length - 1; i++) {
//           const from = ordered[i];
//           const to = ordered[i + 1];
//           const staticSegment = L.polyline(
//             [[from.lat, from.lon], [to.lat, to.lon]], 
//             {
//               color: "#006b4a",
//               weight: 5,
//               opacity: 0.8,
//               smoothFactor: 1,
//               noClip: true,
//               dashArray: '10, 10' // Dashed line for future segments
//             }
//           );
//           staticSegmentsRef.current.addLayer(staticSegment);
//         }
//       }

//       // Fit map bounds to show entire route
//       if (ordered.length > 0) {
//         try {
//           const coords = [[start.lat, start.lon], ...ordered.map(p => [p.lat, p.lon])];
//           const bounds = L.latLngBounds(coords);
//           mapRef.current.fitBounds(bounds, { padding: [60, 60] });
//         } catch (e) {}
//       }
//     }, [remainingPois, nearestNeighborOrder, userCoords]);

//     /**
//      * Monitor plane position, update current segment in real-time, and mark POIs as visited
//      * Updates only the active segment between plane and next POI
//      * Checks every second for proximity to target POI
//      */
//     // Keep an up-to-date mirror of orderedRoute for the singleton loop
//     useEffect(() => {
//       orderedRouteRef.current = Array.isArray(orderedRoute) ? orderedRoute : [];
//     }, [orderedRoute]);

//     /**
//      * Single real-time loop: updates plane→first-POI segment and handles arrivals.
//      * Uses refs to avoid multiple intervals and to update polyline in place.
//      */
//     useEffect(() => {
//       if (loopRef.current) {
//         clearInterval(loopRef.current);
//         loopRef.current = null;
//       }
//       loopRef.current = setInterval(() => {
//         const map = mapRef.current;
//         const marker = planeMarkerRef.current;
//         const route = orderedRouteRef.current;
//         if (!map || !marker) return;
//         if (!route || route.length === 0) {
//           // No route: remove current dynamic line if any
//           if (currentSegmentLineRef.current && currentSegmentRef.current) {
//             try { currentSegmentRef.current.removeLayer(currentSegmentLineRef.current); } catch (_) {}
//             currentSegmentLineRef.current = null;
//           }
//           return;
//         }

//         const target = route[0];
//         if (!target) return;

//         const planeLatLng = marker.getLatLng();
//         if (!planeLatLng) return;

//         // Ensure the layer group exists
//         if (!currentSegmentRef.current && mapRef.current) {
//           currentSegmentRef.current = L.layerGroup().addTo(mapRef.current);
//         }

//         const latlngs = [[planeLatLng.lat, planeLatLng.lng], [target.lat, target.lon]];

//         // Update or create the current segment polyline in place
//         if (currentSegmentLineRef.current) {
//           try { currentSegmentLineRef.current.setLatLngs(latlngs); } catch (_) {}
//         } else {
//           currentSegmentLineRef.current = L.polyline(latlngs, {
//             color: palette?.accent || "#00bcd4",
//             weight: 3,
//             opacity: 0.9,
//             smoothFactor: 1,
//             noClip: true
//           });
//           currentSegmentRef.current.addLayer(currentSegmentLineRef.current);
//         }

//         // Arrival check
//         const distKm = haversine(planeLatLng.lat, planeLatLng.lng, target.lat, target.lon);
//         const thresholdKm = 0.2; // 200 meters
//         if (distKm <= thresholdKm && !visitedIdsRef.current.has(target.id)) {
//           visitedIdsRef.current.add(target.id);

//           const planePos = marker.getLatLng();
//           const targetPos = [target.lat, target.lon];

//           // Notify MSFS via L:var to indicate we've reached the next POI
//           try {
//               SimVar.SetSimVarValue("L:WFP_NextPoi", "Bool", 1);
//               console.log("L:WFP_NextPoi 1");
//               setTimeout(() => {
//                 SimVar.SetSimVarValue("L:WFP_NextPoi", "Bool", 0);
//                 console.log("L:WFP_NextPoi 0");
//               }, 1000);
            
//           } catch (e) {
//             console.warn("[MapView] Error setting L:WFP_NextPoi", e);
//           }

//           // Auto-pause simulator when reaching a POI and sync UI
//           try {
//             if (typeof SimVar?.SetSimVarValue === 'function') {
//               SimVar.SetSimVarValue("K:PAUSE_SET", "Bool", 1);
//             }
//             pauseRef.current = true;
//             if (typeof updatePauseButtonRef.current === 'function') {
//               try { updatePauseButtonRef.current(); } catch (_) {}
//             }
//           } catch (e) {
//             console.warn("[MapView] Error auto-pausing on POI arrival", e);
//           }

//           // Completed segment in red
//           const completedSegment = L.polyline([[planePos.lat, planePos.lng], targetPos], {
//             color: "#ff0000",
//             weight: 3,
//             opacity: 0.9,
//             smoothFactor: 1,
//             noClip: true
//           });
//           if (visitedLayerRef.current) visitedLayerRef.current.addLayer(completedSegment);

//           // Remove the dynamic line (it will be recreated for the next target on next tick)
//           if (currentSegmentLineRef.current && currentSegmentRef.current) {
//             try { currentSegmentRef.current.removeLayer(currentSegmentLineRef.current); } catch (_) {}
//             currentSegmentLineRef.current = null;
//           }

//           // Rebuild static segments excluding the first leg we just completed
//           if (staticSegmentsRef.current && route.length > 1) {
//             staticSegmentsRef.current.clearLayers();
//             for (let i = 1; i < route.length - 1; i++) {
//               const from = route[i];
//               const to = route[i + 1];
//               const staticSegment = L.polyline([[from.lat, from.lon], [to.lat, to.lon]], {
//                 color: "#006b4a",
//                 weight: 5,
//                 opacity: 0.8,
//                 smoothFactor: 1,
//                 noClip: true,
//                 dashArray: '10, 10'
//               });
//               staticSegmentsRef.current.addLayer(staticSegment);
//             }
//           }

//           setCompletedSegments(prev => [...prev, { from: [planePos.lat, planePos.lng], to: targetPos }]);
//           setRemainingPois(prev => prev.filter(p => p.id !== target.id));
//         }
//       }, 1000);

//       return () => {
//         if (loopRef.current) clearInterval(loopRef.current);
//         loopRef.current = null;
//       };
//     }, []);

//     /**
//      * Sync followPlane state with ref for use in Leaflet controls
//      */
//     useEffect(() => { 
//       followRef.current = followPlane; 
//     }, [followPlane]);

//     /**
//      * Centers map on specified POI with animation
//      * Disables follow plane mode when manually focusing on a POI
//      * @param {Object} poi - POI object with lat/lon coordinates
//      */
//     const focusOnPoi = (poi) => {
//         if (mapRef.current && poi?.lat && poi?.lon) {
//             // Disable follow plane mode
//             setFollowPlane(false);
//             followRef.current = false;
            
//             // Update the follow button UI if the update function exists
//             if (updateFollowButtonRef.current) {
//                 updateFollowButtonRef.current();
//             }
            
//             // Center map on POI with maximum zoom (18 is Leaflet's default max zoom)
//             const maxZoom = mapRef.current.getMaxZoom() || 18;
//             mapRef.current.setView([poi.lat, poi.lon], maxZoom, {
//                 animate: true,
//                 duration: 1
//             });
//         }
//     };

//   /**
//    * Sends POI coordinates to WASM module via callback
//    * Orders POIs by shortest path (nearest neighbor) starting from provided start
//    * Creates JSON with only lat/lon for each POI
//    * @param {Array} poisArray - Array of POI objects
//    * @param {{lat:number, lon:number}} [start] - Optional starting coordinate
//    */
//   /**
//    * Sends POIs ordered by shortest path to WASM via provided callback.
//    * Falls back to current plane or userCoords if no explicit start is given.
//    */
//   const sendPoisToWasm = useCallback((poisArray, start) => {
//     if (!isReady){
//       console.warn("[Mapview] CommBus not ready yet");
//       return;
//     }

//     try {
//       // Determine start position: prefer explicit start, else plane marker, else userCoords
//       let startLat, startLon;
//       if (start && typeof start.lat === 'number' && typeof start.lon === 'number') {
//         startLat = start.lat; startLon = start.lon;
//       } else {
//         const planeLatLng = planeMarkerRef.current?.getLatLng?.();
//         if (planeLatLng) {
//           startLat = planeLatLng.lat; startLon = planeLatLng.lng;
//         } else if (typeof userCoords.lat === 'number' && typeof userCoords.lon === 'number') {
//           startLat = userCoords.lat; startLon = userCoords.lon;
//         }
//       }

//       const startCoord = (typeof startLat === 'number' && typeof startLon === 'number')
//         ? { lat: startLat, lon: startLon }
//         : null;

//       // Filter to valid coordinate objects
//       const validPois = Array.isArray(poisArray)
//         ? poisArray.filter(p => typeof p?.lat === 'number' && typeof p?.lon === 'number')
//         : [];

//       // Order using nearest neighbor if we have a starting point
//       const ordered = startCoord ? nearestNeighborOrder(startCoord, validPois) : validPois;

//       // Create simplified JSON with only coordinates
//       const poisCoordinates = ordered.map(poi => ({ lat: poi.lat, lon: poi.lon }));

//       // Create payload for WASM
//       const payload = {
//         type: "POI_COORDINATES",
//         data: poisCoordinates,
//         count: poisCoordinates.length
//       };

//       console.log("[MapView] Sending ordered POI coordinates to WASM:", payload);

//       // Send via callback trough useCommBus hook
//       send("OnMessageFromJs", payload);
//       console.log("[MapView] Ordered POI coordinates sent successfully");
//     } catch (err) {
//       console.error("[MapView] Error preparing ordered POIs for WASM:", err);
//     }
//   }, [send, nearestNeighborOrder, userCoords, isReady]);

//     /**
//      * Fetches POIs around current plane position using Wikipedia geosearch API
//      * Integrates with MSFS SimVar to get real-time plane coordinates
//      * Sends POI coordinates to WASM module via CommBus
//      * @async
//      */
//   /**
//    * Fetches POIs around current plane position from Wikipedia and sends them to WASM
//    * ordered by nearest-neighbor from the current plane position.
//    */
//   const fetchPoisAroundPlane = useCallback(async () => {
//     // Avoid sending/processing route payloads until CommBus is ready
//     if (!isReady) return;
//         try {
//             // Get plane coordinates from MSFS SimVar
//             const lat = SimVar.GetSimVarValue("PLANE LATITUDE", "degrees");
//             const lon = SimVar.GetSimVarValue("PLANE LONGITUDE", "degrees");
            
//             if (typeof lat !== "number" || typeof lon !== "number") return;

//             setUserCoords({ lat, lon });

//             // Wikipedia geosearch API
//             const url = `https://en.wikipedia.org/w/api.php?action=query&list=geosearch&gscoord=${lat}|${lon}&gsradius=5000&gslimit=10&format=json&origin=*`;
            
//       const res = await fetch(url);
//       if (!res.ok) throw new Error(`Wikipedia API error: ${res.status}`);
//             const data = await res.json();
//             if (data.query?.geosearch) {
//         const fetchedPois = data.query.geosearch;
//         setPois(fetchedPois);

//         // Send ordered POI coordinates to WASM using current plane position as start
//         sendPoisToWasm(fetchedPois, { lat, lon });
//             }
//         } catch (err) {
//             console.error("Error fetching POIs:", err);
//             setPois([]);
//         }
//   }, [setPois, setUserCoords, isReady]);

//     /**
//      * Initialize Leaflet map with custom controls and plane marker
//      * Creates map instance, adds tiles, and sets up MSFS integration controls
//      */
//     useEffect(() => {
//         // Clean up existing map
//         if (mapRef.current) {
//             mapRef.current.remove();
//             mapRef.current = null;
//         }

//         if (!containerRef.current) return;
//         if (typeof userCoords.lat !== "number" || typeof userCoords.lon !== "number") return;

//         // Create map instance
//         const map = L.map(containerRef.current, { 
//             preferCanvas: true,
//             zoomControl: true,
//             attributionControl: false
//         }).setView([userCoords.lat, userCoords.lon], 13);

//         // Add OpenStreetMap tile layer
//         L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
//             attribution: '&copy; OpenStreetMap contributors',
//         }).addTo(map);

//         mapRef.current = map;
//         poiLayerRef.current = L.layerGroup().addTo(map);
//         visitedLayerRef.current = L.layerGroup().addTo(map);

//         // Create custom plane icon with SVG
//         const planeIcon = L.divIcon({
//             className: "plane-icon",
//             html: `
//                 <svg viewBox="0 0 64 64" class="plane-svg" width="40" height="40">
//                     <path fill="#006b4a" d="M30 4 L34 4 L36 22 L56 28 L56 32 L36 34 L34 60 L30 60 L28 34 L8 32 L8 28 L28 22 Z"/>
//                     <circle cx="32" cy="10" r="3" fill="#e6f9fc"/>
//                 </svg>`,
//             iconSize: [40, 40],
//             iconAnchor: [20, 20],
//         });

//         planeMarkerRef.current = L.marker([userCoords.lat, userCoords.lon], { icon: planeIcon }).addTo(map);

//         /**
//          * Custom Leaflet Control: Follow Plane Toggle
//          * Allows user to enable/disable automatic map centering on plane
//          */
//         const FollowControl = L.Control.extend({
//             options: { position: "topleft" },
//             onAdd: function() {
//                 const container = L.DomUtil.create("div", "leaflet-bar leaflet-control");
//                 const btn = L.DomUtil.create("div", "", container);
//                 btn.title = "Follow plane"; // Translated from "Seguir avión"
//                 btn.style.width = "30px";
//                 btn.style.height = "30px";
//                 btn.style.display = "flex";
//                 btn.style.alignItems = "center";
//                 btn.style.justifyContent = "center";
//                 btn.style.cursor = "pointer";
//                 btn.style.backgroundColor = "#fff";

//                 // Create React root for the icon
//                 const root = createRoot(btn);

//                 const updateButton = () => {
//                     const isFollowing = followRef.current;
//                     const iconColor = isFollowing ? (palette?.dark || "#000") : "#000";
//                     const bgColor = isFollowing ? (palette?.accent || "#00bcd4") : "#fff";
                    
//                     btn.style.backgroundColor = bgColor;
                    
//                     // Render Material-UI Flight icon
//                     root.render(
//                         React.createElement(FlightIcon, {
//                             style: { 
//                                 fontSize: "18px", 
//                                 color: iconColor,
//                                 transform: "rotate(45deg)" // Diagonal orientation like a plane in flight
//                             }
//                         })
//                     );
//                 };
                
//                 // Store the update function so it can be called externally
//                 updateFollowButtonRef.current = updateButton;
//                 updateButton();

//                 L.DomEvent.on(btn, "click", (e) => {
//                     L.DomEvent.stopPropagation(e);
//                     L.DomEvent.preventDefault(e);
//                     const newVal = !followRef.current;
//                     setFollowPlane(newVal);
//                     followRef.current = newVal;
//                     updateButton();
//                 });

//                 L.DomEvent.disableClickPropagation(container);
//                 L.DomEvent.disableScrollPropagation(container);
//                 return container;
//             }
//         });

//         /**
//          * Custom Leaflet Control: Fetch Nearby POIs
//          * Triggers Wikipedia search for POIs near current plane position
//          */
//   const FetchPoisControl = L.Control.extend({
//             options: { position: "topleft" },
//             onAdd: function(map) {
//                 const container = L.DomUtil.create("div", "leaflet-bar leaflet-control");
//                 const button = L.DomUtil.create("div", "", container);
//                 button.title = "Search nearby POIs"; // Translated from "Buscar POIs cercanos"
//                 button.style.width = "30px";
//                 button.style.height = "30px";
//                 button.style.display = "flex";
//                 button.style.alignItems = "center";
//                 button.style.justifyContent = "center";
//                 button.style.cursor = "pointer";
//                 button.style.backgroundColor = "#fff";

//                 // Create React root for the search icon
//                 const root = createRoot(button);
//                 root.render(
//                     React.createElement(SearchIcon, {
//                         style: { 
//                             fontSize: "18px", 
//                             color: "#000"
//                         }
//                     })
//                 );

//                 L.DomEvent.on(button, "click", function(e) {
//                     L.DomEvent.preventDefault(e);
//                     L.DomEvent.stopPropagation(e);
//                     fetchPoisAroundPlane();
//                 });

//                 L.DomEvent.disableClickPropagation(container);
//                 L.DomEvent.disableScrollPropagation(container);
//                 return container;
//             }
//         });

//     /**
//      * Custom Leaflet Control: Pause/Play Simulator
//      * Toggles MSFS pause state via K:PAUSE_SET event (Bool 0/1)
//      */
//     const PausePlayControl = L.Control.extend({
//       options: { position: "topleft" },
//       onAdd: function() {
//         const container = L.DomUtil.create("div", "leaflet-bar leaflet-control");
//         const btn = L.DomUtil.create("div", "", container);
//         btn.title = "Pause/Resume simulator";
//         btn.style.width = "30px";
//         btn.style.height = "30px";
//         btn.style.display = "flex";
//         btn.style.alignItems = "center";
//         btn.style.justifyContent = "center";
//         btn.style.cursor = "pointer";
//         btn.style.backgroundColor = "#fff";
//         btn.setAttribute('aria-label', 'Pause or resume simulator');

//         const root = createRoot(btn);

//         const renderIcon = () => {
//           const isPaused = pauseRef.current;
//           root.render(React.createElement(isPaused ? PlayArrowIcon : PauseIcon, {
//             style: { fontSize: "18px", color: "#000" }
//           }));
//           btn.title = isPaused ? "Resume simulator" : "Pause simulator";
//         };
//         // Start/stop a green/white blinking effect while paused
//         const applyBlinking = () => {
//           const isPaused = pauseRef.current;
//           // Clear any previous blink interval
//           if (pauseBlinkIntervalRef.current) {
//             try { clearInterval(pauseBlinkIntervalRef.current); } catch (_) {}
//             pauseBlinkIntervalRef.current = null;
//           }
//           // When paused: blink between green and white every 1s
//           if (isPaused) {
//             let green = true;
//             btn.style.backgroundColor = "#00b050"; // initial green
//             pauseBlinkIntervalRef.current = setInterval(() => {
//               green = !green;
//               btn.style.backgroundColor = green ? "#00b050" : "#fff";
//             }, 1000);
//           } else {
//             // Not paused: ensure default background
//             btn.style.backgroundColor = "#fff";
//           }
//         };
//         const updatePauseUI = () => {
//           renderIcon();
//           applyBlinking();
//         };
//         updatePauseUI();

//         // Expose an external updater so logic can sync UI when pausing automatically
//         updatePauseButtonRef.current = updatePauseUI;

//         L.DomEvent.on(btn, "click", (e) => {
//           L.DomEvent.stopPropagation(e);
//           L.DomEvent.preventDefault(e);
//           const newPaused = !pauseRef.current; // true means we will request pause (1)
//           try {
//             if (typeof SimVar?.SetSimVarValue === 'function') {
//               SimVar.SetSimVarValue("K:PAUSE_SET", "Bool", newPaused ? 1 : 0);
//             } else {
//               console.warn("[MapView] SimVar not available to toggle pause");
//             }
//             pauseRef.current = newPaused;
//             updatePauseUI();
//           } catch (err) {
//             console.warn("[MapView] Failed to toggle pause state", err);
//           }
//         });

//         L.DomEvent.disableClickPropagation(container);
//         L.DomEvent.disableScrollPropagation(container);
//         return container;
//       }
//     });

//     // Add custom controls to map
//   new FollowControl().addTo(mapRef.current);
//   new FetchPoisControl().addTo(mapRef.current);
//   new PausePlayControl().addTo(mapRef.current);

//     // Force initial size calculation (container may have been hidden/sized late)
//     try { map.invalidateSize(); } catch (_) {}
//     setTimeout(() => { try { map.invalidateSize(); } catch (_) {} }, 150);
//     // Resize observer to keep Leaflet layout correct without manual window resize
//     if (containerRef.current && typeof ResizeObserver !== 'undefined') {
//       resizeObserverRef.current = new ResizeObserver(() => {
//         if (mapRef.current) {
//           try { mapRef.current.invalidateSize(); } catch (_) {}
//         }
//       });
//       resizeObserverRef.current.observe(containerRef.current);
//     }

//         // Cleanup on unmount
//         return () => {
//       // Disconnect resize observer first
//       if (resizeObserverRef.current) {
//         try { resizeObserverRef.current.disconnect(); } catch (_) {}
//         resizeObserverRef.current = null;
//       }
//       // Clear blinking interval if active
//       if (pauseBlinkIntervalRef.current) {
//         try { clearInterval(pauseBlinkIntervalRef.current); } catch (_) {}
//         pauseBlinkIntervalRef.current = null;
//       }
//       map.remove();
//             mapRef.current = null;
//             poiLayerRef.current = null;
//             planeMarkerRef.current = null;
//             visitedLayerRef.current = null;
//             currentSegmentRef.current = null;
//             staticSegmentsRef.current = null;
//         };
//     }, [fetchPoisAroundPlane]);

//     /**
//      * Real-time plane position and heading update loop
//      * Polls MSFS SimVar every second for:
//      * - Plane latitude/longitude
//      * - Plane heading (for icon rotation)
//      * Updates plane marker position and rotation on map
//      */
//     useEffect(() => {
//         const interval = setInterval(() => {
//             try {
//                 // Get plane data from MSFS SimVar
//                 const lat = SimVar.GetSimVarValue("PLANE LATITUDE", "degrees");
//                 const lon = SimVar.GetSimVarValue("PLANE LONGITUDE", "degrees");
//                 const hdg = SimVar.GetSimVarValue("PLANE HEADING DEGREES TRUE", "degrees");

//                 if (typeof lat === "number" && typeof lon === "number") {
//                     if (planeMarkerRef.current) {
//                         // Update plane position
//                         planeMarkerRef.current.setLatLng([lat, lon]);

//                         // Center map on plane if follow mode is enabled
//                         if (mapRef.current && followRef.current) {
//                             mapRef.current.setView([lat, lon], mapRef.current.getZoom() || 13);
//                         }

//                         // Rotate plane icon to match heading
//                         const el = planeMarkerRef.current.getElement();
//                         if (el) {
//                             const svg = el.querySelector(".plane-svg");
//                             if (svg) svg.style.transform = `rotate(${hdg}deg)`;
//                         }
//                     }
//                 }
//             } catch (error) {
//                 console.error("Error getting plane coordinates:", error); // Translated from Spanish
//             }
//         }, 1000);

//         return () => clearInterval(interval);
//     }, []);

//     /**
//      * Render POI markers on the map
//      * Creates clickable markers with popups for each POI
//      * Updates when POI list or selection changes
//      */
//     useEffect(() => {
//         if (!mapRef.current || !poiLayerRef.current) return;
//         const layer = poiLayerRef.current;
//         layer.clearLayers();

//         // Create POI marker icons - Normal and selected states
//         const createPoiIcon = (isSelected = false) => L.divIcon({
//             className: "poi-icon",
//             html: `
//                 <svg viewBox="0 0 24 24" width="32" height="32" fill="${isSelected ? '#a80000ff' : '#006b4a'}">
//                     <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
//                 </svg>
//             `,
//             iconSize: [32, 32],
//             iconAnchor: [16, 32], // Anchor at the bottom point of the pin
//         });

//         const normalIcon = createPoiIcon(false);
//         const selectedIcon = createPoiIcon(true);

//         // Add marker for each POI
//         pois.forEach((poi) => {
//             if (typeof poi.lat !== "number" || typeof poi.lon !== "number") return;

//             // Check if this POI is currently selected
//             const isSelected = selectedPoi && selectedPoi.pageid === poi.pageid;
//             const marker = L.marker([poi.lat, poi.lon], { 
//                 icon: isSelected ? selectedIcon : normalIcon 
//             });

//             // Handle marker click - select POI and open Wikipedia popup
//             marker.on("click", () => {
//                 if (typeof setSelectedPoi === "function") setSelectedPoi(poi);
//             });

//             layer.addLayer(marker);
//         });

//         // Ensure popups appear above other UI elements
//         try {
//             const panes = mapRef.current.getPanes && mapRef.current.getPanes();
//             if (panes && panes.popupPane) panes.popupPane.style.zIndex = 5000;
//         } catch (e) {}

//         return () => {
//             if (layer) layer.clearLayers();
//         };
//     }, [pois, setSelectedPoi, selectedPoi]);

//     return (
//         <Box sx={{ 
//             position: "absolute",
//             top: 93,
//             left: 400,
//             right: 0,
//             bottom: 0,
//             bgcolor: palette.background,
//             zIndex: 0
//         }}>
//             {/* Leaflet map container */}
//             <Box
//                 ref={containerRef}
//                 sx={{
//                     width: "100%",
//                     height: "100%",
//                     position: 'relative'
//                 }}
//             />

//             {/* Wikipedia POI details popup (rendered when POI is selected) */}
//             {selectedPoi && (
//                 <Box sx={{ 
//                     position: "absolute",
//                     top: 0,
//                     left: 0,
//                     zIndex: 1200,
//                     pointerEvents: "auto"
//                 }}>
//                     <MapPopupWikipedia 
//                         poi={selectedPoi}
//                         userCoords={userCoords}
//                         onFocusPoi={focusOnPoi}
//                     />
//                 </Box>
//             )}
//         </Box>
//     );
// }

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
 * - Communicate ordered POI coordinates to the WASM module via callback
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
import PauseIcon from "@mui/icons-material/Pause";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import { createRoot } from "react-dom/client";
import palette from "../theme/palette";
import MapPopupWikipedia from "./MapPopupWikipedia/MapPopupWikipedia";
import { usePoiContext } from "../components/context/PoiContext";
import { useCommBus } from "../hooks/useCommBus";
import { nearestNeighborOrder, normalizePois } from "../utils/routeUtils";
import { haversine } from "../utils/haversine";

export default function MapView({ 
    
    userCoords = {}, 
    setUserCoords,
    // onSendToWasm // Callback function to send data to WASM
}) {
    const { pois = [], selectedPoi, setSelectedPoi, setPois } = usePoiContext();
    const { send, isReady } = useCommBus();
    // Map and layer references
    const containerRef = useRef(null);
    const mapRef = useRef(null);
    const poiLayerRef = useRef(null);
    const planeMarkerRef = useRef(null);
    const routeLayerRef = useRef(null);
    const visitedLayerRef = useRef(null);
    const currentSegmentRef = useRef(null); // Reference for current active segment
    const staticSegmentsRef = useRef(null); // Reference for future static segments
  const visitedIdsRef = useRef(new Set()); // Dedup: prevent multiple "visited" renders
    const resizeObserverRef = useRef(null); // Tracks container size to invalidate Leaflet
    const loopRef = useRef(null); // Singleton interval for real-time updates
    const orderedRouteRef = useRef([]); // Mirror of orderedRoute for the loop
    const currentSegmentLineRef = useRef(null); // The actual polyline for current segment
  const pauseRef = useRef(false); // Track local pause state for pause/play control
    
    // Flight tracking state
    const [followPlane, setFollowPlane] = useState(true);
    const followRef = useRef(followPlane);
  const updateFollowButtonRef = useRef(null); // Reference to button update function
  const updatePauseButtonRef = useRef(null);  // Reference to pause/play button update function
  const pauseBlinkIntervalRef = useRef(null); // Interval for paused blinking effect
    
    // Route planning state
    const [remainingPois, setRemainingPois] = useState([]);
    const [orderedRoute, setOrderedRoute] = useState([]);
    const [completedSegments, setCompletedSegments] = useState([]);

    /**
     * Process and validate incoming POIs
     * Maps POIs to standard format and filters invalid coordinates
     */
    useEffect(() => {
      const validPois = normalizePois(pois);
      setRemainingPois(validPois);
      setCompletedSegments([]);
      // Reset visited IDs when the POI list changes
      if (visitedIdsRef.current) visitedIdsRef.current.clear();
    }, [pois]);

    /**
     * Calculate and draw optimal route from current position to all remaining POIs
     * Updates route visualization on map with independent segments
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
        if (currentSegmentRef.current) currentSegmentRef.current.clearLayers();
        if (staticSegmentsRef.current) staticSegmentsRef.current.clearLayers();
        if (visitedIdsRef.current) visitedIdsRef.current.clear();
        return;
      }

      // Calculate optimal route order
      const ordered = nearestNeighborOrder(start, remainingPois);
      setOrderedRoute(ordered);

      // Create layer groups if they don't exist
      if (!visitedLayerRef.current) visitedLayerRef.current = L.layerGroup().addTo(mapRef.current);
      if (!currentSegmentRef.current) currentSegmentRef.current = L.layerGroup().addTo(mapRef.current);
      if (!staticSegmentsRef.current) staticSegmentsRef.current = L.layerGroup().addTo(mapRef.current);
      
      // Clear previous segments
      currentSegmentRef.current.clearLayers();
      staticSegmentsRef.current.clearLayers();

      // Draw static segments between POIs (not including first segment from plane)
      if (ordered.length > 1) {
        for (let i = 0; i < ordered.length - 1; i++) {
          const from = ordered[i];
          const to = ordered[i + 1];
          const staticSegment = L.polyline(
            [[from.lat, from.lon], [to.lat, to.lon]], 
            {
              color: "#006b4a",
              weight: 5,
              opacity: 0.8,
              smoothFactor: 1,
              noClip: true,
              dashArray: '10, 10' // Dashed line for future segments
            }
          );
          staticSegmentsRef.current.addLayer(staticSegment);
        }
      }

      // Fit map bounds to show entire route
      if (ordered.length > 0) {
        try {
          const coords = [[start.lat, start.lon], ...ordered.map(p => [p.lat, p.lon])];
          const bounds = L.latLngBounds(coords);
          mapRef.current.fitBounds(bounds, { padding: [60, 60] });
        } catch (e) {}
      }
    }, [remainingPois, nearestNeighborOrder, userCoords]);

    /**
     * Monitor plane position, update current segment in real-time, and mark POIs as visited
     * Updates only the active segment between plane and next POI
     * Checks every second for proximity to target POI
     */
    // Keep an up-to-date mirror of orderedRoute for the singleton loop
    useEffect(() => {
      orderedRouteRef.current = Array.isArray(orderedRoute) ? orderedRoute : [];
    }, [orderedRoute]);

    /**
     * Single real-time loop: updates plane→first-POI segment and handles arrivals.
     * Uses refs to avoid multiple intervals and to update polyline in place.
     */
    useEffect(() => {
      if (loopRef.current) {
        clearInterval(loopRef.current);
        loopRef.current = null;
      }
      loopRef.current = setInterval(() => {
        const map = mapRef.current;
        const marker = planeMarkerRef.current;
        const route = orderedRouteRef.current;
        if (!map || !marker) return;
        if (!route || route.length === 0) {
          // No route: remove current dynamic line if any
          if (currentSegmentLineRef.current && currentSegmentRef.current) {
            try { currentSegmentRef.current.removeLayer(currentSegmentLineRef.current); } catch (_) {}
            currentSegmentLineRef.current = null;
          }
          return;
        }

        const target = route[0];
        if (!target) return;

        const planeLatLng = marker.getLatLng();
        if (!planeLatLng) return;

        // Ensure the layer group exists
        if (!currentSegmentRef.current && mapRef.current) {
          currentSegmentRef.current = L.layerGroup().addTo(mapRef.current);
        }

        const latlngs = [[planeLatLng.lat, planeLatLng.lng], [target.lat, target.lon]];

        // Update or create the current segment polyline in place
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
          currentSegmentRef.current.addLayer(currentSegmentLineRef.current);
        }

        // Arrival check
        const distKm = haversine(planeLatLng.lat, planeLatLng.lng, target.lat, target.lon);
        const thresholdKm = 0.2; // 200 meters
        if (distKm <= thresholdKm && !visitedIdsRef.current.has(target.id)) {
          visitedIdsRef.current.add(target.id);

          const planePos = marker.getLatLng();
          const targetPos = [target.lat, target.lon];

          // Notify MSFS via L:var to indicate we've reached the next POI
          try {
              SimVar.SetSimVarValue("L:WFP_NextPoi", "Bool", 1);
              console.log("L:WFP_NextPoi 1");
              setTimeout(() => {
                SimVar.SetSimVarValue("L:WFP_NextPoi", "Bool", 0);
                console.log("L:WFP_NextPoi 0");
              }, 1000);
            
          } catch (e) {
            console.warn("[MapView] Error setting L:WFP_NextPoi", e);
          }

          // Auto-pause simulator when reaching a POI and sync UI
          try {
            if (typeof SimVar?.SetSimVarValue === 'function') {
              SimVar.SetSimVarValue("K:PAUSE_SET", "Bool", 1);
            }
            pauseRef.current = true;
            if (typeof updatePauseButtonRef.current === 'function') {
              try { updatePauseButtonRef.current(); } catch (_) {}
            }
          } catch (e) {
            console.warn("[MapView] Error auto-pausing on POI arrival", e);
          }

          // Completed segment in red
          const completedSegment = L.polyline([[planePos.lat, planePos.lng], targetPos], {
            color: "#ff0000",
            weight: 3,
            opacity: 0.9,
            smoothFactor: 1,
            noClip: true
          });
          if (visitedLayerRef.current) visitedLayerRef.current.addLayer(completedSegment);

          // Remove the dynamic line (it will be recreated for the next target on next tick)
          if (currentSegmentLineRef.current && currentSegmentRef.current) {
            try { currentSegmentRef.current.removeLayer(currentSegmentLineRef.current); } catch (_) {}
            currentSegmentLineRef.current = null;
          }

          // Rebuild static segments excluding the first leg we just completed
          if (staticSegmentsRef.current && route.length > 1) {
            staticSegmentsRef.current.clearLayers();
            for (let i = 1; i < route.length - 1; i++) {
              const from = route[i];
              const to = route[i + 1];
              const staticSegment = L.polyline([[from.lat, from.lon], [to.lat, to.lon]], {
                color: "#006b4a",
                weight: 5,
                opacity: 0.8,
                smoothFactor: 1,
                noClip: true,
                dashArray: '10, 10'
              });
              staticSegmentsRef.current.addLayer(staticSegment);
            }
          }

          setCompletedSegments(prev => [...prev, { from: [planePos.lat, planePos.lng], to: targetPos }]);
          setRemainingPois(prev => prev.filter(p => p.id !== target.id));
        }
      }, 1000);

      return () => {
        if (loopRef.current) clearInterval(loopRef.current);
        loopRef.current = null;
      };
    }, []);

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
    if (!isReady){
      console.warn("[Mapview] CommBus not ready yet");
      return;
    }

    try {
      // Determine start position: prefer explicit start, else plane marker, else userCoords
      let startLat, startLon;
      if (start && typeof start.lat === 'number' && typeof start.lon === 'number') {
        startLat = start.lat; startLon = start.lon;
      } else {
        const planeLatLng = planeMarkerRef.current?.getLatLng?.();
        if (planeLatLng) {
          startLat = planeLatLng.lat; startLon = planeLatLng.lng;
        } else if (typeof userCoords.lat === 'number' && typeof userCoords.lon === 'number') {
          startLat = userCoords.lat; startLon = userCoords.lon;
        }
      }

      const startCoord = (typeof startLat === 'number' && typeof startLon === 'number')
        ? { lat: startLat, lon: startLon }
        : null;

      // Filter to valid coordinate objects
      const validPois = Array.isArray(poisArray)
        ? poisArray.filter(p => typeof p?.lat === 'number' && typeof p?.lon === 'number')
        : [];

      // Order using nearest neighbor if we have a starting point
      const ordered = startCoord ? nearestNeighborOrder(startCoord, validPois) : validPois;

      // Create simplified JSON with only coordinates
      const poisCoordinates = ordered.map(poi => ({ lat: poi.lat, lon: poi.lon }));

      // Create payload for WASM
      const payload = {
        type: "POI_COORDINATES",
        data: poisCoordinates,
        count: poisCoordinates.length
      };

  console.log("[MapView] Sending ordered POI coordinates to WASM:", payload);

      // Send via callback trough useCommBus hook
      send("OnMessageFromJs", payload);
      console.log("[MapView] Ordered POI coordinates sent successfully");
    } catch (err) {
      console.error("[MapView] Error preparing ordered POIs for WASM:", err);
    }
  }, [send, nearestNeighborOrder, userCoords, isReady]);

    /**
     * Fetches POIs around current plane position using Wikipedia geosearch API
     * Integrates with MSFS SimVar to get real-time plane coordinates
     * Sends POI coordinates to WASM module via CommBus
     * @async
     */
  /**
   * Fetches POIs around current plane position from Wikipedia and sends them to WASM
   * ordered by nearest-neighbor from the current plane position.
   */
  const fetchPoisAroundPlane = useCallback(async () => {
    // Avoid sending/processing route payloads until CommBus is ready
    if (!isReady) return;
        try {
            // Get plane coordinates from MSFS SimVar
            const lat = SimVar.GetSimVarValue("PLANE LATITUDE", "degrees");
            const lon = SimVar.GetSimVarValue("PLANE LONGITUDE", "degrees");
            
            if (typeof lat !== "number" || typeof lon !== "number") return;

            setUserCoords({ lat, lon });

            // Wikipedia geosearch API
            const url = `https://en.wikipedia.org/w/api.php?action=query&list=geosearch&gscoord=${lat}|${lon}&gsradius=5000&gslimit=10&format=json&origin=*`;
            
      const res = await fetch(url);
      if (!res.ok) throw new Error(`Wikipedia API error: ${res.status}`);
            const data = await res.json();
            if (data.query?.geosearch) {
        const fetchedPois = data.query.geosearch;
        setPois(fetchedPois);

        // Send ordered POI coordinates to WASM using current plane position as start
        sendPoisToWasm(fetchedPois, { lat, lon });
            }
        } catch (err) {
            console.error("Error fetching POIs:", err);
            setPois([]);
        }
  }, [setPois, setUserCoords, isReady]);

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
                    <path fill="#006b4a" d="M30 4 L34 4 L36 22 L56 28 L56 32 L36 34 L34 60 L30 60 L28 34 L8 32 L8 28 L28 22 Z"/>
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

    /**
     * Custom Leaflet Control: Pause/Play Simulator
     * Toggles MSFS pause state via K:PAUSE_SET event (Bool 0/1)
     */
    const PausePlayControl = L.Control.extend({
      options: { position: "topleft" },
      onAdd: function() {
        const container = L.DomUtil.create("div", "leaflet-bar leaflet-control");
        const btn = L.DomUtil.create("div", "", container);
        btn.title = "Pause/Resume simulator";
        btn.style.width = "30px";
        btn.style.height = "30px";
        btn.style.display = "flex";
        btn.style.alignItems = "center";
        btn.style.justifyContent = "center";
        btn.style.cursor = "pointer";
        btn.style.backgroundColor = "#fff";
        btn.setAttribute('aria-label', 'Pause or resume simulator');

        const root = createRoot(btn);

        const renderIcon = () => {
          const isPaused = pauseRef.current;
          root.render(React.createElement(isPaused ? PlayArrowIcon : PauseIcon, {
            style: { fontSize: "18px", color: "#000" }
          }));
          btn.title = isPaused ? "Resume simulator" : "Pause simulator";
        };
        // Start/stop a green/white blinking effect while paused
        const applyBlinking = () => {
          const isPaused = pauseRef.current;
          // Clear any previous blink interval
          if (pauseBlinkIntervalRef.current) {
            try { clearInterval(pauseBlinkIntervalRef.current); } catch (_) {}
            pauseBlinkIntervalRef.current = null;
          }
          // When paused: blink between green and white every 1s
          if (isPaused) {
            let green = true;
            btn.style.backgroundColor = "#00b050"; // initial green
            pauseBlinkIntervalRef.current = setInterval(() => {
              green = !green;
              btn.style.backgroundColor = green ? "#00b050" : "#fff";
            }, 1000);
          } else {
            // Not paused: ensure default background
            btn.style.backgroundColor = "#fff";
          }
        };
        const updatePauseUI = () => {
          renderIcon();
          applyBlinking();
        };
        updatePauseUI();

        // Expose an external updater so logic can sync UI when pausing automatically
        updatePauseButtonRef.current = updatePauseUI;

        L.DomEvent.on(btn, "click", (e) => {
          L.DomEvent.stopPropagation(e);
          L.DomEvent.preventDefault(e);
          const newPaused = !pauseRef.current; // true means we will request pause (1)
          try {
            if (typeof SimVar?.SetSimVarValue === 'function') {
              SimVar.SetSimVarValue("K:PAUSE_SET", "Bool", newPaused ? 1 : 0);
            } else {
              console.warn("[MapView] SimVar not available to toggle pause");
            }
            pauseRef.current = newPaused;
            updatePauseUI();
          } catch (err) {
            console.warn("[MapView] Failed to toggle pause state", err);
          }
        });

        L.DomEvent.disableClickPropagation(container);
        L.DomEvent.disableScrollPropagation(container);
        return container;
      }
    });

    // Add custom controls to map
  new FollowControl().addTo(mapRef.current);
  new FetchPoisControl().addTo(mapRef.current);
  new PausePlayControl().addTo(mapRef.current);

    // Force initial size calculation (container may have been hidden/sized late)
    try { map.invalidateSize(); } catch (_) {}
    setTimeout(() => { try { map.invalidateSize(); } catch (_) {} }, 150);
    // Resize observer to keep Leaflet layout correct without manual window resize
    if (containerRef.current && typeof ResizeObserver !== 'undefined') {
      resizeObserverRef.current = new ResizeObserver(() => {
        if (mapRef.current) {
          try { mapRef.current.invalidateSize(); } catch (_) {}
        }
      });
      resizeObserverRef.current.observe(containerRef.current);
    }

        // Cleanup on unmount
        return () => {
      // Disconnect resize observer first
      if (resizeObserverRef.current) {
        try { resizeObserverRef.current.disconnect(); } catch (_) {}
        resizeObserverRef.current = null;
      }
      // Clear blinking interval if active
      if (pauseBlinkIntervalRef.current) {
        try { clearInterval(pauseBlinkIntervalRef.current); } catch (_) {}
        pauseBlinkIntervalRef.current = null;
      }
      map.remove();
            mapRef.current = null;
            poiLayerRef.current = null;
            planeMarkerRef.current = null;
            visitedLayerRef.current = null;
            currentSegmentRef.current = null;
            staticSegmentsRef.current = null;
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





