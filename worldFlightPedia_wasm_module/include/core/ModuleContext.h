#pragma once
#include <MSFS/MSFS_WindowsTypes.h>
#include <vector>
#include <utility>

// Declaraciones (no definir aquí, sólo 'extern')
extern HANDLE g_hSimConnect;
extern DWORD g_lasersID;
extern std::vector<std::pair<double, double>> g_poi_coords;

extern double g_lastSpawnState;
extern double g_lastStartFlight;
extern double g_lastNextPoi;
extern bool   g_flightActive;
extern int    g_activePoiIndex;

extern std::vector<DWORD> g_lasersIDs;
extern DWORD g_spawnReqBase;
