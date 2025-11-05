import React from 'react';
import { Box, Typography, Button } from '@mui/material';

const TopBar = () => {
  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '16px 24px',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        backgroundColor: 'rgba(0, 0, 0, 0.3)'
      }}
    >
      {/* Título */}
      <Typography
        variant="h6"
        sx={{
          fontWeight: 600,
          color: 'white'
        }}
      >
        POI Explorer
      </Typography>

      {/* Botones de acción */}
      <Box sx={{ display: 'flex', gap: 2 }}>
        <Button
          variant="text"
          sx={{
            color: '#ff6b6b',
            textTransform: 'none',
            fontWeight: 500
          }}
        >
          [Importar]
        </Button>
        <Button
          variant="text"
          sx={{
            color: '#ff6b6b',
            textTransform: 'none',
            fontWeight: 500
          }}
        >
          [Exportar]
        </Button>
        <Button
          variant="text"
          sx={{
            color: '#ff6b6b',
            textTransform: 'none',
            fontWeight: 500
          }}
        >
          [Ayuda]
        </Button>
      </Box>
    </Box>
  );
};

export default TopBar;
