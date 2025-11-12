// -----------------------------------------------------------------------------
// worldFlightPedia_wasm_module.cpp
// Context: Standalone WASM SimConnect module for MSFS to inject / remove SimObjects and using MSFS Communication API to interact Data with "worldFlightPedia JavaScript Panel"
// -----------------------------------------------------------------------------
#include <string>
#include <vector>
#include <utility>
#include <cstdio>
#include <cstring>
#include <cstdlib>
#include <MSFS/MSFS.h>
#include <MSFS/MSFS_CommBus.h>
#include <MSFS/MSFS_WindowsTypes.h>
#include <SimConnect.h>
#include "worldFlightPedia_wasm_module.h"


// -----------------------------------------------------------------------------
// GLOBAL VARIABLES
// -----------------------------------------------------------------------------

HANDLE g_hSimConnect = 0; // Global SimConnect handle (connection interface)
static DWORD g_lasersID = SIMCONNECT_OBJECT_ID_USER; // Stores the assigned object ID once "laser_red" is spawned
static std::vector<std::pair<double,double>> g_poi_coords; // stores parsed POI lat/lon pairs


// -----------------------------------------------------------------------------
// ENUMERATIONS: Event IDs, Groups, and Requests
// -----------------------------------------------------------------------------

// List of SimConnect system and custom events handled by this module
enum eEvents
{
    EVENT_FLIGHT_LOADED = 0, // Triggered when a flight is loaded
    EVENT_SIM_START = 1, // Triggered when the simulator session starts
    EVENT_FLIGHTPLAN_LOADED = 2, // Triggered when a flight plan is loaded
    EVENT_TRIGGER_M = 3, // Custom event mapped to key 'M' (spawn object)
    EVENT_TRIGGER_N = 4  // Custom event mapped to key 'N' (remove object)
};

// Notification and input groups used to map keyboard events
enum eGroups {
    GROUP_INPUT = 0
};

enum eInputs {
    INPUT_GROUP = 0
};

// Async request identifiers used for tracking specific SimConnect operations
enum eRequests {
    REQUEST_ADD_LASERS = 101, // Request ID for creating the object
    REQUEST_REMOVE_LASERS = 201, // Request ID for removing the object
    REQUEST_LVAR_STARTFLIGHT = 1003,
    REQUEST_LVAR_NEXTPOI = 1004,
    REQUEST_LVAR_SPAWN = 1002
};

// -----------------------------------------------------------------------------
// DATA DEFINITIONS FOR CUSTOM LVAR
// -----------------------------------------------------------------------------
enum eDataDefs
{
    DEFINITION_LVAR_SPAWN = 1001,
    DEFINITION_LVAR_STARTFLIGHT = 1003,
    DEFINITION_LVAR_NEXTPOI = 1004
};

// Variable local para guardar el último valor leído del L:var
static double g_lastSpawnState = -1.0;

// -----------------------------------------------------------------------------
// NUEVOS L:vars para control de vuelo WFP
// -----------------------------------------------------------------------------
static double g_lastStartFlight = -1.0;
static double g_lastNextPoi = -1.0;
static bool   g_flightActive = false;
static int    g_activePoiIndex = -1;

// Mantiene los IDs de todos los objetos spawneados
static std::vector<DWORD> g_lasersIDs;

// Base para IDs únicos de requests de spawn múltiples
static DWORD g_spawnReqBase = 3000;

// -----------------------------------------------------------------------------
// CALLBACK DECLARATION
// -----------------------------------------------------------------------------
void CALLBACK MyDispatchProc(SIMCONNECT_RECV* pData, DWORD cbData, void* pContext);

