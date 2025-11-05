import React, { useState } from "react";
import { Box } from "@mui/material";
import palette from "./theme/palette";
import SearchPanel from "./components/SearchPanel";
import PoiList from "./components/PoiList";
import MapView from "./components/MapView";
import TopBar from "./components/TopBar";


export default function App() {
  const [pois, setPois] = useState([]);
  const [selectedPoi, setSelectedPoi] = useState(null);
  const [userCoords, setUserCoords] = useState({ lat: -17.389, lon: -66.156 });
  const [username, setUsername] = useState("");

  return (
    <Box sx={{ alignSelf: "flex-start", height: "auto", display: "flex", flexDirection: "column", bgcolor: palette.background, color: palette.textPrimary }}>
      <TopBar />
      <Box sx={{ display: "grid", gridTemplateColumns: "400px 1fr", minHeight: 0 }}>
        
        <Box sx={{ overflowY: "auto", p: 2, borderRight: `1px solid ${palette.divider}`, bgcolor: palette.dark }}>
          {/* <SearchPanel setPois={setPois} setUserCoords={setUserCoords} /> */}
          
          <PoiList pois={pois} setSelectedPoi={setSelectedPoi} />
        </Box>

        {/* ✅ solo MapView renderiza el popup */}
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
