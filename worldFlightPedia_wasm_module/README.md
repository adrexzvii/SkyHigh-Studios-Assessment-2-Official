# worldFlightPedia WASM Module

A standalone WebAssembly (WASM) module for Microsoft Flight Simulator (MSFS) that enables dynamic SimObject injection and removal, with bidirectional communication between the WASM module and JavaScript panels.

## Overview

This WASM module acts as a bridge between MSFS SimConnect and JavaScript-based panels, providing functionality to:
- Spawn and remove SimObjects dynamically in the simulator
- Manage Points of Interest (POI) during flight
- Spawn objects near the user aircraft with offset positioning
- Handle bidirectional communication using the MSFS Communication Bus API
- Monitor and respond to local variables (L:VARs) for flight control

## Features

### 🎯 Core Capabilities

- **Dynamic SimObject Management**: Create and remove SimObjects (e.g., `laser_red`, `cube`) at specific coordinates in real-time
- **POI Flight System**: Sequential navigation through Points of Interest with automatic SimObject spawning
- **Offset Spawning**: Spawn objects at calculated positions relative to the user aircraft (e.g., cube at right offset)
- **JavaScript Integration**: Full communication bridge between WASM and JavaScript panels
- **Event-Driven Architecture**: Responds to SimConnect events and local variable changes
- **Modular Design**: Clean separation of concerns across multiple managers and handlers

### 🛠️ Key Components

#### SimConnect Manager
- Initializes and manages SimConnect connection
- Registers events (flight loaded, sim start, key inputs)
- Handles data definitions for local variables and aircraft position
- Sets up dispatch callbacks

#### Communication Bus
- Bidirectional messaging between WASM and JavaScript
- Receives POI coordinates from JS panels
- Sends acknowledgments and status updates back to JS
- Parses JSON-like message structures
- Sends "WASM ready" notification on initialization

#### Flight Controller
- Manages flight state (start/stop)
- Controls POI navigation sequence
- Spawns SimObjects at POI locations
- Handles `L:WFP_StartFlight` and `L:WFP_NextPoi` variables

#### SimObject Manager
- Encapsulates SimObject creation and removal logic
- Manages object IDs for tracking spawned objects
- Handles cleanup operations
- Supports multiple SimObject types (laser_red, cube)
- Calculates offset positions for spawning near aircraft

#### Dispatch Handler
- Processes SimConnect callbacks
- Routes events to appropriate handlers
- Manages data updates from SimConnect
- Handles aircraft position data for offset spawning

#### Message Parser
- Parses incoming messages from JavaScript
- Extracts POI coordinates from message data
- Provides simple JSON-like parsing without external dependencies

## Architecture

```
┌─────────────────────────────────────────────────┐
│         MSFS (Microsoft Flight Simulator)        │
│                                                  │
│  ┌──────────────┐         ┌─────────────────┐  │
│  │  SimConnect  │◄───────►│  WASM Module    │  │
│  │              │         │                 │  │
│  └──────────────┘         │  ┌───────────┐  │  │
│                           │  │SimConnect │  │  │
│                           │  │ Manager   │  │  │
│                           │  └─────┬─────┘  │  │
│                           │        │        │  │
│  ┌──────────────┐         │  ┌─────▼─────┐  │  │
│  │ CommBus API  │◄───────►│  │ Dispatch  │  │  │
│  │              │         │  │ Handler   │  │  │
│  └──────────────┘         │  └─────┬─────┘  │  │
│                           │        │        │  │
│                           │  ┌─────▼─────┐  │  │
│                           │  │  Flight   │  │  │
│                           │  │Controller │  │  │
│                           │  └─────┬─────┘  │  │
│                           │        │        │  │
│                           │  ┌─────▼─────┐  │  │
│                           │  │SimObject  │  │  │
│                           │  │ Manager   │  │  │
│                           │  └───────────┘  │  │
│                           └─────────────────┘  │
│                                     ▲           │
└─────────────────────────────────────┼───────────┘
                                      │
                          ┌───────────▼────────────┐
                          │  JavaScript Panel      │
                          │  (HTML/CSS/JS)         │
                          │                        │
                          │  - Sends POI coords    │
                          │  - Receives acks       │
                          │  - Controls L:VARs     │
                          └────────────────────────┘
```

## Building

### Prerequisites

