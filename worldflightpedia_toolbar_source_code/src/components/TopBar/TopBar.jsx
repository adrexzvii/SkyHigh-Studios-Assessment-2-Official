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
import FiberManualRecordIcon from "@mui/icons-material/FiberManualRecord";
import palette from "../../theme/palette";
import { useSimVarToggle } from "../../hooks/simvar/useSimVarToggle";
import { useCommBus } from "../../hooks/comm/useCommBus";

export default function TopBar({ onOpenHelp }) {
  // Hook controlling POI spawn toggle (SimVar: L:spawnAllLasersRed)
  const spawnPois = useSimVarToggle("L:spawnAllLasersRed");
  // Hook controlling flight tracking toggle (SimVar: L:WFP_StartFlight)
  const flight = useSimVarToggle("L:WFP_StartFlight");
  // Hook managing CommBus connection status
  const { isReady } = useCommBus();

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
        {/* Left section: connection status */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          {/* WASM connection status indicator */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
            <FiberManualRecordIcon
              sx={{
                fontSize: "12px",
                color: isReady ? palette.accent : "#ff4444",
                animation: isReady ? "none" : "pulse 1.5s ease-in-out infinite",
                "@keyframes pulse": {
                  "0%, 100%": { opacity: 1 },
                  "50%": { opacity: 0.3 }
                }
              }}
            />
            <Typography
              variant="caption"
              sx={{
                color: isReady ? palette.accent : "#ff4444",
                fontSize: "0.75rem",
                fontWeight: 600
              }}
            >
              {isReady ? "WASM Connected" : "Connecting..."}
            </Typography>
          </Box>
        </Box>

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
              onClick={onOpenHelp}
              sx={{ color: palette.textPrimary, "&:hover": { bgcolor: palette.accentHover } }}
            >
              <HelpOutlineIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* HelpDialog removed: Help now opens Wikipedia popup in MapView */}
    </>
  );
}
