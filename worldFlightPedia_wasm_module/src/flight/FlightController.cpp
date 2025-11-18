#include "flight/FlightController.h"
#include "core/ModuleContext.h"
#include "simobjects/SimObjectManager.h"
#include "core/Constants.h"

#include <MSFS/MSFS.h>
#include <MSFS/Legacy/gauges.h>
#include <SimConnect.h>
#include <cstdio>
#include <string>
#include <ctime>

// -----------------------------------------------------------------------------
// Flight controller
// - Handles L:Vars related to automated flight/POI navigation
// - Uses globals from ModuleContext (g_poi_coords, g_lastStartFlight, g_flightActive, g_activePoiIndex)
// - Spawns/removes SimObjects via SimConnect and SimObjectManager helpers
// -----------------------------------------------------------------------------

// Static variables to track NextPoi sound reset timing
// Using absolute timestamp for compatibility
static time_t g_nextPoiSoundResetTimestamp = 0;
static bool g_nextPoiSoundActive = false;

/**
 * Helper function to execute calculator code (for setting L:Vars)
 * Uses execute_calculator_code from MSFS Gauge API
 */
static void ExecuteCalculatorCode(const char* code)
{
    if (!code) return;
    
    // execute_calculator_code is the MSFS Gauge API function to run RPN/calculator strings
    // It's commonly used to set L:Vars from WASM
    execute_calculator_code(code, nullptr, nullptr, nullptr);
    
    fprintf(stderr, "[MSFS] Executed calculator code: %s\n", code);
}

/**
 * Called periodically to check if NextPoi sound should be reset
 * This gets called from the dispatch handler on every SimConnect message
 */
void FlightController_Update()
{
    if (g_nextPoiSoundActive)
    {
        // Get current time
        time_t now = time(nullptr);
        
        // Check if 2 seconds have passed
        if (now >= g_nextPoiSoundResetTimestamp)
        {
            // Reset the sound L:Var to 0
            ExecuteCalculatorCode("0 (>L:WFP_NEXT_POI_SOUND)");
            g_nextPoiSoundActive = false;
            fprintf(stderr, "[MSFS] NextPoi sound reset to 0 after 4 seconds.\n");
        }
    }
}

/**
 * Called when the local variable L:WFP_StartFlight changes.
 * newValue: 1.0 => start flight (spawn first POI), 0.0 => stop flight (remove all objects)
 */
void FlightController_OnStartFlight(double newValue)
{
    if (newValue != g_lastStartFlight)
    {
        fprintf(stderr, "[MSFS] L:WFP_StartFlight changed -> %.0f\n", newValue);

        if (newValue == 1.0)
        {
            // Start flight: clear any previously spawned objects then spawn the first POI
            fprintf(stderr, "[MSFS] -> Starting Flight: removing all, spawning first POI.\n");
            RemoveSimObject();
            g_activePoiIndex = 0;
            g_flightActive = true;

            if (!g_poi_coords.empty())
            {
                double lat = g_poi_coords[0].first;
                double lon = g_poi_coords[0].second;

                // Prepare SimConnect init position structure for terrain-level spawn
                SIMCONNECT_DATA_INITPOSITION pos = {};
                pos.Latitude = lat;
                pos.Longitude = lon;
                pos.Altitude = 0; // 0 means use terrain elevation when OnGround=1
                pos.OnGround = 1;

                // Request creation of a 'laser_red' SimObject at the POI
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
            // Stop flight: remove all spawned objects and reset state
            fprintf(stderr, "[MSFS] -> Flight stopped, removing all objects.\n");
            RemoveSimObject();
            g_flightActive = false;
            g_activePoiIndex = -1;
        }

        // Store last observed value for change detection (rising/falling edges)
        g_lastStartFlight = newValue;
    }
}


/**
 * Called when the local variable L:WFP_NextPoi changes.
 * newValue: value becomes 1.0 to advance to next POI (if flight is active)
 */
void FlightController_OnNextPoi(double newValue) {
    if (newValue != g_lastNextPoi)
    {
        fprintf(stderr, "[MSFS] L:WFP_NextPoi changed -> %.0f\n", newValue);

        // Only react to NextPoi if the flight is currently active
        if (g_flightActive && newValue == 1.0)
        {
            g_activePoiIndex++;
            if (g_activePoiIndex < (int)g_poi_coords.size())
            {
                // Remove previous POI objects then spawn the next one
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
                
                // ---------------------------------------------------------------
                // Trigger NextPoi sound: set L:WFP_NEXT_POI_VOLUME to 100 and
                // L:WFP_NEXT_POI_SOUND to 1, then schedule reset to 0 after 2s
                // ---------------------------------------------------------------
                ExecuteCalculatorCode("100 (>L:WFP_NEXT_POI_VOLUME)");
                ExecuteCalculatorCode("1 (>L:WFP_NEXT_POI_SOUND)");
                
                // Schedule sound reset for 2 seconds from now (using absolute timestamp)
                g_nextPoiSoundResetTimestamp = time(nullptr) + 4; // current time + 4 seconds
                g_nextPoiSoundActive = true;
                
                fprintf(stderr, "[MSFS] NextPoi sound triggered, will reset in 4 seconds.\n");
            }
            else
            {
                // Reached end of POI list: cleanup and deactivate flight
                fprintf(stderr, "[MSFS] End of POI list reached.\n");
                RemoveSimObject();
                g_flightActive = false;
            }
        }

        // Update last seen NextPoi value
        g_lastNextPoi = newValue;
    }
}