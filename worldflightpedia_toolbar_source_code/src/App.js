/**
 * App.js - Main Application Component
 * 
 * Root component for the WorldFlightPedia application.
 * Manages global state for POIs, user coordinates, and selected POI.
 * 
 * @component
 */

import React, { useState } from "react";
import { Box } from "@mui/material";
import palette from "./theme/palette";
import SearchPanel from "./components/SearchPanel";
import PoiList from "./components/PoiList";
import MapView from "./components/MapView";
import TopBar from "./components/TopBar";

export default function App() {
  // State management for POIs and user data
  const [pois, setPois] = useState([]);
  const [selectedPoi, setSelectedPoi] = useState(null);
  const [userCoords, setUserCoords] = useState({ lat: -17.389, lon: -66.156 }); // Default: Bolivia
  const [username, setUsername] = useState("");

  return (
    <Box 
      sx={{ 
        alignSelf: "flex-start", 
        height: "auto", 
        display: "flex", 
        flexDirection: "column", 
        bgcolor: palette.background, 
        color: palette.textPrimary 
      }}
    >
      {/* Top Navigation Bar */}
      <TopBar />
      
      {/* Main Content Grid: Sidebar + Map */}
      <Box sx={{ display: "grid", gridTemplateColumns: "400px 1fr", minHeight: 0 }}>
        
        {/* Left Sidebar: Search Panel and POI List */}
        <Box 
          sx={{ 
            overflowY: "auto", 
            p: 2, 
            borderRight: `1px solid ${palette.divider}`, 
            bgcolor: palette.dark 
          }}
        >
          {/* Search Panel - Currently commented out */}
          {/* <SearchPanel setPois={setPois} setUserCoords={setUserCoords} /> */}
          
          {/* POI List */}
          <PoiList pois={pois} setSelectedPoi={setSelectedPoi} />
        </Box>

        {/* Right Side: Map View with POI markers and route planning */}
        <div style={{ width: "100%", height: "100%" }}>
          <MapView
            pois={pois}
            userCoords={userCoords}
            selectedPoi={selectedPoi}
            setSelectedPoi={setSelectedPoi}
            setPois={setPois}
            setUserCoords={setUserCoords}
          />
        </div>
      </Box>
    </Box>
  );
}
