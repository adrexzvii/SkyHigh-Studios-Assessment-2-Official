/**
 * MapPopupMinimized - Minimized view of POI popup
 * 
 * Displays a compact version of the POI popup showing only the title
 * and an expand button to restore the full view.
 * 
 * @param {string} title - POI title to display
 * @param {Function} onExpand - Callback to expand the popup back to full view
 */

import { Card, Box, Typography, IconButton } from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";

export default function MapPopupMinimized({ title, onExpand }) {
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
        {/* POI title - truncated if too long */}
        <Typography sx={{color:"text.primary"}} fontWeight={600}>{title}</Typography>
        
        {/* Expand button to restore full popup */}
        <IconButton size="small" onClick={onExpand}>
          <ExpandMoreIcon />
        </IconButton>
      </Box>
    </Card>
  );
}
