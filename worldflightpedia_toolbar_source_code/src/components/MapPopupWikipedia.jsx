import { useState, useEffect } from "react";
import { Card, CardMedia, CardContent, Typography, Button, Box, Collapse, IconButton, CircularProgress } from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import RemoveIcon from "@mui/icons-material/Remove";

// Cálculo de distancia (Haversine)
function haversine(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

export default function MapPopupWikipedia({ poi, userCoords, onFocusPoi }) {
  const [expanded, setExpanded] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [details, setDetails] = useState(null);
  const [distance, setDistance] = useState(null);
  const [loading, setLoading] = useState(false);

  // Robust title/name extraction with common fallbacks
  const poiTitle =
    (poi && (
      poi.title ||
      poi.name ||
      poi.display_name ||
      (poi.properties && (poi.properties.title || poi.properties.name)) ||
      (poi.tags && (poi.tags.name || poi.tags.title)) ||
      poi.wikipedia_title ||
      poi.label ||
      (typeof poi === "string" ? poi : null)
    )) || "Sin nombre";

  useEffect(() => {
    if (!poi) return;

    const fetchDetails = async () => {
      try {
        setLoading(true);
        // Use the resolved poiTitle for the Wikipedia request
        const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(poiTitle)}`;
        const res = await fetch(url);
        const data = await res.json();
        // If Wikipedia returns a "title" different from requested, keep it; otherwise fallback
        setDetails(data);

        if (userCoords?.lat && userCoords?.lon && poi?.lat && poi?.lon) {
          const d = haversine(userCoords.lat, userCoords.lon, poi.lat, poi.lon);
          setDistance(d.toFixed(2));
        }
      } catch (err) {
        console.error("Error cargando detalles:", err);
        setDetails(null);
      } finally {
        setLoading(false);
      }
    };

    fetchDetails();
    
  }, [poi, poiTitle, userCoords]);

  if (!poi) return null;

  if (minimized) {
    return (
      <Card
        sx={{
          position: "absolute",
          top: 130,
          left: 0,
          width: 260,
          boxShadow: 4,
          borderRadius: 2,
        }}
      >
        <Box
          sx={{
            p: 1,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          {/* Mostrar nombre usando color del tema */}
          <Typography fontWeight={600} sx={{ color: "text.primary" }}>
            {poiTitle}
          </Typography>
          <IconButton size="small" onClick={() => setMinimized(false)}>
            <ExpandMoreIcon />
          </IconButton>
        </Box>
      </Card>
    );
  }
  
  return (
    <Card
      sx={{
        position: "absolute",
        top: 130,
        left: 0,
        zIndex: 10,
        width: 250,
        boxShadow: 6,
        borderRadius: 2,
      }}
    >
      {/* preferir imagen de details si existe */}
      {(details?.thumbnail?.source || poi.image) && (
        <CardMedia
          component="img"
          height="140"
          image={details?.thumbnail?.source || poi.image}
          alt={poiTitle}
        />
      )}
      <CardContent>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          {/* Mostrar nombre con color del tema y peso */}
          <Typography variant="h6" sx={{ color: "text.primary", fontWeight: 600 }}>
            {poiTitle}
          </Typography>
          <IconButton size="small" onClick={() => setMinimized(true)}>
            <RemoveIcon />
          </IconButton>
        </Box>

        {distance && (
          <Typography variant="body2" color="text.secondary">
            Distancia: {distance} km
          </Typography>
        )}

        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", p: 2 }}>
            <CircularProgress size={24} />
          </Box>
        ) : (
          <>
            {/* Quitar la estrella y no mostrar rating si no existe */}
            <Typography variant="body2" color="text.secondary">
              {poi.rating ? `${poi.rating} · ` : ""}{poi.category}
            </Typography>
            <Collapse in={expanded} timeout="auto" unmountOnExit>
              <Typography
                variant="caption"
                display="block"
                sx={{ my: 1 }}
              >
                {details?.extract || "Sin descripción disponible."}
              </Typography>
              {/* {details?.thumbnail?.source && (
                <img
                  src={details.thumbnail.source}
                  alt={poiTitle}
                  style={{ width: "100%", borderRadius: 6, marginTop: 4 }}
                />
              )} */}
              <Button
                size="small"
                variant="contained"
                onClick={() => { if (typeof onFocusPoi === "function") onFocusPoi(poi); }} // <-- usar focusOnPoi
                sx={{ mt: 1 }}
              >
                Ver en mapa
              </Button>
            </Collapse>
            <Button
              size="small"
              variant="outlined"
              onClick={() => setExpanded(!expanded)}
              sx={{ mt: 1 }}
              startIcon={expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            >
              {expanded ? "Ver menos" : "Ver más"}
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}
