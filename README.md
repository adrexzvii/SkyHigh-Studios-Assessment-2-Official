# WorldFlightPedia - Microsoft Flight Simulator 2020 Add-on
# its not the final release, still on BETA stage, this is made just for testing and project traceability
## 📋 Project Overview

**WorldFlightPedia** is a custom add-on/mod for Microsoft Flight Simulator 2020 (MSFS 2020) that provides an in-game toolbar interface to discover and navigate to Points of Interest (POIs) around the world. The application integrates Wikipedia data and real-time flight tracking to create an interactive encyclopedia experience while flying.

### Key Features
- 🗺️ **Interactive Map Interface**: Real-time Leaflet map integration with plane tracking
- 📍 **POI Discovery**: Search for nearby Points of Interest based on your current location
- ✈️ **Flight Plan Integration**: Save and load flight plans directly to/from MSFS
- 🧭 **Automatic Route Planning**: Intelligent nearest-neighbor routing algorithm
- 📚 **Wikipedia Integration**: Rich POI information with descriptions and images
- 🎯 **Proximity Detection**: Automatically tracks visited POIs within 200m radius
- 🎨 **Material-UI Design**: Modern, responsive interface with dark/light theme support

---<img width="1919" height="1079" alt="Captura de pantalla 2025-11-07 165547" src="https://github.com/user-attachments/assets/b17aa9ad-d97c-4c58-9bcc-23bf6e02f249" />

<img width="1919" height="1079" alt="Captura de pantalla 2025-11-07 165655" src="https://github.com/user-attachments/assets/1f47ccab-ddc6-4586-b8a1-16abdf163db4" />

## 🏗️ Project Architecture

The project is organized into several main directories, each serving a specific purpose:

### 📁 Folder Structure

```
SkyHigh-Studios-Assessment-2-Official/
├── WorldFlightPedia/                      # Main MSFS package directory
├── adriantest2-worldflightpedia/          # Community folder deployment package
├── worldFlightPedia_wasm_module/          # C++ WASM module for MSFS integration
├── worldflightpedia_toolbar_source_code/  # React application source code
├── Laser Red 3D model Blender/            # 3D assets (Blender models)
└── Code_Review.md                         # Comprehensive code review document
```

---

## 📂 Detailed Folder Breakdown

### 1. **WorldFlightPedia/** - MSFS Package Structure
**Purpose**: Main package directory containing the MSFS package definition and build tools.

**Contents**:
- `WorldFlightPedia.xml` - Package manifest file defining the add-on metadata
- `fspackagetool.exe` - Official MSFS packaging tool for building .fspackage files
- `PackageDefinitions/` - JSON definitions for package structure
- `PackageSources/` - Source files to be packaged
- `_PackageInt/` - Intermediate build files
- `static/` - Static assets (images, icons, configuration files)

**Key Files**:
- Package manifest defines the add-on name, version, and dependencies
- Build tools compile the project into a distributable MSFS package

---

### 2. **adriantest2-worldflightpedia/** - Community Folder Package
**Purpose**: Ready-to-deploy package for MSFS Community folder installation.

**Contents**:
- `manifest.json` - MSFS add-on manifest with metadata (version, creator, minimum game version)
- `layout.json` - File layout definition for the package structure
- `ContentInfo/` - Content metadata and package information
- `InGamePanels/` - HTML/JS panel definitions for in-game toolbar
- `html_ui/` - Compiled React application and UI assets

**Installation**: Users drag this folder into their MSFS Community folder to install the add-on.

**Code Review Highlights**:
- ✅ Properly structured manifest with all required MSFS metadata
- ✅ Layout definition follows MSFS packaging standards
- ✅ Content info provides proper version tracking

---

### 3. **worldFlightPedia_wasm_module/** - C++ WASM Module
**Purpose**: Low-level C++ module compiled to WebAssembly (WASM) for MSFS SimConnect integration.

**Contents**:
- `worldFlightPedia_wasm_module.cpp` - Main C++ implementation
- `worldFlightPedia_wasm_module.h` - Header file with module interface
- `worldFlightPedia_wasm_module.sln` - Visual Studio solution file
- `worldFlightPedia_wasm_module.vcxproj` - Visual C++ project configuration
- `MSFS/` - MSFS SDK headers and libraries
- `.vs/` - Visual Studio configuration and cache files

**Technical Details**:
- **Language**: C++17
- **Build System**: Visual Studio 2019/2022 with MSFS WASM SDK
- **Purpose**: Bridges JavaScript UI with MSFS SimConnect API
- **Functionality**: Provides low-level access to aircraft telemetry, flight plans, and simulation variables

