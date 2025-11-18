#include <MSFS/MSFS.h>
#include <MSFS/MSFS_CommBus.h>
#include <MSFS/MSFS_WindowsTypes.h>
#include <SimConnect.h>
#include "dispatch/DispatchHandler.h"
#include "core/Constants.h"
#include "simobjects/SimObjectManager.h"
#include <vector>
#include "core/ModuleContext.h"
#include "flight/FlightController.h"
#include <cmath>

// -----------------------------------------------------------------------------
// Dispatch callback handler
// - Central SimConnect message handler invoked via SimConnect_CallDispatch
// - Routes system events, assigned object notifications and data updates
// - Keeps logic minimal: delegates work to FlightController and SimObjectManager
// -----------------------------------------------------------------------------
void CALLBACK MyDispatchProc(SIMCONNECT_RECV* pData, DWORD cbData, void* pContext)
{
    if (!pData)
        return; // Defensive: ignore null pointers

    switch (pData->dwID)
    {
    case SIMCONNECT_RECV_ID_EVENT_FILENAME:
    {
        // Event containing a filename (e.g. flight loaded)
        SIMCONNECT_RECV_EVENT_FILENAME* evt = (SIMCONNECT_RECV_EVENT_FILENAME*)pData;
        if (evt->uEventID == EVENT_FLIGHT_LOADED)
            fprintf(stderr, "[MSFS] FlightLoaded detected: %s\n", evt->szFileName);
        else
            fprintf(stderr, "[MSFS] EVENT_FILENAME other id=%u file='%s'\n", (unsigned)evt->uEventID, evt->szFileName);
        break;
    }
    case SIMCONNECT_RECV_ID_EVENT:
    {
        // Generic subscribed events (keyboard, sim start, flightplan loaded...)
        SIMCONNECT_RECV_EVENT* evt = (SIMCONNECT_RECV_EVENT*)pData;

        if (evt->uEventID == EVENT_SIM_START)
            fprintf(stderr, "[MSFS] SimStart event received.\n");
        else if (evt->uEventID == EVENT_FLIGHTPLAN_LOADED)
            fprintf(stderr, "[MSFS] FlightPlanLoaded event received.\n");
        else if (evt->uEventID == EVENT_TRIGGER_M)
        {
            // Manual spawn trigger (mapped to key 'M')
            fprintf(stderr, "[MSFS] Key 'M' pressed - EVENT_TRIGGER_M\n");
            SpawnSimObject(); // Delegate to SimObjectManager
        }
        else if (evt->uEventID == EVENT_TRIGGER_N)
        {
            // Manual remove trigger (mapped to key 'N')
            fprintf(stderr, "[MSFS] Key 'N' pressed - EVENT_TRIGGER_N\n");
            RemoveSimObject(); // Delegate to SimObjectManager
        }
        else
            fprintf(stderr, "[MSFS] EVENT generic id=%u\n", (unsigned)evt->uEventID);
        break;
    }
    case SIMCONNECT_RECV_ID_ASSIGNED_OBJECT_ID:
    {
        // Received assigned object id after an AICreateSimulatedObject call
        SIMCONNECT_RECV_ASSIGNED_OBJECT_ID* pObj = (SIMCONNECT_RECV_ASSIGNED_OBJECT_ID*)pData;

        // Differentiate between multiple spawn requests and single cube spawn
        if (pObj->dwRequestID >= g_spawnReqBase) {
            // Multi-spawn mode: collect ids
            g_lasersIDs.push_back(pObj->dwObjectID);
            fprintf(stderr, "[MSFS] Multi-spawn assigned object id: %u (req=%u) (total=%zu)\n", (unsigned)pObj->dwObjectID, (unsigned)pObj->dwRequestID, g_lasersIDs.size());
        }
        else if (pObj->dwRequestID == REQUEST_ADD_LASERS) {
            // Single spawn: store and track id
            g_lasersID = pObj->dwObjectID;
            g_lasersIDs.push_back(g_lasersID);
            fprintf(stderr, "[MSFS] Single spawn object id: %u\n", (unsigned)g_lasersID);
        }
        else if (pObj->dwRequestID == REQUEST_ADD_CUBE) {
            // Cube spawn: informational only (no further action required here)
            fprintf(stderr, "[MSFS] Cube assigned object id: %u\n", (unsigned)pObj->dwObjectID);
        }
        break;
    }
    case SIMCONNECT_RECV_ID_SIMOBJECT_DATA:
    {
        // Data response for requested SimVar / L:Var definitions
        SIMCONNECT_RECV_SIMOBJECT_DATA* pObjData = (SIMCONNECT_RECV_SIMOBJECT_DATA*)pData;

        if (pObjData->dwRequestID == REQUEST_LVAR_SPAWN)
        {
            // Handle L:spawnAllLasersRed (toggle spawn/remove)
            double newValue = *(double*)&pObjData->dwData;
            if (newValue != g_lastSpawnState)
            {
                fprintf(stderr, "[MSFS] L:spawnAllLasersRed changed -> %.0f\n", newValue);
                if (newValue == 1.0) { fprintf(stderr, "[MSFS] -> Spawning all lasers\n"); SpawnSimObject(); }
                else if (newValue == 0.0) { fprintf(stderr, "[MSFS] -> Removing all lasers\n"); RemoveSimObject(); }
                g_lastSpawnState = newValue; // remember last state for edge detection
            }
        }
        else if (pObjData->dwRequestID == REQUEST_LVAR_STARTFLIGHT)
        {
            // Delegate start/stop flight handling
            double newValue = *(double*)&pObjData->dwData;
            FlightController_OnStartFlight(newValue);
        }
        else if (pObjData->dwRequestID == REQUEST_LVAR_NEXTPOI)
        {
            // Delegate next POI handling
            double newValue = *(double*)&pObjData->dwData;
            FlightController_OnNextPoi(newValue);
        }
        else if (pObjData->dwRequestID == REQUEST_LVAR_SPAWN_CUBE)
        {
            // LVar-driven cube spawn: when L:WFP_SPAWN_CUBE becomes 1, request user pos and spawn cube
            double newValue = *(double*)&pObjData->dwData;
            if (newValue == 1.0)
            {
                fprintf(stderr, "[MSFS] L:WFP_SPAWN_CUBE triggered -> requesting user pos.\n");
                SpawnCubeNearAircraft(); // will request user pos via SimConnect and later spawn
            }
        }
        else if (pObjData->dwRequestID == REQUEST_USER_POS_FOR_CUBE)
        {
            // Response with user's aircraft position used to compute cube spawn location
            struct UserPos { double lat; double lon; double alt; double hdg; };
            UserPos* d = (UserPos*)&pObjData->dwData;
            // Delegate geometric computation and spawn to SimObjectManager
            SpawnCubeAtOffsetFromUser(d->lat, d->lon, d->alt, d->hdg, 1.0);
        }
        break;
    }
    default:
        // Unhandled message types are ignored
        break;
    }
}