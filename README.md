# WorldFlightPedia

> **In-game VFR exploration toolbar for Microsoft Flight Simulator 2020.**  
> Fetch nearby POIs, render dynamic VFR routes, spawn 3D markers, trigger spatial audio,  
> and transform any free-flight session into an interactive sightseeing experience.

---

# 1. Overview

## **What the Project Does**

WorldFlightPedia transforms Microsoft Flight Simulator into an **interactive VFR sightseeing mode**.  
It adds an in-game toolbar panel that:

- Fetches nearby Points of Interest (POIs)
- Displays them on an interactive map
- Automatically builds a VFR route based on proximity
- Spawns fully dynamic 3D POI markers in the MSFS world
- Plays audio cues for immersion and feedback
- Tracks aircraft position live on the map
- Shows POI details and Wikipedia summaries

It requires no flight plan and no FMS integration—  
**it is a visual exploration experience layered on top of normal free flight.**

---

## **What Problem It Solves // What Value It Adds**

Although MSFS contains thousands of POIs and a fully rendered planet, players often:

- Fly over landmarks **without realizing they are there**
- Want a **simple, casual way to explore the world visually**
- Prefer VFR flying but lack a **guided discovery mode**
- Want **dynamic navigation aids** not tied to IFR systems
- Benefit from audio cues and on-screen markers to enhance exploration

WorldFlightPedia solves all of this:

### ✔ Creates a guided world-exploration system  
### ✔ Makes exploration meaningful with dynamic routing  
### ✔ Adds clear visual navigation cues inside the 3D world  
### ✔ Simplifies sightseeing for beginners and VFR pilots  
### ✔ Provides contextual information via popups and Wikipedia  
### ✔ Adds immersion through Wwise-triggered audio events  

It introduces a new “gameplay loop” into the simulator:  
**Discover → Navigate → Learn → Continue Exploring.**

---

## **Why I Built It**

I wanted a project that:

- Demonstrates mastery of the full MSFS SDK stack  
- Combines UI, WASM, SimConnect, 3D models, and audio  
- Adds value for actual players, not just developers  
- Shows real technical problem-solving (CommBus, dynamic spawning, audio emitters)  
- Expands what a toolbar panel can do inside MSFS  

WorldFlightPedia became the perfect vehicle to showcase:

🧠 **technical complexity**  
🎨 **UI/UX design sophistication**  
🎧 **audio engineering**  
🌍 **in-world dynamic content**  

—while still being fun and useful for actual simmers.

---

# Feature Descriptions & Design Choices

Below is a professional breakdown of the key features, how they were implemented, and why each design decision was made.

---

## 1.1 **POI Fetching & Intelligent Filtering**

### **What it does**
- Fetches up to **50 POIs** within a **10,000 km** radius.
- Removes overlapping or duplicate POIs closer than **100 meters**.
- Repopulates the map and sidebar list instantly.

### **Why this design**
- Raw POI datasets include duplicates, close clusters, and noise.
- Deduplication prevents **clutter**, **false contacts**, and **UI overload**.
- Hard limits ensure performance stability and avoid WASM congestion.

### **How it was implemented**
- Custom **Haversine distance algorithm**.
- Filtering handled inside React hooks:
  - `usePoiSelection.js`
  - `useDistance.js`
---

## 1.2 **Interactive Map with Real-Time Aircraft Tracking**

### **What it does**
- Displays POIs on a **Leaflet** interactive map.
- Tracks aircraft position in real time using SimVars:
  - `LATITUDE`
  - `LONGITUDE`
  - `HEADING`
- Allows centering the map on the aircraft at any moment.

### **Design choices**
- Leaflet chosen because it is fully compatible with **Coherent GT**.
- Map clicks require a **double-confirmation** to avoid accidental popup activation.
- Custom marker icons ensure readability and match MSFS UI style.

