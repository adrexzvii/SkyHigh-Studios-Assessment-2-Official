import React from 'react';
import { Box, Typography } from '@mui/material';

const Map = () => {
  return (
    <Box
      sx={{
        width: '100%',
        height: '100%',
        backgroundColor: '#1a1d23',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      {/* Placeholder para el mapa */}
      <Box
        sx={{
          textAlign: 'center',
          color: 'rgba(255, 255, 255, 0.3)'
        }}
      >
        <Typography variant="h6" sx={{ mb: 1 }}>
          🗺️ Mapa
        </Typography>
        <Typography variant="body2">
          El componente del mapa se integrará aquí
        </Typography>
      </Box>

      {/* Overlay simulado del mapa con puntos */}
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          pointerEvents: 'none',
          background: 'radial-gradient(circle at 30% 40%, rgba(74, 171, 247, 0.1) 0%, transparent 50%), radial-gradient(circle at 70% 60%, rgba(255, 107, 107, 0.1) 0%, transparent 50%)'
        }}
      />
    </Box>
  );
};

export default Map;
