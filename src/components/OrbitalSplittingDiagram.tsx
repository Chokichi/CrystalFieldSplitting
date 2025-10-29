import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Box, Typography, Paper } from '@mui/material';

// Calculate crystal field splitting energies
function calculateSplitting(geometry, distance, ligandStrength) {
  const base = ligandStrength / Math.pow(distance, 3);
  
  console.log(`🔬 Crystal Field Calculation - Geometry: ${geometry}, Distance: ${distance}, Ligand Strength: ${ligandStrength}`);
  console.log(`📊 Base value: ${base.toFixed(3)}`);
  
  if (geometry === "octahedral") {
    const energies = {
      eg: base * 0.6,      // dz², dx²-y² (higher energy - destabilized)
      t2g: -base * 0.4,    // dxy, dxz, dyz (lower energy - stabilized)
      splitting: base * 1.0
    };
    console.log(`🔺 Octahedral Energies:`, energies);
    console.log(`   eg (dz², dx²-y²): ${energies.eg.toFixed(3)} (higher energy - destabilized)`);
    console.log(`   t2g (dxy, dxz, dyz): ${energies.t2g.toFixed(3)} (lower energy - stabilized)`);
    console.log(`   Δₒ: ${energies.splitting.toFixed(3)}`);
    return energies;
  } else if (geometry === "squarePlanar") {
    const energies = {
      dx2y2: base * 0.8,   // highest energy (eg orbital - most destabilized)
      dz2: base * 0.6,     // high energy (eg orbital - destabilized)
      dxy: -base * 0.4,    // lower energy (t2g orbital - stabilized)
      dxz: -base * 0.4,    // lower energy (t2g orbital - stabilized)
      dyz: -base * 0.4,    // lower energy (t2g orbital - stabilized)
      splitting: base * 1.2
    };
    console.log(`🔺 Square Planar Energies:`, energies);
    console.log(`   dx²-y²: ${energies.dx2y2.toFixed(3)} (highest energy - most destabilized)`);
    console.log(`   dz²: ${energies.dz2.toFixed(3)} (high energy - destabilized)`);
    console.log(`   dxy, dxz, dyz: ${energies.dxy.toFixed(3)} (lower energy - stabilized)`);
    console.log(`   Δₛₚ: ${energies.splitting.toFixed(3)}`);
    return energies;
  }
}

// Energy level component
function EnergyLevel({ 
  label, 
  energy, 
  color, 
  isActive = true,
  geometry,
  orbitalType,
  containerHeight = 300,
  index = 0, // For horizontal positioning
  isDarkMode = true
}) {
  // Calculate position as percentage from top (0-100%)
  const energyRange = 0.5; // Maximum energy range to display
  const normalizedEnergy = (energy + energyRange/2) / energyRange; // Normalize to 0-1
  const yPosition = 100 - (normalizedEnergy * 100); // Invert for CSS (higher energy = lower percentage = higher on screen)
  
  // Log positioning calculations for debugging
  console.log(`📍 EnergyLevel ${label}: energy=${energy.toFixed(3)}, energyRange=${energyRange}, normalized=${normalizedEnergy.toFixed(3)}, yPosition=${yPosition.toFixed(1)}%`);
  
  // Bar width for the orbital bars (doubled for better visibility)
  const barWidth = 50; // Width of each bar (increased from 2
  
  return (
    <motion.div
      initial={{ y: 0, opacity: 0 }}
      animate={{ 
        y: `${yPosition}%`, 
        opacity: isActive ? 1 : 0.3 
      }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      style={{
        position: 'relative',
        width: `${barWidth}px`,
        height: '12px',
        background: `linear-gradient(90deg, ${color} 0%, ${color}80 100%)`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transform: 'translateY(-50%)', // Center the line on the position
        borderRadius: '2px',
        boxShadow: `0 0 8px ${color}40`,
        margin: '0 8px' // Add horizontal margin for spacing (increased for larger bars)
      }}
    >
        <Typography 
          variant="body2" 
          sx={{ 
            color: isDarkMode ? 'white' : 'black', 
            fontSize: { xs: '0.8rem', sm: '0.9rem' },
            fontWeight: orbitalType === 'eg' || orbitalType === 'highest' ? 'bold' : 'normal',
            textShadow: isDarkMode 
              ? '1px 1px 2px rgba(0,0,0,0.8)' 
              : '1px 1px 2px rgba(255,255,255,0.8)',
            textAlign: 'center',
            lineHeight: 1,
            transform: 'rotate(-90deg)', // Rotate text vertically
            whiteSpace: 'nowrap'
          }}
        >
        {label}
      </Typography>
    </motion.div>
  );
}

// Octahedral energy diagram
function OctahedralDiagram({ energies, splitting, isDarkMode = true }) {
  return (
    <Box sx={{ 
      position: 'relative', 
      height: '100%', 
      width: '100%',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center'
    }}>
      {/* Reference line at center */}
      <Box
        sx={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: '50%',
          height: '1px',
          background: isDarkMode ? '#666' : '#999',
          opacity: 0.5
        }}
      />
      
      {/* Energy scale labels */}
      <Box
        sx={{
          position: 'absolute',
          left: '5px',
          top: '10%',
          color: isDarkMode ? '#888' : '#999',
          fontSize: '0.7rem'
        }}
      >
        High Energy
      </Box>
      <Box
        sx={{
          position: 'absolute',
          left: '5px',
          bottom: '10%',
          color: isDarkMode ? '#888' : '#999',
          fontSize: '0.7rem'
        }}
      >
        Low Energy
      </Box>
      
      {/* Centered container for orbital bars */}
      <Box sx={{ 
        position: 'relative',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%',
        height: '100%'
      }}>
      {/* t2g orbitals (lower energy) - all at same energy level */}
      <EnergyLevel 
        label="dxy" 
        energy={energies.t2g} 
        color="#4fc3f7" 
        geometry="octahedral"
        orbitalType="t2g"
        index={0}
        isDarkMode={isDarkMode}
      />
      <EnergyLevel 
        label="dxz" 
        energy={energies.t2g} 
        color="#4fc3f7" 
        geometry="octahedral"
        orbitalType="t2g"
        index={1}
        isDarkMode={isDarkMode}
      />
      <EnergyLevel 
        label="dyz" 
        energy={energies.t2g} 
        color="#4fc3f7" 
        geometry="octahedral"
        orbitalType="t2g"
        index={2}
        isDarkMode={isDarkMode}
      />
      
      {/* eg orbitals (higher energy) - all at same energy level */}
      <EnergyLevel 
        label="dz²" 
        energy={energies.eg} 
        color="#ff6b6b" 
        geometry="octahedral"
        orbitalType="eg"
        index={3}
        isDarkMode={isDarkMode}
      />
      <EnergyLevel 
        label="dx²-y²" 
        energy={energies.eg} 
        color="#ff6b6b" 
        geometry="octahedral"
        orbitalType="eg"
        index={4}
        isDarkMode={isDarkMode}
      />
      </Box>
      
      {/* Splitting indicator */}
      <motion.div
        animate={{ 
          y: '50%',
          height: Math.abs(energies.eg - energies.t2g) * 25
        }}
        transition={{ duration: 0.5 }}
        style={{
          position: 'absolute',
          right: '20px',
          width: '4px',
          background: 'linear-gradient(to top, #4fc3f7, #ff6b6b)',
          borderRadius: '2px'
        }}
      />
    </Box>
  );
}

