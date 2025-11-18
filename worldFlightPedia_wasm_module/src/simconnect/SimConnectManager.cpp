#include "simconnect/SimConnectManager.h"
#include "MSFS/MSFS_WindowsTypes.h"
#include <simconnect.h>
#include "core/ModuleContext.h"
#include "core/Constants.h"
#include "dispatch/DispatchHandler.h"

// -----------------------------------------------------------------------------
// SimConnect Manager
// Responsibilities:
// - Open and close the SimConnect connection
// - Register system events and input mappings
// - Define and request SIM/Local variable data definitions (L:VARs)
// - Install the global dispatch callback (MyDispatchProc)
// Notes:
// - This initialization is intended to run once during module_init.
// - Many SimConnect APIs are tolerant of repeated AddToDataDefinition calls,
//   but prefer adding definitions once to avoid ambiguity.
// -----------------------------------------------------------------------------

bool SimConnectManager_Initialize()
{
    const char* clientName = "FlightpediaConnect";
    HRESULT hr = SimConnect_Open(&g_hSimConnect, clientName, 0, 0, 0, 0);
    if (hr != S_OK)
    {
        // On failure, log the HRESULT and mark handle invalid
        fprintf(stderr, "[MSFS] SimConnect_Open('%s') failed (HRESULT=0x%08X)\n", clientName, static_cast<unsigned int>(hr));
        g_hSimConnect = 0;
        return false;
    }

    fprintf(stderr, "[MSFS] v70 SimConnect connected as '%s'.\n", clientName);

    // -------------------------------------------------------------------------
    // Subscribe to system-level events (flight lifecycle notifications)
    // These are high-level simulator events we may want to react to.
    // -------------------------------------------------------------------------
    HRESULT hr2;

    hr2 = SimConnect_SubscribeToSystemEvent(g_hSimConnect, EVENT_FLIGHT_LOADED, "FlightLoaded");
    fprintf(stderr, "[MSFS] Subscribed FlightLoaded -> %s (id=%d)\n",
        hr2 == S_OK ? "OK" : "FAIL", EVENT_FLIGHT_LOADED);

    hr2 = SimConnect_SubscribeToSystemEvent(g_hSimConnect, EVENT_SIM_START, "SimStart");
    fprintf(stderr, "[MSFS] Subscribed SimStart -> %s (id=%d)\n",
        hr2 == S_OK ? "OK" : "FAIL", EVENT_SIM_START);

    hr2 = SimConnect_SubscribeToSystemEvent(g_hSimConnect, EVENT_FLIGHTPLAN_LOADED, "FlightPlanLoaded");
    fprintf(stderr, "[MSFS] Subscribed FlightPlanLoaded -> %s (id=%d)\n",
        hr2 == S_OK ? "OK" : "FAIL", EVENT_FLIGHTPLAN_LOADED);

    // -------------------------------------------------------------------------
    // Input mappings and notification groups
    // - Map client event IDs to simulator events
    // - Map keyboard input to client events
    // - Group events into a notification group and set priority
    // -------------------------------------------------------------------------
    HRESULT hr3;

    // Map and bind 'M' key
    hr3 = SimConnect_MapClientEventToSimEvent(g_hSimConnect, EVENT_TRIGGER_M, "Flightpedia.M");
    fprintf(stderr, "[MSFS] MapClientEventToSimEvent EVENT_TRIGGER_M -> %s\n",
        hr3 == S_OK ? "OK" : "FAIL");

    hr3 = SimConnect_MapInputEventToClientEvent(g_hSimConnect, INPUT_GROUP, "M", EVENT_TRIGGER_M);
    fprintf(stderr, "[MSFS] MapInputEventToClientEvent 'M' -> %s\n",
        hr3 == S_OK ? "OK" : "FAIL");

    // Map and bind 'N' key
    hr3 = SimConnect_MapClientEventToSimEvent(g_hSimConnect, EVENT_TRIGGER_N, "Flightpedia.N");
    fprintf(stderr, "[MSFS] MapClientEventToSimEvent EVENT_TRIGGER_N -> %s\n",
        hr3 == S_OK ? "OK" : "FAIL");

    hr3 = SimConnect_MapInputEventToClientEvent(g_hSimConnect, INPUT_GROUP, "N", EVENT_TRIGGER_N);
    fprintf(stderr, "[MSFS] MapInputEventToClientEvent 'N' -> %s\n",
        hr3 == S_OK ? "OK" : "FAIL");

    // Add both events to the input notification group and enable it
    hr3 = SimConnect_AddClientEventToNotificationGroup(g_hSimConnect, GROUP_INPUT, EVENT_TRIGGER_M);
    fprintf(stderr, "[MSFS] AddClientEventToNotificationGroup EVENT_TRIGGER_M -> %s\n",
        hr3 == S_OK ? "OK" : "FAIL");

    hr3 = SimConnect_AddClientEventToNotificationGroup(g_hSimConnect, GROUP_INPUT, EVENT_TRIGGER_N);
    fprintf(stderr, "[MSFS] AddClientEventToNotificationGroup EVENT_TRIGGER_N -> %s\n",
        hr3 == S_OK ? "OK" : "FAIL");

    hr3 = SimConnect_SetNotificationGroupPriority(g_hSimConnect, GROUP_INPUT, SIMCONNECT_GROUP_PRIORITY_HIGHEST);
    fprintf(stderr, "[MSFS] SetNotificationGroupPriority GROUP_INPUT -> %s\n",
        hr3 == S_OK ? "OK" : "FAIL");

    hr3 = SimConnect_SetInputGroupState(g_hSimConnect, INPUT_GROUP, SIMCONNECT_STATE_ON);
    fprintf(stderr, "[MSFS] SetInputGroupState INPUT_GROUP ON -> %s\n",
        hr3 == S_OK ? "OK" : "FAIL");

    // -------------------------------------------------------------------------
    // Local variables (L:Var) data definitions and requests
    // - AddToDataDefinition binds a definition id to a simulator variable name
    // - RequestDataOnSimObject requests periodic or on-change updates for that definition
    // -------------------------------------------------------------------------
    HRESULT hrDef;
    HRESULT hrReq;

    // L:spawnAllLasersRed -- toggles spawning of laser objects
    hrDef = SimConnect_AddToDataDefinition(
        g_hSimConnect,
        DEFINITION_LVAR_SPAWN,
        "L:spawnAllLasersRed",
        "Bool",
        SIMCONNECT_DATATYPE_FLOAT64,
        0.0f,
        SIMCONNECT_UNUSED);

    if (hrDef == S_OK)
        fprintf(stderr, "[MSFS] Added L:spawnAllLasersRed to data definition.\n");
    else
        fprintf(stderr, "[MSFS] FAILED to add L:spawnAllLasersRed (0x%08X)\n", (unsigned)hrDef);

    // Request this L:Var every second
    hrReq = SimConnect_RequestDataOnSimObject(
        g_hSimConnect,
        REQUEST_LVAR_SPAWN,
        DEFINITION_LVAR_SPAWN,
        SIMCONNECT_OBJECT_ID_USER,
        SIMCONNECT_PERIOD_SECOND,
        SIMCONNECT_DATA_REQUEST_FLAG_DEFAULT,
        0, 0, 0);

    if (hrReq == S_OK)
        fprintf(stderr, "[MSFS] Started monitoring L:spawnAllLasersRed every second.\n");
    else
        fprintf(stderr, "[MSFS] FAILED to request L:spawnAllLasersRed (0x%08X)\n", (unsigned)hrReq);

    // L:WFP_StartFlight -- start/stop automated POI flight
    hrDef = SimConnect_AddToDataDefinition(
        g_hSimConnect,
        DEFINITION_LVAR_STARTFLIGHT,
        "L:WFP_StartFlight",
        "Bool",
        SIMCONNECT_DATATYPE_FLOAT64,
        0.0f,
        SIMCONNECT_UNUSED);

    if (hrDef == S_OK)
        fprintf(stderr, "[MSFS] Added L:WFP_StartFlight to data definition.\n");
    else
        fprintf(stderr, "[MSFS] FAILED to add L:WFP_StartFlight (0x%08X)\n", (unsigned)hrDef);

    hrReq = SimConnect_RequestDataOnSimObject(
        g_hSimConnect,
        REQUEST_LVAR_STARTFLIGHT,
        DEFINITION_LVAR_STARTFLIGHT,
        SIMCONNECT_OBJECT_ID_USER,
        SIMCONNECT_PERIOD_SECOND,
        SIMCONNECT_DATA_REQUEST_FLAG_DEFAULT,
        0, 0, 0);

    if (hrReq == S_OK)
        fprintf(stderr, "[MSFS] Started monitoring L:WFP_StartFlight every second.\n");
    else
        fprintf(stderr, "[MSFS] FAILED to request L:WFP_StartFlight (0x%08X)\n", (unsigned)hrReq);

    // L:WFP_NextPoi -- advance to next POI in sequence
    hrDef = SimConnect_AddToDataDefinition(
        g_hSimConnect,
        DEFINITION_LVAR_NEXTPOI,
        "L:WFP_NextPoi",
        "Bool",
        SIMCONNECT_DATATYPE_FLOAT64,
        0.0f,
        SIMCONNECT_UNUSED);

    if (hrDef == S_OK)
        fprintf(stderr, "[MSFS] Added L:WFP_NextPoi to data definition.\n");
    else
        fprintf(stderr, "[MSFS] FAILED to add L:WFP_NextPoi (0x%08X)\n", (unsigned)hrDef);

    hrReq = SimConnect_RequestDataOnSimObject(
        g_hSimConnect,
        REQUEST_LVAR_NEXTPOI,
        DEFINITION_LVAR_NEXTPOI,
        SIMCONNECT_OBJECT_ID_USER,
        SIMCONNECT_PERIOD_SECOND,
        SIMCONNECT_DATA_REQUEST_FLAG_DEFAULT,
        0, 0, 0);

    if (hrReq == S_OK)
        fprintf(stderr, "[MSFS] Started monitoring L:WFP_NextPoi every second.\n");
    else
        fprintf(stderr, "[MSFS] FAILED to request L:WFP_NextPoi (0x%08X)\n", (unsigned)hrReq);

    // ---- L:WFP_SPAWN_CUBE ----
    hrDef = SimConnect_AddToDataDefinition(
        g_hSimConnect,
        DEFINITION_LVAR_SPAWN_CUBE,
        "L:WFP_SPAWN_CUBE",
        "Bool",
        SIMCONNECT_DATATYPE_FLOAT64,
        0.0f,
        SIMCONNECT_UNUSED);

    if (hrDef == S_OK)
        fprintf(stderr, "[MSFS] Added L:WFP_SPAWN_CUBE to data definition.\n");
    else
        fprintf(stderr, "[MSFS] FAILED to add L:WFP_SPAWN_CUBE (0x%08X)\n", (unsigned)hrDef);

    hrReq = SimConnect_RequestDataOnSimObject(
        g_hSimConnect,
        REQUEST_LVAR_SPAWN_CUBE,
        DEFINITION_LVAR_SPAWN_CUBE,
        SIMCONNECT_OBJECT_ID_USER,
        SIMCONNECT_PERIOD_SECOND,
        SIMCONNECT_DATA_REQUEST_FLAG_CHANGED,
        0, 0, 0);

    if (hrReq == S_OK)
        fprintf(stderr, "[MSFS] Started monitoring L:WFP_SPAWN_CUBE (on change).\n");
    else
        fprintf(stderr, "[MSFS] FAILED to request L:WFP_SPAWN_CUBE (0x%08X)\n", (unsigned)hrReq);


    // -------------------------------------------------------------------------
    // Initial dispatch
    // - CallDispatch will cause the provided callback to be invoked for pending messages
    // -------------------------------------------------------------------------
    HRESULT hrDispatch = SimConnect_CallDispatch(g_hSimConnect, MyDispatchProc, nullptr);
    if (hrDispatch != S_OK)
    {
        fprintf(stderr, "[MSFS] SimConnect_CallDispatch on INIT returned 0x%08X\n",
            (unsigned)hrDispatch);
    }
    else
    {
        fprintf(stderr, "[MSFS] SimConnect_CallDispatch on INIT\n");
    }

    return true;
}

void SimConnectManager_Shutdown()
{
    if (g_hSimConnect)
    {
        // Disable input groups before closing connection
        SimConnect_SetInputGroupState(g_hSimConnect, INPUT_GROUP, SIMCONNECT_STATE_OFF);

        // Close SimConnect connection and clear handle
        SimConnect_Close(g_hSimConnect);
        g_hSimConnect = 0;

        fprintf(stderr, "[MSFS] SimConnect shutdown completed (via SimConnectManager).\n");
    }
}
