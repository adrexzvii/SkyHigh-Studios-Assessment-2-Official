import React, { useEffect, useRef, useState, useCallback } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Box } from "@mui/material";
import palette from "../theme/palette";
import MapPopupWikipedia from "./MapPopupWikipedia";

export default function MapView({ pois = [], userCoords = {}, selectedPoi, setSelectedPoi, setPois, setUserCoords }) {
    const containerRef = useRef(null);
    const mapRef = useRef(null);
    const poiLayerRef = useRef(null);
    const planeMarkerRef = useRef(null);
    const routeLayerRef = useRef(null);
    const visitedLayerRef = useRef(null);
    
    const [followPlane, setFollowPlane] = useState(true);
    const followRef = useRef(followPlane);
    const [remainingPois, setRemainingPois] = useState([]);
    const [orderedRoute, setOrderedRoute] = useState([]);
    const [currentTargetIndex, setCurrentTargetIndex] = useState(0);
    const [completedSegments, setCompletedSegments] = useState([]);

    const haversine = (lat1, lon1, lat2, lon2) => {
      const R = 6371;
      const toRad = (v) => (v * Math.PI) / 180;
      const dLat = toRad(lat2 - lat1);
      const dLon = toRad(lon2 - lon1);
      const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
      return 2 * R * Math.asin(Math.sqrt(a));
    };

    const nearestNeighborOrder = useCallback((start, points) => {
      if (!start || !Array.isArray(points)) return [];
      const pts = points.map(p => ({ ...p }));
      const order = [];
      let cur = { lat: start.lat, lon: start.lon };

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

    useEffect(() => {
      if (!Array.isArray(pois)) return;
      // map incoming pois to objects with lat/lon and id/title (avoid mutating original)
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

    useEffect(() => {
      if (!mapRef.current) return;

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

      if (!remainingPois || remainingPois.length === 0) {
        setOrderedRoute([]);
        if (routeLayerRef.current) routeLayerRef.current.clearLayers();
        return;
      }

      const ordered = nearestNeighborOrder(start, remainingPois);
      setOrderedRoute(ordered);
      setCurrentTargetIndex(0);

      if (!routeLayerRef.current) routeLayerRef.current = L.layerGroup().addTo(mapRef.current);
      if (!visitedLayerRef.current) visitedLayerRef.current = L.layerGroup().addTo(mapRef.current);
      
      const layer = routeLayerRef.current;
      layer.clearLayers();

      const coords = [[start.lat, start.lon], ...ordered.map(p => [p.lat, p.lon])];
      const poly = L.polyline(coords, {
        color: palette?.accent || "#00bcd4",
        weight: 3,
        opacity: 0.9,
        smoothFactor: 1,
        noClip: true
      });
      layer.addLayer(poly);

      if (coords.length > 1) {
        try {
          const bounds = L.latLngBounds(coords);
          mapRef.current.fitBounds(bounds, { padding: [60, 60] });
        } catch (e) {}
      }
    }, [remainingPois, nearestNeighborOrder, userCoords]);

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
        const thresholdKm = 0.2;

        if (distKm <= thresholdKm) {
          const planePos = planeMarkerRef.current.getLatLng();
          const targetPos = [target.lat, target.lon];
          
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
          
          setRemainingPois(prev => {
            const next = prev.filter(p => p.id !== target.id);
            return next;
          });
          setCurrentTargetIndex(0);
        }
      }, 1000);

      return () => clearInterval(interval);
    }, [orderedRoute, currentTargetIndex]);

    useEffect(() => { 
      followRef.current = followPlane; 
    }, [followPlane]);

    const focusOnPoi = (poi) => {
        if (mapRef.current && poi?.lat && poi?.lon) {
            mapRef.current.setView([poi.lat, poi.lon], 16, {
                animate: true,
                duration: 1
            });
        }
    };

    const fetchPoisAroundPlane = useCallback(async () => {
        try {
            const lat = SimVar.GetSimVarValue("PLANE LATITUDE", "degrees");
            const lon = SimVar.GetSimVarValue("PLANE LONGITUDE", "degrees");
            
            if (typeof lat !== "number" || typeof lon !== "number") return;

            setUserCoords({ lat, lon });

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

    useEffect(() => {
        if (mapRef.current) {
            mapRef.current.remove();
            mapRef.current = null;
        }

        if (!containerRef.current) return;
        if (typeof userCoords.lat !== "number" || typeof userCoords.lon !== "number") return;

        const map = L.map(containerRef.current, { 
            preferCanvas: true,
            zoomControl: true,
            attributionControl: false
        }).setView([userCoords.lat, userCoords.lon], 13);

        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
            attribution: '&copy; OpenStreetMap contributors',
        }).addTo(map);

        mapRef.current = map;
        poiLayerRef.current = L.layerGroup().addTo(map);
        visitedLayerRef.current = L.layerGroup().addTo(map);

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

        const FollowControl = L.Control.extend({
            options: { position: "topleft" },
            onAdd: function() {
                const container = L.DomUtil.create("div", "leaflet-bar leaflet-control");
                const btn = L.DomUtil.create("a", "", container);
                btn.href = "#";
                btn.title = "Seguir avión";
                btn.style.width = "30px";
                btn.style.height = "30px";
                btn.style.display = "flex";
                btn.style.alignItems = "center";
                btn.style.justifyContent = "center";
                btn.style.fontSize = "16px";
                btn.innerHTML = "A";

                const updateButton = () => {
                    if (followRef.current) {
                        btn.style.background = palette?.accent || "#00bcd4";
                        btn.style.color = palette?.dark || "#000";
                    } else {
                        btn.style.background = "#fff";
                        btn.style.color = "#000";
                    }
                };
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

        const FetchPoisControl = L.Control.extend({
            options: { position: "topleft" },
            onAdd: function(map) {
                const container = L.DomUtil.create("div", "leaflet-bar leaflet-control");
                const button = L.DomUtil.create("a", "", container);
                button.innerHTML = "B";
                button.href = "#";
                button.title = "Buscar POIs cercanos";
                button.style.fontSize = "16px";
                button.style.lineHeight = "30px";

                L.DomEvent.on(button, "click", function(e) {
                    L.DomEvent.preventDefault(e);
                    L.DomEvent.stopPropagation(e);
                    fetchPoisAroundPlane();
                });

                return container;
            }
        });

        new FollowControl().addTo(mapRef.current);
        new FetchPoisControl().addTo(mapRef.current);

        return () => {
            map.remove();
            mapRef.current = null;
            poiLayerRef.current = null;
            planeMarkerRef.current = null;
            visitedLayerRef.current = null;
        };
    }, [fetchPoisAroundPlane]);

    useEffect(() => {
        const interval = setInterval(() => {
            try {
                const lat = SimVar.GetSimVarValue("PLANE LATITUDE", "degrees");
                const lon = SimVar.GetSimVarValue("PLANE LONGITUDE", "degrees");
                const hdg = SimVar.GetSimVarValue("PLANE HEADING DEGREES TRUE", "degrees");

                if (typeof lat === "number" && typeof lon === "number") {
                    if (planeMarkerRef.current) {
                        planeMarkerRef.current.setLatLng([lat, lon]);

                        if (mapRef.current && followRef.current) {
                            mapRef.current.setView([lat, lon], mapRef.current.getZoom() || 13);
                        }

                        const el = planeMarkerRef.current.getElement();
                        if (el) {
                            const svg = el.querySelector(".plane-svg");
                            if (svg) svg.style.transform = `rotate(${hdg}deg)`;
                        }
                    }
                }
            } catch (error) {
                console.error("Error al obtener las coordenadas del avión:", error);
            }
        }, 1000);

        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
    if (!mapRef.current || !poiLayerRef.current) return;
    const layer = poiLayerRef.current;
    layer.clearLayers();

    const poiIcon = L.divIcon({
      className: "poi-icon",
      html: `<svg viewBox="0 0 24 24" width="24" height="24" fill="${palette?.accent || "#00b894"}"><circle cx="12" cy="12" r="10"/></svg>`,
      iconSize: [24, 24],
      iconAnchor: [12, 12],
    });

    pois.forEach((poi) => {
      if (typeof poi.lat !== "number" || typeof poi.lon !== "number") return;

      const marker = L.marker([poi.lat, poi.lon], { icon: poiIcon });

      const title = (poi.title || poi.name || "").toString().replace(/</g, "&lt;");
      const desc = poi.description ? poi.description.toString().replace(/</g, "&lt;") : "";
      const popupContent = `
        <div class="poi-popup">
          <strong>${title}</strong>
          ${desc ? `<div class="poi-desc">${desc}</div>` : ""}
        </div>
      `;

      marker.bindPopup(popupContent, { maxWidth: 320, keepInView: true, autoClose: true });

      marker.on("click", () => {
        marker.openPopup();
        if (typeof setSelectedPoi === "function") setSelectedPoi(poi);
      });

      layer.addLayer(marker);
    });

    try {
      const panes = mapRef.current.getPanes && mapRef.current.getPanes();
      if (panes && panes.popupPane) panes.popupPane.style.zIndex = 5000;
    } catch (e) {}

    return () => {
      if (layer) layer.clearLayers();
    };
  }, [pois, setSelectedPoi]);

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
            <Box
                ref={containerRef}
                sx={{
                    width: "100%",
                    height: "100%",
                    position: 'relative'
                }}
            />

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



