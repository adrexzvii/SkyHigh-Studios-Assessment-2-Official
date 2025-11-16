import { Card, CardContent, Typography, IconButton, Box, Divider, Button } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import palette from "../../theme/palette";

export default function HelpOverlay({ open, onClose }) {
  if (!open) return null;
  
  return (
    <Box sx={{ 
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      bgcolor: "rgba(0, 0, 0, 0.5)",
      zIndex: 9999,
      pointerEvents: "auto"
    }}>
      <Card sx={{ width: 400, maxWidth: "90vw", maxHeight: "90vh", overflow: "auto", bgcolor: palette.dark, color: palette.textPrimary, boxShadow: 24 }}>
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", px: 2, py: 1 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>WorldFlightPedia Help</Typography>
          <IconButton size="small" onClick={onClose} sx={{ color: palette.textPrimary, "&:hover": { bgcolor: palette.accentHover } }}>
            <CloseIcon />
          </IconButton>
        </Box>
        <Divider sx={{ borderColor: palette.divider }} />
        <CardContent sx={{ pt: 2, pb: 2 }}>
          <Typography variant="body2" sx={{ mb: 1 }}>
            - Fetch POIs using the toolbar, then press Start Flight.
          </Typography>
          <Typography variant="body2" sx={{ mb: 1 }}>
            - The active route segment is highlighted in {"#00E46A"}.
          </Typography>
          <Typography variant="body2" sx={{ mb: 1 }}>
            - Auto-pause triggers at each POI when Start Flight is active.
          </Typography>
          <Typography variant="body2" sx={{ mb: 1 }}>
            - Click a marker to view Wikipedia details.
          </Typography>
          <Box sx={{ mt: 1 }}>
            <Button size="small" variant="outlined" onClick={onClose} sx={{ color: palette.textPrimary, borderColor: palette.divider, "&:hover": { bgcolor: palette.accentHover } }}>
              Close
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}