### **Implementation**
- `useLeafletMap.js` → manages map lifecycle and initialization.
- `usePlaneTracking.js` → polls aircraft SimVars and updates map in real time.
- `TopBar.jsx` → controls “center on aircraft” and map locking behavior.

---

## 1.3 **Dynamic VFR Routing System**

### **What it does**
- Generates a live route from the aircraft → next closest POI.
- Clears previous segments to avoid clutter.
- Auto-pauses on POI arrival and opens the popup automatically.

### **Why this design**
- VFR navigation is **simple, visual, and sequential**.
- Too many lines overwhelm the map and reduce clarity.
- Auto-pause improves the sightseeing experience and learning flow.

### **Implementation**
- `useRoutePlanning.js` calculates the route polyline.
- Uses Haversine + bearings for precise geographic projections.
- Integrated with arrival detection logic implemented in the WASM backend.

---

## 1.4 **3D POI Markers (SimObject: `laser_red`)**

### **What it does**
- Spawns a dynamic 3D marker (cylinder with light) at each POI location.
- Provides in-world navigation aids visible from the cockpit.
- Fully dynamic: spawned/despawned via WASM logic.

### **Design choices**
- Markers must be noticeable but **not intrusive**.
- Emissive light improves visibility in low-light or cloudy conditions.
- Avoiding BGL scenery keeps markers fully dynamic and session-based.

### **Implementation**
- Modeled in **Blender**.
- Exported to **GLTF** and integrated as a SimObject.
- Spawned through SimConnect requests inside:
  - `SimObjectManager.cpp`

---

## 1.5 **Audio System (Wwise + Invisible Cube Emitter)**

### **What it does**
Plays spatial audio cues for:
- Flight start  
- Flight end  
- Show all POIs  
- Hide all POIs  
- New POI generated  

Audio continues even when POI markers despawn.

### **Design rationale**
- Audio must not stop when SimObjects are removed.
- Audio should follow the aircraft smoothly.
- An invisible cube provides a stable emitter anchor point.

### **Implementation**
- Invisible cube SimObject spawned next to the aircraft.
- Cube carries the **Wwise emitter**.
- Audio triggered via L:Vars processed in the WASM module.

---

## 1.6 **WASM Backend + CommBus Integration**

### **What it does**
- Handles all interaction with **SimConnect**.
- Manages dynamic SimObject spawning.
- Reads and writes **L:Vars**.
- Exchanges structured messages with JavaScript via CommBus.

### **Design rationale**
- JavaScript alone cannot spawn SimObjects—WASM is required.
- CommBus provides a lightweight, reliable JS ↔ WASM bridge.
- Modular components make the system clear, scalable, and maintainable.

### **Implementation**
C++ architecture:
- `SimConnectManager`
- `DispatchHandler`
- `FlightController`
- `SimObjectManager`
- `CommunicationBus`

JS sends JSON-based POI arrays to WASM, which spawns markers accordingly.

---

## 1.7 **UX/UI Design & User Workflow**

### **What it does**
- Provides a clean, MSFS-style interface.
- Responsive layout suitable for all resolutions.
- Integrated Help dialog explaining how the system works.
- **Minimizable (but not closable) panel to ensure continuity.**

### **Design rationale**
- Closing an MSFS toolbar panel resets the entire experience.
- Minimizing ensures session persistence without obstructing the screen.
- Map + list layout mirrors MSFS visual design patterns.

### **Color Palette Choice**
- The entire UI color palette was intentionally designed using the **official SkyHigh Studios brand colors**.
- This ensures:
  - Professional, cohesive visual identity  
  - Alignment with studio branding  
  - Immediate recognizability and stylistic consistency  
- Colors were applied across:
  - TopBar buttons  
  - Map overlays  
  - Selection states  
  - Hover/focus elements  
  - Sidebar backgrounds and typography 

### **Implementation**
- Built with React + Material-UI.
- Global POI state managed through a dedicated context provider.
- Leaflet map is tightly integrated with toolbar controls and events.

