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
              color: isDarkMode ? 'white' : '#212121',
              '& .MuiOutlinedInput-notchedOutline': {
                borderColor: isDarkMode ? '#555' : '#ccc',
              },
              '&:hover .MuiOutlinedInput-notchedOutline': {
                borderColor: isDarkMode ? '#777' : '#999',
              },
              '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                borderColor: isDarkMode ? '#90caf9' : '#1976d2',
              },
            }}
          >
            <MenuItem value="octahedral" sx={{ color: isDarkMode ? 'white' : '#212121' }}>Octahedral (Oh)</MenuItem>
            <MenuItem value="squarePlanar" sx={{ color: isDarkMode ? 'white' : '#212121' }}>Square Planar (D4h)</MenuItem>
          </Select>
        </FormControl>
      </Box>

      <Divider sx={{ mb: { xs: 2, sm: 3 }, borderColor: isDarkMode ? '#333' : '#e0e0e0' }} />

      {/* Distance Slider */}
      <Box sx={{ mb: { xs: 2, sm: 3 } }}>
        <Typography 
          variant="body2" 
          sx={{ 
            mb: 1, 
            color: isDarkMode ? '#aaa' : '#666',
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
            color: isDarkMode ? '#90caf9' : '#1976d2',
            '& .MuiSlider-thumb': {
              backgroundColor: isDarkMode ? '#90caf9' : '#1976d2',
            },
            '& .MuiSlider-track': {
              backgroundColor: isDarkMode ? '#90caf9' : '#1976d2',
            },
            '& .MuiSlider-rail': {
              backgroundColor: isDarkMode ? '#444' : '#ddd',
            },
          }}
        />
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
          <Typography 
            variant="caption" 
            sx={{ 
              color: isDarkMode ? '#666' : '#999',
              fontSize: { xs: '0.7rem', sm: '0.8rem' }
            }}
          >
            Close
          </Typography>
          <Typography 
            variant="caption" 
            sx={{ 
              color: isDarkMode ? '#666' : '#999',
              fontSize: { xs: '0.7rem', sm: '0.8rem' }
            }}
          >
            Far
          </Typography>
        </Box>
      </Box>

      <Divider sx={{ mb: { xs: 2, sm: 3 }, borderColor: isDarkMode ? '#333' : '#e0e0e0' }} />

      {/* Ligand Selection */}
      <Box sx={{ mb: { xs: 2, sm: 3 } }}>
        <Typography 
          variant="body2" 
          sx={{ 
            mb: 1, 
            color: isDarkMode ? '#aaa' : '#666',
            fontSize: { xs: '0.8rem', sm: '0.9rem' }
          }}
        >
          Ligand Field Strength
        </Typography>
        <FormControl fullWidth size="small">
          <InputLabel sx={{ color: isDarkMode ? '#aaa' : '#666' }}>Ligand</InputLabel>
          <Select
            value={ligandStrength}
            label="Ligand"
            onChange={(e) => setLigandStrength(Number(e.target.value))}
            sx={{
              color: isDarkMode ? 'white' : '#212121',
              '& .MuiOutlinedInput-notchedOutline': {
                borderColor: isDarkMode ? '#555' : '#ccc',
              },
              '&:hover .MuiOutlinedInput-notchedOutline': {
                borderColor: isDarkMode ? '#777' : '#999',
              },
              '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                borderColor: isDarkMode ? '#90caf9' : '#1976d2',
              },
            }}
          >
            {ligands.map((ligand) => (
              <MenuItem key={ligand.strength} value={ligand.strength} sx={{ color: isDarkMode ? 'white' : '#212121' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box
                    sx={{
                      width: 12,
                      height: 12,
                      borderRadius: '50%',
                      backgroundColor: ligand.color,
                    }}
                  />
                  <Typography sx={{ fontSize: { xs: '0.8rem', sm: '0.9rem' }, color: isDarkMode ? 'white' : '#212121' }}>
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

      <Divider sx={{ mb: { xs: 2, sm: 3 }, borderColor: isDarkMode ? '#333' : '#e0e0e0' }} />

      {/* Orbital Toggle */}
      <Box sx={{ mb: { xs: 1, sm: 2 } }}>
        <FormControlLabel
          control={
            <Switch
              checked={showOrbitals}
              onChange={(e) => setShowOrbitals(e.target.checked)}
              sx={{
                '& .MuiSwitch-switchBase.Mui-checked': {
                  color: isDarkMode ? '#90caf9' : '#1976d2',
                },
                '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                  backgroundColor: isDarkMode ? '#90caf9' : '#1976d2',
                },
              }}
            />
          }
          label={
            <Typography 
              variant="body2" 
              sx={{ 
                color: isDarkMode ? '#aaa' : '#666',
                fontSize: { xs: '0.8rem', sm: '0.9rem' }
              }}
            >
              Show d-orbital lobes
            </Typography>
          }
        />
      </Box>

      <Divider sx={{ mb: { xs: 2, sm: 3 }, borderColor: isDarkMode ? '#333' : '#e0e0e0' }} />

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
                color: isDarkMode ? '#aaa' : '#666',
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
          <Typography variant="caption" sx={{ color: isDarkMode ? '#90caf9' : '#1976d2', fontWeight: 'bold' }}>
            💡 Tip:
          </Typography>
          <Typography variant="caption" sx={{ color: isDarkMode ? '#aaa' : '#666', display: 'block', mt: 0.5 }}>
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
