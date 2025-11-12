/**
 * PoiListItem - Individual POI list item component
 * 
 * Renders a single clickable POI item with:
 * - POI title as primary text
 * - Formatted coordinates as secondary text
 * - Hover effect with accent color
 * 
 * @component
 * @param {Object} props
 * @param {Object} props.poi - POI object containing title, lat, and lon
 * @param {Function} props.onSelect - Callback function triggered when item is clicked
 * @returns {JSX.Element} Rendered list item button
 */

import { ListItemButton, ListItemText } from "@mui/material";
import palette from "../../theme/palette";
import { formatCoordinates } from "../../utils/ui/formatCoordinates";

export default function PoiListItem({ poi, onSelect }) {
  return (
    <ListItemButton
      onClick={() => onSelect(poi)}
      sx={{
        borderRadius: 1,
        mb: 1,
        bgcolor: palette.card,
        // Hover effect: accent background with dark text
        "&:hover": { bgcolor: palette.accent, color: palette.dark },
      }}
    >
      {/* POI title and formatted coordinates */}
      <ListItemText
        primary={poi.title || "Unnamed"}
        secondary={formatCoordinates(poi.lat, poi.lon)}
      />
    </ListItemButton>
  );
}
