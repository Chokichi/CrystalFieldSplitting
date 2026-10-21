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
  Chip,
  Divider
} from '@mui/material';

export function LigandDistanceControl({ distance, setDistance, isDarkMode }) {
  return (
    <Box>
      <Typography
        variant="body2"
        sx={{
          mb: 0.5,
          color: isDarkMode ? '#e0e0e0' : '#424242',
          fontSize: { xs: '0.8rem', sm: '0.9rem' }
        }}
      >
        Ligand Distance: {distance.toFixed(1)} Å
      </Typography>
      <Slider
        value={distance}
        onChange={(_event, value) => setDistance(Array.isArray(value) ? value[0] : value)}
        min={1.0}
        max={4.0}
        step={0.1}
        size="small"
        sx={{
          color: isDarkMode ? '#90caf9' : '#1976d2',
          '& .MuiSlider-thumb': {
            backgroundColor: isDarkMode ? '#90caf9' : '#1976d2',
          },
          '& .MuiSlider-track': {
            backgroundColor: isDarkMode ? '#90caf9' : '#1976d2',
          },
          '& .MuiSlider-rail': {
            backgroundColor: isDarkMode ? '#444' : '#bdbdbd',
          },
        }}
      />
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: -0.5 }}>
        <Typography variant="caption" sx={{ color: isDarkMode ? '#bdbdbd' : '#616161', fontSize: { xs: '0.7rem', sm: '0.8rem' } }}>
          Close
        </Typography>
        <Typography variant="caption" sx={{ color: isDarkMode ? '#bdbdbd' : '#616161', fontSize: { xs: '0.7rem', sm: '0.8rem' } }}>
          Far
        </Typography>
      </Box>
    </Box>
  );
}

export default function ControlsPanel({
  geometryType,
  setGeometryType,
  ligandStrength,
  setLigandStrength,
  ligands,
  isDarkMode,
  setIsDarkMode
}) {
  const selectedLigand = ligands.find(l => l.strength === ligandStrength) || ligands[4];

  return (
    <Box>
      <Box sx={{ mb: 2 }}>
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
            <MenuItem value="tetrahedral" sx={{ color: isDarkMode ? 'white' : '#212121' }}>Tetrahedral (Td)</MenuItem>
            <MenuItem value="squarePlanar" sx={{ color: isDarkMode ? 'white' : '#212121' }}>Square Planar (D4h)</MenuItem>
          </Select>
        </FormControl>
      </Box>

      <Divider sx={{ mb: 2, borderColor: isDarkMode ? '#333' : '#e0e0e0' }} />

      <Box sx={{ mb: 2 }}>
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

      <Divider sx={{ mb: 2, borderColor: isDarkMode ? '#333' : '#e0e0e0' }} />

      <Box>
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

      <Typography variant="caption" sx={{ color: isDarkMode ? '#bdbdbd' : '#616161', display: 'block', mt: 1.5 }}>
        {geometryType === 'octahedral'
          ? 'In octahedral complexes, dz² and dx²-y² orbitals point directly at ligands and are destabilized.'
          : geometryType === 'tetrahedral'
          ? 'In tetrahedral complexes, t₂ orbitals (dxy, dxz, dyz) are destabilized more than e orbitals (dz², dx²-y²) due to their orientation.'
          : 'In square planar complexes, dx²-y² orbital has the highest energy as it points directly at the four ligands.'}
      </Typography>
    </Box>
  );
}
