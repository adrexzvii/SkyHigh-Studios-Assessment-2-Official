/**
 * POIPopup.jsx - POI Detail Popup Component
 * 
 * Displays detailed information about a selected Point of Interest in a floating card.
 * Shows name, category, description, and image.
 * 
 * @component
 * @param {Object} poi - The POI object to display
 * @param {Function} setSelectedPOI - Function to close the popup (set to null)
 */

import React from "react";
import { 
  Paper, 
  Box, 
  Typography, 
  CardMedia, 
  IconButton, 
  Button 
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import palette from "../theme/palette";

export default function POIPopup({ poi, setSelectedPOI }) {
  return (
    <Paper
      elevation={6}
      sx={{
        position: "absolute",
        top: 40,
        right: 40,
        width: 360,
        borderRadius: 3,
        overflow: "hidden",
        zIndex: 10,
        bgcolor: palette.card,
        color: palette.textPrimary,
      }}
    >
      {/* Header with title and close button */}
      <Box 
        sx={{ 
          display: "flex", 
          alignItems: "center", 
          justifyContent: "space-between", 
          p: 1.5, 
          borderBottom: `1px solid ${palette.divider}` 
        }}
      >
        <Typography variant="subtitle1" fontWeight={700}>
          {poi.name}
        </Typography>
        <IconButton 
          size="small" 
          onClick={() => setSelectedPOI(null)} 
          sx={{ color: palette.textSecondary }}
        >
          <CloseIcon />
        </IconButton>
      </Box>

      {/* POI Image */}
      <CardMedia 
        component="img" 
        height="200" 
        image={poi.img} 
        alt={poi.name} 
      />

      {/* POI Details */}
      <Box sx={{ p: 2 }}>
        <Typography 
          variant="body2" 
          color={palette.textSecondary} 
          sx={{ mb: 1 }}
        >
          {poi.category}
        </Typography>
        <Typography variant="body1">
          {poi.desc}
        </Typography>

        {/* Action Button */}
        <Button 
          variant="contained" 
          fullWidth 
          sx={{ 
            mt: 2, 
            bgcolor: palette.accent, 
            color: palette.dark, 
            "&:hover": { bgcolor: palette.accentHover } 
          }}
        >
          View on map
        </Button>
      </Box>
    </Paper>
  );
}
