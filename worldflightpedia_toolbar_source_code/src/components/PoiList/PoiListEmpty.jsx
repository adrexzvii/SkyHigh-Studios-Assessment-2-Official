/**
 * PoiListEmpty - Empty state component for POI list
 * 
 * Displays a centered message when no POIs are available.
 * Shown when the POI list is empty (no search results or initial state).
 * 
 * @component
 * @returns {JSX.Element} Centered "No results found" message
 */

import { Typography } from "@mui/material";
import palette from "../../theme/palette";

export default function PoiListEmpty() {
  return (
    <Typography
      variant="body2"
      color={palette.textSecondary}
      sx={{ textAlign: "center", mt: 2 }}
    >
      No results found
    </Typography>
  );
}
