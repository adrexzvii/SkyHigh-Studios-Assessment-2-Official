#pragma once

// Interfaz pública del Flight Controller

// Se llama cuando cambia el L:WFP_StartFlight (0 → stop, 1 → start)
void FlightController_OnStartFlight(double newValue);

// Se llama cuando cambia el L:WFP_NextPoi (1 → avanzar al siguiente POI)
void FlightController_OnNextPoi(double newValue);
