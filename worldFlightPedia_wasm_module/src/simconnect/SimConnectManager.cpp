#include "simconnect/SimConnectManager.h"
#include "MSFS/MSFS_WindowsTypes.h"
#include <simconnect.h>
#include "core/ModuleContext.h"
#include "core/Constants.h"
#include "dispatch/DispatchHandler.h"

bool SimConnectManager_Initialize()
{
    // AQUI MOVEMOS TODA LA LÓGICA DE module_init (menos CommBus)
    const char* clientName = "FlightpediaConnect";
    HRESULT hr = SimConnect_Open(&g_hSimConnect, clientName, 0, 0, 0, 0);
    if (hr != S_OK)
    {
        fprintf(stderr, "[MSFS] SimConnect_Open('%s') failed (HRESULT=0x%08X)\n", clientName, static_cast<unsigned int>(hr));
        g_hSimConnect = 0;
        return false;
    }

    fprintf(stderr, "[MSFS] v41 SimConnect connected as '%s'.\n", clientName);

    // -------------------------------------------------------------------------
   // Subscribe to system-level events
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
// BLOQUE 3 — Input Mappings y Notification Groups
// -------------------------------------------------------------------------
    HRESULT hr3;

    // EVENT_TRIGGER_M
    hr3 = SimConnect_MapClientEventToSimEvent(g_hSimConnect, EVENT_TRIGGER_M, "Flightpedia.M");
    fprintf(stderr, "[MSFS] MapClientEventToSimEvent EVENT_TRIGGER_M -> %s\n",
        hr3 == S_OK ? "OK" : "FAIL");

    hr3 = SimConnect_MapInputEventToClientEvent(g_hSimConnect, INPUT_GROUP, "M", EVENT_TRIGGER_M);
    fprintf(stderr, "[MSFS] MapInputEventToClientEvent 'M' -> %s\n",
        hr3 == S_OK ? "OK" : "FAIL");

    // EVENT_TRIGGER_N
    hr3 = SimConnect_MapClientEventToSimEvent(g_hSimConnect, EVENT_TRIGGER_N, "Flightpedia.N");
    fprintf(stderr, "[MSFS] MapClientEventToSimEvent EVENT_TRIGGER_N -> %s\n",
        hr3 == S_OK ? "OK" : "FAIL");

    hr3 = SimConnect_MapInputEventToClientEvent(g_hSimConnect, INPUT_GROUP, "N", EVENT_TRIGGER_N);
    fprintf(stderr, "[MSFS] MapInputEventToClientEvent 'N' -> %s\n",
        hr3 == S_OK ? "OK" : "FAIL");

    // Notification Group
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
// BLOQUE 4 — L:Vars (AddToDataDefinition + RequestDataOnSimObject)
// -------------------------------------------------------------------------
    HRESULT hrDef;
    HRESULT hrReq;

    // ---- L:spawnAllLasersRed ----
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


    // ---- L:WFP_StartFlight ----
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


    // ---- L:WFP_NextPoi ----
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

    // -------------------------------------------------------------------------
// BLOQUE 5 — Dispatch inicial
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
        // Desactivar input groups (del original module_deinit)
        SimConnect_SetInputGroupState(g_hSimConnect, INPUT_GROUP, SIMCONNECT_STATE_OFF);

        // Cerrar SimConnect (mantenemos esto igual)
        SimConnect_Close(g_hSimConnect);
        g_hSimConnect = 0;

        fprintf(stderr, "[MSFS] SimConnect shutdown completed (via SimConnectManager).\n");
    }
}
