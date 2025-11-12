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

import { useEffect } from 'react';
import L from 'leaflet';
import { createPoiIcon } from '../../utils/leaflet/createPoiIcon';

export function usePoiMarkers({ mapRef, poiLayerRef, pois, selectedPoi, setSelectedPoi }) {
  useEffect(() => {
    if (!mapRef.current || !poiLayerRef.current) return;
    
    const layer = poiLayerRef.current;
    layer.clearLayers();

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

      // Handle marker click - select POI and open Wikipedia popup
      marker.on('click', () => {
        if (typeof setSelectedPoi === 'function') setSelectedPoi(poi);
      });

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
    };
  }, [mapRef, poiLayerRef, pois, selectedPoi, setSelectedPoi]);
}
