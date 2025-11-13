#include "simobjects/SimObjectManager.h"
#include "core/ModuleContext.h"
#include "core/Constants.h"
#include <cstdio>
#include <vector>
#include <MSFS/MSFS.h>
#include <SimConnect.h>

void RemoveSimObject()
{
    if (!g_hSimConnect)
        return;

    if (g_lasersIDs.empty())
    {
        fprintf(stderr, "[MSFS] RemoveSimObject: No active 'laser_red' objects to remove.\n");
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

void SpawnSimObject()
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