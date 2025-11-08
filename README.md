# WorldFlightPedia - Microsoft Flight Simulator 2020 Add-on
# its not the final release, still on BETA stage, this is made just for testing and project traceability
## 📋 Project Overview

**WorldFlightPedia** is a custom add-on/mod for Microsoft Flight Simulator 2020 (MSFS 2020) that provides an in-game toolbar interface to discover and navigate to Points of Interest (POIs) around the world. The application integrates Wikipedia data and real-time flight tracking to create an interactive encyclopedia experience while flying and openstreetmap with leaflet overlay map integration.

# This version ONLY works in ICAO: **SLCB** "Airport Jorge Wilstermann" located in: **Cochabamba,Bolivia**

---

<img width="1919" height="1079" alt="Captura de pantalla 2025-11-07 165547" src="https://github.com/user-attachments/assets/b17aa9ad-d97c-4c58-9bcc-23bf6e02f249" />

<img width="1919" height="1079" alt="Captura de pantalla 2025-11-07 165655" src="https://github.com/user-attachments/assets/1f47ccab-ddc6-4586-b8a1-16abdf163db4" />

### Key Features
- 🗺️ **Interactive Map Interface**: Real-time Leaflet map integration with plane tracking
- 📍 **POI Discovery**: Search for nearby Points of Interest based on your current location
- ✈️ **Flight Plan Integration**: Save and load flight plans directly to/from MSFS
- 🧭 **Automatic Route Planning**: Intelligent nearest-neighbor routing algorithm
- 📚 **Wikipedia Integration**: Rich POI information with descriptions and images
- 🎯 **Proximity Detection**: Automatically tracks visited POIs within 200m radius
- 🎨 **Material-UI Design**: Modern, responsive interface with dark/light theme support
- 🔴 **SimObject Spawning**: Dynamic laser_red 3D model spawning/removal via keyboard controls

---

## 🎮 New Feature: SimObject Control

This version includes enhanced WASM module functionality for spawning and removing the **laser_red** 3D model SimObject at coordinates **-17.389, -66.156** (Cochabamba, Bolivia).

### Keyboard Controls:
- **Press M**: Spawn the laser_red SimObject at the specified location
- **Press N**: Remove the laser_red SimObject from the simulation

### Technical Implementation:
The WASM module now includes:
- Global variables for SimConnect handle and object ID management
- Event enumeration for keyboard input mapping
- Utility functions `SpawnSimObject()` and `RemoveSimObject()`
- Enhanced dispatch callback for real-time object management
- Improved logging for debugging and action tracking

