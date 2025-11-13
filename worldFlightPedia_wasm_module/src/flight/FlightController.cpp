#include "flight/FlightController.h"
#include "core/ModuleContext.h"
#include "simobjects/SimObjectManager.h"
#include "core/Constants.h"

#include <MSFS/MSFS.h>
#include <SimConnect.h>
#include <cstdio>

void FlightController_OnStartFlight(double newValue)
{
    if (newValue != g_lastStartFlight)
    {
        fprintf(stderr, "[MSFS] L:WFP_StartFlight changed -> %.0f\n", newValue);

        if (newValue == 1.0)
        {
            fprintf(stderr, "[MSFS] -> Starting Flight: removing all, spawning first POI.\n");
            RemoveSimObject();
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
            RemoveSimObject();
            g_flightActive = false;
            g_activePoiIndex = -1;
        }

        g_lastStartFlight = newValue;
    }
}


void FlightController_OnNextPoi(double newValue) {
    if (newValue != g_lastNextPoi)
    {
        fprintf(stderr, "[MSFS] L:WFP_NextPoi changed -> %.0f\n", newValue);

        if (g_flightActive && newValue == 1.0)
        {
            g_activePoiIndex++;
            if (g_activePoiIndex < (int)g_poi_coords.size())
            {
                RemoveSimObject();

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
                RemoveSimObject();
                g_flightActive = false;
            }
        }

        g_lastNextPoi = newValue;
    }
}