---

**WorldFlightPedia** is a custom **in-game toolbar panel** for *Microsoft Flight Simulator 2020* (MSFS2020) designed for the **Creative Technical Assessment**.

This project showcases advanced usage of:

- **MSFS WASM modules**
- **SimConnect integration**
- **3D SimObject spawning**
- **React/Leaflet custom UI panels**
- **CommBus API (JS ↔ WASM)**
- **Dynamic L:Vars**
- **Wwise audio events**
- **Custom navigation logic & live map rendering**
- **3D model creation and integration (Blender → GLTF → SimObject)**

The goal is to deliver a **lightweight VFR tourism mode**, allowing pilots to discover real-world POIs visually, without loading or manipulating IFR flight plans.

WorldFlightPedia blends map-based exploration, procedural POI selection, route rendering, and real-time aircraft tracking into a modern MSFS UI experience.

---

# 2. Key Features

## ✈️ VFR Tourist Mode
- Interactive in-game toolbar (HTML/JS/React).
- Fetch POIs around the aircraft (radius: **10,000 km**, max: **50 POIs**).
- Deduplication algorithm: remove POIs within **100 m** of each other.
- One-click **START FLIGHT** to begin the guided VFR route.
- Real-time plane tracking using SimVars (lat, lon, heading).
- Automatic route recalculation.

## 🌍 Dynamic POI Rendering
- POIs rendered on a Leaflet map with custom icons.
- Clicking a POI recenters the map on its location.
- Double clicking a POI in the map opens popup information.
- Wikipedia summary integration for POI details inside the map popup.
- Left sidebar listing POIs with coordinates and scroll support.

## 🛰️ 3D SimObject Spawn System
- Each POI is replicated in the actual MSFS world using a **custom “laser_red” 3D marker**:
  - Cylinder mesh with dynamic lighting.
  - Integrated via SimConnect request IDs.
- 100% dynamic: **no BGL scenery needed**.

## 🔊 Audio System (Wwise)
Triggered via WASM L:Vars:
- `flight_started` – entering VFR mode.
- `flight_ended` – leaving VFR mode.
- `All_POI_showed_in_msfs_map_sounds` – visualizing all POIs.
- `All_POI_hide_in_msfs_map_sounds` – hiding all POIs.
- `fly_to_new_POI_generated` – a new POI target becomes active.

### Audio Emitter Architecture
- Because POI SimObjects appear/disappear constantly, audio lives in an **invisible 3D cube** SimObject.
- Cube is spawned **beside the aircraft** (heading-aware offset).
- Cube contains the Wwise emitter to avoid sudden audio cutoff.

## 🧭 Route Navigation
- Automatic POI ordering:
  - Next target = closest unvisited POI to the aircraft.
- Only one route segment is rendered at a time:
  - Aircraft → Next POI.
- Previous segments are cleared to avoid clutter.
- Arrival auto-detection:
  - System pauses the route.
  - POI popup is displayed automatically.

## 🗺️ Map Interaction Tools
- **Center on Aircraft** button (plane icon).
- **Pause/Resume** (auto-paused when reaching a POI).
- Zoom in/out.
- Minimized compact mode — toolbar must *not* be closed (closing resets session).

## 🔧 WASM–JS Integration (CommBus)
- JS sends POI list → WASM.
- WASM sends ready status, acks, and events → JS.
- L:Vars control spawning, navigation, audio, and cube positioning.

## 🚀 Flight Session Lifecycle
- Start: audio plays → cube spawns → first POI marker spawns.
- Mid-flight: route updates, popup auto-triggers, plane tracking enabled.
- End: markers & cube despawned, audio plays, state reset.

---

# 3. Screenshots

## PRINCIPAL UI
<img width="712" height="694" alt="image" src="https://github.com/user-attachments/assets/d454a062-78ea-4e71-b6a1-5ce5024149d7" />

