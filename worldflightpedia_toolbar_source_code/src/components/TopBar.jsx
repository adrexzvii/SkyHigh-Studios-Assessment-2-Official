/**
 * TopBar.jsx - Application Top Navigation Bar
 * 
 * Responsibilities:
 * - Provide UI controls for saving and loading flight plans
 * - Toggle MSFS L:vars for spawning POIs and starting flight tracking
 * - Integrate with MSFS Coherent engine for loading .pln files
 * - Display help dialog for user guidance
 * 
 * Notes:
 * - All SimVar and engine calls are guarded to avoid errors outside MSFS
 * - State toggles are optimistic (UI updates immediately; MSFS is source of truth)
 * - The commented-out pause logic is preserved for future use if needed
 * 
 * @component
 */

import React from 'react';
import { 
    Box, 
    Typography, 
    Button, 
    IconButton, 
    Tooltip,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    List,
    ListItem,
    ListItemText 
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import DownloadIcon from '@mui/icons-material/Download';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import palette from '../theme/palette';

export default function TopBar() {
    // Help dialog visibility
    const [helpOpen, setHelpOpen] = React.useState(false);
    
    // Tracks whether all POIs should be spawned in MSFS (backed by L:spawnAllLasersRed)
    const [spawnAllPois, setSpawnAllPois] = React.useState(false);
    // Tracks whether sim is currently paused via K:PAUSE_SET
    // const [paused, setPaused] = React.useState(false);
    // Tracks whether flight is started (backed by L:WFP_StartFlight)
    const [flightStarted, setFlightStarted] = React.useState(false);

    // Toggle MSFS custom L:var to show/hide all POIs in the simulator
    const handleToggleAllPois = () => {
        const newVal = spawnAllPois ? 0 : 1;
        try {
        SimVar.SetSimVarValue("L:spawnAllLasersRed", "Bool", newVal);
            
        } catch (e) {
            console.error("[TopBar] Error setting L:spawnAllLasersRed:", e);
        } finally {
            // Reflect desired state in UI regardless; in-sim it will be the source of truth
            setSpawnAllPois((prev) => !prev);
        }
    };

    // Toggle MSFS custom L:var to start/stop flight tracking
    const handleToggleStartFlight = () => {
        const newVal = flightStarted ? 0 : 1;
        try {
            SimVar.SetSimVarValue("L:WFP_StartFlight", "Bool", newVal);
        } catch (e) {
            console.error("[TopBar] Error setting L:WFP_StartFlight:", e);
        } finally {
            // Reflect desired state in UI regardless; in-sim it will be the source of truth
            setFlightStarted((prev) => !prev);
        }
    };

    /**
     * Saves the current flight plan to localStorage
     */
    const handleSaveFlightPlan = () => {
        try {
            const flightPlanData = {
                timestamp: new Date().toISOString(),
                // Add your flight plan data structure here (e.g., pois, route)
            };
            
            localStorage.setItem('flightPlan', JSON.stringify(flightPlanData));
            // Could add success notification here
        } catch (error) {
            console.error('Error saving flight plan:', error);
            // Could add error handling UI here
        }
    };
    
    /**
     * Loads a flight plan - attempts to use MSFS Coherent API or opens native dialog
     * Note: This is specific to Microsoft Flight Simulator integration
     */
    const handleLoadFlightPlan = () => {
        const path = "C:/Users/adria/Downloads/SLCBSLVR_MFS_29Oct25.pln";
        console.log("Attempting to load flight plan");
        
        try {
            // // Toggle simulator pause state using K: event when loading
            // try {
            //     const newPauseVal = paused ? 0 : 1;
            //     // K: events accept a numeric/bool value parameter
            //     SimVar.SetSimVarValue("K:PAUSE_SET", "Bool", newPauseVal);
            // } catch (pauseErr) {
            //     console.warn("[TopBar] Unable to toggle K:PAUSE_SET:", pauseErr);
            // } finally {
            //     setPaused(prev => !prev);
            // }

            console.log("Inside try block");
            const engineTrigger = engine.trigger("ASK_LOAD_SAVE_CUSTOM_FLIGHTPLAN");
            console.log("After ASK_LOAD_SAVE_CUSTOM_FLIGHTPLAN:", engineTrigger);
            
            // Try to load using Coherent API (MSFS specific)
            Coherent.call("LOAD_FLIGHTPLAN", path)
                .then(() => console.log("Flight plan loaded:", path))
                .catch((err) => {
                    console.warn("LOAD_FLIGHTPLAN not available or failed:", err);
                    // Fallback: Open native Load/Save dialog
                    engine.trigger("ASK_LOAD_SAVE_CUSTOM_FLIGHTPLAN");
                });
        } catch (e) {
            console.warn("Coherent not available in this environment. Opening dialog:", e);
            engine.trigger("ASK_LOAD_SAVE_CUSTOM_FLIGHTPLAN");
        }
    };

    /**
     * Opens the help dialog
     */
    const handleHelpClick = () => {
        setHelpOpen(true);
    };

    /**
     * Closes the help dialog
     */
    const handleCloseHelp = () => {
        setHelpOpen(false);
    };

    return (
        <>
            <Box
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    height: '48px',
                    px: 2,
                    bgcolor: palette.dark,
                    borderBottom: `1px solid ${palette.divider}`,
                    position: 'relative',
                    top: 0,
                    left: 0,
                    right: 0,
                    zIndex: 1200,
                }}
            >
                <Typography
                    variant="h6"
                    sx={{
                        color: palette.textPrimary,
                        fontWeight: 700,
                        fontSize: '1.2rem',
                    }}
                >
                    POIS FLIGHTPLAN
                </Typography>

                <Box sx={{ display: 'flex', gap: 1 }}>
                    <Tooltip title="Show/Hide all POIs in MSFS">
                        <Button
                            onClick={handleToggleAllPois}
                            sx={{
                                color: palette.textPrimary,
                                '&:hover': { bgcolor: palette.accentHover },
                            }}
                        >
                            {spawnAllPois ? 'Hide all POIs in MSFS' : 'Show all POIs in MSFS'}
                        </Button>
                    </Tooltip>

                    <Tooltip title="Start/Stop Flight Tracking">
                        <Button
                            onClick={handleToggleStartFlight}
                            sx={{
                                color: palette.textPrimary,
                                '&:hover': { bgcolor: palette.accentHover },
                            }}
                        >
                            {flightStarted ? 'Stop Flight' : 'Start Flight'}
                        </Button>
                    </Tooltip>

                    <Tooltip title="Save Flight Plan">
                        <Button
                            startIcon={<SaveIcon />}
                            onClick={handleSaveFlightPlan}
                            sx={{
                                color: palette.textPrimary,
                                '&:hover': {
                                    bgcolor: palette.accentHover,
                                },
                            }}
                        >
                            Save Plan
                        </Button>
                    </Tooltip>

                    <Tooltip title="Load Flight Plan">
                        <Button
                            startIcon={<DownloadIcon />}
                            onClick={handleLoadFlightPlan}
                            sx={{
                                color: palette.textPrimary,
                                '&:hover': {
                                    bgcolor: palette.accentHover,
                                },
                            }}
                        >
                            Load Plan
                        </Button>
                    </Tooltip>

                    <Tooltip title="Help">
                        <IconButton
                            onClick={handleHelpClick}
                            sx={{
                                color: palette.textPrimary,
                                '&:hover': {
                                    bgcolor: palette.accentHover,
                                },
                            }}
                        >
                            <HelpOutlineIcon />
                        </IconButton>
                    </Tooltip>
                </Box>
            </Box>

            {/* Help Dialog */}
            <Dialog 
                open={helpOpen} 
                onClose={handleCloseHelp}
                PaperProps={{
                    sx: {
                        bgcolor: palette.dark,
                        color: palette.textPrimary,
                        minWidth: '320px'
                    }
                }}
            >
                <DialogTitle sx={{ borderBottom: `1px solid ${palette.divider}` }}>
                    Help Guide
                </DialogTitle>
                <DialogContent>
                    <List>
                        <ListItem>
                            <ListItemText 
                                primary="Save Flight Plan"
                                secondary="Saves your current flight plan locally"
                                secondaryTypographyProps={{ color: palette.textSecondary }}
                            />
                        </ListItem>
                        <ListItem>
                            <ListItemText 
                                primary="Load Flight Plan"
                                secondary="Loads your previously saved flight plan"
                                secondaryTypographyProps={{ color: palette.textSecondary }}
                            />
                        </ListItem>
                        {/* Add more help items as needed */}
                    </List>
                </DialogContent>
                <DialogActions sx={{ borderTop: `1px solid ${palette.divider}` }}>
                    <Button 
                        onClick={handleCloseHelp}
                        sx={{ color: palette.accent }}
                    >
                        Close
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
}