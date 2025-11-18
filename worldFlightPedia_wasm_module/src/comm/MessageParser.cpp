#include <string>
#include <vector>
#include <utility>
#include <cstring>
#include <cstdlib>
#include <cstdio>
#include "comm/MessageParser.h"

// -----------------------------------------------------------------------------
// MessageParser
// Lightweight parser for incoming JS -> WASM messages.
// NOTE: This is intentionally minimal to avoid pulling a full JSON library into
// the WASM build. It only extracts "lat"/"lon" numeric pairs when the
// message contains the marker "POI_COORDINATES" and a "data" array.
//
// Limitations / assumptions:
// - Expects numbers in plain decimal form (no exponential formats guaranteed)
// - No strict JSON validation is performed; malformed input will be skipped
// - For production use consider replacing with a small JSON parser or
//   performing validation on the JS side before sending.
// -----------------------------------------------------------------------------

std::vector<std::pair<double, double>> ParsePoiCoordinates(const std::string& received)
{
    std::vector<std::pair<double, double>> result;

    // Quick check for message type to avoid unnecessary scanning
    if (received.find("POI_COORDINATES") == std::string::npos)
        return result;

    // Find the "data" array open bracket
    size_t dataPos = received.find("\"data\"");
    if (dataPos == std::string::npos)
        return result;

    size_t bracket = received.find('[', dataPos);
    if (bracket == std::string::npos)
        return result;

    const char* cstr = received.c_str();
    const char* ptr = cstr + bracket + 1;
    char* endptr = nullptr;

    // Iterate looking for "lat" then "lon" keys and parse following numbers
    while (true)
    {
        const char* latKey = strstr(ptr, "\"lat\"");
        if (!latKey) break;

        const char* colon = strchr(latKey, ':');
        if (!colon) break;

        double lat = strtod(colon + 1, &endptr);
        if (endptr == colon + 1) break; // no valid number parsed

        const char* lonKey = strstr(endptr, "\"lon\"");
        if (!lonKey) break;

        const char* colonLon = strchr(lonKey, ':');
        if (!colonLon) break;

        double lon = strtod(colonLon + 1, &endptr);
        if (endptr == colonLon + 1) break;

        // Append parsed coordinate pair
        result.push_back(std::make_pair(lat, lon));

        // Advance pointer to continue parsing subsequent entries
        ptr = endptr;
    }

    return result;
}