// -----------------------------------------------------------------------------
// CALLBACK WHEN A MESSAGE IS RECEIVED FROM JS TO WASM
// -----------------------------------------------------------------------------
static void OnMessageFromJS(const char* buf, unsigned int bufSize, void* ctx)
{
    std::string received(buf, bufSize);
    std::fprintf(stderr, "[MSFS] Received from JS: %s\n", received.c_str());
    
    // Try to parse a simple JSON structure for POI_COORDINATES without pulling in a full JSON library
    // Expected shape:
    // { "type": "POI_COORDINATES", "data": [ {"lat": 40.7, "lon": -74.0}, ... ], "count": 2 }

    // Clear previous coords
    g_poi_coords.clear();

    // Quick check for message type
    if (received.find("POI_COORDINATES") != std::string::npos)
    {
        // Find start of data array
        size_t dataPos = received.find("\"data\"");
        if (dataPos != std::string::npos)
        {
            size_t bracket = received.find('[', dataPos);
            if (bracket != std::string::npos)
            {
                const char* cstr = received.c_str();
                const char* ptr = cstr + bracket + 1; // position after '['
                char* endptr = nullptr;

                while (true)
                {
                    // find next "lat"
                    const char* latKey = strstr(ptr, "\"lat\"");
                    if (!latKey) break;

                    // find ':' after latKey
                    const char* colon = strchr(latKey, ':');
                    if (!colon) break;

                    // parse latitude
                    double lat = strtod(colon + 1, &endptr);
                    if (endptr == colon + 1)
                    {
                        // parse failed, abort
                        break;
                    }

                    // find next "lon" after endptr
                    const char* lonKey = strstr(endptr, "\"lon\"");
                    if (!lonKey) break;

                    const char* colonLon = strchr(lonKey, ':');
                    if (!colonLon) break;

                    double lon = strtod(colonLon + 1, &endptr);
                    if (endptr == colonLon + 1)
                    {
                        // parse failed
                        break;
                    }

                    // store pair
                    g_poi_coords.push_back(std::make_pair(lat, lon));

                    // move ptr forward to continue search
                    ptr = endptr;
                }

                // Log parsed coordinates
                fprintf(stderr, "[MSFS] Parsed %zu POI coordinates from JS\n", g_poi_coords.size());
                for (size_t i = 0; i < g_poi_coords.size(); ++i)
                {
                    fprintf(stderr, "[MSFS] POI[%zu] = lat: %.6f, lon: %.6f\n", i, g_poi_coords[i].first, g_poi_coords[i].second);
                }
            }
            else
            {
                fprintf(stderr, "[MSFS] 'data' array not found in payload\n");
            }
        }
        else
        {
            fprintf(stderr, "[MSFS] 'type' indicates POI_COORDINATES but 'data' key not found\n");
        }
    }

    // Send simple acknowledgement back to JS (original behavior)
    std::string reply;
    reply.append("ack: ");
    reply += received;
    fsCommBusCall("OnMessageFromWasm", reply.c_str(), (unsigned int)reply.size(), FsCommBusBroadcast_JS);
    std::fprintf(stderr, "[MSFS] Sent ack to JS: %s\n", reply.c_str());
}


// -----------------------------------------------------------------------------
// UTILITY: Spawn a SimObject at given coordinates
// -----------------------------------------------------------------------------
static void SpawnSimObject()
{
    if (!g_hSimConnect)
        return; // ensure early exit if connection is not established

    if (g_poi_coords.empty())
    {
        fprintf(stderr, "[MSFS] SpawnSimObject: No POI coordinates loaded in vector.\n");
        return;
    }
    fprintf(stderr, "[MSFS] Spawning 'laser_red' SimObjects for %zu POIs...\n", g_poi_coords.size());

    for (size_t i = 0; i < g_poi_coords.size(); i++) {
        double lat = g_poi_coords[i].first;
        double lon = g_poi_coords[i].second;

        SIMCONNECT_DATA_INITPOSITION pos = {};
        pos.Latitude = lat;
        pos.Longitude = lon;
        pos.Altitude = 0; // Altitude 0 → use terrain elevation
        pos.Pitch = 0;
        pos.Bank = 0;
        pos.Heading = 0;
        pos.OnGround = 1; // SimObject spawns on ground level at the specified lat/lon. The "0" altitude value is ignored when OnGround=1, we need to set and altitude.


        // You can assign a dynamic request ID based on the index to differentiate spawns
        DWORD requestId = REQUEST_ADD_LASERS + static_cast<DWORD>(i);


        // Attempt to spawn the SimObject named "laser_red" (must exist as a defined SimObject)
        HRESULT hr = SimConnect_AICreateSimulatedObject(g_hSimConnect, "laser_red", pos, REQUEST_ADD_LASERS);
        if (hr == S_OK)
        {
            fprintf(stderr, "[MSFS] Spawn request submitted for 'laser_red' (request=%d) at %.5f, %.5f (terrain)\n", REQUEST_ADD_LASERS, lat, lon);
        }
        else
        {
            fprintf(stderr, "[MSFS] Spawn FAILED (HRESULT=0x%08X)\n", static_cast<unsigned int>(hr));
        }
    }
}