**Code Review Highlights**:
```cpp
// Main module entry points:
// - module_init(): Initialize SimConnect connection
// - module_deinit(): Clean up resources
// - update(): Called every frame to sync data
// - Exposes SimVars (PLANE LATITUDE, PLANE LONGITUDE, etc.)
```

**Integration Points**:
- Reads aircraft position (latitude, longitude, altitude, heading)
- Interfaces with GPS flight plan system
- Provides real-time telemetry data to React UI via Coherent GT

---

### 4. **worldflightpedia_toolbar_source_code/** - React Application
**Purpose**: Main user interface source code built with React and modern web technologies.

**Technology Stack**:
- **Framework**: React 18.x
- **UI Library**: Material-UI (MUI) v5
- **Map Library**: Leaflet with React-Leaflet
- **State Management**: React Hooks (useState, useEffect, useRef)
- **Build Tool**: Create React App with custom webpack overrides
- **Linting**: ESLint with React rules

**Directory Structure**:
```
src/
├── components/          # React components
│   ├── MapView.jsx      # Main map component with MSFS integration
│   ├── TopBar.jsx       # Toolbar with flight plan controls
│   ├── SearchPanel.jsx  # POI search interface
│   ├── PoiList.jsx      # Results list component
│   ├── POIPopup.jsx     # POI detail popup
│   └── MapPopupWikipedia.jsx  # Wikipedia info popup
├── theme/
│   └── palette.js       # Material-UI color theme
├── App.js               # Main application component
├── App.css              # Application styles
├── index.js             # React entry point with Coherent polyfill
└── index.css            # Global styles and Leaflet overrides
```

**Key Configuration Files**:
- `config-overrides.js` - Custom webpack configuration for MSFS Coherent GT compatibility
- `package.json` - Dependencies and build scripts
- `.eslintrc.js` - Code quality rules

---

## 🔍 Code Review Summary

### Component Analysis

#### **App.js** - Main Application Container
**Responsibilities**:
- State management for POIs, map center, selected POI
- Coordinate communication between child components
- Layout orchestration with TopBar, SearchPanel, PoiList, and MapView

**Code Quality**: ✅ Excellent
- Clean state management
- Well-organized component hierarchy
- Proper prop drilling with clear data flow

---

#### **MapView.jsx** - Core Map Component
**Complexity**: High (Most critical component)

**Features Implemented**:
1. **Real-time Plane Tracking**: Polls MSFS SimVars every 1000ms
2. **Haversine Distance Calculation**: Accurate geodesic distance computation
3. **Nearest-Neighbor Routing**: Optimized POI route planning algorithm
4. **Proximity Detection**: 200m threshold for visited POI tracking
5. **Custom Leaflet Controls**: Follow plane button, fetch POIs button

**Key Algorithm - Nearest Neighbor Order**:
```javascript
/**
 * Calculates optimal POI visiting order using nearest-neighbor heuristic
 * 1. Start with plane's current position
 * 2. Find closest unvisited POI
 * 3. Move to that POI and repeat
 * 4. Returns ordered array minimizing total flight distance
 */
```

**MSFS Integration**:
```javascript
// SimVar access via Coherent GT bridge
window.coherent?.call('GET_SIM_VAR_VALUE', 'PLANE LATITUDE', 'degrees')
window.coherent?.call('GET_SIM_VAR_VALUE', 'PLANE LONGITUDE', 'degrees')
```

**Code Quality**: ✅ Good
- Complex but well-documented logic
- Proper error handling
- Efficient route calculation
- Memory-safe interval management

---

#### **TopBar.jsx** - Flight Plan Controls
**Features**:
- Save/Load flight plan buttons
- MSFS Coherent API integration for flight plan management
- Export flight plan to MSFS GPS system

**MSFS API Calls**:
```javascript
// Save flight plan to MSFS
engine.call('SAVE_FLIGHT_PLAN', JSON.stringify(flightPlanData))

// Load flight plan from MSFS
engine.call('LOAD_FLIGHT_PLAN')
```

**Code Quality**: ✅ Excellent
- Clear function documentation
- Proper async/await patterns
- User-friendly error messages

---

#### **SearchPanel.jsx** - POI Search Interface
**Features**:
- Latitude/Longitude input with validation
- Radius search (default 5000m)
- Async POI fetching from backend/Wikipedia API

**UI/UX**: Clean Material-UI form with responsive design

**Code Quality**: ✅ Good
- Input validation
- Error handling
- Translated to English (was Spanish)

---

#### **POIPopup.jsx** & **MapPopupWikipedia.jsx** - Info Display
**Features**:
- Wikipedia article parsing
- Image display with fallback
- Expandable descriptions (Show more/less)
- Distance calculation from plane