// Square planar energy diagram
function SquarePlanarDiagram({ energies, splitting, isDarkMode = true }) {
  return (
    <Box sx={{ 
      position: 'relative', 
      height: '100%', 
      width: '100%',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center'
    }}>
      {/* Reference line at center */}
      <Box
        sx={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: '50%',
          height: '1px',
          background: isDarkMode ? '#666' : '#999',
          opacity: 0.5
        }}
      />
      
      {/* Energy scale labels */}
      <Box
        sx={{
          position: 'absolute',
          left: '5px',
          top: '10%',
          color: isDarkMode ? '#888' : '#999',
          fontSize: '0.7rem'
        }}
      >
        High Energy
      </Box>
      <Box
        sx={{
          position: 'absolute',
          left: '5px',
          bottom: '10%',
          color: isDarkMode ? '#888' : '#999',
          fontSize: '0.7rem'
        }}
      >
        Low Energy
      </Box>
      
      {/* Centered container for orbital bars */}
      <Box sx={{ 
        position: 'relative',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%',
        height: '100%'
      }}>
      {/* Lower energy orbitals - all at same energy level */}
      <EnergyLevel 
        label="dxy" 
        energy={energies.dxy} 
        color="#4fc3f7" 
        geometry="squarePlanar"
        orbitalType="lower"
        index={0}
        isDarkMode={isDarkMode}
      />
      <EnergyLevel 
        label="dxz" 
        energy={energies.dxz} 
        color="#4fc3f7" 
        geometry="squarePlanar"
        orbitalType="lower"
        index={1}
        isDarkMode={isDarkMode}
      />
      <EnergyLevel 
        label="dyz" 
        energy={energies.dyz} 
        color="#4fc3f7" 
        geometry="squarePlanar"
        orbitalType="lower"
        index={2}
        isDarkMode={isDarkMode}
      />
      
      {/* Moderate energy orbital - positioned near center */}
      <EnergyLevel 
        label="dz²" 
        energy={energies.dz2} 
        color="#ffa726" 
        geometry="squarePlanar"
        orbitalType="moderate"
        index={3}
        isDarkMode={isDarkMode}
      />
      
      {/* Highest energy orbital - positioned well above center */}
      <EnergyLevel 
        label="dx²-y²" 
        energy={energies.dx2y2} 
        color="#ff6b6b" 
        geometry="squarePlanar"
        orbitalType="highest"
        index={4}
        isDarkMode={isDarkMode}
      />
      </Box>
    </Box>
  );
}