// -----------------------------------------------------------------------------
// UTILITY: Remove the last spawned SimObject
// -----------------------------------------------------------------------------
static void RemoveLasersObject()
{
    if (!g_hSimConnect)
        return;

    if (g_lasersIDs.empty())
    {
        fprintf(stderr, "[MSFS] RemoveLasersObject: No active 'laser_red' objects to remove.\n");
        return;
    }

    fprintf(stderr, "[MSFS] Removing %zu 'laser_red' objects...\n", g_lasersIDs.size());

    // Loop through all stored object IDs
    for (size_t i = 0; i < g_lasersIDs.size(); ++i)
    {
        DWORD objId = g_lasersIDs[i];
        HRESULT hr = SimConnect_AIRemoveObject(g_hSimConnect, objId, REQUEST_REMOVE_LASERS);

        if (hr == S_OK)
        {
            fprintf(stderr, "[MSFS]  -> Remove submitted for id=%u (index=%zu)\n", (unsigned)objId, i);
        }
        else
        {
            fprintf(stderr, "[MSFS]  -> Remove FAILED for id=%u (HRESULT=0x%08X)\n",
                (unsigned)objId, static_cast<unsigned int>(hr));
        }
    }

    // Clear stored IDs
    g_lasersIDs.clear();
    g_lasersID = SIMCONNECT_OBJECT_ID_USER;

    fprintf(stderr, "[MSFS] All laser_red objects removal requested.\n");
}

