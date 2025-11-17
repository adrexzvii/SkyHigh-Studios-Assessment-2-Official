/**
 * usePoiSelection - Custom hook for POI selection logic
 * 
 * Encapsulates the logic for selecting a POI and updating global state.
 * Returns a memoized callback that validates and updates the selected POI.
 * 
 * Benefits:
 * - Prevents unnecessary re-renders via useCallback
 * - Centralizes selection validation logic
 * - Makes components cleaner by extracting this concern
 * 
 * @param {Function} setSelectedPoi - State setter function from context or parent
 * @returns {Function} Memoized callback that accepts a POI object and updates selection
 * 
 * @example
 * const handleSelect = usePoiSelection(setSelectedPoi);
 * handleSelect(poiObject); // Updates selected POI
 */

import { useCallback } from "react";

export function usePoiSelection(setSelectedPoi) {
  return useCallback(
    (poi) => {
      // Validate POI exists before setting
      if (!poi) return;
      
      // Update selected POI state
      setSelectedPoi(poi);
      
      // Open Leaflet popup if available
      if (window.__openPoiPopup) {
        window.__openPoiPopup(poi);
      }
    },
    [setSelectedPoi] // Only recreate if setter changes
  );
}