## PRINCIPAL UI POP-UP SHOW
<img width="709" height="701" alt="image" src="https://github.com/user-attachments/assets/4395172e-dc09-4bea-b2b1-809cad0a7b33" />

## PRINCIPAL UI POP-UP EXTENDED SHOW
<img width="710" height="697" alt="image" src="https://github.com/user-attachments/assets/5a566e37-0893-4d9b-8b9b-22a51cdecb5d" />

## PRINCIPAL UI MINIMUM RESIZABLE SIZE
<img width="604" height="331" alt="image" src="https://github.com/user-attachments/assets/481ef08d-4c1c-4632-8d10-8df1e95e1d37" />

## PRINCIPAL UI NO POIS IN MSFS MAP NIGHT
<img width="1919" height="1079" alt="image" src="https://github.com/user-attachments/assets/900c3248-b1d3-4a8e-96c1-6578228d6c6f" />

## PRINCIPAL UI NO POIS IN MSFS MAP DAY
<img width="1919" height="1079" alt="image" src="https://github.com/user-attachments/assets/eaeb5e19-3528-46c7-bca1-fba18e27d5ac" />

## PRINCIPAL UI ALL POIS SHOWED IN MSFS MAP NIGHT
<img width="1919" height="1079" alt="image" src="https://github.com/user-attachments/assets/32f8d64f-5f42-4e3e-ba7c-dc47c3b32b92" />

## PRINCIPAL UI ALL POIS SHOWED IN MSFS MAP DAY
<img width="1919" height="1079" alt="image" src="https://github.com/user-attachments/assets/9be5058e-9360-4aaf-b25a-9f747572cf42" />

## PRINCIPAL UI START FLIGHT WITH FIRST POI SHOWED DAY
<img width="1919" height="1079" alt="image" src="https://github.com/user-attachments/assets/ca7d9d59-6fa7-4321-8070-965f0ccb586a" />

## PRINCIPAL UI START FLIGHT WITH FIRST POI SHOWED NIGHT
<img width="1919" height="1079" alt="image" src="https://github.com/user-attachments/assets/cf215582-92f8-4d38-b8b7-d7edb468377a" />

## PRINCIPAL UI START FLIGHT WITH HELP POP-UP SHOWED
<img width="898" height="589" alt="image" src="https://github.com/user-attachments/assets/41c05fa0-18e3-41d7-9d3b-d11b6b3832ed" />


### 3.1 VIDEO DEMO

## VIDEO DEMO RECORDED IN icao: SLVR, AEROPUERTO INTERNACIONAL VIRU VIRU, SANTA CRUZ, BOLIVIA, BUT THE WORLD FLIGHT PEDIA TOOLBAR WORK EVERYWHER IN THE WORLD OF MSFS2020!!
## VOLUME UP IN THE REPRODUCTOR!!!



https://github.com/user-attachments/assets/447748a9-2044-47a3-9db0-995891f52682




---



# 4. Repository Structure (Deep Technical Dive)

```
SkyHigh-Studios-Assessment-2-Official/
├── WorldFlightPedia/ # MSFS package build workspace
├── adriantest2-worldflightpedia/ # Community folder package (ready-to-install)
├── worldFlightPedia_wasm_module/ # C++ WASM module source
├── worldflightpedia_toolbar_source_code/ # React UI source
├── Laser Red 3D model Blender/ # SimObject 3D marker (Blender source)
├── Invisible cube 3D model Blender/ # Audio cube SimObject
├── WorldFlightPediaAudios/ # All Wwise-ready raw audio files
└── README.md # This file
```

# 5. MSFS Package: `WorldFlightPedia/`

This folder is used by the MSFS SDK build system with **fspackagetool.exe**.

