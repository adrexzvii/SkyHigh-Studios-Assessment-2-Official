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
import React, { useState, useRef, useEffect } from "react";
import { Box, Typography, Button, IconButton, Tooltip } from "@mui/material";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
import FiberManualRecordIcon from "@mui/icons-material/FiberManualRecord";
import palette from "../../theme/palette";
import { useSimVarToggle } from "../../hooks/simvar/useSimVarToggle";
import { setSimVarSafe } from "../../utils/simvar/simvarUtils";
import { useCommBus } from "../../hooks/comm/useCommBus";

export default function TopBar({ onOpenHelp, flightFinished = false, onFinishComplete = () => {} }) {
  // Hook controlling POI spawn toggle (SimVar: L:spawnAllLasersRed)
  const spawnPois = useSimVarToggle("L:spawnAllLasersRed");
  // Hook controlling flight tracking toggle (SimVar: L:WFP_StartFlight)
  const flight = useSimVarToggle("L:WFP_StartFlight");
  // Hook managing CommBus connection status
  const { isReady } = useCommBus();
  // Local UI state for manual testing of L:WFP_START_SOUND
  const [soundOn, setSoundOn] = useState(false);
  // Timeout ref to clear pending sound resets
  const soundTimeoutRef = useRef(null);
  // Ref for delayed start-sound trigger (1s after start)
  const delayedSoundRef = useRef(null);
  // Separate refs for stop-sound handling to avoid clashing with start-sound
  const stopSoundTimeoutRef = useRef(null);
  const delayedStopRef = useRef(null);
  // Refs for show-sound handling (for Show/Hide POIs)
  const showSoundTimeoutRef = useRef(null);
  const delayedShowRef = useRef(null);
  // Refs for hide-sound handling (for Hide POIs)
  const hideSoundTimeoutRef = useRef(null);
  const delayedHideRef = useRef(null);
  // Ref to ensure automatic finish logic runs only once per flightFinished true
  const autoFinishRanRef = useRef(false);
  // Disable state for the 'Show all POIs' button while flight is started
  const LS_KEY_SPAWN_DISABLED = "wfp_spawn_btn_disabled";
  const [spawnBtnDisabled, setSpawnBtnDisabled] = useState(() => {
    try {
      const raw = window.localStorage?.getItem(LS_KEY_SPAWN_DISABLED);
      return raw ? JSON.parse(raw) : false;
    } catch (_) {
      return false;
    }
  });

  // Persist spawnBtnDisabled to localStorage whenever it changes
  useEffect(() => {
    try {
      window.localStorage?.setItem(LS_KEY_SPAWN_DISABLED, JSON.stringify(spawnBtnDisabled));
    } catch (e) {
      console.warn('[TopBar] Failed saving spawnBtnDisabled to localStorage', e);
    }
  }, [spawnBtnDisabled]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (soundTimeoutRef.current) {
        clearTimeout(soundTimeoutRef.current);
        soundTimeoutRef.current = null;
      }
      if (delayedSoundRef.current) {
        clearTimeout(delayedSoundRef.current);
        delayedSoundRef.current = null;
      }
      if (stopSoundTimeoutRef.current) {
        clearTimeout(stopSoundTimeoutRef.current);
        stopSoundTimeoutRef.current = null;
      }
      if (delayedStopRef.current) {
        clearTimeout(delayedStopRef.current);
        delayedStopRef.current = null;
      }
      if (showSoundTimeoutRef.current) {
        clearTimeout(showSoundTimeoutRef.current);
        showSoundTimeoutRef.current = null;
      }
      if (delayedShowRef.current) {
        clearTimeout(delayedShowRef.current);
        delayedShowRef.current = null;
      }
      if (hideSoundTimeoutRef.current) {
        clearTimeout(hideSoundTimeoutRef.current);
        hideSoundTimeoutRef.current = null;
      }
      if (delayedHideRef.current) {
        clearTimeout(delayedHideRef.current);
        delayedHideRef.current = null;
      }
    };
  }, []);

  // Pulse the start sound simvar: set to 1 for 4 seconds, then back to 0.
  const toggleStartSound = () => {
    // set sound on
    setSimVarSafe("L:WFP_START_SOUND", "Number", 1);
    setSoundOn(true);

    // schedule turning it off after 4s
    soundTimeoutRef.current = setTimeout(() => {
      setSimVarSafe("L:WFP_START_SOUND", "Number", 0);
      console.log("4.5 sec doneeeeeeeeeeeeeeeeeeeeeeeeee");
      setSoundOn(false);
      soundTimeoutRef.current = null;
    }, 3800);
  };

  // Pulse the stop sound simvar: set to 1 for 4 seconds, then back to 0.
  const toggleStopSound = () => {
    // clear any existing pending stop reset
    if (stopSoundTimeoutRef.current) {
      clearTimeout(stopSoundTimeoutRef.current);
      stopSoundTimeoutRef.current = null;
    }

    // set stop sound on
    setSimVarSafe("L:WFP_STOP_SOUND", "Number", 1);
    // schedule turning it off after 4s
    stopSoundTimeoutRef.current = setTimeout(() => {
      setSimVarSafe("L:WFP_STOP_SOUND", "Number", 0);
      console.log("4.5 sec doneeeeeeeeeeeeeeeeeeeeeeeeee stoooooooooooooooop");
      stopSoundTimeoutRef.current = null;
    }, 1600);
  };

  // Pulse the show sound simvar: set to 1 for ~4 seconds, then back to 0.
  const toggleShowSound = () => {
    // clear existing pending reset
    if (showSoundTimeoutRef.current) {
      clearTimeout(showSoundTimeoutRef.current);
      showSoundTimeoutRef.current = null;
    }

    // set show sound on
    setSimVarSafe("L:WFP_SHOW_SOUND", "Number", 1);

    // schedule turning it off after ~3.8s
    showSoundTimeoutRef.current = setTimeout(() => {
      setSimVarSafe("L:WFP_SHOW_SOUND", "Number", 0);
      showSoundTimeoutRef.current = null;
    }, 3500);
  };

  // Pulse the hide sound simvar: set to 1 for ~4 seconds, then back to 0.
  const toggleHideSound = () => {
    // clear existing pending reset
    if (hideSoundTimeoutRef.current) {
      clearTimeout(hideSoundTimeoutRef.current);
      hideSoundTimeoutRef.current = null;
    }

    // set hide sound on
    setSimVarSafe("L:WFP_HIDE_SOUND", "Number", 1);

    // schedule turning it off after ~3.8s
    hideSoundTimeoutRef.current = setTimeout(() => {
      setSimVarSafe("L:WFP_HIDE_SOUND", "Number", 0);
      hideSoundTimeoutRef.current = null;
    }, 3700);
  };

  // If the parent signals the route finished, run the finish/stop actions automatically
  useEffect(() => {
    if (flightFinished) {
      if (autoFinishRanRef.current) return;
      autoFinishRanRef.current = true;

      // Ensure StartFlight simvar toggled off
      try {
        if (flight.value) flight.toggle();
      } catch (e) { console.warn('[TopBar] Error toggling flight during auto-finish', e); }

      // Trigger stop volume and stop sound
      try { setSimVarSafe("L:WFP_STOP_VOLUME", "Number", 100); } catch (_){ }
      if (delayedStopRef.current) { clearTimeout(delayedStopRef.current); delayedStopRef.current = null; }
      delayedStopRef.current = setTimeout(() => { toggleStopSound(); delayedStopRef.current = null; }, 1000);
      // Do not auto-clear flightFinished here; leave it for user acknowledgement (Finish Flight button)
    } else {
      // Reset auto-run guard when parent clears the finished flag
      autoFinishRanRef.current = false;
    }
  }, [flightFinished]);

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
              disabled={spawnBtnDisabled}
              onClick={() => {
                const willShow = !spawnPois.value;
                spawnPois.toggle();

                if (willShow) {
                  // showing POIs: set show volume and trigger show sound
                  try {
                    setSimVarSafe("L:WFP_SHOW_VOLUME", "Number", 100);
                  } catch {}

                  if (delayedShowRef.current) {
                    clearTimeout(delayedShowRef.current);
                    delayedShowRef.current = null;
                  }
                  delayedShowRef.current = setTimeout(() => {
                    toggleShowSound();
                    delayedShowRef.current = null;
                  }, 1000);
                } else {
                  // hiding POIs: set hide volume and trigger hide sound
                  try {
                    setSimVarSafe("L:WFP_HIDE_VOLUME", "Number", 100);
                  } catch {}

                  if (delayedHideRef.current) {
                    clearTimeout(delayedHideRef.current);
                    delayedHideRef.current = null;
                  }
                  delayedHideRef.current = setTimeout(() => {
                    toggleHideSound();
                    delayedHideRef.current = null;
                  }, 1000);
                }
              }}
              sx={{ color: palette.textPrimary, "&:hover": { bgcolor: palette.accentHover } }}
            >
              {spawnPois.value ? "Hide all POIs in MSFS" : "Show all POIs in MSFS"}
            </Button>
          </Tooltip>

          {/* Start/Stop or Finish Flight control */}
          {flightFinished ? (
            <Tooltip title="Finish Flight">
              <Button
                onClick={() => {
                  // Ensure the flight simvar is off
                  try {
                    if (flight.value) flight.toggle();
                  } catch (e) { console.warn('[TopBar] Error toggling flight during finish', e); }

                  // Trigger stop-volume and stop-sound sequence for finish
                  try { setSimVarSafe("L:WFP_STOP_VOLUME", "Number", 100); } catch (_){ }
                  if (delayedStopRef.current) { clearTimeout(delayedStopRef.current); delayedStopRef.current = null; }
                  delayedStopRef.current = setTimeout(() => { toggleStopSound(); delayedStopRef.current = null; }, 1000);

                  // Notify parent that finish was completed so UI can update
                  try { onFinishComplete(); } catch (e) { console.warn('[TopBar] onFinishComplete threw', e); }
                }}
                sx={{ color: palette.textPrimary, "&:hover": { bgcolor: palette.accentHover } }}
              >
                Finish Flight
              </Button>
            </Tooltip>
          ) : (
            <Tooltip title="Start/Stop Flight Tracking">
              <Button
                onClick={() => {
                  const willStart = !flight.value;
                  flight.toggle();
                    if (willStart) {
                      // Disable the Show POIs button while flight is started
                      try { setSpawnBtnDisabled(true); } catch (_) {}
                    try {
                      setSimVarSafe("L:WFP_START_VOLUME", "Number", 100);
                    } catch {}

                    // trigger the start sound after 1 second
                    if (delayedSoundRef.current) {
                      clearTimeout(delayedSoundRef.current);
                      delayedSoundRef.current = null;
                    }
                    delayedSoundRef.current = setTimeout(() => {
                      toggleStartSound();
                      delayedSoundRef.current = null;
                    }, 1000);
                  } else {
                    // Re-enable the Show POIs button when flight stops
                    try { setSpawnBtnDisabled(false); } catch (_) {}
                    // stopping flight: set stop volume and trigger stop sound after 1s
                    try {
                      setSimVarSafe("L:WFP_STOP_VOLUME", "Number", 100);
                    } catch {}

                    if (delayedStopRef.current) {
                      clearTimeout(delayedStopRef.current);
                      delayedStopRef.current = null;
                    }
                    delayedStopRef.current = setTimeout(() => {
                      toggleStopSound();
                      delayedStopRef.current = null;
                    }, 1000);
                  }
                }}
                sx={{ color: palette.textPrimary, "&:hover": { bgcolor: palette.accentHover } }}
              >
                {flight.value ? "Stop Flight" : "Start Flight"}
              </Button>
            </Tooltip>
          )}

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
