#pragma once

// Utilities to manage laser_red SimObjects
void SpawnSimObject();
void RemoveSimObject();

// Spawns a cube 1 meter to the right of the user's aircraft
void SpawnCubeNearAircraft();

// Spawn a cube applying a rightward offset (in meters) from a given user position
void SpawnCubeAtOffsetFromUser(double latDeg, double lonDeg, double altMeters, double headingTrueDeg, double rightMeters);
