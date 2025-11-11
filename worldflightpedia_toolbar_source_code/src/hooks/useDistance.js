import { useEffect, useState } from "react";
import { haversine } from "../utils/haversine";

export function useDistance(userCoords, poi) {
  const [distance, setDistance] = useState(null);

  useEffect(() => {
    if (userCoords?.lat && poi?.lat) {
      const d = haversine(userCoords.lat, userCoords.lon, poi.lat, poi.lon);
      setDistance(d.toFixed(2));
    }
  }, [userCoords, poi]);

  return distance;
}
