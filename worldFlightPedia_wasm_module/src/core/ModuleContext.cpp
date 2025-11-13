#include <vector>
#include "core/ModuleContext.h"
#include <MSFS/MSFS_WindowsTypes.h>
#include <SimConnect.h>


HANDLE g_hSimConnect = 0;
DWORD g_lasersID = SIMCONNECT_OBJECT_ID_USER;
std::vector<std::pair<double, double>> g_poi_coords;

double g_lastSpawnState = -1.0;
double g_lastStartFlight = -1.0;
double g_lastNextPoi = -1.0;
bool   g_flightActive = false;
int    g_activePoiIndex = -1;

std::vector<DWORD> g_lasersIDs;
DWORD g_spawnReqBase = 3000;
