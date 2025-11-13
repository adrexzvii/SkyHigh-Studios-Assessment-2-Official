#pragma once
#include <string>
#include <vector>
#include <utility>

// Devuelve una lista de coordenadas (lat, lon) parseadas desde el mensaje JSON “manual”
std::vector<std::pair<double, double>> ParsePoiCoordinates(const std::string& jsonMessage);