- **Microsoft Flight Simulator SDK** (WASM toolchain)
- **Visual Studio 2019/2022** with C++ development tools
- **MSFS WASM Platform Toolset** configured
- **C++14** compiler support

### Build Steps

1. Open `worldFlightPedia_wasm_module.sln` in Visual Studio
2. Select the desired configuration:
   - `Debug|MSFS` - For development with debugging symbols
   - `Release|MSFS` - For production builds with optimizations
3. Build the solution (Ctrl+Shift+B)
4. The output will be `worldFlightPedia_wasm_module.wasm`

### Project Structure

```
worldFlightPedia_wasm_module/
├── include/
│   ├── comm/
│   │   ├── CommunicationBus.h       # CommBus API wrapper
│   │   └── MessageParser.h          # JSON-like message parsing
│   ├── core/
│   │   ├── Constants.h              # Event IDs, request IDs, data definitions
│   │   └── ModuleContext.h          # Global state and variables
│   ├── dispatch/
│   │   └── DispatchHandler.h        # SimConnect callback dispatcher
│   ├── flight/
│   │   └── FlightController.h       # Flight state and POI management
│   ├── simconnect/
│   │   └── SimConnectManager.h      # SimConnect initialization
│   ├── simobjects/
│   │   └── SimObjectManager.h       # SimObject spawn/remove
│   └── worldFlightPedia_wasm_module.h  # Module macros and exports
├── src/
│   ├── comm/
│   │   ├── CommunicationBus.cpp
│   │   └── MessageParser.cpp
│   ├── core/
│   │   └── ModuleContext.cpp
│   ├── dispatch/
│   │   └── DispatchHandler.cpp
│   ├── flight/
│   │   └── FlightController.cpp
│   ├── simconnect/
│   │   └── SimConnectManager.cpp
│   ├── simobjects/
│   │   └── SimObjectManager.cpp
│   └── worldFlightPedia_wasm_module.cpp  # Entry point
├── MSFS/                             # MSFS SDK headers
├── worldFlightPedia_wasm_module.sln
└── worldFlightPedia_wasm_module.vcxproj
```

## Usage

### Installation

1. Build the WASM module as described above
2. Copy the `.wasm` file to your MSFS package structure:
   ```
   YourPackage/
   ├── PackageDefinitions/
   ├── PackageSources/
   └── Modules/
       └── worldFlightPedia_wasm_module.wasm
   ```
3. Update your `panel.cfg` or manifest to reference the WASM module

### JavaScript Integration

#### Sending POI Coordinates to WASM

```javascript
// Send POI coordinates from JavaScript
const poiData = {
    type: "POI_COORDINATES",
    data: [
        { lat: 40.7128, lon: -74.0060 },  // New York
        { lat: 51.5074, lon: -0.1278 },   // London
        { lat: 35.6762, lon: 139.6503 }   // Tokyo
    ],
    count: 3
};

// Send via Coherent
Coherent.call("OnMessageFromJs", JSON.stringify(poiData));
```

#### Receiving Messages from WASM

```javascript
// Register listener for WASM messages
Coherent.on("OnMessageFromWasm", (message) => {
    console.log("Received from WASM:", message);
    
    if (message === "WASM ready") {
        console.log("WASM module initialized successfully");
        // Send initial POI data
    } else if (message.startsWith("ack:")) {
        console.log("Acknowledgment received:", message);
    }
});
```

### Controlling Flight via Local Variables

#### Start/Stop Flight

```javascript
// Start flight (spawns first POI)
SimVar.SetSimVarValue("L:WFP_StartFlight", "number", 1);

// Stop flight (removes all objects)
SimVar.SetSimVarValue("L:WFP_StartFlight", "number", 0);
```

#### Navigate to Next POI

```javascript
// Move to next POI in sequence
SimVar.SetSimVarValue("L:WFP_NextPoi", "number", 1);
```

#### Spawn Cube Near Aircraft

```javascript
// Spawn a cube object at offset position from user aircraft
SimVar.SetSimVarValue("L:WFP_SPAWN_CUBE", "number", 1);
```

### Keyboard Controls

The module also responds to keyboard inputs (configured in SimConnect):

- **M Key**: Spawn SimObject at current position
- **N Key**: Remove all spawned SimObjects

## Events and Data Definitions

### Events

