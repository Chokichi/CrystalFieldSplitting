import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Box, Typography, Paper } from '@mui/material';

// Calculate crystal field splitting energies
function calculateSplitting(geometry, distance, ligandStrength) {
  // Normalize distance: 1.0 (close) to 4.0 (far) maps to 1.0 to 0.0156
  // Use inverse distance cubed for physics accuracy
  const distanceEffect = 1.0 / Math.pow(distance, 3);
  const base = ligandStrength * distanceEffect;
  
  // Distance-based scaling: when far away (distance=4), orbitals should be near ground state
  // When close (distance=1), they should be significantly raised
  // Map distance from 1-4 range to energy multiplier 0.05 to 1.0
  const distanceScaler = 0.05 + (4.0 - distance) / 3.0 * 0.95; // distance=4 → 0.05, distance=1 → 0.95
  
  console.log(`🔬 Crystal Field Calculation - Geometry: ${geometry}, Distance: ${distance}, Ligand Strength: ${ligandStrength}`);
  console.log(`📊 Base value: ${base.toFixed(3)}, Distance scaler: ${distanceScaler.toFixed(3)}`);
  
  if (geometry === "octahedral") {
    // All orbitals are raised in energy, scaled by distance
    const baseRise = base * distanceScaler * 0.8;  // Average energy increase for all orbitals
    const energies = {
      eg: baseRise + base * distanceScaler * 0.3,      // dz², dx²-y² (raised even more - most destabilized)
      t2g: baseRise - base * distanceScaler * 0.3,     // dxy, dxz, dyz (raised less - least destabilized)
      splitting: base * distanceScaler * 0.6  // Difference between eg and t2g
    };
    console.log(`🔺 Octahedral Energies:`, energies);
    console.log(`   eg (dz², dx²-y²): ${energies.eg.toFixed(3)} (highest energy - most destabilized)`);
    console.log(`   t2g (dxy, dxz, dyz): ${energies.t2g.toFixed(3)} (lower energy - still destabilized but less)`);
    console.log(`   Δₒ: ${energies.splitting.toFixed(3)}`);
    return energies;
  } else if (geometry === "squarePlanar") {
    // All orbitals are raised in energy, scaled by distance
    const baseRise = base * distanceScaler * 0.6;  // Average energy increase for all orbitals
    const energies = {
      dx2y2: baseRise + base * distanceScaler * 0.4,   // highest energy (points directly at ligands - most destabilized)
      dxy: baseRise + base * distanceScaler * 0.25,    // high energy (in xy-plane rotated 45° - significant interaction)
      dz2: baseRise + base * distanceScaler * 0.1,     // moderate energy (points along z-axis - moderate destabilization)
      dxz: baseRise - base * distanceScaler * 0.5,     // lower energy (points out of plane - least destabilized)
      dyz: baseRise - base * distanceScaler * 0.5,     // lower energy (points out of plane - least destabilized)
      splitting: base * distanceScaler * 0.9  // Difference between highest and lowest
    };
    console.log(`🔺 Square Planar Energies:`, energies);
    console.log(`   dx²-y²: ${energies.dx2y2.toFixed(3)} (highest energy - most destabilized, points at ligands)`);
    console.log(`   dxy: ${energies.dxy.toFixed(3)} (high energy - in xy-plane but rotated 45°, significant interaction)`);
    console.log(`   dz²: ${energies.dz2.toFixed(3)} (moderate energy - points along z-axis)`);
    console.log(`   dxz, dyz: ${energies.dxz.toFixed(3)} (lower energy - least destabilized, point away from ligands)`);
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
  totalOrbitals = 5, // Total number of orbitals to space
  maxEnergyValue = 3.0, // Maximum energy value for scaling (passed from parent)
  isDarkMode = true
}) {
  // Calculate position as percentage from top (0-100%)
  // Use the passed maxEnergyValue for proper scaling
  // Normalize energy to 0-1 range, but ensure it's never negative
  const normalizedEnergy = Math.max(0, energy) / maxEnergyValue; // Normalize to 0-1, positive values only
  
  // Position from 90% (ground) to 10% (top), using 80% of available height for energy levels
  const yPosition = 90 - (normalizedEnergy * 80);
  
  // Cap the position to ensure orbitals stay within visible bounds (5% to 95%)
  const cappedYPosition = Math.max(5, Math.min(95, yPosition));
  
  // Calculate horizontal positioning based on total number of orbitals
  // Middle bar (index = Math.floor(totalOrbitals / 2)) should be centered
  const middleIndex = Math.floor(totalOrbitals / 2);
  const offsetFromCenter = (index - middleIndex);
  
  // Calculate spacing in pixels
  // Use a fixed pixel spacing that works well visually
  const spacingPx = 80; // Fixed pixel spacing between orbital centers
  const horizontalOffsetPx = offsetFromCenter * spacingPx;
  
  // Log horizontal positioning for debugging
  console.log(`📍 ${label} horizontalOffset=${horizontalOffsetPx}px, index=${index}, middleIndex=${middleIndex}, offsetFromCenter=${offsetFromCenter}`);
  
  // Log positioning calculations for debugging
  console.log(`📍 EnergyLevel ${label}: energy=${energy.toFixed(3)}, maxEnergyValue=${maxEnergyValue}, normalized=${normalizedEnergy.toFixed(3)}, yPosition=${yPosition.toFixed(1)}%, cappedYPosition=${cappedYPosition.toFixed(1)}%`);
  
  // Bar width for the orbital bars (doubled for better visibility)
  const barWidth = 50; // Width of each bar (increased from 2
  
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ 
        top: `${yPosition}%`,
        opacity: isActive ? 1 : 0.3 
      }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      style={{
        position: 'absolute',
        width: `${barWidth}px`,
        height: '12px',
        background: `linear-gradient(90deg, ${color} 0%, ${color}80 100%)`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        top: `${cappedYPosition}%`,
        left: `calc(50% + ${horizontalOffsetPx}px)`, // Center all bars at 50% + pixel offset
        transform: 'translateX(-50%) translateY(-50%)', // Center the bar on its position
        borderRadius: '2px',
        boxShadow: `0 0 8px ${color}40`
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
function OctahedralDiagram({ energies, splitting, isDarkMode = true, maxEnergyValue = 3.0 }) {
  return (
    <Box sx={{ 
      position: 'relative', 
      height: '100%', 
      width: '100%',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center'
    }}>
      {/* Ground state reference line */}
      <Box
        sx={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: '90%',
          height: '2px',
          background: isDarkMode ? '#888' : '#666',
          opacity: 0.8,
          borderStyle: 'dashed'
        }}
      />
      
      {/* Energy scale labels */}
      <Box
        sx={{
          position: 'absolute',
          left: '5px',
          top: '5%',
          color: isDarkMode ? '#888' : '#999',
          fontSize: '0.7rem'
        }}
      >
        Higher Energy
      </Box>
      <Box
        sx={{
          position: 'absolute',
          left: '5px',
          bottom: '1%',
          color: isDarkMode ? '#888' : '#999',
          fontSize: '0.7rem'
        }}
      >
        Ground State
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
        totalOrbitals={5}
        maxEnergyValue={maxEnergyValue}
        isDarkMode={isDarkMode}
      />
      <EnergyLevel 
        label="dxz" 
        energy={energies.t2g} 
        color="#4fc3f7" 
        geometry="octahedral"
        orbitalType="t2g"
        index={1}
        totalOrbitals={5}
        maxEnergyValue={maxEnergyValue}
        isDarkMode={isDarkMode}
      />
      <EnergyLevel 
        label="dyz" 
        energy={energies.t2g} 
        color="#4fc3f7" 
        geometry="octahedral"
        orbitalType="t2g"
        index={2}
        totalOrbitals={5}
        maxEnergyValue={maxEnergyValue}
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
        totalOrbitals={5}
        maxEnergyValue={maxEnergyValue}
        isDarkMode={isDarkMode}
      />
      <EnergyLevel 
        label="dx²-y²" 
        energy={energies.eg} 
        color="#ff6b6b" 
        geometry="octahedral"
        orbitalType="eg"
        index={4}
        totalOrbitals={5}
        maxEnergyValue={maxEnergyValue}
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
function SquarePlanarDiagram({ energies, splitting, isDarkMode = true, maxEnergyValue = 3.0 }) {
  return (
    <Box sx={{ 
      position: 'relative', 
      height: '100%', 
      width: '100%',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center'
    }}>
      {/* Ground state reference line */}
      <Box
        sx={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: '90%',
          height: '2px',
          background: isDarkMode ? '#888' : '#666',
          opacity: 0.8,
          borderStyle: 'dashed'
        }}
      />
      
      {/* Energy scale labels */}
      <Box
        sx={{
          position: 'absolute',
          left: '5px',
          top: '5%',
          color: isDarkMode ? '#888' : '#999',
          fontSize: '0.7rem'
        }}
      >
        Higher Energy
      </Box>
      <Box
        sx={{
          position: 'absolute',
          left: '5px',
          bottom: '1%',
          color: isDarkMode ? '#888' : '#999',
          fontSize: '0.7rem'
        }}
      >
        Ground State
      </Box>
      
      {/* Centered container for orbital bars */}
      <Box sx={{ 
        position: 'relative',
        width: '100%',
        height: '100%'
      }}>
      {/* Lower energy orbitals - point away from ligands */}
      <EnergyLevel 
        label="dxz" 
        energy={energies.dxz} 
        color="#4fc3f7" 
        geometry="squarePlanar"
        orbitalType="lower"
        index={0}
        totalOrbitals={5}
        maxEnergyValue={maxEnergyValue}
        isDarkMode={isDarkMode}
      />
      <EnergyLevel 
        label="dyz" 
        energy={energies.dyz} 
        color="#4fc3f7" 
        geometry="squarePlanar"
        orbitalType="lower"
        index={1}
        totalOrbitals={5}
        maxEnergyValue={maxEnergyValue}
        isDarkMode={isDarkMode}
      />
      
      {/* High energy orbital - points along z-axis */}
      <EnergyLevel 
        label="dz²" 
        energy={energies.dz2} 
        color="#ffa726" 
        geometry="squarePlanar"
        orbitalType="moderate"
        index={2}
        totalOrbitals={5}
        maxEnergyValue={maxEnergyValue}
        isDarkMode={isDarkMode}
      />
      
      {/* High energy orbital - in xy-plane but rotated 45° */}
      <EnergyLevel 
        label="dxy" 
        energy={energies.dxy} 
        color="#ffa726" 
        geometry="squarePlanar"
        orbitalType="moderate"
        index={3}
        totalOrbitals={5}
        maxEnergyValue={maxEnergyValue}
        isDarkMode={isDarkMode}
      />
      
      {/* Highest energy orbital - points directly at 4 ligands */}
      <EnergyLevel 
        label="dx²-y²" 
        energy={energies.dx2y2} 
        color="#ff6b6b" 
        geometry="squarePlanar"
        orbitalType="highest"
        index={4}
        totalOrbitals={5}
        maxEnergyValue={maxEnergyValue}
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

  // Calculate the maximum energy value for proper scaling
  const maxEnergyValue = useMemo(() => {
    if (!energies) return 3.0;
    // Get all energy values (excluding splitting)
    const energyValues = geometryType === 'octahedral' 
      ? [energies.eg, energies.t2g]
      : [energies.dx2y2, energies.dxy, energies.dz2, energies.dxz, energies.dyz];
    
    // Find the maximum and minimum energy values
    const maxEnergy = Math.max(...energyValues);
    const minEnergy = Math.min(...energyValues);
    
    // Use the range (max - min) plus buffer to scale properly
    // Add small buffers to ensure orbitals aren't at the very edges
    const energyRange = maxEnergy - minEnergy;
    const buffer = Math.max(energyRange * 0.3, 0.5); // Use 30% of range or min 0.5
    
    return Math.max(maxEnergy + buffer, Math.abs(minEnergy - buffer));
  }, [energies, geometryType]);
  
  console.log(`📊 maxEnergyValue calculated: ${maxEnergyValue.toFixed(3)}`);

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
          <OctahedralDiagram energies={energies} splitting={energies.splitting} isDarkMode={isDarkMode} maxEnergyValue={maxEnergyValue} />
        ) : (
          <SquarePlanarDiagram energies={energies} splitting={energies.splitting} isDarkMode={isDarkMode} maxEnergyValue={maxEnergyValue} />
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
