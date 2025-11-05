import React from "react";
import POIExplorer from "./components/POIExplorer";

export default function App() {
  return (
    <div
      style={{
        width: "100%",
        height: "100vh",
        margin: 0,
        padding: 0,
        overflow: "hidden"
      }}
    >
      <POIExplorer />
    </div>
  );
}
