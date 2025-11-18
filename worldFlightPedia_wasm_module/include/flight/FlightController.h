#pragma once

// Public interface of the Flight Controller

// Called when L:WFP_StartFlight changes (0 -> stop, 1 -> start)
void FlightController_OnStartFlight(double newValue);

// Called when L:WFP_NextPoi changes (1 -> advance to next POI)
void FlightController_OnNextPoi(double newValue);

// Called periodically to handle time-based operations (e.g., sound reset timers)
// Should be called from the dispatch callback to check if timers have expired
void FlightController_Update();
