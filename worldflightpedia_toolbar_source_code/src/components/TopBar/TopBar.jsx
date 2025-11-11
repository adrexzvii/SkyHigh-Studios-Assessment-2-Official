/**
 * TopBar - Application navigation and action bar
 *
 * Provides quick-access controls for simulator integration:
 * - Toggle visibility of all POIs (L:spawnAllLasersRed)
 * - Start/stop flight tracking (L:WFP_StartFlight)
 * - Open contextual help dialog
 *
 * Uses small custom hooks for clean state management:
 * - useSimVarToggle abstracts SimVar.SetSimVarValue with local optimistic UI state
 * - useDialog manages help dialog open/close lifecycle
 *
 * Styling leverages the shared palette for consistent theming.
 *
 * @component
 * @returns {JSX.Element} Top navigation bar with action buttons and help dialog
 */
import React from "react";
import { Box, Typography, Button, IconButton, Tooltip } from "@mui/material";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
import palette from "../../theme/palette";
import { useSimVarToggle } from "../../hooks/useSimVarToggle";
import { useDialog } from "../../hooks/useDialog";
import HelpDialog from "./HelpDialog";

export default function TopBar() {
  // Hook controlling POI spawn toggle (SimVar: L:spawnAllLasersRed)
  const spawnPois = useSimVarToggle("L:spawnAllLasersRed");
  // Hook controlling flight tracking toggle (SimVar: L:WFP_StartFlight)
  const flight = useSimVarToggle("L:WFP_StartFlight");
  // Hook managing help dialog open/close state
  const help = useDialog(false);

  return (
    <>
      {/* Container bar: fixed height, horizontal layout */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          height: 48,
          px: 2,
          bgcolor: palette.dark,
          borderBottom: `1px solid ${palette.divider}`,
          zIndex: 1200,
        }}
      >
        {/* Product / feature title */}
        <Typography
          variant="h6"
          sx={{ color: palette.textPrimary, fontWeight: 700, fontSize: "1.2rem" }}
        >
          POIS FLIGHTPLAN
        </Typography>

        {/* Action buttons group */}
        <Box sx={{ display: "flex", gap: 1 }}>
          {/* Toggle all POIs visibility in MSFS */}
          <Tooltip title="Show/Hide all POIs in MSFS">
            <Button
              onClick={spawnPois.toggle}
              sx={{ color: palette.textPrimary, "&:hover": { bgcolor: palette.accentHover } }}
            >
              {spawnPois.value ? "Hide all POIs in MSFS" : "Show all POIs in MSFS"}
            </Button>
          </Tooltip>

          {/* Start or stop flight tracking */}
          <Tooltip title="Start/Stop Flight Tracking">
            <Button
              onClick={flight.toggle}
              sx={{ color: palette.textPrimary, "&:hover": { bgcolor: palette.accentHover } }}
            >
              {flight.value ? "Stop Flight" : "Start Flight"}
            </Button>
          </Tooltip>

          {/* Open help dialog */}
          <Tooltip title="Help">
            <IconButton
              onClick={help.handleOpen}
              sx={{ color: palette.textPrimary, "&:hover": { bgcolor: palette.accentHover } }}
            >
              <HelpOutlineIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Contextual help dialog (controlled component) */}
      <HelpDialog open={help.open} onClose={help.handleClose} />
    </>
  );
}