// -----------------------------------------------------------------------------
// MODULE INITIALIZATION
// Called automatically when the WASM module is loaded by the simulator
// -----------------------------------------------------------------------------
extern "C" MODULE_EXPORT MSFS_CALLBACK void module_init(void)
{
    const char* clientName = "FlightpediaConnect";
    HRESULT hr = SimConnect_Open(&g_hSimConnect, clientName, 0, 0, 0, 0);
    if (hr != S_OK)
    {
        fprintf(stderr, "[MSFS] SimConnect_Open('%s') failed (HRESULT=0x%08X)\n", clientName, static_cast<unsigned int>(hr));
        g_hSimConnect = 0;
        return;
    }

    fprintf(stderr, "[MSFS] v4 SimConnect connected as '%s'.\n", clientName);

    std::fprintf(stderr, "[MSFS] module communication: initiated and registering CommBus listener\n");
    fsCommBusRegister("OnMessageFromJs", OnMessageFromJS, nullptr);

    const char* startup = "WASM ready";
    fsCommBusCall("OnMessageFromWasm", startup, (unsigned int)std::strlen(startup), FsCommBusBroadcast_JS);
    std::fprintf(stderr, "[MSFS] module communication: sent startup message to JS\n");


   // -------------------------------------------------------------------------
  // Subscribe to system-level events
  // -------------------------------------------------------------------------
    hr = SimConnect_SubscribeToSystemEvent(g_hSimConnect, EVENT_FLIGHT_LOADED, "FlightLoaded");
    fprintf(stderr, "[MSFS] Subscribed FlightLoaded -> %s (id=%d)\n", hr==S_OK?"OK":"FAIL", EVENT_FLIGHT_LOADED);

    hr = SimConnect_SubscribeToSystemEvent(g_hSimConnect, EVENT_SIM_START, "SimStart");
    fprintf(stderr, "[MSFS] Subscribed SimStart -> %s (id=%d)\n", hr==S_OK?"OK":"FAIL", EVENT_SIM_START);

    hr = SimConnect_SubscribeToSystemEvent(g_hSimConnect, EVENT_FLIGHTPLAN_LOADED, "FlightPlanLoaded");
    fprintf(stderr, "[MSFS] Subscribed FlightPlanLoaded -> %s (id=%d)\n", hr==S_OK?"OK":"FAIL", EVENT_FLIGHTPLAN_LOADED);

    // -------------------------------------------------------------------------
    // Map keyboard input (M → spawn, N → remove)
    // -------------------------------------------------------------------------
    // NOTE: In MSFS standalone modules, key mapping only works if focus is active.
    //       Ensure the module’s input group is correctly configured in the manifest.

    hr = SimConnect_MapClientEventToSimEvent(g_hSimConnect, EVENT_TRIGGER_M, "Flightpedia.M");
    fprintf(stderr, "[MSFS] MapClientEventToSimEvent EVENT_TRIGGER_M -> %s\n", hr==S_OK?"OK":"FAIL");

    hr = SimConnect_MapInputEventToClientEvent(g_hSimConnect, INPUT_GROUP, "M", EVENT_TRIGGER_M);
    fprintf(stderr, "[MSFS] MapInputEventToClientEvent 'M' -> %s\n", hr==S_OK?"OK":"FAIL");

    
    hr = SimConnect_MapClientEventToSimEvent(g_hSimConnect, EVENT_TRIGGER_N, "Flightpedia.N");
    fprintf(stderr, "[MSFS] MapClientEventToSimEvent EVENT_TRIGGER_N -> %s\n", hr==S_OK?"OK":"FAIL");

    hr = SimConnect_MapInputEventToClientEvent(g_hSimConnect, INPUT_GROUP, "N", EVENT_TRIGGER_N);
    fprintf(stderr, "[MSFS] MapInputEventToClientEvent 'N' -> %s\n", hr==S_OK?"OK":"FAIL");

    // -------------------------------------------------------------------------
     // Register events and activate input group
     // -------------------------------------------------------------------------
    hr = SimConnect_AddClientEventToNotificationGroup(g_hSimConnect, GROUP_INPUT, EVENT_TRIGGER_M);
    fprintf(stderr, "[MSFS] AddClientEventToNotificationGroup EVENT_TRIGGER_M -> %s\n", hr==S_OK?"OK":"FAIL");

    hr = SimConnect_AddClientEventToNotificationGroup(g_hSimConnect, GROUP_INPUT, EVENT_TRIGGER_N);
    fprintf(stderr, "[MSFS] AddClientEventToNotificationGroup EVENT_TRIGGER_N -> %s\n", hr==S_OK?"OK":"FAIL");

    hr = SimConnect_SetNotificationGroupPriority(g_hSimConnect, GROUP_INPUT, SIMCONNECT_GROUP_PRIORITY_HIGHEST);
    fprintf(stderr, "[MSFS] SetNotificationGroupPriority GROUP_INPUT -> %s\n", hr==S_OK?"OK":"FAIL");

    hr = SimConnect_SetInputGroupState(g_hSimConnect, INPUT_GROUP, SIMCONNECT_STATE_ON);
    fprintf(stderr, "[MSFS] SetInputGroupState INPUT_GROUP ON -> %s\n", hr==S_OK?"OK":"FAIL");

    // -------------------- LVAR Monitoring Setup --------------------
    HRESULT hrDef = SimConnect_AddToDataDefinition(
        g_hSimConnect,
        DEFINITION_LVAR_SPAWN,
        "L:spawnAllLasersRed",  // nombre del L:var en el simulador
        "Bool",                 // tipo
        SIMCONNECT_DATATYPE_FLOAT64, // tipo de dato (doble precisión)
        0.0f,
        SIMCONNECT_UNUSED);

    if (hrDef == S_OK)
        fprintf(stderr, "[MSFS] Added L:spawnAllLasersRed to data definition.\n");
    else
        fprintf(stderr, "[MSFS] FAILED to add L:spawnAllLasersRed (0x%08X)\n", (unsigned)hrDef);

    // Request initial value
    HRESULT hrReq = SimConnect_RequestDataOnSimObject(
        g_hSimConnect,
        REQUEST_LVAR_SPAWN,
        DEFINITION_LVAR_SPAWN,
        SIMCONNECT_OBJECT_ID_USER,
        SIMCONNECT_PERIOD_SECOND,  // check every second
        SIMCONNECT_DATA_REQUEST_FLAG_DEFAULT,
        0, 0, 0);

    if (hrReq == S_OK)
        fprintf(stderr, "[MSFS] Started monitoring L:spawnAllLasersRed every second.\n");
    else
        fprintf(stderr, "[MSFS] FAILED to request L:spawnAllLasersRed (0x%08X)\n", (unsigned)hrReq);

    // -------------------- WFP_StartFlight LVAR Setup --------------------
    HRESULT hrDef2 = SimConnect_AddToDataDefinition(
        g_hSimConnect,
        DEFINITION_LVAR_STARTFLIGHT,
        "L:WFP_StartFlight",
        "Bool",
        SIMCONNECT_DATATYPE_FLOAT64,
        0.0f,
        SIMCONNECT_UNUSED);

    if (hrDef2 == S_OK)
        fprintf(stderr, "[MSFS] Added L:WFP_StartFlight to data definition.\n");
    else
        fprintf(stderr, "[MSFS] FAILED to add L:WFP_StartFlight (0x%08X)\n", (unsigned)hrDef2);

    HRESULT hrReq2 = SimConnect_RequestDataOnSimObject(
        g_hSimConnect,
        REQUEST_LVAR_STARTFLIGHT,
        DEFINITION_LVAR_STARTFLIGHT,
        SIMCONNECT_OBJECT_ID_USER,
        SIMCONNECT_PERIOD_SECOND,
        SIMCONNECT_DATA_REQUEST_FLAG_DEFAULT,
        0, 0, 0);

    if (hrReq2 == S_OK)
        fprintf(stderr, "[MSFS] Started monitoring L:WFP_StartFlight every second.\n");
    else
        fprintf(stderr, "[MSFS] FAILED to request L:WFP_StartFlight (0x%08X)\n", (unsigned)hrReq2);


    // -------------------- WFP_NextPoi LVAR Setup --------------------
    HRESULT hrDef3 = SimConnect_AddToDataDefinition(
        g_hSimConnect,
        DEFINITION_LVAR_NEXTPOI,
        "L:WFP_NextPoi",
        "Bool",
        SIMCONNECT_DATATYPE_FLOAT64,
        0.0f,
        SIMCONNECT_UNUSED);

    if (hrDef3 == S_OK)
        fprintf(stderr, "[MSFS] Added L:WFP_NextPoi to data definition.\n");
    else
        fprintf(stderr, "[MSFS] FAILED to add L:WFP_NextPoi (0x%08X)\n", (unsigned)hrDef3);

    HRESULT hrReq3 = SimConnect_RequestDataOnSimObject(
        g_hSimConnect,
        REQUEST_LVAR_NEXTPOI,
        DEFINITION_LVAR_NEXTPOI,
        SIMCONNECT_OBJECT_ID_USER,
        SIMCONNECT_PERIOD_SECOND,
        SIMCONNECT_DATA_REQUEST_FLAG_DEFAULT,
        0, 0, 0);

    if (hrReq3 == S_OK)
        fprintf(stderr, "[MSFS] Started monitoring L:WFP_NextPoi every second.\n");
    else
        fprintf(stderr, "[MSFS] FAILED to request L:WFP_NextPoi (0x%08X)\n", (unsigned)hrReq3);


    // -------------------------------------------------------------------------
    // Dispatch initial events (flush startup messages)
    // -------------------------------------------------------------------------
    hr = SimConnect_CallDispatch(g_hSimConnect, MyDispatchProc, nullptr);
    if (hr != S_OK)
    {
        fprintf(stderr, "[MSFS] SimConnect_CallDispatch on INIT returned 0x%08X\n", static_cast<unsigned int>(hr));
    }
    else
    {
        fprintf(stderr, "[MSFS] SimConnect_CallDispatch on INIT\n");
    }
}

