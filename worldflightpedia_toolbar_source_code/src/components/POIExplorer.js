import React from 'react';
import { Box, Grid } from '@mui/material';
import TopBar from './TopBar';
import ListPanel from './ListPanel';
import Map from './Map';
import POICard from './POICard';

const POIExplorer = () => {
  return (
    <Box
      sx={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: '#0b0f13',
        color: 'white',
        overflow: 'hidden'
      }}
    >
      {/* TopBar */}
      <Box sx={{ flexShrink: 0 }}>
        <TopBar />
      </Box>

      {/* principal container with Grid for ListPanel and Map */}
      <Box sx={{ flex: 1, overflow: 'hidden' }}>
        <Grid
          container
          sx={{ height: '100%', width: '100%' }}
          spacing={0}
        >
          {/* List Panel - Left Column */}
          <Grid
            item
            xs={12}
            md={4}
            lg={3}
            sx={{
              height: '100%',
              overflow: 'hidden'
            }}
          >
            <ListPanel />
          </Grid>

          {/* Map and POICard - Right Column */}
          <Grid
            item
            xs={12}
            md={8}
            lg={9}
            sx={{
              height: '100%',
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            {/* Background map */}
            <Map />

            {/* POICard anchored over the map (bottom right) */}
            <Box
              sx={{
                position: 'absolute',
                bottom: 16,
                right: 16,
                zIndex: 1000,
                maxWidth: '400px',
                width: '90%'
              }}
            >
              <POICard />
            </Box>
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
};

export default POIExplorer;
