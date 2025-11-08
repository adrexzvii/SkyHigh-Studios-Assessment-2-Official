#include <MSFS/MSFS.h>
#include <MSFS/MSFS_WindowsTypes.h>
#include <SimConnect.h>
#include "worldFlightPedia_wasm_module.h"

// ----------------------------------------------------
// Global SimConnect handle
// ----------------------------------------------------
HANDLE g_hSimConnect = 0;
static unsigned int g_frameCounter = 0; // para heartbeat

// ----------------------------------------------------
// Enum para eventos del módulo
// ----------------------------------------------------
enum eEvents
{
    EVENT_FLIGHT_LOADED = 0,
    EVENT_SIM_START = 1,
    EVENT_FLIGHTPLAN_LOADED = 2
};

// ----------------------------------------------------
// Declaración de callback
// ----------------------------------------------------
void CALLBACK MyDispatchProc(SIMCONNECT_RECV* pData, DWORD cbData, void* pContext);

// ----------------------------------------------------
// INIT: conexión mínima
// ----------------------------------------------------
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

    fprintf(stderr, "[MSFS] v2 SimConnect connected as '%s'.\n", clientName);

    // Suscripciones
    hr = SimConnect_SubscribeToSystemEvent(g_hSimConnect, EVENT_FLIGHT_LOADED, "FlightLoaded");
    fprintf(stderr, "[MSFS] Subscribed FlightLoaded -> %s (id=%d)\n", hr==S_OK?"OK":"FAIL", EVENT_FLIGHT_LOADED);

    hr = SimConnect_SubscribeToSystemEvent(g_hSimConnect, EVENT_SIM_START, "SimStart");
    fprintf(stderr, "[MSFS] Subscribed SimStart -> %s (id=%d)\n", hr==S_OK?"OK":"FAIL", EVENT_SIM_START);

    hr = SimConnect_SubscribeToSystemEvent(g_hSimConnect, EVENT_FLIGHTPLAN_LOADED, "FlightPlanLoaded");
    fprintf(stderr, "[MSFS] Subscribed FlightPlanLoaded -> %s (id=%d)\n", hr==S_OK?"OK":"FAIL", EVENT_FLIGHTPLAN_LOADED);

    hr = SimConnect_CallDispatch(g_hSimConnect, MyDispatchProc, nullptr);
    if (hr != S_OK)
    {
        fprintf(stderr, "[MSFS] SimConnect_CallDispatch on INIT returned 0x%08X\n", static_cast<unsigned int>(hr));
    }
    else
    {
        fprintf(stderr, "[MSFS] SimConnect_CallDispatch on INIT \n", static_cast<unsigned int>(hr));
    }
}

// ----------------------------------------------------
// DEINIT: cierre limpio
// ----------------------------------------------------
extern "C" MODULE_EXPORT MSFS_CALLBACK void module_deinit(void)
{
    if (g_hSimConnect)
    {
        SimConnect_Close(g_hSimConnect);
        g_hSimConnect = 0;
        fprintf(stderr, "[MSFS] SimConnect closed.\n");
    }
}

// ----------------------------------------------------
// DISPATCH CALLBACK
// ----------------------------------------------------
void CALLBACK MyDispatchProc(SIMCONNECT_RECV* pData, DWORD cbData, void* pContext)
{
    if (!pData)
        return;

    switch (pData->dwID)
    {
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
        else
        {
            fprintf(stderr, "[MSFS] EVENT generic id=%u\n", (unsigned)evt->uEventID);
        }
        break;
    }
    default:
        // Otros paquetes ignorados
        break;
    }
}