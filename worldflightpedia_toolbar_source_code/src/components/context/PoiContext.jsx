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

import { createContext, useContext, useState } from "react";

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
