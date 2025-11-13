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
            RemoveSimObject();
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
                    RemoveSimObject();
                }

                g_lastSpawnState = newValue;
            }
        }
        // --- L:WFP_StartFlight ---
        else if (pObjData->dwRequestID == REQUEST_LVAR_STARTFLIGHT)
        {
            double newValue = *(double*)&pObjData->dwData;
            FlightController_OnStartFlight(newValue);
        }

        // --- L:WFP_NextPoi ---
        else if (pObjData->dwRequestID == REQUEST_LVAR_NEXTPOI)
        {
            double newValue = *(double*)&pObjData->dwData;
            FlightController_OnNextPoi(newValue);
        }

        break;
    }
    default:
        // Other message types not explicitly handled
        break;
    }
}