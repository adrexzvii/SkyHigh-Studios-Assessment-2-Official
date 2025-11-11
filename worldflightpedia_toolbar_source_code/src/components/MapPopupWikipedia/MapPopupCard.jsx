/**
 * MapPopupCard - Displays detailed POI information
 * 
 * Renders a card with POI details including image, title, distance,
 * and expandable Wikipedia description.
 * 
 * @param {Object} poi - POI object with location and metadata
 * @param {string} poiTitle - Formatted title of the POI
 * @param {Object} details - Wikipedia API response data
 * @param {string} distance - Calculated distance in kilometers
 * @param {boolean} expanded - Whether the description is expanded
 * @param {Function} setExpanded - Callback to toggle expanded state
 * @param {Function} setMinimized - Callback to minimize the popup
 * @param {Function} onFocusPoi - Optional callback to center map on POI
 */

import {
  CardContent,
  CardMedia,
  Typography,
  Box,
  Collapse,
  Button,
  IconButton,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import RemoveIcon from "@mui/icons-material/Remove";

export default function MapPopupCard({
  poi,
  poiTitle,
  details,
  distance,
  expanded,
  setExpanded,
  setMinimized,
  onFocusPoi,
}) {
  return (
    <>
      {/* POI Image - Shows Wikipedia thumbnail or custom image */}
      {(details?.thumbnail?.source || poi.image) && (
        <CardMedia
          component="img"
          height="140"
          image={details?.thumbnail?.source || poi.image}
          alt={poiTitle}
        />
      )}
      
      <CardContent sx={{ overflowY: "auto", maxHeight: "25rem" }}>
        {/* Header: Title and minimize button */}
        <Box sx={{ display: "flex", justifyContent: "space-between" }}>
          <Typography variant="h6">{poiTitle}</Typography>
          <IconButton size="small" onClick={() => setMinimized(true)}>
            <RemoveIcon />
          </IconButton>
        </Box>

        {/* Distance from user/plane to POI */}
        {distance && (
          <Typography variant="body2" color="text.secondary">
            Distance: {distance} km
          </Typography>
        )}

        {/* POI metadata: rating and category */}
        <Typography variant="body2" color="text.secondary">
          {poi.rating ? `${poi.rating} · ` : ""}
          {poi.category}
        </Typography>

        {/* Expandable description section */}
        <Collapse in={expanded} timeout="auto" unmountOnExit>
          {/* Wikipedia extract or fallback message */}
          <Typography variant="caption" sx={{ my: 1 }}>
            {details?.extract || "No description available."}
          </Typography>
          
          {/* Focus map on POI button */}
          <Button
            size="small"
            variant="contained"
            onClick={() => {
              onFocusPoi?.(poi);
              setMinimized(true);
            }}
            sx={{ mt: 1 }}
          >
            View on map
          </Button>
        </Collapse>

        {/* Toggle button to expand/collapse description */}
        <Button
          size="small"
          variant="outlined"
          onClick={() => setExpanded(!expanded)}
          sx={{ mt: 1 }}
          startIcon={expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
        >
          {expanded ? "Show less" : "Show more"}
        </Button>
      </CardContent>
    </>
  );
}
