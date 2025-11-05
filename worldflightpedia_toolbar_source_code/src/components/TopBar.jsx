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

    const handleSaveFlightPlan = () => {
        try {
            const flightPlanData = {
                // Add your flight plan data structure here
                timestamp: new Date().toISOString(),
                // ... other data
            };
            
            localStorage.setItem('flightPlan', JSON.stringify(flightPlanData));
            // Could add a success notification here
        } catch (error) {
            console.error('Error saving flight plan:', error);
            // Could add error handling UI here
        }
    };
    
const handleLoadFlightPlan = () => {
     const path = "C:/Users/adria/Downloads/SLCBSLVR_MFS_29Oct25.pln";
     console.log("test 1");
    try {
        console.log("test 1 inside");
       const engineTrigger = engine.trigger("ASK_LOAD_SAVE_CUSTOM_FLIGHTPLAN");
        console.log("test 1 despues ask", engineTrigger);
        Coherent.call("LOAD_FLIGHTPLAN", path)
      .then(() => console.log("Plan cargado:", path))
      .catch((err) => {
        console.warn("LOAD_FLIGHTPLAN no disponible o falló:", err);
        // 2) Fallback: abrir popup nativo Load/Save
        engine.trigger("ASK_LOAD_SAVE_CUSTOM_FLIGHTPLAN");
      });
  } catch (e) {
    console.warn("Coherent no disponible aquí. Abriendo popup…", e);
    engine.trigger("ASK_LOAD_SAVE_CUSTOM_FLIGHTPLAN");
  }
};


    const handleHelpClick = () => {
        setHelpOpen(true);
    };

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