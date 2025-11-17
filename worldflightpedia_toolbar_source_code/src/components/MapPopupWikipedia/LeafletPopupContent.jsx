/**
 * LeafletPopupContent - Wrapper component for rendering MapPopupCard inside Leaflet popup
 * 
 * This component is designed to be rendered inside a Leaflet popup using ReactDOM.
 * It fetches Wikipedia data and displays the same UI as MapPopupWikipedia.
 */

import { useState } from "react";
import MapPopupCard from "./MapPopupCard";
import { useWikipediaSummary } from "../../hooks/wiki/useWikipediaSummary";
import { useDistance } from "../../hooks/map/useDistance";
import { CircularProgress, Box } from "@mui/material";

export default function LeafletPopupContent({ poi, userCoords, onFocusPoi, onClose }) {
  const [expanded, setExpanded] = useState(false);

  // Extract POI title
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

  if (!poi) return null;

  return (
    <Box sx={{ minWidth: 150, maxWidth: 300 }}>
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
          <CircularProgress size={24} />
        </Box>
      ) : (
        <MapPopupCard
          poi={poi}
          poiTitle={poiTitle}
          details={details}
          distance={distance}
          expanded={expanded}
          setExpanded={setExpanded}
          setMinimized={null} // Don't show minimize button in Leaflet popup
          onFocusPoi={onFocusPoi}
          isLeafletPopup={true}
        />
      )}
    </Box>
  );
}
