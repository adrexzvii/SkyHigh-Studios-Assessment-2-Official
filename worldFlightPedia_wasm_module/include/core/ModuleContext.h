#pragma once
#include <MSFS/MSFS_WindowsTypes.h>
#include <vector>
#include <utility>

// Declarations (do not define here, only 'extern')
// Global handle to SimConnect connection
extern HANDLE g_hSimConnect;
// Single-object ID used for single-spawn operations
extern DWORD g_lasersID;
// Global list of POI coordinates (latitude, longitude)
extern std::vector<std::pair<double, double>> g_poi_coords;

// Last seen L: var states for change detection
extern double g_lastSpawnState;   // last value of L:spawnAllLasersRed
extern double g_lastStartFlight;  // last value of L:WFP_StartFlight
extern double g_lastNextPoi;      // last value of L:WFP_NextPoi

// Flight and POI state
extern bool   g_flightActive;     // is automated flight active
extern int    g_activePoiIndex;   // index of the currently active POI

// Storage for multi-spawned object ids and base for spawn requests
extern std::vector<DWORD> g_lasersIDs;
extern DWORD g_spawnReqBase;