---

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
- **SimObjects/laser_red/** - 3D model files (GLTF, BIN, XML, CFG configurations)

**Key Files**:
- Package manifest defines the add-on name, version, and dependencies
- Build tools compile the project into a distributable MSFS package
- Laser_red 3D model with complete configuration for in-game rendering

---

### 2. **adriantest2-worldflightpedia/** - Community Folder Package
**Purpose**: Ready-to-deploy package for MSFS Community folder installation.

**Contents**:
- `manifest.json` - MSFS add-on manifest with metadata (version, creator, minimum game version)
- `layout.json` - File layout definition for the package structure
- `ContentInfo/` - Content metadata and package information
- `InGamePanels/` - HTML/JS panel definitions for in-game toolbar
- `html_ui/` - Compiled React application and UI assets
- `SimObjects/` - Laser_red 3D model for spawning tests
- `scenery/` - BGL scenery test files for ICAO: SLCB

**Installation**: Users drag this folder into their MSFS Community folder to install the add-on.

**Code Review Highlights**:
- ✅ Properly structured manifest with all required MSFS metadata
- ✅ Layout definition follows MSFS packaging standards
- ✅ Content info provides proper version tracking
- ✅ Includes laser_red SimObject for testing purposes

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
- **Functionality**: Provides low-level access to aircraft telemetry, flight plans, simulation variables, and SimObject spawning

**Code Review Highlights**:
```cpp
// Main module entry points:
// - module_init(): Initialize SimConnect connection and subscribe to keyboard events
// - module_deinit(): Clean up resources
// - update(): Called every frame to sync data
// - SpawnSimObject(): Creates laser_red at specified coordinates (-17.389, -66.156)
// - RemoveSimObject(): Removes spawned laser_red from simulation
// - Exposes SimVars (PLANE LATITUDE, PLANE LONGITUDE, etc.)
// - Keyboard mapping: M key = Spawn, N key = Remove
```

**Integration Points**:
- Reads aircraft position (latitude, longitude, altitude, heading)
- Interfaces with GPS flight plan system
- Provides real-time telemetry data to React UI via Coherent GT
- **NEW**: Spawns and removes SimObjects dynamically via keyboard input
- **NEW**: Manages object IDs for proper cleanup and tracking

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

## 🔍 Recent Updates (Latest Commits)

### November 8, 2025 - Major WASM Module Enhancement
**Commits**: `9780b15`, `f400d8f`, `b461b44`

**Changes**:
1. **SimConnect Object Spawning System**: Implemented full SimObject spawning and removal functionality
   - Added global variables for SimConnect handle and object ID management
   - Defined enumerations for event IDs, groups, and requests
   - Implemented `SpawnSimObject()` and `RemoveSimObject()` utility functions
   - Enhanced module initialization to subscribe to system events
   - Mapped keyboard inputs (M = spawn, N = remove) for object management
   - Updated dispatch callback to handle new events
   - Improved logging for better debugging

2. **Layout Updates**: Modified `layout.json` with updated file dates and sizes for new WASM binary

3. **3D Model Integration**: Added complete laser_red 3D model files
   - GLTF and BIN model files
   - XML configuration for MSFS integration
   - CFG files for SimObject properties
   - BGL scenery test in ICAO: SLCB (Cochabamba, Bolivia)

### November 8, 2025 - README and Documentation Updates
**Commits**: `7dbb4c4`, `45e6186`, `0bc845d`, `1ac7b4a`

**Changes**:
- Created comprehensive README.md with full project documentation
- Added beta status notification
- Enhanced OpenStreetMap integration details
- Added airport-specific information (ICAO: SLCB)
- Included screenshots for visual representation

### November 6-7, 2025 - UI/UX Improvements
**Commits**: `5c4063e`, `7d39265`, `442571e`, `4b18c25`, `d562db4`

**Changes**:
- Enhanced MapView with real-time updates and improved segment tracking
- Added ResizeObserver for dynamic layout adjustments
- Refactored route handling for independent segment visualization
- Improved visited POI tracking in real time
- Enhanced POI selection colors and display states
- Updated layout and styling with custom scrollbars
- Added follow plane toggle functionality
- Improved MapPopupWikipedia styling with scrollable content

### November 5, 2025 - Component Refactoring
**Commits**: `03dd374`, `7c9d6c1`, `2478d3d`, `aac58d9`

**Changes**:
- Added comprehensive JSDoc documentation to all components
- Replaced old Map component with new MapView
- Introduced MapPopupWikipedia for detailed POI information
- Created new POIPopup, PoiList, and SearchPanel components
- Updated TopBar with save/load flight plan functionality
- Enhanced CSS styles for better UI/UX
- Translated all Spanish text to English
- Removed deprecated components (POICard, old Map)
- Introduced new color palette for consistent theming

---

## 🔧 Technical Implementation Details

### MSFS Integration Architecture
```
┌─────────────────────┐
│   React UI (JS)     │  ← User interacts here
├─────────────────────┤
│  Coherent GT Bridge │  ← JavaScript ↔ C++ communication layer
├─────────────────────┤
│  WASM Module (C++)  │  ← Low-level SimConnect access + SimObject spawning
├─────────────────────┤
│  MSFS SimConnect    │  ← Core simulator API
└─────────────────────┘
```

### Data Flow
1. **UI → WASM**: User clicks "Save Flight Plan" → Coherent call → WASM module → SimConnect
2. **WASM → UI**: Aircraft position updates → WASM polls SimVars → Coherent event → React state update
3. **External API**: Wikipedia POI data fetched asynchronously from backend service
4. **Keyboard → WASM**: User presses M/N → WASM module → SpawnSimObject/RemoveSimObject → SimConnect

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
5. Ensure laser_red 3D model files are in SimObjects folder
6. Run `fspackagetool.exe` to create `.fspackage`

---

## 📊 Code Quality Metrics

### Overall Assessment: ✅ Production-Ready (Beta Stage)

**Strengths**:
- ✅ Comprehensive JSDoc documentation throughout
- ✅ Clean separation of concerns
- ✅ No console errors or warnings
- ✅ Proper React hooks usage (no memory leaks)
- ✅ Efficient rendering with proper key props
- ✅ Professional UI/UX with Material-UI
- ✅ Robust error handling
- ✅ Fully translated to English (previously Spanish)
- ✅ Advanced SimObject spawning capabilities
- ✅ Keyboard-controlled testing features

**Completed Improvements** (from Code_Review.md):
- ✅ All Spanish comments translated to English
- ✅ JSDoc headers added to all components
- ✅ Removed unnecessary commented code
- ✅ Fixed typos ("Buscar POIss" → "Search POIs")
- ✅ Standardized coding practices
- ✅ Improved code organization
- ✅ Implemented SimObject management system

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
6. **Test SimObject Spawning**: Press **M** to spawn laser_red at -17.389, -66.156 (Cochabamba)
7. **Remove SimObject**: Press **N** to remove the spawned laser_red

### For Developers
1. Clone the repository
2. Build WASM module with Visual Studio 2019/2022
3. Install Node.js dependencies in `worldflightpedia_toolbar_source_code/`
4. Run development server or build production bundle
5. Follow package build process above
6. Test SimObject spawning functionality in ICAO: SLCB

---

## 📝 API Dependencies

- **MSFS SDK**: Required for WASM module compilation and SimConnect integration
- **Wikipedia API**: For POI data (assumes backend service)
- **Leaflet**: Open-source map library
- **Material-UI**: React component library
- **SimConnect API**: For SimObject spawning and removal

---


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
- Blender community for 3D modeling support

---

## 📝 Version History

### Current Version (Beta)
- **Location**: ICAO: SLCB (Airport Jorge Wilstermann, Cochabamba, Bolivia)
- **Features**: Full POI discovery, flight planning, Wikipedia integration, SimObject spawning
- **Keyboard Controls**: M (spawn), N (remove)
- **Test Coordinates**: -17.389, -66.156

---

**Last Updated**: November 8, 2025  
**MSFS Version Compatibility**: Microsoft Flight Simulator 2020 (MSFS 2020)  
**Status**: ✅ Beta/Alpha Stage - Work in Progress  
**Note**: This version is for testing and project traceability purposes
