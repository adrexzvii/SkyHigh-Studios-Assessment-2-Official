#pragma once
#include <string>
#include <vector>
#include <utility>

// Parse and return a list of coordinates (lat, lon) from a lightweight JSON-like message
// Input expected shape: { "type": "POI_COORDINATES", "data": [ {"lat": 40.7, "lon": -74.0}, ... ], "count": n }
std::vector<std::pair<double, double>> ParsePoiCoordinates(const std::string& jsonMessage);