export default function OrbitalSplittingDiagram({ 
  geometryType, 
  distance, 
  ligandStrength,
  isDarkMode = true
}) {
  const energies = useMemo(() => {
    console.log(`🔄 Recalculating energies for: ${geometryType}, distance: ${distance}, ligandStrength: ${ligandStrength}`);
    const result = calculateSplitting(geometryType, distance, ligandStrength);
    console.log(`✅ Final energies:`, result);
    return result;
  }, [geometryType, distance, ligandStrength]);

  return (
    <Paper 
      elevation={2} 
      sx={{ 
        p: { xs: 1, sm: 2 }, 
        height: '100%',
        background: isDarkMode 
          ? 'linear-gradient(135deg, #1e1e1e 0%, #2d2d2d 100%)'
          : 'linear-gradient(135deg, #ffffff 0%, #f5f5f5 100%)',
        border: isDarkMode ? '1px solid #333' : '1px solid #e0e0e0',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      <Typography 
        variant="h6" 
        sx={{ 
          mb: { xs: 1, sm: 2 }, 
          textAlign: 'center',
          color: isDarkMode ? '#90caf9' : '#1976d2',
          fontWeight: 'bold',
          fontSize: { xs: '1rem', sm: '1.25rem' }
        }}
      >
        Crystal Field Splitting
      </Typography>
      
      <Typography 
        variant="body2" 
        sx={{ 
          mb: { xs: 1, sm: 2 }, 
          textAlign: 'center',
          color: isDarkMode ? '#aaa' : '#666',
          fontSize: { xs: '0.8rem', sm: '0.9rem' }
        }}
      >
        {geometryType === 'octahedral' ? 'Octahedral (Oh)' : 'Square Planar (D4h)'}
      </Typography>
      
      <Box sx={{ 
        position: 'relative', 
        flex: 1,
        minHeight: { xs: '200px', sm: '250px', md: '300px' },
        maxHeight: { xs: '300px', md: '400px' }
      }}>
        {geometryType === 'octahedral' ? (
          <OctahedralDiagram energies={energies} splitting={energies.splitting} isDarkMode={isDarkMode} />
        ) : (
          <SquarePlanarDiagram energies={energies} splitting={energies.splitting} isDarkMode={isDarkMode} />
        )}
      </Box>
      
      {/* Orbital Legend */}
      <Box sx={{ mt: { xs: 1, sm: 2 }, textAlign: 'center' }}>
        <Typography 
          variant="caption" 
          sx={{ 
            color: isDarkMode ? '#888' : '#999', 
            display: 'block', 
            mb: 1,
            fontSize: { xs: '0.7rem', sm: '0.8rem' }
          }}
        >
          Orbital Legend (left to right):
        </Typography>
        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1, flexWrap: 'wrap' }}>
          {geometryType === 'octahedral' ? (
            <>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Box sx={{ width: 12, height: 2, backgroundColor: '#4fc3f7' }} />
                <Typography variant="caption" sx={{ color: isDarkMode ? '#aaa' : '#666', fontSize: '0.7rem' }}>t₂g</Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Box sx={{ width: 12, height: 2, backgroundColor: '#ff6b6b' }} />
                <Typography variant="caption" sx={{ color: isDarkMode ? '#aaa' : '#666', fontSize: '0.7rem' }}>eg</Typography>
              </Box>
            </>
          ) : (
            <>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Box sx={{ width: 12, height: 2, backgroundColor: '#4fc3f7' }} />
                <Typography variant="caption" sx={{ color: isDarkMode ? '#aaa' : '#666', fontSize: '0.7rem' }}>Lower</Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Box sx={{ width: 12, height: 2, backgroundColor: '#ffa726' }} />
                <Typography variant="caption" sx={{ color: isDarkMode ? '#aaa' : '#666', fontSize: '0.7rem' }}>Moderate</Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Box sx={{ width: 12, height: 2, backgroundColor: '#ff6b6b' }} />
                <Typography variant="caption" sx={{ color: isDarkMode ? '#aaa' : '#666', fontSize: '0.7rem' }}>Highest</Typography>
              </Box>
            </>
          )}
        </Box>
      </Box>

      {/* Splitting value display */}
      <Box sx={{ mt: { xs: 1, sm: 2 }, textAlign: 'center' }}>
        <Typography 
          variant="body2" 
          sx={{ 
            color: isDarkMode ? '#aaa' : '#666',
            fontSize: { xs: '0.8rem', sm: '0.9rem' }
          }}
        >
          Δ = {energies.splitting.toFixed(2)} eV
        </Typography>
        <Typography 
          variant="caption" 
          sx={{ 
            color: isDarkMode ? '#666' : '#999', 
            display: 'block', 
            mt: 0.5,
            fontSize: { xs: '0.7rem', sm: '0.8rem' }
          }}
        >
          Distance: {distance.toFixed(1)} Å | Ligand Strength: {ligandStrength}
        </Typography>
      </Box>
    </Paper>
  );
}
