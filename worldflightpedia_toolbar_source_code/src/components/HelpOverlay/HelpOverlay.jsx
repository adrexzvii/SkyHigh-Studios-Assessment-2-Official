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
      <Card sx={{
        width: 400,
        maxWidth: "90vw",
        maxHeight: "90vh",
        overflow: "auto",
        bgcolor: palette.dark,
        color: palette.textPrimary,
        boxShadow: 24,
        // Scrollbar styling to match Leaflet popup (light track, subtle thumb)
        '&::-webkit-scrollbar': { width: '6px' },
              '&::-webkit-scrollbar-track': {
                backgroundColor: 'transparent',
              },
              '&::-webkit-scrollbar-thumb': {
                backgroundColor: palette.accent,
                borderRadius: '6px',
                border: 'none',
                '&:hover': { backgroundColor: palette.accentHover },
              },
              scrollbarWidth: 'thin',
              scrollbarColor: `${palette.accent} transparent`,
      }}>
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", px: 2, py: 1 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>WorldFlightPedia Help</Typography>
          <IconButton size="small" onClick={onClose} sx={{ color: palette.textPrimary, "&:hover": { bgcolor: palette.accentHover } }}>
            <CloseIcon />
          </IconButton>
        </Box>
        <Divider sx={{ borderColor: palette.divider }} />
        <CardContent sx={{ pt: 2, pb: 2, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          {/*
            Show an illustrative help image instead of the text-only guide.
            In MSFS this app is hosted inside CoherentGT (COUI). If you bundle
            the image for COUI, you can expose its path via a global (for
            example `window.__COUI_HELP_IMAGE`) so the app will use that URL.
            Otherwise the app falls back to a file placed in `public/help-guide.png`.
          */}
          {(() => {
            const publicSrc = `${process.env.PUBLIC_URL || ''}/help-guide.png`;
            // Allow MSFS/Coherent to provide an explicit COUI asset URL via a global.
            const couiSrc = typeof window !== 'undefined' && window.__COUI_HELP_IMAGE ? window.__COUI_HELP_IMAGE : null;
            const src = couiSrc || publicSrc;
            return (
              <Box sx={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
                <img
                  src={src}
                  alt="WorldFlightPedia usage guide"
                  style={{ width: '370px', height: '440px', objectFit: 'cover', borderRadius: 6, boxShadow: '0 6px 18px rgba(0,0,0,0.5)' }}
                />
              </Box>
            );
          })()}

          <Box sx={{ mt: 2 }}>
            <Button size="small" variant="outlined" onClick={onClose} sx={{ color: palette.textPrimary, borderColor: palette.divider, "&:hover": { bgcolor: palette.accentHover } }}>
              Close
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}
