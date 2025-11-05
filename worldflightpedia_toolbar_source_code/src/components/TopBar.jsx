/**
 * TopBar.jsx - Application Top Navigation Bar
 * 
 * Provides the main navigation and actions for the application:
 * - Save/Load flight plans
 * - Help dialog
 * - Integration with Microsoft Flight Simulator (MSFS) Coherent engine
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
    const [helpOpen, setHelpOpen] = React.useState(false);

    /**
     * Saves the current flight plan to localStorage
     */
    const handleSaveFlightPlan = () => {
        try {
            const flightPlanData = {
                timestamp: new Date().toISOString(),
                // Add your flight plan data structure here
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