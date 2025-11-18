#pragma once

/**
 * SimConnectManager
 * -----------------
 * Initializes and tears down the SimConnect connection used by the WASM module.
 * Responsibilities:
 *  - Open and close the SimConnect handle
 *  - Register system events and input mappings
 *  - Define and request data definitions for L:Vars
 *  - Install the dispatch callback that routes incoming SimConnect messages
 */

// Initializes SimConnect, events, input groups, LVAR monitoring, etc.
// Returns true on success, false on failure.
bool SimConnectManager_Initialize();

// Cleans up and closes SimConnect
void SimConnectManager_Shutdown();
