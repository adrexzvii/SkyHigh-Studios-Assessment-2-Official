/**
 * PoiList.jsx - Modular React component for displaying Points of Interest
 *
 * Displays a scrollable list of POIs with:
 * - Counter showing total POIs found
 * - Clickable list items that trigger selection
 * - Custom styled scrollbar
 * - Empty state when no POIs available
 *
 * Uses Context API to access global POI state and delegates
 * rendering of individual items to PoiListItem component.
 *
 * @component
 * @returns {JSX.Element} Rendered POI list with header and items
 */

import React from "react";
import { List, Typography, Box } from "@mui/material";
import palette from "../../theme/palette";
import PoiListItem from "./PoiListItem";
import { usePoiSelection } from "../../hooks/map/usePoiSelection";
import { usePoiContext } from "../context/PoiContext";

export default function PoiList() {
  // Access global POI state from context
  const { pois, setSelectedPoi } = usePoiContext();

  // Get memoized POI selection handler
  const handleSelectPoi = usePoiSelection(setSelectedPoi);

  return (
    <Box sx={{ width: "100%", display: "flex", flexDirection: "column" }}>
      {/* Header: POI counter with accent border */}
      <Typography
        variant="subtitle1"
        sx={{
          mb: 2,
          fontWeight: 600,
          color: palette.textPrimary,
          borderBottom: `2px solid ${palette.accent}`,
          pb: 1,
        }}
      >
        POIs Found: {pois.length}
      </Typography>

      {/* Scrollable list of POI items */}
      <List
        sx={{
          width: "100%",
          p: 0,
          maxHeight: "calc(100vh - 190px)", // Viewport height minus header and padding
          overflowY: "auto",
          overflowX: "hidden",
          // Custom Webkit scrollbar styling
          "&::-webkit-scrollbar": { width: "12px" },
          "&::-webkit-scrollbar-track": {
            backgroundColor: palette.dark,
            borderRadius: "6px",
          },
          "&::-webkit-scrollbar-thumb": {
            backgroundColor: palette.accent,
            borderRadius: "6px",
            border: `2px solid ${palette.dark}`,
            "&:hover": { backgroundColor: palette.textSecondary },
          },
          // Firefox scrollbar styling
          scrollbarWidth: "thin",
          scrollbarColor: `${palette.accent} ${palette.dark}`,
        }}
      >
        {/* Render individual POI items */}
        {pois.map((poi) => (
          <PoiListItem
            key={poi.pageid || poi.id}
            poi={poi}
            onSelect={handleSelectPoi}
          />
        ))}
      </List>
    </Box>
  );
}
