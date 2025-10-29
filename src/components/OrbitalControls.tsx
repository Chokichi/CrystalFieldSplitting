import React from 'react';
import {
  Box,
  Typography,
  Switch,
  Slider,
  FormControlLabel,
  Paper,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

const orbitalInfo = {
  dz2: { name: 'dz²', description: 'Two lobes along z-axis with torus in xy-plane', color: '#4fc3f7' },
  dx2y2: { name: 'dx²-y²', description: 'Four lobes in xy-plane along x and y axes', color: '#ff6b6b' },
  dxy: { name: 'dxy', description: 'Four lobes in xy-plane rotated 45°', color: '#4fc3f7' },
  dxz: { name: 'dxz', description: 'Lobes in xz-plane', color: '#4fc3f7' },
  dyz: { name: 'dyz', description: 'Lobes in yz-plane', color: '#4fc3f7' }
};

export default function OrbitalControls({
  orbitalStates,
  setOrbitalStates,
  orbitalScales,
  setOrbitalScales,
  isDarkMode = true
}) {
  const handleOrbitalToggle = (orbitalType) => {
    setOrbitalStates(prev => ({
      ...prev,
      [orbitalType]: !prev[orbitalType]
    }));
  };

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
        p: 2,
        background: isDarkMode 
          ? 'linear-gradient(135deg, #1e1e1e 0%, #2d2d2d 100%)'
          : 'linear-gradient(135deg, #ffffff 0%, #f5f5f5 100%)',
        border: isDarkMode ? '1px solid #333' : '1px solid #e0e0e0'
      }}
    >
      <Typography 
        variant="h6" 
        sx={{ 
          mb: 2, 
          color: isDarkMode ? '#90caf9' : '#1976d2', 
          fontWeight: 'bold',
          fontSize: { xs: '1rem', sm: '1.25rem' }
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
          sx={{ 
            '& .MuiAccordionSummary-content': { 
              alignItems: 'center',
              gap: 1
            }
          }}
        >
          <Typography variant="body2" sx={{ color: isDarkMode ? '#90caf9' : '#1976d2', fontWeight: 'bold' }}>
            Individual Orbital Controls
          </Typography>
          <Chip 
            label={`${Object.values(orbitalStates).filter(Boolean).length}/5 visible`}
            size="small"
            sx={{ 
              backgroundColor: isDarkMode ? '#90caf9' : '#1976d2',
              color: 'white',
              fontSize: '0.7rem'
            }}
          />
        </AccordionSummary>
        
        <AccordionDetails sx={{ pt: 1 }}>
          {Object.entries(orbitalInfo).map(([orbitalType, info]) => (
            <Box key={orbitalType} sx={{ mb: 3 }}>
              {/* Orbital Header */}
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between',
                mb: 1
              }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box
                    sx={{
                      width: 12,
                      height: 12,
                      borderRadius: '50%',
                      backgroundColor: info.color,
                    }}
                  />
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      color: isDarkMode ? 'white' : '#212121',
                      fontWeight: 'bold',
                      fontSize: { xs: '0.8rem', sm: '0.9rem' }
                    }}
                  >
                    {info.name}
                  </Typography>
                </Box>
                
                <FormControlLabel
                  control={
                    <Switch
                      checked={orbitalStates[orbitalType]}
                      onChange={() => handleOrbitalToggle(orbitalType)}
                      sx={{
                        '& .MuiSwitch-switchBase.Mui-checked': {
                          color: info.color,
                        },
                        '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                          backgroundColor: info.color,
                        },
                      }}
                    />
                  }
                  label=""
                />
              </Box>

              {/* Orbital Description */}
              <Typography 
                variant="caption" 
                sx={{ 
                  color: isDarkMode ? '#aaa' : '#666',
                  fontSize: { xs: '0.7rem', sm: '0.8rem' },
                  display: 'block',
                  mb: 1
                }}
              >
                {info.description}
              </Typography>

              {/* Scale Slider */}
              {orbitalStates[orbitalType] && (
                <Box sx={{ pl: 1 }}>
                  <Typography 
                    variant="caption" 
                    sx={{ 
                      color: isDarkMode ? '#aaa' : '#666',
                      fontSize: { xs: '0.7rem', sm: '0.8rem' }
                    }}
                  >
                    Scale: {orbitalScales[orbitalType].toFixed(1)}
                  </Typography>
                  <Slider
                    value={orbitalScales[orbitalType]}
                    onChange={(e, value) => handleScaleChange(orbitalType, value)}
                    min={0.2}
                    max={2.0}
                    step={0.1}
                    size="small"
                    sx={{
                      color: info.color,
                      '& .MuiSlider-thumb': {
                        backgroundColor: info.color,
                      },
                      '& .MuiSlider-track': {
                        backgroundColor: info.color,
                      },
                      '& .MuiSlider-rail': {
                        backgroundColor: isDarkMode ? '#444' : '#ddd',
                      },
                    }}
                  />
                </Box>
              )}
            </Box>
          ))}
        </AccordionDetails>
      </Accordion>

      {/* Quick Actions */}
      <Box sx={{ mt: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
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
            fontSize: '0.7rem'
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
            fontSize: '0.7rem'
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
            fontSize: '0.7rem'
          }}
        />
      </Box>
    </Paper>
  );
}