### Contains:
- `WorldFlightPedia.xml` – Package definition / manifest used by the SDK build system.
- `PackageDefinitions/` – defines how the package is built.
- `PackageSources/` – Source content that is packaged:
  -  html_ui/ (compiled React bundle copied from worldflightpedia_toolbar_source_code/build)
  - Modules/ (built WASM from worldFlightPedia_wasm_module)
  - SimObjects/ (laser_red & audio cube objects)
- `InGamePanels/` (toolbar panel registration)
- `static/` – Icons, thumbnails and static config files used by the package.

### Used for:
- Generating the final `.fspackage`.

---

# 6. Community Package: `adriantest2-worldflightpedia/`

This is the **end-user installable package**.
Community/
└── adriantest2-worldflightpedia/
### Contains:
- `manifest.json`, `layout.json`
- `html_ui/` – Bundled toolbar React app (JS, CSS, assets).
- `Modules/` – `worldFlightPedia_wasm_module.wasm`
- `SimObjects/` - Runtime SimObjects used as POI markers and invisible cube.
- `InGamePanels/` - Panel configuration that makes WorldFlightPedia appear as an in-game toolbar button.
- `scenery/` - Optionally test scenery (SLCB BGL)
---

# 7. WASM Backend: `worldFlightPedia_wasm_module/`

Full C++17 modular architecture:

## Build Instructions (Developers)

## WASM
1. Open VS solution  
2. Build `Release|MSFS`  
3. Copy `.wasm` to:

## 7.1 Main Responsibilities
- Connect to **SimConnect**.
- Listen for SimVars & SimEvents.
- Handle L:Var-driven logic.
- Spawn/despawn SimObjects via marketplace-safe API.
- Send/receive messages via **CommBus**.

## 7.2 Internal Modules
### `SimConnectManager`
- Opens connections, subscribes events, maps variables, dispatches.

### `DispatchHandler`
- Routes incoming SimConnect events to managers.

### `FlightController`
- Manages the POI sequence.
- Responds to `L:WFP_StartFlight` and `L:WFP_NextPoi`.
- Spawns first marker & next marker logic.

### `SimObjectManager`
- Generic interface for creating/removing SimObjects:
  - POI marker: `laser_red`
  - Audio cube: `cube`

### `CommunicationBus`
- JS ↔ WASM bridge.
- Receives POI coordinate arrays (JSON-like).
- Sends acknowledgement messages to JS.

### `MessageParser`
- Parses minimal JSON into POI structs.

---

# 8. Toolbar UI (React): `worldflightpedia_toolbar_source_code/`

The source code for the in-game toolbar UI, built with React + Leaflet + Coherent GT-compatible tooling.

### Technologies:
- React 18
- Material-UI (MUI 5)
- Leaflet + React-Leaflet
- CommBus interface
- SimVar API
- Create React App with Coherent GT overrides

### Installation and build 

- `cd worldflightpedia_toolbar_source_code`
- `npm install` install all react and libraries dependencies.
- `npm run build` generates a production bundle under `dist/`.

That bundle is copied into `WorldFlightPedia/PackageSources/html_ui/` for packaging.

### Main folders:

```
src/
│
├── components/
│ ├── context/ # Global POI context provider
│ ├── HelpOverlay/ # Usage guide overlay
│ ├── MapPopupWikipedia/ # Wikipedia popup components
│ ├── MapView/ # Leaflet map + aircraft tracking
│ ├── PoiList/ # Left sidebar POI list
│ └── TopBar/ # Upper toolbar with all controls
│
├── hooks/
│ ├── comm/ # CommBus integration hooks
│ ├── map/ # Map, POI, route, tracking logic
│ └── simvar/ # Set L:Vars from JS
│
├── utils/
│ ├── geo/ # Haversine + routing
│ ├── leaflet/ # Marker icons, map controls
│ ├── comm/ # CommBus utilities
│ ├── simvar/ # SimVar helpers
│ └── wiki/ # Wikipedia API integration
│
├── wiki/ # Wikipedia data hooks
├── theme/ # Palette and design system
└── media/ # Config file for adjustable params
```
---