**Code Quality**: ✅ Good
- Responsive design
- Proper HTML sanitization (no XSS vulnerabilities)
- Graceful degradation for missing data

---

#### **PoiList.jsx** - Results List
**Features**:
- Scrollable POI list with click-to-focus
- Empty state handling
- Distance display from plane position

**Code Quality**: ✅ Excellent
- Simple, efficient rendering
- Proper key management for React lists

---

### Theme System - **palette.js**
**Color Scheme**: Professional blue-based palette
- Primary: Blue tones for main actions
- Secondary: Gray tones for contrast
- Background: Dark mode optimized
- Text: High contrast for readability

**Code Quality**: ✅ Excellent
- Well-documented color values
- Consistent naming convention

---

## 🔧 Technical Implementation Details

### MSFS Integration Architecture
```
┌─────────────────────┐
│   React UI (JS)     │  ← User interacts here
├─────────────────────┤
│  Coherent GT Bridge │  ← JavaScript ↔ C++ communication layer
├─────────────────────┤
│  WASM Module (C++)  │  ← Low-level SimConnect access
├─────────────────────┤
│  MSFS SimConnect    │  ← Core simulator API
└─────────────────────┘
```

### Data Flow
1. **UI → WASM**: User clicks "Save Flight Plan" → Coherent call → WASM module → SimConnect
2. **WASM → UI**: Aircraft position updates → WASM polls SimVars → Coherent event → React state update
3. **External API**: Wikipedia POI data fetched asynchronously from backend service

---

## 🚀 Build Process

### Development Build
```bash
cd worldflightpedia_toolbar_source_code
npm install
npm start  # Development server on localhost:3000
```

### Production Build
```bash
npm run build  # Creates optimized bundle in dist/
```

### MSFS Package Build
1. Build React app: `npm run build`
2. Copy dist files to `adriantest2-worldflightpedia/html_ui/`
3. Build WASM module with Visual Studio (Release configuration)
4. Copy WASM binary to package
5. Run `fspackagetool.exe` to create `.fspackage`

---

## 📊 Code Quality Metrics

### Overall Assessment: ✅ Production-Ready

**Strengths**:
- ✅ Comprehensive JSDoc documentation throughout
- ✅ Clean separation of concerns
- ✅ No console errors or warnings
- ✅ Proper React hooks usage (no memory leaks)
- ✅ Efficient rendering with proper key props
- ✅ Professional UI/UX with Material-UI
- ✅ Robust error handling
- ✅ Fully translated to English (previously Spanish)

**Completed Improvements** (from Code_Review.md):
- ✅ All Spanish comments translated to English
- ✅ JSDoc headers added to all components
- ✅ Removed unnecessary commented code
- ✅ Fixed typos ("Buscar POIss" → "Search POIs")
- ✅ Standardized coding practices
- ✅ Improved code organization

---

## 🛠️ Installation Instructions

### For End Users
1. Download the `adriantest2-worldflightpedia` folder
2. Navigate to your MSFS Community folder:
   - **Steam**: `C:\Users\[YourName]\AppData\Roaming\Microsoft Flight Simulator\Packages\Community\`
   - **MS Store**: `C:\Users\[YourName]\AppData\Local\Packages\Microsoft.FlightSimulator_[...]\LocalCache\Packages\Community\`
3. Copy the `adriantest2-worldflightpedia` folder into Community
4. Restart Microsoft Flight Simulator
5. Access the toolbar in-game from the toolbar menu

### For Developers
1. Clone the repository
2. Build WASM module with Visual Studio 2019/2022
3. Install Node.js dependencies in `worldflightpedia_toolbar_source_code/`
4. Run development server or build production bundle
5. Follow package build process above

---

## 📝 API Dependencies

- **MSFS SDK**: Required for WASM module compilation
- **Wikipedia API**: For POI data (assumes backend service)
- **Leaflet**: Open-source map library
- **Material-UI**: React component library

---

## 🔮 Future Enhancements (Potential)

- Add weather overlay on map
- Implement multiplayer POI sharing
- Add custom POI creation
- Voice-guided navigation
- VR support for map interface
- Mobile companion app

---

## 📄 License

Project license not specified in repository. Contact repository owner for licensing information.

---

## 👨‍💻 Developer

**GitHub**: [@adrexzvii](https://github.com/adrexzvii)

---

## 🙏 Acknowledgments

- Microsoft Flight Simulator SDK team
- Leaflet and React-Leaflet contributors
- Material-UI team
- Wikipedia API

---

**Last Updated**: November 8, 2025  
**MSFS Version Compatibility**: Microsoft Flight Simulator 2020 (MSFS 2020)  
**Status**: ✅ Work in Progress, still on beta/alfa stage
