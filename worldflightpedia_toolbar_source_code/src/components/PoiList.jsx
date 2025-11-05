import React from "react";
import { List, ListItemButton, ListItemText, Typography } from "@mui/material";
import palette from "../theme/palette";

export default function PoiList({ pois, setSelectedPoi }) {
  if (!pois.length)
    return <Typography variant="body2" color={palette.textSecondary}>No hay resultados</Typography>;

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
            "&:hover": { bgcolor: palette.accent, color: palette.dark },
          }}
        >
          <ListItemText primary={poi.title} secondary={`(${poi.lat.toFixed(3)}, ${poi.lon.toFixed(3)})`} />
        </ListItemButton>
      ))}
    </List>
  );
}
