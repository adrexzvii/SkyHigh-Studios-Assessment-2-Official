#include <string>
#include <vector>
#include <cstdio>
#include <cstring>
#include <cstdlib>
#include "comm/MessageParser.h"
#include <MSFS/MSFS_CommBus.h>

#include "core/ModuleContext.h"   // for g_poi_coords
#include "comm/CommunicationBus.h"

// -----------------------------------------------------------
// Initialize the CommBus and register the JS -> WASM listener
// -----------------------------------------------------------
void CommBus_Initialize()
{
    std::fprintf(stderr, "[MSFS] CommBus initialization...\n");

    // Register the handler exactly as in the original code
    fsCommBusRegister("OnMessageFromJs", OnMessageFromJS, nullptr);

    // Send the startup message (moved here)
    const char* startup = "WASM ready";
    fsCommBusCall("OnMessageFromWasm",
        startup,
        (unsigned int)std::strlen(startup),
        FsCommBusBroadcast_JS);

    std::fprintf(stderr, "[MSFS] CommBus initialized and startup sent.\n");
}


// -----------------------------------------------------------
// Shutdown the CommBus (same behaviour as original module_deinit)
// -----------------------------------------------------------
void CommBus_Shutdown()
{
    fsCommBusUnregisterAll();
    std::fprintf(stderr, "[MSFS] CommBus shutdown, handlers unregistered.\n");
}

void OnMessageFromJS(const char* buf, unsigned int bufSize, void* ctx)
{
    std::string received(buf, bufSize);
    std::fprintf(stderr, "[MSFS] Received from JS: %s\n", received.c_str());

    // Try to parse a simple JSON structure for POI_COORDINATES without pulling in a full JSON library
    // Expected shape:
    // { "type": "POI_COORDINATES", "data": [ {"lat": 40.7, "lon": -74.0}, ... ], "count": 2 }

    // Parse POIs using the dedicated parser
        auto parsed = ParsePoiCoordinates(received);

    // Replace global vector with parsed data
    g_poi_coords = parsed;

    // Logs
    fprintf(stderr, "[MSFS] Parsed %zu POI coordinates from JS\n", g_poi_coords.size());
    for (size_t i = 0; i < g_poi_coords.size(); ++i)
    {
        fprintf(stderr, "[MSFS] POI[%zu] = lat: %.6f, lon: %.6f\n",
            i, g_poi_coords[i].first, g_poi_coords[i].second);
    }

    // Send simple acknowledgement back to JS (original behavior)
    std::string reply;
    reply.append("ack: ");
    reply += received;
    fsCommBusCall("OnMessageFromWasm", reply.c_str(), (unsigned int)reply.size(), FsCommBusBroadcast_JS);
    std::fprintf(stderr, "[MSFS] Sent ack to JS: %s\n", reply.c_str());
}