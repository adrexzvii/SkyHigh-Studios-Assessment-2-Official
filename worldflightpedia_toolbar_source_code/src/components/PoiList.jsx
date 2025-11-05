/**
 * PoiList.jsx - POI List Component
 * 
 * Displays a list of Points of Interest (POIs) in a scrollable list.
 * Each POI item is clickable and triggers selection.
 * 
 * @component
 * @param {Array} pois - Array of POI objects to display
 * @param {Function} setSelectedPoi - Function to set the currently selected POI
 */

import React from "react";
import { List, ListItemButton, ListItemText, Typography } from "@mui/material";
import palette from "../theme/palette";

export default function PoiList({ pois, setSelectedPoi }) {
  // Show message if no POIs are available
  if (!pois.length) {
    return (
      <Typography variant="body2" color={palette.textSecondary}>
        No results found
      </Typography>
    );
  }

  return (
    <List 
      sx={{ 
        width: "100%", 
        p: 0,
        maxHeight: "calc(100vh - 130px)", // Height calculation: viewport - topbar - padding
        overflowY: "scroll",
        overflowX: "hidden",
        // Custom scrollbar for Webkit browsers
        "&::-webkit-scrollbar": {
          width: "12px",
        },
        "&::-webkit-scrollbar-track": {
          backgroundColor: palette.dark,
          borderRadius: "6px",
        },
        "&::-webkit-scrollbar-thumb": {
          backgroundColor: palette.accent,
          borderRadius: "6px",
          border: `2px solid ${palette.dark}`,
          "&:hover": {
            backgroundColor: palette.textSecondary,
          },
        },
        // Firefox scrollbar
        scrollbarWidth: "thin",
        scrollbarColor: `${palette.accent} ${palette.dark}`,
        // Fallback for non-supporting browsers
        msOverflowStyle: "auto", // IE and Edge fallback
      }}
    >
      {pois.map((poi) => (
        <ListItemButton
          key={poi.pageid}
          onClick={() => setSelectedPoi(poi)}
          sx={{
            borderRadius: 1,
            mb: 1,
            bgcolor: palette.card,
            "&:hover": { 
              bgcolor: palette.accent, 
              color: palette.dark 
            },
          }}
        >
          <ListItemText 
            primary={poi.title} 
            secondary={`(${poi.lat.toFixed(3)}, ${poi.lon.toFixed(3)})`} 
          />
        </ListItemButton>
      ))}
    </List>
  );
}