// -----------------------------------------------------------------------------
// MODULE DEINITIALIZATION
// Called automatically when the simulator unloads the WASM module
// -----------------------------------------------------------------------------
extern "C" MODULE_EXPORT MSFS_CALLBACK void module_deinit(void)
{
    if (g_hSimConnect)
    {
        // Turn off input group
        SimConnect_SetInputGroupState(g_hSimConnect, INPUT_GROUP, SIMCONNECT_STATE_OFF);

        SimConnect_Close(g_hSimConnect);
        g_hSimConnect = 0;
        fprintf(stderr, "[MSFS] SimConnect closed.\n");
    }
    fsCommBusUnregisterAll();
    std::fprintf(stderr, "[MSFS] module communication: closed and unregistered CommBus handlers\n");
}

// -----------------------------------------------------------------------------
// DISPATCH CALLBACK HANDLER
// Handles all messages coming from SimConnect asynchronously
// -----------------------------------------------------------------------------
void CALLBACK MyDispatchProc(SIMCONNECT_RECV* pData, DWORD cbData, void* pContext)
{
    if (!pData)
        return;

    switch (pData->dwID)
    {
        // ---------------------------------------------------------------------
        // Event containing filenames (flight loaded, flight plan loaded, etc.)
        // ---------------------------------------------------------------------
    case SIMCONNECT_RECV_ID_EVENT_FILENAME:
    {
        SIMCONNECT_RECV_EVENT_FILENAME* evt = (SIMCONNECT_RECV_EVENT_FILENAME*)pData;
        if (evt->uEventID == EVENT_FLIGHT_LOADED)
        {
            fprintf(stderr, "[MSFS] FlightLoaded detected: %s\n", evt->szFileName);
        }
        else
        {
            fprintf(stderr, "[MSFS] EVENT_FILENAME other id=%u file='%s'\n", (unsigned)evt->uEventID, evt->szFileName);
        }
        break;
    }
    // ---------------------------------------------------------------------
       // Generic event handler for all subscribed events
       // ---------------------------------------------------------------------
    case SIMCONNECT_RECV_ID_EVENT:
    {
        SIMCONNECT_RECV_EVENT* evt = (SIMCONNECT_RECV_EVENT*)pData;
        if (evt->uEventID == EVENT_SIM_START)
        {
            fprintf(stderr, "[MSFS] SimStart event received.\n");
        }
        else if (evt->uEventID == EVENT_FLIGHTPLAN_LOADED)
        {
            fprintf(stderr, "[MSFS] FlightPlanLoaded event received.\n");
        }
        else if (evt->uEventID == EVENT_TRIGGER_M)
        {
            // Triggered when the 'M' key is pressed
            fprintf(stderr, "[MSFS] Key 'M' pressed - triggered EVENT_TRIGGER_M\n");

            SpawnSimObject();// Example coords (Cochabamba, Bolivia)
        }
        else if (evt->uEventID == EVENT_TRIGGER_N)
        {
            // Triggered when the 'N' key is pressed
            fprintf(stderr, "[MSFS] Key 'N' pressed - triggered EVENT_TRIGGER_N\n");
            // Remove Lasers object
            RemoveLasersObject();
        }
        else
        {
            fprintf(stderr, "[MSFS] EVENT generic id=%u\n", (unsigned)evt->uEventID);
        }
        break;
    }
    case SIMCONNECT_RECV_ID_ASSIGNED_OBJECT_ID:
    {
        SIMCONNECT_RECV_ASSIGNED_OBJECT_ID* pObj = (SIMCONNECT_RECV_ASSIGNED_OBJECT_ID*)pData;

        if (pObj->dwRequestID >= g_spawnReqBase) {
            g_lasersIDs.push_back(pObj->dwObjectID);
            fprintf(stderr, "[MSFS] Multi-spawn assigned object id: %u (req=%u) (total=%zu)\n",
                (unsigned)pObj->dwObjectID,
                (unsigned)pObj->dwRequestID,
                g_lasersIDs.size());
        }
        else if (pObj->dwRequestID == REQUEST_ADD_LASERS) {
            g_lasersID = pObj->dwObjectID;
            g_lasersIDs.push_back(g_lasersID);
            fprintf(stderr, "[MSFS] Single spawn object id: %u\n", (unsigned)g_lasersID);
        }
        break;
    }
    case SIMCONNECT_RECV_ID_SIMOBJECT_DATA:
    {
        SIMCONNECT_RECV_SIMOBJECT_DATA* pObjData = (SIMCONNECT_RECV_SIMOBJECT_DATA*)pData;

        if (pObjData->dwRequestID == REQUEST_LVAR_SPAWN)
        {
            double* pValue = (double*)&pObjData->dwData;
            double newValue = *pValue;

            if (newValue != g_lastSpawnState)
            {
                fprintf(stderr, "[MSFS] L:spawnAllLasersRed changed -> %.0f\n", newValue);

                if (newValue == 1.0)
                {
                    fprintf(stderr, "[MSFS] -> Spawning all lasers\n");
                    SpawnSimObject();
                }
                else if (newValue == 0.0)
                {
                    fprintf(stderr, "[MSFS] -> Removing all lasers\n");
                    RemoveLasersObject();
                }

                g_lastSpawnState = newValue;
            }
        }
        // --- L:WFP_StartFlight ---
        else if (pObjData->dwRequestID == REQUEST_LVAR_STARTFLIGHT)
        {
            double* pValue = (double*)&pObjData->dwData;
            double newValue = *pValue;

            if (newValue != g_lastStartFlight)
            {
                fprintf(stderr, "[MSFS] L:WFP_StartFlight changed -> %.0f\n", newValue);

                if (newValue == 1.0)
                {
                    fprintf(stderr, "[MSFS] -> Starting Flight: removing all, spawning first POI.\n");
                    RemoveLasersObject();
                    g_activePoiIndex = 0;
                    g_flightActive = true;

                    if (!g_poi_coords.empty())
                    {
                        double lat = g_poi_coords[0].first;
                        double lon = g_poi_coords[0].second;
                        SIMCONNECT_DATA_INITPOSITION pos = {};
                        pos.Latitude = lat;
                        pos.Longitude = lon;
                        pos.Altitude = 0;
                        pos.OnGround = 1;
                        SimConnect_AICreateSimulatedObject(g_hSimConnect, "laser_red", pos, REQUEST_ADD_LASERS);
                        fprintf(stderr, "[MSFS] Spawned first POI at index 0 (%.6f, %.6f)\n", lat, lon);
                    }
                    else
                    {
                        fprintf(stderr, "[MSFS] No POIs available to spawn.\n");
                    }
                }
                else if (newValue == 0.0)
                {
                    fprintf(stderr, "[MSFS] -> Flight stopped, removing all objects.\n");
                    RemoveLasersObject();
                    g_flightActive = false;
                    g_activePoiIndex = -1;
                }

                g_lastStartFlight = newValue;
            }
        }

        // --- L:WFP_NextPoi ---
        else if (pObjData->dwRequestID == REQUEST_LVAR_NEXTPOI)
        {
            double* pValue = (double*)&pObjData->dwData;
            double newValue = *pValue;

            if (newValue != g_lastNextPoi)
            {
                fprintf(stderr, "[MSFS] L:WFP_NextPoi changed -> %.0f\n", newValue);

                if (g_flightActive && newValue == 1.0)
                {
                    g_activePoiIndex++;
                    if (g_activePoiIndex < (int)g_poi_coords.size())
                    {
                        RemoveLasersObject();

                        double lat = g_poi_coords[g_activePoiIndex].first;
                        double lon = g_poi_coords[g_activePoiIndex].second;
                        SIMCONNECT_DATA_INITPOSITION pos = {};
                        pos.Latitude = lat;
                        pos.Longitude = lon;
                        pos.Altitude = 0;
                        pos.OnGround = 1;
                        SimConnect_AICreateSimulatedObject(g_hSimConnect, "laser_red", pos, REQUEST_ADD_LASERS);

                        fprintf(stderr, "[MSFS] Advanced to POI[%d] -> %.6f, %.6f\n", g_activePoiIndex, lat, lon);
                    }
                    else
                    {
                        fprintf(stderr, "[MSFS] End of POI list reached.\n");
                        RemoveLasersObject();
                        g_flightActive = false;
                    }
                }

                g_lastNextPoi = newValue;
            }
        }

        break;
    }
    default:
        // Other message types not explicitly handled
        break;
    }
}