# 9. 3D Models

## `Laser Red 3D Model Blender/`
- Cylinder mesh with emissive material.
- Exported to GLTF with MSFS-specific parameters.
- SimObject config provides dynamic light.
- This is the visual POI marker the pilot sees in the world.

## `Invisible cube 3D model Blender/`
- A cube scaled to 0% visual representation.
- This cube is spawned next to the aircraft and exists only to host the Wwise audio emitter.
- It keeps audio alive even when POI markers are despawned.
- If the SimObject with the emitter disappears, the sound would cut; the cube solves this.

---

# 10. Audio Integration

## `WorldFlightPediaAudios/`

All sounds are built in Wwise and triggered from WASM via L:Vars.

Events:
- **flight_started**
- **flight_ended**
- **All_POI_showed_in_msfs_map_sounds**
- **All_POI_hide_in_msfs_map_sounds**
- **fly_to_new_POI_generated**

The audio cube prevents audio cutoff when POI markers are despawned.

---

# 11. POI System

## 11.1 POI Fetch
- Triggered by clicking **Search (🔍)**
- Radius: **10,000 km**
- Max: **50**
- Deduplication: **100 m threshold**

## 11.2 Route Logic
- Next POI = shortest distance from aircraft.
- Route redraws dynamically.
- Only one line is visible at any time.

## 11.3 Arrival Behavior
- Auto-pause.
- Popup automatically opened.
- Next segment loaded after user continues.

---

# 12. User Experience Flow

1. Open toolbar  
2. Press 🔍 to fetch POIs  
3. View POIs in list/map  
4. Press **START FLIGHT**  
5. Follow dynamic route  
6. Reach POI → auto-pause → popup opens  
7. Continue to next POI  
8. Press **STOP FLIGHT** to end session  
9. All SimObjects and states are cleared  

Toolbar should be minimized, **not closed**, during flight.

---

# 13. Assessment Criteria Mapping (from MSFS Creative Technical Assessment)

| Requirement from Assessment | Coverage in Project |
|----------------------------|---------------------|
| **Custom SimObject** | `laser_red` + `audio cube` (Blender → GLTF → SimObject) |
| **Dynamic SimObject Spawning** | WASM + SimConnect + L:Vars |
| **Toolbar panel** | React/Leaflet custom UI |
| **Communication JS ↔ WASM** | CommBus + JSON messages |
| **Audio trigger system** | Wwise events triggered by WASM |
| **Real-time SimVar usage** | Plane tracking, route updates |
| **POI logic / dynamic content** | Full POI fetch, dedupe, route, markers |
| **UI/UX quality** | Responsive, MUI design, overlay help, popups |
| **Code organization** | Fully modular architecture |
| **Creative gameplay** | Lightweight VFR sightseeing system |

---

# 14. Future Improvements

- Make POI fetch radius and max POI count configurable from the UI.

- Background / automatic POI refresh as the aircraft moves (no need to hit lupa each time).

- Export the dynamically built route as a .PLN flight plan to be loaded into ATC/GPS.

- Add ambient calm sound while WorldFlightPedia mode is active.

- Add proximity sound cue when the aircraft is within threshold distance of a POI.

- Support POI packs (e.g., historical, nature, city highlights) via config files.

---

# 15. Installation (Users)

1. Download `adriantest2-worldflightpedia`  
2. Drop into MSFS Community folder  
3. Launch MSFS  
4. Click toolbar → WorldFlightPedia  

# 16. Final Notes

WorldFlightPedia demonstrates:

- Full MSFS SDK integration  
- Multi-language architecture (C++17 + JS/React)  
- Real-time data synchronization  
- Dynamic world manipulation  
- Sound engineering  
- UX-first design philosophy  

It is a **complete, polished and technically rich** demonstration project for the MSFS Creative Technical Assessment.

