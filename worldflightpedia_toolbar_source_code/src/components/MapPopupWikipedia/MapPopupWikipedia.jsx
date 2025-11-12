/**
 * MapPopupWikipedia.jsx - Wikipedia POI Details Component
 * 
 * Main component that orchestrates the display of POI information.
 * Fetches Wikipedia data and calculates distance, then delegates
 * rendering to child components (MapPopupCard or MapPopupMinimized).
 * 
 * Features:
 * - Fetches Wikipedia summary via custom hook
 * - Calculates distance from user/plane to POI
 * - Expandable/collapsible content
 * - Minimizable popup view
 * 
 * @param {Object} poi - POI object with lat, lon, and metadata
 * @param {Object} userCoords - User's current coordinates {lat, lon}
 * @param {Function} onFocusPoi - Optional callback to center map on POI
 */

import { useState, useEffect } from "react";
import { Card, CircularProgress } from "@mui/material";
import MapPopupMinimized from "./MapPopupMinimized";
import MapPopupCard from "./MapPopupCard";
import { useWikipediaSummary } from "../../hooks/wiki/useWikipediaSummary";
import { useDistance } from "../../hooks/map/useDistance";

export default function MapPopupWikipedia({ poi, userCoords, onFocusPoi }) {
  // UI state management
  const [expanded, setExpanded] = useState(false);
  const [minimized, setMinimized] = useState(false);

  // Extract POI title with multiple fallback options
  // Handles various data structures from different POI sources
  const poiTitle =
    poi?.title ||
    poi?.name ||
    poi?.display_name ||
    poi?.properties?.title ||
    poi?.properties?.name ||
    poi?.tags?.name ||
    poi?.tags?.title ||
    poi?.wikipedia_title ||
    poi?.label ||
    (typeof poi === "string" ? poi : "Unnamed location");

  // Fetch Wikipedia summary data
  const { data: details, loading } = useWikipediaSummary(poiTitle);
  
  // Calculate distance from user to POI
  const distance = useDistance(userCoords, poi);

  // Reset minimized state when a new POI is selected
  useEffect(() => {
    if (poi) setMinimized(false);
  }, [poi]);

  // Early return if no POI data
  if (!poi) return null;
  
  // Render minimized view
  if (minimized)
    return <MapPopupMinimized title={poiTitle} onExpand={() => setMinimized(false)} />;

  // Render full popup card
  return (
    <Card sx={{ position: "absolute", top: 173, left: 0, zIndex: 10, width: 250 }}>
      {/* Show loading spinner while fetching Wikipedia data */}
      {loading ? (
        <CircularProgress sx={{ m: 3 }} />
      ) : (
        // Render full POI details card
        <MapPopupCard
          poi={poi}
          poiTitle={poiTitle}
          details={details}
          distance={distance}
          expanded={expanded}
          setExpanded={setExpanded}
          setMinimized={setMinimized}
          onFocusPoi={onFocusPoi}
        />
      )}
    </Card>
  );
}