| Event ID | Name | Description |
|----------|------|-------------|
| `EVENT_FLIGHT_LOADED` (0) | Flight Loaded | Triggered when a flight is loaded |
| `EVENT_SIM_START` (1) | Sim Start | Triggered when simulator session starts |
| `EVENT_FLIGHTPLAN_LOADED` (2) | Flight Plan Loaded | Triggered when a flight plan is loaded |
| `EVENT_TRIGGER_M` (3) | Key M | Manual spawn trigger |
| `EVENT_TRIGGER_N` (4) | Key N | Manual remove trigger |

### Request IDs

| Request ID | Purpose |
|------------|---------|
| `REQUEST_ADD_LASERS` (101) | Create laser_red SimObject |
| `REQUEST_REMOVE_LASERS` (201) | Remove laser_red SimObject |
| `REQUEST_USER_POS_FOR_CUBE` (301) | Request user aircraft position for cube spawn |
| `REQUEST_ADD_CUBE` (401) | Create cube SimObject |
| `REQUEST_LVAR_SPAWN` (1002) | L:VAR spawn monitoring |
| `REQUEST_LVAR_STARTFLIGHT` (1003) | L:VAR flight start/stop |
| `REQUEST_LVAR_NEXTPOI` (1004) | L:VAR next POI navigation |
| `REQUEST_LVAR_SPAWN_CUBE` (1005) | L:VAR cube spawn trigger |

### Data Definitions

| Definition ID | Purpose |
|---------------|---------|
| `DEFINITION_LVAR_SPAWN` (1001) | L:spawnAllLasersRed variable |
| `DEFINITION_LVAR_STARTFLIGHT` (1003) | L:WFP_StartFlight variable |
| `DEFINITION_LVAR_NEXTPOI` (1004) | L:WFP_NextPoi variable |
| `DEFINITION_LVAR_SPAWN_CUBE` (1005) | L:WFP_SPAWN_CUBE variable |
| `DEFINITION_USER_POSITION` (2001) | User position (lat/lon/alt/heading) |

### Local Variables

| Variable | Type | Purpose |
|----------|------|---------|
| `L:WFP_StartFlight` | number | Start (1) or stop (0) flight |
| `L:WFP_NextPoi` | number | Advance to next POI (1) |
| `L:WFP_SPAWN_CUBE` | number | Spawn cube near aircraft (1) |
| `L:spawnAllLasersRed` | number | Legacy spawn trigger |

## Development

### Module Lifecycle

```cpp
// Called when WASM module is loaded
module_init()
├── SimConnectManager_Initialize()
│   ├── Open SimConnect connection
│   ├── Register system events
│   ├── Map keyboard inputs
│   ├── Add data definitions for L:VARs
│   ├── Add data definitions for user position
│   └── Set dispatch callback
├── CommBus_Initialize()
│   ├── Register JS message handler
│   └── Send "WASM ready" message
└── Ready for operation

// Called when WASM module is unloaded
module_deinit()
├── CommBus_Shutdown()
│   └── Unregister all handlers
└── SimConnectManager_Shutdown()
    └── Close SimConnect connection
```

### SimObject Types

The module supports spawning different SimObject types:

- **laser_red**: POI marker objects spawned at ground level
- **cube**: Test object spawned at aircraft offset position (right side)

These SimObjects must be defined in your MSFS package's `sim.cfg`.

### Offset Spawning System

The module can calculate positions relative to the user aircraft:

1. Requests aircraft position (lat, lon, alt, heading) via SimConnect
2. Calculates offset position using heading and distance
3. Spawns SimObject at computed coordinates
4. Default offset: 50 meters to the right of aircraft

### Adding New Features

#### Adding a New Event

1. Define event ID in `include/core/Constants.h`:
   ```cpp
   enum eEvents {
       // ...existing events...
       EVENT_YOUR_NEW_EVENT = 5
   };
   ```

2. Register event in `SimConnectManager.cpp`:
   ```cpp
   SimConnect_SubscribeToSystemEvent(g_hSimConnect, 
       EVENT_YOUR_NEW_EVENT, 
       "YourEventName");
   ```

3. Handle event in `DispatchHandler.cpp`:
   ```cpp
   case SIMCONNECT_RECV_ID_EVENT:
       auto evt = (SIMCONNECT_RECV_EVENT*)pData;
       if (evt->uEventID == EVENT_YOUR_NEW_EVENT) {
           // Handle your event
       }
       break;
   ```

#### Adding a New Message Type

