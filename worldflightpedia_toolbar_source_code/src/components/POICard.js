import React from 'react';
import { Box, Card, CardContent, Typography, IconButton } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

const POICard = () => {
  return (
    <Card
      sx={{
        backgroundColor: 'rgba(11, 15, 19, 0.95)',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '8px',
        color: 'white',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)'
      }}
    >
      <CardContent sx={{ padding: '16px', '&:last-child': { paddingBottom: '16px' } }}>
        {/* Header of the card with close button */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            mb: 2
          }}
        >
          <Typography
            variant="h6"
            sx={{
              fontWeight: 600,
              color: 'white'
            }}
          >
            POI Card (anchored)
          </Typography>
          <IconButton
            size="small"
            sx={{
              color: 'rgba(255, 255, 255, 0.7)',
              '&:hover': {
                color: 'white',
                backgroundColor: 'rgba(255, 255, 255, 0.1)'
              }
            }}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>

        {/* Example content */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          <Typography
            variant="body2"
            sx={{ color: 'rgba(255, 255, 255, 0.5)' }}
          >
            The detailed information of the selected POI will appear here
          </Typography>
        </Box>

        {/* Action buttons example */}
        <Box
          sx={{
            display: 'flex',
            gap: 1,
            mt: 2,
            pt: 2,
            borderTop: '1px solid rgba(255, 255, 255, 0.1)'
          }}
        >
          <Typography
            variant="caption"
            sx={{
              color: '#4dabf7',
              cursor: 'pointer',
              '&:hover': { textDecoration: 'underline' }
            }}
          >
            [Navigate]
          </Typography>
          <Typography
            variant="caption"
            sx={{
              color: '#4dabf7',
              cursor: 'pointer',
              '&:hover': { textDecoration: 'underline' }
            }}
          >
            [Edit]
          </Typography>
          <Typography
            variant="caption"
            sx={{
              color: '#ff6b6b',
              cursor: 'pointer',
              '&:hover': { textDecoration: 'underline' }
            }}
          >
            [Delete]
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
};

export default POICard;
