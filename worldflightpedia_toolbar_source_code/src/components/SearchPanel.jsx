import React, { useState } from "react";
import { Box, TextField, Button, Stack } from "@mui/material";
import palette from "../theme/palette";

export default function SearchPanel({ setPois, setUserCoords }) {
  const [lat, setLat] = useState(-17.389);
  const [lon, setLon] = useState(-66.156);
  const [radius, setRadius] = useState(5000);

  const searchPOIs = async () => {
    setUserCoords({ lat, lon });

    const url = `https://en.wikipedia.org/w/api.php?action=query&list=geosearch&gscoord=${lat}|${lon}&gsradius=${radius}&gslimit=10&format=json&origin=*`;

    try {
      const res = await fetch(url);
      const data = await res.json();
      setPois(data.query?.geosearch || []);
    } catch (err) {
      console.error(err);
      setPois([]);
    }
  };

  return (
    <Box sx={{ mb: 2 }}>
      <Stack spacing={1.5}>
        <TextField
          label="Latitud"
          type="number"
          size="small"
          value={lat}
          onChange={(e) => setLat(+e.target.value)}
          sx={{ bgcolor: palette.card, input: { color: palette.textPrimary } }}
        />
        <TextField
          label="Longitud"
          type="number"
          size="small"
          value={lon}
          onChange={(e) => setLon(+e.target.value)}
          sx={{ bgcolor: palette.card, input: { color: palette.textPrimary } }}
        />
        <TextField
          label="Radio (m)"
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
          Buscar POIss
        </Button>
      </Stack>
    </Box>
  );
}
