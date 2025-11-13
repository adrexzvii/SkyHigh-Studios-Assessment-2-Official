#pragma once

// -----------------------------------------------------------------------------
// SIMCONNECT EVENT IDS
// -----------------------------------------------------------------------------
enum eEvents
{
    EVENT_FLIGHT_LOADED = 0, // Triggered when a flight is loaded
    EVENT_SIM_START = 1, // Triggered when the simulator session starts
    EVENT_FLIGHTPLAN_LOADED = 2, // Triggered when a flight plan is loaded
    EVENT_TRIGGER_M = 3, // Custom event mapped to key 'M' (spawn object)
    EVENT_TRIGGER_N = 4  // Custom event mapped to key 'N' (remove object)
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
    REQUEST_ADD_LASERS = 101, // Request ID for creating the object
    REQUEST_REMOVE_LASERS = 201, // Request ID for removing the object
    REQUEST_LVAR_STARTFLIGHT = 1003,
    REQUEST_LVAR_NEXTPOI = 1004,
    REQUEST_LVAR_SPAWN = 1002
};

// -----------------------------------------------------------------------------
// DATA DEFINITIONS CUSTOMS (L:VARS)
// -----------------------------------------------------------------------------
enum eDataDefs
{
    DEFINITION_LVAR_SPAWN = 1001,
    DEFINITION_LVAR_STARTFLIGHT = 1003,
    DEFINITION_LVAR_NEXTPOI = 1004
};