/**
 * App.js - Main Application Component
 * 
 * Responsibilities:
 * - Root component orchestrating the application layout and data flow
 * - Manage global state: POIs list, selected POI, user/plane coordinates
 * - Wire MapView to WasmViewCommunicationDebug via ref-based callback
 * - Provide two-panel layout: sidebar (POI list + WASM debug) and map
 * 
 * Architecture:
 * - MapView computes ordered routes and sends JSON to WASM via handleSendToWasm
 * - WasmView acts as a centralized communication bridge (headless by default)
 * - TopBar provides MSFS integration buttons (show/hide POIs, start/stop flight, load plan)
 * 
 * @component
 */

import React, { useState, useRef, useCallback } from "react";
import { Box } from "@mui/material";
import { PoiProvider } from "./components/context/PoiContext";
import palette from "./theme/palette";
import PoiList from "./components/PoiList/PoiList";
import MapView from "./components/MapView";
import TopBar from "./components/TopBar/TopBar";
import  WasmViewCommunicationDebug  from "./components/WasmViewCommunicationDebug";

export default function App() {
  // Global state: POI list, selected POI, and user/plane coordinates
  const [pois, setPois] = useState([]);
  const [selectedPoi, setSelectedPoi] = useState(null);
  const [userCoords, setUserCoords] = useState({ lat: -17.389, lon: -66.156 }); // Default: Cochabamba, Bolivia
  
  // Reference to WasmViewCommunicationDebug component for imperative API access
  const wasmDebugRef = useRef(null);

  /**
   * Callback to send data to WASM module via the centralized bridge.
   * Checks readiness before sending; logs warning if not ready.
   * 
   * @param {string} eventName - WASM event identifier (e.g., "OnMessageFromJs")
   * @param {Object} payload - Data payload to send to WASM
   */
  const handleSendToWasm = useCallback((eventName, payload) => {
    if (wasmDebugRef.current && wasmDebugRef.current.isReady()) {
      wasmDebugRef.current.sendToWasm(eventName, payload);
    } else {
      console.warn("[App] WASM communication not ready yet; ensure CommBus is initialized");
    }
  }, []);

  return (
    <PoiProvider>
    <Box 
      sx={{ 
        alignSelf: "flex-start", 
        height: "100vh", 
        display: "flex", 
        flexDirection: "column", 
        bgcolor: palette.background, 
        color: palette.textPrimary 
      }}
    >
      {/* Top Navigation Bar */}
      <TopBar />
      
      {/* Main Content Grid: Sidebar + Map */}
      <Box sx={{ 
        display: "grid", 
        gridTemplateColumns: "400px 1fr", 
        flex: 1,
        minHeight: 0,
        overflow: "hidden"
      }}>
        
        {/* Left Sidebar: Search Panel and POI List */}
        <Box 
          sx={{ 
            display: "flex",
            flexDirection: "column",
            height: "100%",
            p: 2, 
            borderRight: `1px solid ${palette.divider}`, 
            bgcolor: palette.dark,
            overflow: "hidden"
          }}
        >
          
          {/* WASM Communication Debug Panel (headless by default; UI commented out) */}
          <WasmViewCommunicationDebug ref={wasmDebugRef} />
          
          {/* POI List: displays fetched POIs with selection */}
          <PoiList 
          // pois={pois} 
          // setSelectedPoi={setSelectedPoi} 
          />
        </Box>

        {/* Right Side: Map View with POI markers and route planning */}
        <div style={{ width: "100%", height: "100%" }}>
          <MapView
            // pois={pois}
            userCoords={userCoords}
            // selectedPoi={selectedPoi}
            // setSelectedPoi={setSelectedPoi}
            // setPois={setPois}
            setUserCoords={setUserCoords}
            onSendToWasm={handleSendToWasm}
          />
        </div>
      </Box>
    </Box>
    </PoiProvider>
  );
}
