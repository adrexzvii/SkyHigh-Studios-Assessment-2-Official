/**
 * MapPopupWikipedia.jsx - Wikipedia POI Details Component
 * 
 * Displays detailed information about a POI fetched from Wikipedia's REST API.
 * Features:
 * - Expandable/collapsible content
 * - Minimizable popup
 * - Distance calculation from user location
 * - Wikipedia summary and images
 * 
 * @component
 * @param {Object} poi - The POI object with lat, lon, and title
 * @param {Object} userCoords - User's current coordinates {lat, lon}
 * @param {Function} onFocusPoi - Function to center map on POI
 */

import { useState, useEffect } from "react";
import { 
  Card, 
  CardMedia, 
  CardContent, 
  Typography, 
  Button, 
  Box, 
  Collapse, 
  IconButton, 
  CircularProgress 
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import RemoveIcon from "@mui/icons-material/Remove";

/**
 * Calculates distance between two coordinates using Haversine formula
 * @param {number} lat1 - First latitude
 * @param {number} lon1 - First longitude
 * @param {number} lat2 - Second latitude
 * @param {number} lon2 - Second longitude
 * @returns {number} Distance in kilometers
 */
function haversine(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

export default function MapPopupWikipedia({ poi, userCoords, onFocusPoi }) {
  const [expanded, setExpanded] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [details, setDetails] = useState(null);
  const [distance, setDistance] = useState(null);
  const [loading, setLoading] = useState(false);

  // Extract POI title with multiple fallback options
  const poiTitle =
    (poi && (
      poi.title ||
      poi.name ||
      poi.display_name ||
      (poi.properties && (poi.properties.title || poi.properties.name)) ||
      (poi.tags && (poi.tags.name || poi.tags.title)) ||
      poi.wikipedia_title ||
      poi.label ||
      (typeof poi === "string" ? poi : null)
    )) || "Unnamed location";

  // Restore minimized state when a new POI is selected
  useEffect(() => {
    if (poi) {
      setMinimized(false);
    }
  }, [poi]);

  // Fetch Wikipedia details and calculate distance
  useEffect(() => {
    if (!poi) return;

    const fetchDetails = async () => {
      try {
        setLoading(true);
        // Fetch Wikipedia summary using REST API
        const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(poiTitle)}`;
        const res = await fetch(url);
        const data = await res.json();
        setDetails(data);

        // Calculate distance if coordinates are available
        if (userCoords?.lat && userCoords?.lon && poi?.lat && poi?.lon) {
          const d = haversine(userCoords.lat, userCoords.lon, poi.lat, poi.lon);
          setDistance(d.toFixed(2));
        }
      } catch (err) {
        console.error("Error loading Wikipedia details:", err);
        setDetails(null);
      } finally {
        setLoading(false);
      }
    };

    fetchDetails();
    
  }, [poi, poiTitle, userCoords]);

  if (!poi) return null;

  // Minimized view
  if (minimized) {
    return (
      <Card
        sx={{
          position: "absolute",
          top: 173,
          left: 0,
          width: 260,
          boxShadow: 4,
          borderRadius: 2,
        }}
      >
        <Box
          sx={{
            p: 1,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Typography fontWeight={600} sx={{ color: "text.primary" }}>
            {poiTitle}
          </Typography>
          <IconButton size="small" onClick={() => setMinimized(false)}>
            <ExpandMoreIcon />
          </IconButton>
        </Box>
      </Card>
    );
  }
  
  // Full view
  return (
    <Card
      sx={{
        position: "absolute",
        top: 173,
        left: 0,
        zIndex: 10,
        width: 250,
        maxHeight: "30rem",
        boxShadow: 6,
        borderRadius: 2,
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* POI Image */}
      {(details?.thumbnail?.source || poi.image) && (
        <CardMedia
          component="img"
          height="140"
          image={details?.thumbnail?.source || poi.image}
          alt={poiTitle}
          sx={{ flexShrink: 0 }}
        />
      )}

      <CardContent sx={{ 
        flexGrow: 1, 
        overflowY: "auto",
        "&::-webkit-scrollbar": {
          width: "8px",
        },
        "&::-webkit-scrollbar-track": {
          backgroundColor: "rgba(0,0,0,0.1)",
          borderRadius: "4px",
        },
        "&::-webkit-scrollbar-thumb": {
          backgroundColor: "rgba(0,0,0,0.3)",
          borderRadius: "4px",
          "&:hover": {
            backgroundColor: "rgba(0,0,0,0.5)",
          },
        },
      }}>
        {/* Header with title and minimize button */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Typography variant="h6" sx={{ color: "text.primary", fontWeight: 600 }}>
            {poiTitle}
          </Typography>
          <IconButton size="small" onClick={() => setMinimized(true)}>
            <RemoveIcon />
          </IconButton>
        </Box>

        {/* Distance information */}
        {distance && (
          <Typography variant="body2" color="text.secondary">
            Distance: {distance} km
          </Typography>
        )}

        {/* Loading state */}
        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", p: 2 }}>
            <CircularProgress size={24} />
          </Box>
        ) : (
          <>
            {/* Category and rating information */}
            <Typography variant="body2" color="text.secondary">
              {poi.rating ? `${poi.rating} · ` : ""}{poi.category}
            </Typography>

            {/* Expandable content section */}
            <Collapse in={expanded} timeout="auto" unmountOnExit>
              <Typography
                variant="caption"
                display="block"
                sx={{ my: 1 }}
              >
                {details?.extract || "No description available."}
              </Typography>

              {/* View on map button */}
              <Button
                size="small"
                variant="contained"
                onClick={() => { 
                  if (typeof onFocusPoi === "function") onFocusPoi(poi);
                  setMinimized(true); // Minimize popup when viewing on map
                }}
                sx={{ mt: 1 }}
              >
                View on map
              </Button>
            </Collapse>

            {/* Expand/Collapse toggle button */}
            <Button
              size="small"
              variant="outlined"
              onClick={() => setExpanded(!expanded)}
              sx={{ mt: 1 }}
              startIcon={expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            >
              {expanded ? "Show less" : "Show more"}
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}
