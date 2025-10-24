import React from 'react';
import {
  Box,
  Typography,
  Slider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Paper,
  Chip,
  Divider
} from '@mui/material';
import { motion } from 'framer-motion';

export default function ControlsPanel({
  geometryType,
  setGeometryType,
  distance,
  setDistance,
  ligandStrength,
  setLigandStrength,
  showOrbitals,
  setShowOrbitals,
  ligands,
  isDarkMode,
  setIsDarkMode
}) {
  const selectedLigand = ligands.find(l => l.strength === ligandStrength) || ligands[4];

  return (
    <Paper 
      elevation={2} 
      sx={{ 
        p: { xs: 1, sm: 2 },
        background: isDarkMode 
          ? 'linear-gradient(135deg, #1e1e1e 0%, #2d2d2d 100%)'
          : 'linear-gradient(135deg, #ffffff 0%, #f5f5f5 100%)',
        border: isDarkMode ? '1px solid #333' : '1px solid #e0e0e0'
      }}
    >
      <Typography 
        variant="h6" 
        sx={{ 
          mb: { xs: 1, sm: 2 }, 
          color: isDarkMode ? '#90caf9' : '#1976d2', 
          fontWeight: 'bold',
          fontSize: { xs: '1rem', sm: '1.25rem' }
        }}
      >
        Controls
      </Typography>

      {/* Geometry Selection */}
      <Box sx={{ mb: { xs: 2, sm: 3 } }}>
        <FormControl fullWidth size="small">
          <InputLabel sx={{ color: isDarkMode ? '#aaa' : '#666' }}>Geometry</InputLabel>
          <Select
            value={geometryType}
            label="Geometry"
            onChange={(e) => setGeometryType(e.target.value)}
            sx={{
              color: 'white',
              '& .MuiOutlinedInput-notchedOutline': {
                borderColor: '#555',
              },
              '&:hover .MuiOutlinedInput-notchedOutline': {
                borderColor: '#777',
              },
              '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                borderColor: '#90caf9',
              },
            }}
          >
            <MenuItem value="octahedral">Octahedral (Oh)</MenuItem>
            <MenuItem value="squarePlanar">Square Planar (D4h)</MenuItem>
          </Select>
        </FormControl>
      </Box>

      <Divider sx={{ mb: { xs: 2, sm: 3 }, borderColor: '#333' }} />

      {/* Distance Slider */}
      <Box sx={{ mb: { xs: 2, sm: 3 } }}>
        <Typography 
          variant="body2" 
          sx={{ 
            mb: 1, 
            color: '#aaa',
            fontSize: { xs: '0.8rem', sm: '0.9rem' }
          }}
        >
          Ligand Distance: {distance.toFixed(1)} Å
        </Typography>
        <Slider
          value={distance}
          onChange={(e, value) => setDistance(value)}
          min={1.0}
          max={4.0}
          step={0.1}
          sx={{
            color: '#90caf9',
            '& .MuiSlider-thumb': {
              backgroundColor: '#90caf9',
            },
            '& .MuiSlider-track': {
              backgroundColor: '#90caf9',
            },
            '& .MuiSlider-rail': {
              backgroundColor: '#444',
            },
          }}
        />
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
          <Typography 
            variant="caption" 
            sx={{ 
              color: '#666',
              fontSize: { xs: '0.7rem', sm: '0.8rem' }
            }}
          >
            Close
          </Typography>
          <Typography 
            variant="caption" 
            sx={{ 
              color: '#666',
              fontSize: { xs: '0.7rem', sm: '0.8rem' }
            }}
          >
            Far
          </Typography>
        </Box>
      </Box>

      <Divider sx={{ mb: { xs: 2, sm: 3 }, borderColor: '#333' }} />

      {/* Ligand Selection */}
      <Box sx={{ mb: { xs: 2, sm: 3 } }}>
        <Typography 
          variant="body2" 
          sx={{ 
            mb: 1, 
            color: '#aaa',
            fontSize: { xs: '0.8rem', sm: '0.9rem' }
          }}
        >
          Ligand Field Strength
        </Typography>
        <FormControl fullWidth size="small">
          <InputLabel sx={{ color: '#aaa' }}>Ligand</InputLabel>
          <Select
            value={ligandStrength}
            label="Ligand"
            onChange={(e) => setLigandStrength(Number(e.target.value))}
            sx={{
              color: 'white',
              '& .MuiOutlinedInput-notchedOutline': {
                borderColor: '#555',
              },
              '&:hover .MuiOutlinedInput-notchedOutline': {
                borderColor: '#777',
              },
              '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                borderColor: '#90caf9',
              },
            }}
          >
            {ligands.map((ligand) => (
              <MenuItem key={ligand.strength} value={ligand.strength}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box
                    sx={{
                      width: 12,
                      height: 12,
                      borderRadius: '50%',
                      backgroundColor: ligand.color,
                    }}
                  />
                  <Typography sx={{ fontSize: { xs: '0.8rem', sm: '0.9rem' } }}>
                    {ligand.name} (strength: {ligand.strength})
                  </Typography>
                </Box>
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        
        {/* Selected ligand chip */}
        <Box sx={{ mt: 1 }}>
          <Chip
            label={`${selectedLigand.name} - ${selectedLigand.strength > 5 ? 'Strong Field' : 'Weak Field'}`}
            size="small"
            sx={{
              backgroundColor: selectedLigand.color,
              color: 'white',
              fontWeight: 'bold',
              fontSize: { xs: '0.7rem', sm: '0.8rem' }
            }}
          />
        </Box>
      </Box>

      <Divider sx={{ mb: { xs: 2, sm: 3 }, borderColor: '#333' }} />

      {/* Orbital Toggle */}
      <Box sx={{ mb: { xs: 1, sm: 2 } }}>
        <FormControlLabel
          control={
            <Switch
              checked={showOrbitals}
              onChange={(e) => setShowOrbitals(e.target.checked)}
              sx={{
                '& .MuiSwitch-switchBase.Mui-checked': {
                  color: '#90caf9',
                },
                '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                  backgroundColor: '#90caf9',
                },
              }}
            />
          }
          label={
            <Typography 
              variant="body2" 
              sx={{ 
                color: '#aaa',
                fontSize: { xs: '0.8rem', sm: '0.9rem' }
              }}
            >
              Show d-orbital lobes
            </Typography>
          }
        />
      </Box>

      <Divider sx={{ mb: { xs: 2, sm: 3 }, borderColor: '#333' }} />

      {/* Theme Toggle */}
      <Box sx={{ mb: { xs: 1, sm: 2 } }}>
        <FormControlLabel
          control={
            <Switch
              checked={isDarkMode}
              onChange={(e) => setIsDarkMode(e.target.checked)}
              sx={{
                '& .MuiSwitch-switchBase.Mui-checked': {
                  color: '#ff9800',
                },
                '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                  backgroundColor: '#ff9800',
                },
              }}
            />
          }
          label={
            <Typography 
              variant="body2" 
              sx={{ 
                color: '#aaa',
                fontSize: { xs: '0.8rem', sm: '0.9rem' }
              }}
            >
              {isDarkMode ? 'Dark Mode (Projector)' : 'Light Mode (Projector)'}
            </Typography>
          }
        />
      </Box>

      {/* Info Panel */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Paper 
          elevation={1} 
          sx={{ 
            p: 1.5, 
            mt: 2,
            background: 'rgba(144, 202, 249, 0.1)',
            border: '1px solid rgba(144, 202, 249, 0.3)'
          }}
        >
          <Typography variant="caption" sx={{ color: '#90caf9', fontWeight: 'bold' }}>
            💡 Tip:
          </Typography>
          <Typography variant="caption" sx={{ color: '#aaa', display: 'block', mt: 0.5 }}>
            {geometryType === 'octahedral' 
              ? 'In octahedral complexes, dz² and dx²-y² orbitals point directly at ligands and are destabilized.'
              : 'In square planar complexes, dx²-y² orbital has the highest energy as it points directly at the four ligands.'
            }
          </Typography>
        </Paper>
      </motion.div>
    </Paper>
  );
}
