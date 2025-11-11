/**
 * TopBar.jsx - Application Top Navigation Bar
 * 
 * Responsibilities:
 * - Toggle MSFS custom L:vars (spawn POIs, start/stop flight tracking)
 * - Display contextual help dialog
 * 
 * Removed features:
 * - Save/Load flight plan actions and Coherent LOAD_FLIGHTPLAN integration have been removed per request.
 * 
 * Notes:
 * - SimVar calls are guarded implicitly via try/catch blocks.
 * - State toggles are optimistic; simulator remains source of truth.
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
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import palette from '../theme/palette';

export default function TopBar() {
    // Help dialog visibility
    const [helpOpen, setHelpOpen] = React.useState(false);
    
    // Tracks whether all POIs should be spawned in MSFS (backed by L:spawnAllLasersRed)
    const [spawnAllPois, setSpawnAllPois] = React.useState(false);
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