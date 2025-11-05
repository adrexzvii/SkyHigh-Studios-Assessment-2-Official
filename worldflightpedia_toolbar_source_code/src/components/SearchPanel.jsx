/**
 * SearchPanel.jsx - POI Search Component
 * 
 * Provides search functionality for Points of Interest using Wikipedia's geosearch API.
 * Allows users to search by latitude, longitude, and radius.
 * 
 * @component
 * @param {Function} setPois - Function to update the POI list
 * @param {Function} setUserCoords - Function to update user coordinates
 */

import React, { useState } from "react";
import { Box, TextField, Button, Stack } from "@mui/material";
import palette from "../theme/palette";

export default function SearchPanel({ setPois, setUserCoords }) {
  // Search parameters state
  const [lat, setLat] = useState(-17.389);   // Default latitude (Bolivia)
  const [lon, setLon] = useState(-66.156);   // Default longitude (Bolivia)
  const [radius, setRadius] = useState(5000); // Search radius in meters

  /**
   * Searches for POIs using Wikipedia's geosearch API
   * @async
   */
  const searchPOIs = async () => {
    // Update user coordinates
    setUserCoords({ lat, lon });

    // Wikipedia geosearch API URL
    const url = `https://en.wikipedia.org/w/api.php?action=query&list=geosearch&gscoord=${lat}|${lon}&gsradius=${radius}&gslimit=10&format=json&origin=*`;

    try {
      const res = await fetch(url);
      const data = await res.json();
      setPois(data.query?.geosearch || []);
    } catch (err) {
      console.error("Error fetching POIs:", err);
      setPois([]);
    }
  };

  return (
    <Box sx={{ mb: 2 }}>
      <Stack spacing={1.5}>
        <TextField
          label="Latitude"
          type="number"
          size="small"
          value={lat}
          onChange={(e) => setLat(+e.target.value)}
          sx={{ bgcolor: palette.card, input: { color: palette.textPrimary } }}
        />
        <TextField
          label="Longitude"
          type="number"
          size="small"
          value={lon}
          onChange={(e) => setLon(+e.target.value)}
          sx={{ bgcolor: palette.card, input: { color: palette.textPrimary } }}
        />
        <TextField
          label="Radius (m)"
          type="number"
          size="small"
          value={radius}
          onChange={(e) => setRadius(+e.target.value)}
          sx={{ bgcolor: palette.card, input: { color: palette.textPrimary } }}
        />
        <Button
          variant="contained"
          sx={{
            bgcolor: palette.accent,
            color: palette.dark,
            fontWeight: 600,
            "&:hover": { bgcolor: palette.accentHover },
          }}
          onClick={searchPOIs}
        >
          Search POIs
        </Button>
      </Stack>
    </Box>
  );
}
