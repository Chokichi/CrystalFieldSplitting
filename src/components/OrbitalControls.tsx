import React from 'react';
import {
  Box,
  Typography,
  Slider,
  Paper,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

const orbitalInfo = {
  dz2: { name: 'dz²', color: '#4fc3f7' },
  dx2y2: { name: 'dx²-y²', color: '#ff6b6b' },
  dxy: { name: 'dxy', color: '#4fc3f7' },
  dxz: { name: 'dxz', color: '#4fc3f7' },
  dyz: { name: 'dyz', color: '#4fc3f7' }
};

export default function OrbitalControls({
  orbitalStates,
  setOrbitalStates,
  orbitalScales,
  setOrbitalScales,
  isDarkMode = true
}) {
  const handleScaleChange = (orbitalType, value) => {
    setOrbitalScales(prev => ({
      ...prev,
      [orbitalType]: value
    }));
  };

  return (
    <Paper 
      elevation={2} 
      sx={{ 
        p: 1.5,
        background: isDarkMode 
          ? 'linear-gradient(135deg, #1e1e1e 0%, #2d2d2d 100%)'
          : 'linear-gradient(135deg, #ffffff 0%, #f5f5f5 100%)',
        border: isDarkMode ? '1px solid #333' : '1px solid #e0e0e0'
      }}
    >
      <Typography 
        variant="h6" 
        sx={{ 
          mb: 1, 
          color: isDarkMode ? '#90caf9' : '#1976d2', 
          fontWeight: 'bold',
          fontSize: { xs: '0.9rem', sm: '1.1rem' }
        }}
      >
        D-Orbital Controls
      </Typography>

      <Accordion 
        defaultExpanded 
        sx={{ 
          background: 'rgba(144, 202, 249, 0.1)',
          border: '1px solid rgba(144, 202, 249, 0.3)',
          '&:before': { display: 'none' }
        }}
      >
        <AccordionSummary 
          expandIcon={<ExpandMoreIcon sx={{ color: isDarkMode ? '#90caf9' : '#1976d2' }} />}
        >
          <Typography variant="body2" sx={{ color: isDarkMode ? '#90caf9' : '#1976d2', fontWeight: 'bold' }}>
            Orbital Scales
          </Typography>
        </AccordionSummary>
        
        <AccordionDetails sx={{ pt: 0.5 }}>
          {Object.entries(orbitalInfo).map(([orbitalType, info]) => (
            <Box 
              key={orbitalType} 
              sx={{ 
                mb: 1,
                display: 'flex',
                alignItems: 'center',
                gap: 1.5
              }}
            >
              {/* Orbital Name */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, minWidth: '50px' }}>
                <Box
                  sx={{
                    width: 10,
                    height: 10,
                    borderRadius: '50%',
                    backgroundColor: info.color,
                  }}
                />
                <Typography 
                  variant="body2" 
                  sx={{ 
                    color: isDarkMode ? 'white' : '#212121',
                    fontWeight: 'bold',
                    fontSize: { xs: '0.75rem', sm: '0.8rem' }
                  }}
                >
                  {info.name}
                </Typography>
              </Box>

              {/* Scale Value */}
              <Typography 
                variant="caption" 
                sx={{ 
                  color: isDarkMode ? '#aaa' : '#666',
                  fontSize: '0.7rem',
                  minWidth: '45px',
                  textAlign: 'right'
                }}
              >
                {orbitalScales[orbitalType].toFixed(1)}
              </Typography>

              {/* Scale Slider */}
              <Slider
                value={orbitalScales[orbitalType]}
                onChange={(e, value) => handleScaleChange(orbitalType, value)}
                min={0.2}
                max={2.0}
                step={0.1}
                size="small"
                sx={{
                  flex: 1,
                  color: info.color,
                  height: 4,
                  '& .MuiSlider-thumb': {
                    backgroundColor: info.color,
                    width: 12,
                    height: 12,
                  },
                  '& .MuiSlider-track': {
                    backgroundColor: info.color,
                    height: 2,
                  },
                  '& .MuiSlider-rail': {
                    backgroundColor: isDarkMode ? '#444' : '#ddd',
                    height: 2,
                  },
                }}
              />
            </Box>
          ))}
        </AccordionDetails>
      </Accordion>

      {/* Quick Actions */}
      <Box sx={{ mt: 1.5, display: 'flex', gap: 0.75, flexWrap: 'wrap' }}>
        <Chip
          label="Show All"
          size="small"
          onClick={() => {
            const allOn = Object.keys(orbitalStates).reduce((acc, key) => {
              acc[key] = true;
              return acc;
            }, {});
            setOrbitalStates(allOn);
          }}
          sx={{
            backgroundColor: '#4caf50',
            color: 'white',
            fontSize: '0.65rem',
            height: 24
          }}
        />
        <Chip
          label="Hide All"
          size="small"
          onClick={() => {
            const allOff = Object.keys(orbitalStates).reduce((acc, key) => {
              acc[key] = false;
              return acc;
            }, {});
            setOrbitalStates(allOff);
          }}
          sx={{
            backgroundColor: '#f44336',
            color: 'white',
            fontSize: '0.65rem',
            height: 24
          }}
        />
        <Chip
          label="Reset Scales"
          size="small"
          onClick={() => {
            const resetScales = {
              dz2: 0.6,
              dx2y2: 1.0,
              dxy: 1.0,
              dxz: 1.0,
              dyz: 1.0
            };
            setOrbitalScales(resetScales);
          }}
          sx={{
            backgroundColor: '#ff9800',
            color: 'white',
            fontSize: '0.65rem',
            height: 24
          }}
        />
      </Box>
    </Paper>
  );
}
