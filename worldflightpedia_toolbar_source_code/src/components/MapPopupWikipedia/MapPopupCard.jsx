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
import palette from "../../theme/palette";

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

      <CardContent
        sx={{
          flex: "1 1 auto",
          overflowY: "auto",
          display: "flex",
          flexDirection: "column",
          p: 2,
          "&:last-child": { pb: 2 },
        }}
      >
        {/* Header: Title and minimize button */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            mb: 1,
          }}
        >
          <Typography
            variant="h6"
            sx={{ fontSize: "1.1rem", fontWeight: 600, lineHeight: 1.3 }}
          >
            {poiTitle}
          </Typography>
          {setMinimized && (
            <IconButton
              size="small"
              onClick={() => setMinimized(true)}
              sx={{ mt: -0.5, mr: -0.5 }}
            >
              <RemoveIcon />
            </IconButton>
          )}
        </Box>

        {/* Distance from user/plane to POI */}
        {distance && (
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ mb: 0.5, fontSize: "0.875rem" }}
          >
            Distance: {distance} km
          </Typography>
        )}

        {/* POI metadata: rating and category */}
        {(poi.rating || poi.category) && (
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ mb: 1.5, fontSize: "0.875rem" }}
          >
            {poi.rating ? `${poi.rating} · ` : ""}
            {poi.category}
          </Typography>
        )}

        {/* Expandable description section */}
        <Collapse in={expanded} timeout="auto" unmountOnExit>
          {/* Fixed-height scrollable area; scrollbar always visible */}
          <Box
            sx={{
              height: 150,
              overflowY: "scroll",
              mb: 1.5,
              pr: 1,
              "&::-webkit-scrollbar": { width: "6px" },
              "&::-webkit-scrollbar-track": {
                backgroundColor: "transparent",
              },
              "&::-webkit-scrollbar-thumb": {
                backgroundColor: palette.accent,
                borderRadius: "6px",
                border: "none",
                "&:hover": { backgroundColor: palette.accentHover },
              },
              scrollbarWidth: "thin",
              scrollbarColor: `${palette.accent} transparent`,
            }}
          >
            {/* Wikipedia extract or fallback message */}
            <Typography
              variant="body2"
              sx={{
                fontSize: "0.875rem",
                lineHeight: 1.6,
                color: "text.primary",
              }}
            >
              {details?.extract || "No description available."}
            </Typography>
          </Box>
        </Collapse>

        {/* Buttons row: Show more/less and View on map side by side (compact) */}
        <Box
          sx={{
            display: "flex",
            gap: 1,
            mt: "auto",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          {/* Toggle button to expand/collapse description */}
          <Button
            size="small"
            variant="outlined"
            onClick={() => setExpanded(!expanded)}
            startIcon={expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            sx={{
              textTransform: "none",
              fontSize: "0.8125rem",
              py: 0.5,
              fontWeight: 500,
              borderColor: "#00E46A",
              color: "#00E46A",
              "&:hover": {
                borderColor: "#00FF94",
                backgroundColor: "rgba(0,228,106,0.10)",
              },
            }}
          >
            {expanded ? "Show less" : "Show more"}
          </Button>

          {/* Focus map on POI button */}
          <Button
            size="small"
            variant="contained"
            onClick={() => {
              onFocusPoi?.(poi);
              if (setMinimized) setMinimized(true);
            }}
            sx={{
              textTransform: "none",
              fontSize: "0.8125rem",
              py: 0.5,
              fontWeight: 600,
              backgroundColor: "#00E46A",
              color: "#0B0C0E",
              boxShadow: "none",
              ml: "10px",
              "&:hover": {
                backgroundColor: "#00FF94",
                boxShadow: "0 0 0 1px #00FF94",
              },
            }}
          >
            Zoom to POI
          </Button>
        </Box>
      </CardContent>
    </>
  );
}
