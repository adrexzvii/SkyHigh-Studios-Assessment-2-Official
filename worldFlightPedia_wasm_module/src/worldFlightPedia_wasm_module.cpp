// -----------------------------------------------------------------------------
// worldFlightPedia_wasm_module.cpp
// Context: Standalone WASM SimConnect module for MSFS to inject / remove SimObjects and using MSFS Communication API to interact Data with "worldFlightPedia JavaScript Panel"
// -----------------------------------------------------------------------------
#include <string>
#include <vector>
#include <utility>
#include <cstdio>
#include <cstring>
#include <cstdlib>
#include "core/ModuleContext.h"
#include <MSFS/MSFS.h>
#include <MSFS/MSFS_CommBus.h>
#include <MSFS/MSFS_WindowsTypes.h>
#include <SimConnect.h>
#include "worldFlightPedia_wasm_module.h"
#include "comm/CommunicationBus.h"
#include "core/Constants.h"
#include "simobjects/SimObjectManager.h"
#include "dispatch/DispatchHandler.h"
#include "simconnect/SimConnectManager.h"
#include "flight/FlightController.h"

// -----------------------------------------------------------------------------
// MODULE INITIALIZATION
// Called automatically when the WASM module is loaded by the simulator
// -----------------------------------------------------------------------------
extern "C" MODULE_EXPORT MSFS_CALLBACK void module_init(void)
{

    // ----------------------------------------------------
    // 1) Initialize SimConnect via the Manager
    // ----------------------------------------------------
    if (!SimConnectManager_Initialize())
    {
        fprintf(stderr, "[MSFS] ERROR: SimConnectManager_Initialize() failed!\n");
        return;
    }

    // ----------------------------------------------------
    // 2) Initialize the Communication Bus
    // ----------------------------------------------------
    CommBus_Initialize();

    // ----------------------------------------------------
    // 3) Notify JS panel that WASM is ready
    // ----------------------------------------------------
    const char* startup = "WASM ready";
    fsCommBusCall("OnMessageFromWasm",
        startup,
        (unsigned int)std::strlen(startup),
        FsCommBusBroadcast_JS);

    fprintf(stderr, "[MSFS] module_init completed.\n");
}

// -----------------------------------------------------------------------------
// MODULE DEINITIALIZATION
// Called automatically when the simulator unloads the WASM module
// -----------------------------------------------------------------------------
extern "C" MODULE_EXPORT MSFS_CALLBACK void module_deinit(void)
{
    // Shut down Communication Bus
    CommBus_Shutdown();

    // Shut down SimConnect
    SimConnectManager_Shutdown();

    fprintf(stderr, "[MSFS] module_deinit completed.\n");
}
