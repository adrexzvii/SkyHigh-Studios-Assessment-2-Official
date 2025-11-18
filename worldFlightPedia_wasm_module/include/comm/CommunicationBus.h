#pragma once

// Declaration (no longer static)
void OnMessageFromJS(const char* buf, unsigned int bufSize, void* ctx);
// Initialize the MSFS Communication Bus (CommBus API)
void CommBus_Initialize();

// Clean up / shut down the Communication Bus
void CommBus_Shutdown();