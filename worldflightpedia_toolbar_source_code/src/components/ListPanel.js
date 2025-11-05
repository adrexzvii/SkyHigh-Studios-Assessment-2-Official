import React from 'react';
import { Box, Typography } from '@mui/material';

const ListPanel = () => {
  return (
    <Box
      sx={{
        width: '100%',
        height: '100%',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        borderRight: '1px solid rgba(255, 255, 255, 0.1)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}
    >
      {/* Header list panel */}
      <Box
        sx={{
          padding: '16px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
        }}
      >
        <Typography
          variant="subtitle1"
          sx={{
            fontWeight: 600,
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            gap: 1
          }}
        >
          <span style={{ color: '#4dabf7' }}>📋</span> PList Panel
        </Typography>
      </Box>

      {/* Content panel - scrollable area for the POI list */}
      <Box
        sx={{
          flex: 1,
          overflowY: 'auto',
          padding: '16px',
          '&::-webkit-scrollbar': {
            width: '8px'
          },
          '&::-webkit-scrollbar-track': {
            backgroundColor: 'rgba(0, 0, 0, 0.2)'
          },
          '&::-webkit-scrollbar-thumb': {
            backgroundColor: 'rgba(255, 255, 255, 0.3)',
            borderRadius: '4px'
          }
        }}
      >
        <Typography
          variant="body2"
          sx={{ color: 'rgba(255, 255, 255, 0.5)' }}
        >
          POI list will appear here
        </Typography>
      </Box>
    </Box>
  );
};

export default ListPanel;
