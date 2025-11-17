/**
 * PoiContext - Global state management for Points of Interest
 * 
 * Provides centralized state for POI data across the application using
 * React Context API. Eliminates prop drilling and enables any component
 * to access or modify POI state.
 * 
 * State managed:
 * - pois: Array of all available POI objects
 * - selectedPoi: Currently selected POI object (null if none selected)
 * 
 * @module PoiContext
 */

import { createContext, useContext, useState, useEffect } from "react";

// Create context with undefined default (throws error if used outside provider)
const PoiContext = createContext();

/**
 * PoiProvider - Context provider component
 * 
 * Wraps the application tree and provides POI state to all children.
 * Manages pois list and selectedPoi state internally.
 * 
 * @component
 * @param {Object} props
 * @param {React.ReactNode} props.children - Child components that need access to POI state
 * @returns {JSX.Element} Context provider wrapping children
 */
export function PoiProvider({ children }) {
  // Selected POI state - tracks which POI is currently active
  const [selectedPoi, setSelectedPoi] = useState(null);
  
  // POI list state - array of all available POIs
  const [pois, setPois] = useState([]);

  // LocalStorage keys
  const LS_KEYS = {
    pois: "wfp_poi_list",
    selected: "wfp_selected_poi",
  };

  // Load from localStorage on mount
  useEffect(() => {
    try {
      if (typeof window !== "undefined" && window.localStorage) {
        const savedPois = window.localStorage.getItem(LS_KEYS.pois);
        if (savedPois) {
          const parsed = JSON.parse(savedPois);
          if (Array.isArray(parsed) && parsed.length > 0) {
            console.log('[PoiContext] Loaded', parsed.length, 'POIs from localStorage');
            setPois(parsed);
          }
        }

        const savedSelected = window.localStorage.getItem(LS_KEYS.selected);
        if (savedSelected) {
          const parsedSel = JSON.parse(savedSelected);
          if (parsedSel && typeof parsedSel === "object") setSelectedPoi(parsedSel);
        }
      }
    } catch (err) {
      console.warn('[PoiContext] Failed to load from localStorage:', err);
    }
  }, []);

  // Persist pois list on change
  useEffect(() => {
    try {
      if (typeof window !== "undefined" && window.localStorage) {
        window.localStorage.setItem(LS_KEYS.pois, JSON.stringify(pois));
      }
    } catch (_) {}
  }, [pois]);

  // Persist selected POI on change
  useEffect(() => {
    try {
      if (typeof window !== "undefined" && window.localStorage) {
        if (selectedPoi) {
          window.localStorage.setItem(LS_KEYS.selected, JSON.stringify(selectedPoi));
        } else {
          window.localStorage.removeItem(LS_KEYS.selected);
        }
      }
    } catch (_) {}
  }, [selectedPoi]);

  return (
    <PoiContext.Provider value={{ pois, setPois, selectedPoi, setSelectedPoi }}>
      {children}
    </PoiContext.Provider>
  );
}

/**
 * usePoiContext - Custom hook to access POI context
 * 
 * Provides access to POI state and setters. Must be used within PoiProvider.
 * 
 * @returns {Object} POI context value
 * @returns {Array} pois - Array of POI objects
 * @returns {Function} setPois - Function to update POI list
 * @returns {Object|null} selectedPoi - Currently selected POI or null
 * @returns {Function} setSelectedPoi - Function to update selected POI
 * @throws {Error} If used outside of PoiProvider
 */
export const usePoiContext = () => useContext(PoiContext);
