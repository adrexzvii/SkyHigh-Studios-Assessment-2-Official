#pragma once

// -----------------------------------------------------------------------------
// SIMCONNECT EVENT IDS
// -----------------------------------------------------------------------------
enum eEvents
{
    EVENT_FLIGHT_LOADED = 0, // Triggered when a flight is loaded
    EVENT_SIM_START = 1,     // Triggered when the simulator session starts
    EVENT_FLIGHTPLAN_LOADED = 2, // Triggered when a flight plan is loaded
    EVENT_TRIGGER_M = 3,     // Custom event mapped to key 'M' (spawn object)
    EVENT_TRIGGER_N = 4      // Custom event mapped to key 'N' (remove object)
};

// -----------------------------------------------------------------------------
// NOTIFICATION GROUPS
// -----------------------------------------------------------------------------
enum eGroups {
    GROUP_INPUT = 0
};

// -----------------------------------------------------------------------------
// INPUT GROUPS
// -----------------------------------------------------------------------------
enum eInputs {
    INPUT_GROUP = 0
};

// -----------------------------------------------------------------------------
// REQUEST IDS
// -----------------------------------------------------------------------------
enum eRequests {
    REQUEST_ADD_LASERS = 101,        // Request ID for creating laser objects
    REQUEST_REMOVE_LASERS = 201,     // Request ID for removing laser objects
    REQUEST_LVAR_SPAWN = 1002,       // L:spawnAllLasersRed
    REQUEST_LVAR_STARTFLIGHT = 1003, // L:WFP_StartFlight
    REQUEST_LVAR_NEXTPOI = 1004,     // L:WFP_NextPoi
    REQUEST_LVAR_SPAWN_CUBE = 1005,  // L:WFP_SPAWN_CUBE
    REQUEST_USER_POS_FOR_CUBE = 301, // User position sample for cube spawn
    REQUEST_ADD_CUBE = 401           // SimObject creation for cube
};

// -----------------------------------------------------------------------------
// DATA DEFINITIONS (L:Vars / Sim Vars)
// -----------------------------------------------------------------------------
enum eDataDefs
{
    DEFINITION_LVAR_SPAWN = 1001,
    DEFINITION_LVAR_STARTFLIGHT = 1003,
    DEFINITION_LVAR_NEXTPOI = 1004,
    DEFINITION_LVAR_SPAWN_CUBE = 1005, // L:WFP_SPAWN_CUBE
    DEFINITION_USER_POSITION = 2001    // User position (lat/lon/alt/heading)
};