/**
 * usePoiMarkers - Manages POI marker rendering on Leaflet map
 * 
 * Responsibilities:
 * - Render clickable POI markers with normal/selected states
 * - Clear and update markers when POI list or selection changes
 * - Handle marker click events to select POIs
 * - Ensure popup pane has correct z-index
 * 
 * @param {Object} params
 * @param {import('react').MutableRefObject<any>} params.mapRef - Leaflet map reference
 * @param {import('react').MutableRefObject<any>} params.poiLayerRef - POI layer group reference
 * @param {Array} params.pois - Array of POI objects with lat/lon
 * @param {Object} params.selectedPoi - Currently selected POI
 * @param {Function} params.setSelectedPoi - Function to update selected POI
 */

import { useEffect, useRef, useCallback } from 'react';
import { createRoot } from 'react-dom/client';
import L from 'leaflet';
import { createPoiIcon } from '../../utils/leaflet/createPoiIcon';
import LeafletPopupContent from '../../components/MapPopupWikipedia/LeafletPopupContent';

export function usePoiMarkers({ mapRef, poiLayerRef, pois, selectedPoi, setSelectedPoi, userCoords, onFocusPoi }) {
  // Store markers by POI ID for programmatic access
  const markersMapRef = useRef(new Map());
  // Store React roots for cleanup
  const reactRootsRef = useRef(new Map());

  useEffect(() => {
    if (!mapRef.current || !poiLayerRef.current) return;
    
    const layer = poiLayerRef.current;
    layer.clearLayers();
    
    // Cleanup previous React roots
    reactRootsRef.current.forEach(root => root.unmount());
    reactRootsRef.current.clear();
    markersMapRef.current.clear();

    // Create icon instances
    const normalIcon = createPoiIcon(false);
    const selectedIcon = createPoiIcon(true);

    // Add marker for each POI
    pois.forEach((poi) => {
      if (typeof poi.lat !== 'number' || typeof poi.lon !== 'number') return;

      // Check if this POI is currently selected
      const isSelected = selectedPoi && selectedPoi.pageid === poi.pageid;
      const marker = L.marker([poi.lat, poi.lon], { 
        icon: isSelected ? selectedIcon : normalIcon 
      });

      // Create a div container for React content
      const popupContainer = document.createElement('div');
      
      // Bind popup with the container
      marker.bindPopup(popupContainer, {
        maxWidth: 145,
        minWidth: 145,
        maxHeight: 500,
        className: 'custom-poi-popup',
        autoPan: true,
        autoPanPadding: [20, 20]
      });

      // Fix close button to show 'X' instead of '×'
      marker.on('popupopen', () => {
        const popup = marker.getPopup();
        if (popup && popup._closeButton) {
          const closeBtn = popup._closeButton;
          const span = closeBtn.querySelector('span');
          if (span) {
            span.textContent = 'X';
          }
        }
      });

      // Handle marker click - select POI and render React content
      marker.on('click', () => {
        console.log('Marker clicked:', poi.title || poi.name);
        if (typeof setSelectedPoi === 'function') setSelectedPoi(poi);
        
        // Create React root and render component
        const poiId = poi.pageid || poi.id;
        if (!reactRootsRef.current.has(poiId)) {
          const root = createRoot(popupContainer);
          reactRootsRef.current.set(poiId, root);
          
          root.render(
            <LeafletPopupContent
              poi={poi}
              userCoords={userCoords}
              onFocusPoi={onFocusPoi}
              onClose={() => marker.closePopup()}
            />
          );
        }
      });

      // Store marker reference by POI ID for programmatic access
      const poiId = poi.pageid || poi.id;
      if (poiId) {
        markersMapRef.current.set(poiId, marker);
      }

      layer.addLayer(marker);
    });

    // Ensure popups appear above other UI elements
    try {
      const panes = mapRef.current.getPanes && mapRef.current.getPanes();
      if (panes && panes.popupPane) panes.popupPane.style.zIndex = 5000;
    } catch (e) {
      // Silently fail if panes not available
    }

    return () => {
      if (layer) layer.clearLayers();
      // Cleanup React roots
      reactRootsRef.current.forEach(root => root.unmount());
      reactRootsRef.current.clear();
      markersMapRef.current.clear();
    };
  }, [mapRef, poiLayerRef, pois, selectedPoi, setSelectedPoi, userCoords, onFocusPoi]);

  // Function to open popup for a specific POI
  const openPoiPopup = useCallback((poi) => {
    const poiId = poi?.pageid || poi?.id;
    const marker = markersMapRef.current.get(poiId);
    if (marker && mapRef.current) {
      // Pan to marker and open popup
      mapRef.current.setView(marker.getLatLng(), mapRef.current.getZoom());
      marker.fire('click'); // Trigger click event to load data and open popup
    }
  }, [mapRef]);

  return { openPoiPopup };
}
