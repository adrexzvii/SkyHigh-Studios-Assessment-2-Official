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
    <List>
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
