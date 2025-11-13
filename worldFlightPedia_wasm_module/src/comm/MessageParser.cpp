#include <string>
#include <vector>
#include <utility>
#include <cstring>
#include <cstdlib>
#include <cstdio>
#include "comm/MessageParser.h"

std::vector<std::pair<double, double>> ParsePoiCoordinates(const std::string& received)
{
    std::vector<std::pair<double, double>> result;

    // Quick check for message type
    if (received.find("POI_COORDINATES") == std::string::npos)
        return result;

    size_t dataPos = received.find("\"data\"");
    if (dataPos == std::string::npos)
        return result;

    size_t bracket = received.find('[', dataPos);
    if (bracket == std::string::npos)
        return result;

    const char* cstr = received.c_str();
    const char* ptr = cstr + bracket + 1;
    char* endptr = nullptr;

    while (true)
    {
        const char* latKey = strstr(ptr, "\"lat\"");
        if (!latKey) break;

        const char* colon = strchr(latKey, ':');
        if (!colon) break;

        double lat = strtod(colon + 1, &endptr);
        if (endptr == colon + 1) break;

        const char* lonKey = strstr(endptr, "\"lon\"");
        if (!lonKey) break;

        const char* colonLon = strchr(lonKey, ':');
        if (!colonLon) break;

        double lon = strtod(colonLon + 1, &endptr);
        if (endptr == colonLon + 1) break;

        result.push_back(std::make_pair(lat, lon));
        ptr = endptr;
    }

    return result;
}