1. Define message parser in `MessageParser.cpp`:
   ```cpp
   std::vector<YourDataType> ParseYourMessage(const std::string& json) {
       // Parse message
   }
   ```

2. Handle in `CommunicationBus.cpp`:
   ```cpp
   void OnMessageFromJS(const char* buf, unsigned int bufSize, void* ctx) {
       std::string received(buf, bufSize);
       
       if (received.find("YOUR_MESSAGE_TYPE") != std::string::npos) {
           auto data = ParseYourMessage(received);
           // Process data
       }
   }
   ```

#### Adding a New Local Variable

1. Define request and data definition IDs in `Constants.h`:
   ```cpp
   enum eRequests {
       // ...
       REQUEST_LVAR_YOUR_VAR = 1006
   };
   
   enum eDataDefs {
       // ...
       DEFINITION_LVAR_YOUR_VAR = 1006
   };
   ```

2. Register in `SimConnectManager.cpp`:
   ```cpp
   SimConnect_AddToDataDefinition(g_hSimConnect, 
       DEFINITION_LVAR_YOUR_VAR, 
       "L:YourVariableName", 
       "number");
   
   SimConnect_RequestDataOnSimObject(g_hSimConnect,
       REQUEST_LVAR_YOUR_VAR,
       DEFINITION_LVAR_YOUR_VAR,
       SIMCONNECT_OBJECT_ID_USER,
       SIMCONNECT_PERIOD_SECOND);
   ```

3. Handle in `DispatchHandler.cpp`:
   ```cpp
   case SIMCONNECT_RECV_ID_SIMOBJECT_DATA:
       auto pObjData = (SIMCONNECT_RECV_SIMOBJECT_DATA*)pData;
       if (pObjData->dwRequestID == REQUEST_LVAR_YOUR_VAR) {
           // Handle your L:VAR change
       }
       break;
   ```

## Debugging

### Enabling Debug Output

Debug messages are written to stderr and can be viewed in:
- Visual Studio Output window when debugging
- MSFS Developer Mode console
- External console tools

### Common Debug Messages

```
[MSFS] SimConnect initialization...
[MSFS] SimConnect opened successfully
[MSFS] CommBus initialization...
[MSFS] CommBus initialized and startup sent.
[MSFS] module_init completed.
[MSFS] Received from JS: {"type":"POI_COORDINATES",...}
[MSFS] Parsed 3 POI coordinates from JS
[MSFS] POI[0] = lat: 40.712800, lon: -74.006000
[MSFS] L:WFP_StartFlight changed -> 1
[MSFS] Spawned first POI at index 0 (40.712800, -74.006000)
[MSFS] SpawnCubeNearAircraft: requested user position to compute spawn offset.
[MSFS] Spawned 'cube' at 50.00m right of aircraft: lat=... lon=... alt=...
```

### Troubleshooting

| Issue | Solution |
|-------|----------|
| SimConnect fails to open | Ensure MSFS is running and SDK mode is enabled |
| No messages from JavaScript | Check Coherent bindings and CommBus registration |
| SimObjects not spawning | Verify SimObject exists in sim.cfg and is properly defined |
| L:VARs not updating | Confirm data definitions are correctly mapped |
| Cube spawns at wrong position | Verify aircraft heading and position data are being received |
| Objects remain after removal | Check that object IDs are properly tracked in `g_lasersIDs` |

## Performance Considerations

- The module uses minimal memory footprint
- SimConnect callbacks are processed efficiently via dispatch handler
- POI coordinates are stored in a simple vector for fast access
- No external JSON libraries to keep WASM size small
- Object ID tracking uses STL containers for automatic memory management
- Offset calculations use optimized trigonometric functions

## Technical Notes

### Coordinate System
- Latitude/Longitude in decimal degrees
- Altitude in meters
- Heading in degrees true (0-360)

### Spawning Behavior
- `OnGround = 1`: Object spawns at terrain elevation (altitude ignored)
- `OnGround = 0`: Object spawns at specified altitude above MSL
- POI objects default to ground level
- Cube objects spawn at aircraft altitude

### Communication Flow
1. JavaScript sends JSON message via `OnMessageFromJs`
2. WASM parses message and extracts data
3. WASM processes data and performs actions
4. WASM sends acknowledgment via `OnMessageFromWasm`

**Note**: This module requires Microsoft Flight Simulator 2020 and the MSFS SDK to build and run.
