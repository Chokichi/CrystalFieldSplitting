import { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Box, Typography, Paper } from '@mui/material';

type GeometryType = 'octahedral' | 'tetrahedral' | 'squarePlanar';

type OctahedralEnergies = {
  eg: number;
  t2g: number;
  splitting: number;
};

type TetrahedralEnergies = {
  t2: number;
  e: number;
  splitting: number;
};

type SquarePlanarEnergies = {
  dx2y2: number;
  dxy: number;
  dz2: number;
  dxz: number;
  dyz: number;
  splitting: number;
};

type EnergyResult = OctahedralEnergies | TetrahedralEnergies | SquarePlanarEnergies;

// Calculate crystal field splitting energies
function calculateSplitting(
  geometry: GeometryType,
  distance: number,
  ligandStrength: number
): EnergyResult | undefined {
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
  } else if (geometry === "tetrahedral") {
    // Tetrahedral: t2 orbitals (dxy, dxz, dyz) are destabilized MORE than e orbitals (dz², dx²-y²)
    // This is opposite to octahedral
    // All orbitals are raised in energy, scaled by distance
    const baseRise = base * distanceScaler * 0.7;  // Average energy increase for all orbitals
    // In tetrahedral, t2 orbitals are higher energy than e orbitals
    // The splitting is about 4/9 of octahedral for the same ligand
    const energies = {
      t2: baseRise + base * distanceScaler * 0.15,      // dxy, dxz, dyz (higher energy - more destabilized)
      e: baseRise - base * distanceScaler * 0.15,       // dz², dx²-y² (lower energy - less destabilized)
      splitting: base * distanceScaler * 0.3  // Δₜ ≈ 0.5Δₒ - smaller than octahedral (0.3 vs 0.6)
    };
    console.log(`🔺 Tetrahedral Energies:`, energies);
    console.log(`   t₂ (dxy, dxz, dyz): ${energies.t2.toFixed(3)} (higher energy - more destabilized)`);
    console.log(`   e (dz², dx²-y²): ${energies.e.toFixed(3)} (lower energy - still destabilized but less)`);
    console.log(`   Δₜ: ${energies.splitting.toFixed(3)}`);
    return energies;
  }
}

type EnergyLevelProps = {
  label: string;
  energy: number;
  color: string;
  isActive?: boolean;
  geometry: GeometryType;
  orbitalType: string;
  containerHeight?: number;
  diagramWidth?: number;
  index?: number;
  totalOrbitals?: number;
  minEnergyValue?: number;
  energyScale?: number;
  baselinePadding?: number;
  isDarkMode?: boolean;
  topPaddingPx?: number;
  bottomPaddingPx?: number;
};

// Energy level component
function EnergyLevel({
  label,
  energy,
  color,
  isActive = true,
  geometry: _geometry,
  orbitalType,
  containerHeight: _containerHeight = 300,
  diagramWidth = 360,
  index = 0,
  totalOrbitals = 5,
  minEnergyValue = 0,
  energyScale = 3.0,
  baselinePadding = 0.2,
  isDarkMode = true,
  topPaddingPx: customTopPaddingPx,
  bottomPaddingPx: customBottomPaddingPx
}: EnergyLevelProps) {
  const containerHeight = Math.max(_containerHeight, 80);
  const shiftedEnergy = Math.max(0, energy - minEnergyValue);
  const normalizedEnergy = Math.min(1, (shiftedEnergy + baselinePadding) / Math.max(energyScale, 0.001));

  const topPaddingPx = customTopPaddingPx ?? Math.min(40, Math.max(16, containerHeight * 0.1));
  const bottomPaddingPx = customBottomPaddingPx ?? Math.min(64, Math.max(24, containerHeight * 0.16));
  const usableHeight = Math.max(containerHeight - topPaddingPx - bottomPaddingPx, 36);
  const yPositionPx = topPaddingPx + (1 - normalizedEnergy) * usableHeight;
  const cappedYPositionPx = Math.max(topPaddingPx, Math.min(topPaddingPx + usableHeight, yPositionPx));

  const middleIndex = Math.floor(totalOrbitals / 2);
  const offsetFromCenter = index - middleIndex;

  const safeWidth = Math.max(diagramWidth, totalOrbitals * 48);
  const rawSpacing = safeWidth / Math.max(totalOrbitals, 1);
  const spacingPx = Math.max(36, Math.min(rawSpacing, 90));
  const horizontalOffsetPx = offsetFromCenter * spacingPx;

  const barWidth = Math.max(30, Math.min(spacingPx * 0.6, 60));

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{
        top: cappedYPositionPx,
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
        top: cappedYPositionPx,
        left: `calc(50% + ${horizontalOffsetPx}px)`,
        transform: 'translate(-50%, -50%)',
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
          transform: 'rotate(-90deg)',
          whiteSpace: 'nowrap',
          maxWidth: 56,
          overflow: 'hidden',
          textOverflow: 'ellipsis'
        }}
      >
        {label}
      </Typography>
    </motion.div>
  );
}

// Octahedral energy diagram
type DiagramCommonProps = {
  isDarkMode?: boolean;
  diagramWidth: number;
  diagramHeight: number;
  minEnergyValue: number;
  energyScale: number;
  baselinePadding: number;
  groundLineOffset?: string;
};

function OctahedralDiagram({
  energies,
  isDarkMode = true,
  diagramWidth = 360,
  diagramHeight = 300,
  minEnergyValue = 0,
  energyScale = 3.0,
  baselinePadding = 0.2,
  groundLineOffset = '6%'
}: { energies: OctahedralEnergies } & DiagramCommonProps) {
  const topPaddingPx = Math.min(44, Math.max(16, diagramHeight * 0.1));
  const bottomPaddingPx = Math.min(72, Math.max(24, diagramHeight * 0.18));
  const usableHeight = Math.max(diagramHeight - topPaddingPx - bottomPaddingPx, 60);
  const groundLineOffsetPx =
    typeof groundLineOffset === 'string'
      ? Math.max(bottomPaddingPx - 20, 12)
      : groundLineOffset;
  const groundLabelBottomPx =
    typeof groundLineOffsetPx === 'number'
      ? Math.max(0, groundLineOffsetPx - 24)
      : Math.max(0, bottomPaddingPx * 0.3);
  const energyIndicatorHeight = Math.max(
    24,
    (Math.abs(energies.eg - energies.t2g) / Math.max(energyScale, 0.001)) * usableHeight
  );
  const indicatorBottom = Math.max(bottomPaddingPx - 20, 10);

  return (
    <Box sx={{ 
      position: 'relative', 
      width: '100%',
      height: '100%',
      minHeight: 'inherit',
      overflow: 'hidden',
      paddingTop: `${topPaddingPx}px`,
      paddingBottom: `${bottomPaddingPx}px`,
      boxSizing: 'border-box'
    }}>
      {/* Ground state reference line */}
      <Box
        sx={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: groundLineOffsetPx,
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
          top: `${Math.max(8, topPaddingPx / 3)}px`,
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
          bottom: `${groundLabelBottomPx}px`,
          color: isDarkMode ? '#888' : '#999',
          fontSize: '0.7rem'
        }}
      >
        Ground State
      </Box>
      
      {/* Centered container for orbital bars */}
      <Box sx={{ 
        position: 'absolute',
        inset: 0,
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
        minEnergyValue={minEnergyValue}
        energyScale={energyScale}
        baselinePadding={baselinePadding}
        isDarkMode={isDarkMode}
        diagramWidth={diagramWidth}
        containerHeight={diagramHeight}
        topPaddingPx={topPaddingPx}
        bottomPaddingPx={bottomPaddingPx}
      />
      <EnergyLevel 
        label="dxz" 
        energy={energies.t2g} 
        color="#4fc3f7" 
        geometry="octahedral"
        orbitalType="t2g"
        index={1}
        totalOrbitals={5}
        minEnergyValue={minEnergyValue}
        energyScale={energyScale}
        baselinePadding={baselinePadding}
        isDarkMode={isDarkMode}
        diagramWidth={diagramWidth}
        containerHeight={diagramHeight}
        topPaddingPx={topPaddingPx}
        bottomPaddingPx={bottomPaddingPx}
      />
      <EnergyLevel 
        label="dyz" 
        energy={energies.t2g} 
        color="#4fc3f7" 
        geometry="octahedral"
        orbitalType="t2g"
        index={2}
        totalOrbitals={5}
        minEnergyValue={minEnergyValue}
        energyScale={energyScale}
        baselinePadding={baselinePadding}
        isDarkMode={isDarkMode}
        diagramWidth={diagramWidth}
        containerHeight={diagramHeight}
        topPaddingPx={topPaddingPx}
        bottomPaddingPx={bottomPaddingPx}
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
        minEnergyValue={minEnergyValue}
        energyScale={energyScale}
        baselinePadding={baselinePadding}
        isDarkMode={isDarkMode}
        diagramWidth={diagramWidth}
        containerHeight={diagramHeight}
        topPaddingPx={topPaddingPx}
        bottomPaddingPx={bottomPaddingPx}
      />
      <EnergyLevel 
        label="dx²-y²" 
        energy={energies.eg} 
        color="#ff6b6b" 
        geometry="octahedral"
        orbitalType="eg"
        index={4}
        totalOrbitals={5}
        minEnergyValue={minEnergyValue}
        energyScale={energyScale}
        baselinePadding={baselinePadding}
        isDarkMode={isDarkMode}
        diagramWidth={diagramWidth}
        containerHeight={diagramHeight}
        topPaddingPx={topPaddingPx}
        bottomPaddingPx={bottomPaddingPx}
      />
      </Box>
      
      {/* Splitting indicator */}
      <motion.div
        animate={{ 
          height: energyIndicatorHeight
        }}
        transition={{ duration: 0.5 }}
        style={{
          position: 'absolute',
          right: '12px',
          bottom: indicatorBottom,
          width: '4px',
          background: 'linear-gradient(to top, #4fc3f7, #ff6b6b)',
          borderRadius: '2px',
          transformOrigin: 'bottom center'
        }}
      />
    </Box>
  );
}

// Tetrahedral energy diagram
function TetrahedralDiagram({
  energies,
  isDarkMode = true,
  diagramWidth = 360,
  diagramHeight = 300,
  minEnergyValue = 0,
  energyScale = 3.0,
  baselinePadding = 0.2,
  groundLineOffset = '6%'
}: { energies: TetrahedralEnergies } & DiagramCommonProps) {
  const topPaddingPx = Math.min(44, Math.max(16, diagramHeight * 0.1));
  const bottomPaddingPx = Math.min(72, Math.max(24, diagramHeight * 0.18));
  const usableHeight = Math.max(diagramHeight - topPaddingPx - bottomPaddingPx, 60);
  const groundLineOffsetPx =
    typeof groundLineOffset === 'string'
      ? Math.max(bottomPaddingPx - 20, 12)
      : groundLineOffset;
  const groundLabelBottomPx =
    typeof groundLineOffsetPx === 'number'
      ? Math.max(0, groundLineOffsetPx - 24)
      : Math.max(0, bottomPaddingPx * 0.3);
  const energyIndicatorHeight = Math.max(
    24,
    (Math.abs(energies.t2 - energies.e) / Math.max(energyScale, 0.001)) * usableHeight
  );
  const indicatorBottom = Math.max(bottomPaddingPx - 20, 10);

  return (
    <Box sx={{ 
      position: 'relative', 
      width: '100%',
      height: '100%',
      minHeight: 'inherit',
      overflow: 'hidden',
      paddingTop: `${topPaddingPx}px`,
      paddingBottom: `${bottomPaddingPx}px`,
      boxSizing: 'border-box'
    }}>
      {/* Ground state reference line */}
      <Box
        sx={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: groundLineOffsetPx,
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
          top: `${Math.max(8, topPaddingPx / 3)}px`,
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
          bottom: `${groundLabelBottomPx}px`,
          color: isDarkMode ? '#888' : '#999',
          fontSize: '0.7rem'
        }}
      >
        Ground State
      </Box>
      
      {/* Centered container for orbital bars */}
      <Box sx={{ 
        position: 'absolute',
        inset: 0,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%',
        height: '100%'
      }}>
      {/* e orbitals (lower energy) - all at same energy level */}
      <EnergyLevel 
        label="dz²" 
        energy={energies.e} 
        color="#4fc3f7" 
        geometry="tetrahedral"
        orbitalType="e"
        index={0}
        totalOrbitals={5}
        minEnergyValue={minEnergyValue}
        energyScale={energyScale}
        baselinePadding={baselinePadding}
        isDarkMode={isDarkMode}
        diagramWidth={diagramWidth}
        containerHeight={diagramHeight}
        topPaddingPx={topPaddingPx}
        bottomPaddingPx={bottomPaddingPx}
      />
      <EnergyLevel 
        label="dx²-y²" 
        energy={energies.e} 
        color="#4fc3f7" 
        geometry="tetrahedral"
        orbitalType="e"
        index={1}
        totalOrbitals={5}
        minEnergyValue={minEnergyValue}
        energyScale={energyScale}
        baselinePadding={baselinePadding}
        isDarkMode={isDarkMode}
        diagramWidth={diagramWidth}
        containerHeight={diagramHeight}
        topPaddingPx={topPaddingPx}
        bottomPaddingPx={bottomPaddingPx}
      />
      
      {/* t2 orbitals (higher energy) - all at same energy level */}
      <EnergyLevel 
        label="dxy" 
        energy={energies.t2} 
        color="#ff6b6b" 
        geometry="tetrahedral"
        orbitalType="t2"
        index={2}
        totalOrbitals={5}
        minEnergyValue={minEnergyValue}
        energyScale={energyScale}
        baselinePadding={baselinePadding}
        isDarkMode={isDarkMode}
        diagramWidth={diagramWidth}
        containerHeight={diagramHeight}
        topPaddingPx={topPaddingPx}
        bottomPaddingPx={bottomPaddingPx}
      />
      <EnergyLevel 
        label="dxz" 
        energy={energies.t2} 
        color="#ff6b6b" 
        geometry="tetrahedral"
        orbitalType="t2"
        index={3}
        totalOrbitals={5}
        minEnergyValue={minEnergyValue}
        energyScale={energyScale}
        baselinePadding={baselinePadding}
        isDarkMode={isDarkMode}
        diagramWidth={diagramWidth}
        containerHeight={diagramHeight}
        topPaddingPx={topPaddingPx}
        bottomPaddingPx={bottomPaddingPx}
      />
      <EnergyLevel 
        label="dyz" 
        energy={energies.t2} 
        color="#ff6b6b" 
        geometry="tetrahedral"
        orbitalType="t2"
        index={4}
        totalOrbitals={5}
        minEnergyValue={minEnergyValue}
        energyScale={energyScale}
        baselinePadding={baselinePadding}
        isDarkMode={isDarkMode}
        diagramWidth={diagramWidth}
        containerHeight={diagramHeight}
        topPaddingPx={topPaddingPx}
        bottomPaddingPx={bottomPaddingPx}
      />
      </Box>
      
      {/* Splitting indicator */}
      <motion.div
        animate={{ 
          height: energyIndicatorHeight
        }}
        transition={{ duration: 0.5 }}
        style={{
          position: 'absolute',
          right: '12px',
          bottom: indicatorBottom,
          width: '4px',
          background: 'linear-gradient(to top, #4fc3f7, #ff6b6b)',
          borderRadius: '2px',
          transformOrigin: 'bottom center'
        }}
      />
    </Box>
  );
}

// Square planar energy diagram
function SquarePlanarDiagram({
  energies,
  isDarkMode = true,
  diagramWidth = 360,
  diagramHeight = 300,
  minEnergyValue = 0,
  energyScale = 3.0,
  baselinePadding = 0.2,
  groundLineOffset = '6%'
}: { energies: SquarePlanarEnergies } & DiagramCommonProps) {
  const topPaddingPx = Math.min(44, Math.max(16, diagramHeight * 0.1));
  const bottomPaddingPx = Math.min(72, Math.max(24, diagramHeight * 0.18));
  const groundLineOffsetPx =
    typeof groundLineOffset === 'string'
      ? Math.max(bottomPaddingPx - 20, 12)
      : groundLineOffset;
  const groundLabelBottomPx = typeof groundLineOffsetPx === 'number'
    ? Math.max(0, groundLineOffsetPx - 24)
    : Math.max(0, bottomPaddingPx * 0.3);

  return (
    <Box sx={{ 
      position: 'relative', 
      width: '100%',
      height: '100%',
      minHeight: 'inherit',
      overflow: 'hidden',
      paddingTop: `${topPaddingPx}px`,
      paddingBottom: `${bottomPaddingPx}px`,
      boxSizing: 'border-box'
    }}>
      {/* Ground state reference line */}
      <Box
        sx={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: groundLineOffsetPx,
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
          top: `${Math.max(8, topPaddingPx / 3)}px`,
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
          bottom: `${groundLabelBottomPx}px`,
          color: isDarkMode ? '#888' : '#999',
          fontSize: '0.7rem'
        }}
      >
        Ground State
      </Box>
      
      {/* Centered container for orbital bars */}
      <Box sx={{ 
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center'
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
        minEnergyValue={minEnergyValue}
        energyScale={energyScale}
        baselinePadding={baselinePadding}
        isDarkMode={isDarkMode}
        diagramWidth={diagramWidth}
        containerHeight={diagramHeight}
        topPaddingPx={topPaddingPx}
        bottomPaddingPx={bottomPaddingPx}
      />
      <EnergyLevel 
        label="dyz" 
        energy={energies.dyz} 
        color="#4fc3f7" 
        geometry="squarePlanar"
        orbitalType="lower"
        index={1}
        totalOrbitals={5}
        minEnergyValue={minEnergyValue}
        energyScale={energyScale}
        baselinePadding={baselinePadding}
        isDarkMode={isDarkMode}
        diagramWidth={diagramWidth}
        containerHeight={diagramHeight}
        topPaddingPx={topPaddingPx}
        bottomPaddingPx={bottomPaddingPx}
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
        minEnergyValue={minEnergyValue}
        energyScale={energyScale}
        baselinePadding={baselinePadding}
        isDarkMode={isDarkMode}
        diagramWidth={diagramWidth}
        containerHeight={diagramHeight}
        topPaddingPx={topPaddingPx}
        bottomPaddingPx={bottomPaddingPx}
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
        minEnergyValue={minEnergyValue}
        energyScale={energyScale}
        baselinePadding={baselinePadding}
        isDarkMode={isDarkMode}
        diagramWidth={diagramWidth}
        containerHeight={diagramHeight}
        topPaddingPx={topPaddingPx}
        bottomPaddingPx={bottomPaddingPx}
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
        minEnergyValue={minEnergyValue}
        energyScale={energyScale}
        baselinePadding={baselinePadding}
        isDarkMode={isDarkMode}
        diagramWidth={diagramWidth}
        containerHeight={diagramHeight}
        topPaddingPx={topPaddingPx}
        bottomPaddingPx={bottomPaddingPx}
      />
      </Box>
    </Box>
  );
}

type OrbitalSplittingDiagramProps = {
  geometryType: GeometryType;
  distance: number;
  ligandStrength: number;
  isDarkMode?: boolean;
};

export default function OrbitalSplittingDiagram({
  geometryType,
  distance,
  ligandStrength,
  isDarkMode = true
}: OrbitalSplittingDiagramProps) {
  const energies = useMemo<EnergyResult | undefined>(() => {
    console.log(`🔄 Recalculating energies for: ${geometryType}, distance: ${distance}, ligandStrength: ${ligandStrength}`);
    const result = calculateSplitting(geometryType, distance, ligandStrength);
    console.log(`✅ Final energies:`, result);
    return result;
  }, [geometryType, distance, ligandStrength]);

  const typedEnergies = useMemo(() => {
    if (!energies) {
      return null;
    }

    if ('eg' in energies && 't2g' in energies) {
      return { geometry: 'octahedral', data: energies as OctahedralEnergies } as const;
    }

    if ('t2' in energies && 'e' in energies) {
      return { geometry: 'tetrahedral', data: energies as TetrahedralEnergies } as const;
    }

    if ('dx2y2' in energies && 'dxy' in energies) {
      return { geometry: 'squarePlanar', data: energies as SquarePlanarEnergies } as const;
    }

    return null;
  }, [energies]);

  const energyStats = useMemo(() => {
    if (!typedEnergies) {
      return {
        minEnergy: 0,
        maxEnergy: 3,
        range: 3,
        baselinePadding: 0.2,
        topPadding: 0.5,
        energyScale: 3.7
      };
    }

    const { geometry, data } = typedEnergies;

    const energyValues =
      geometry === 'octahedral'
        ? [data.eg, data.t2g]
        : geometry === 'tetrahedral'
        ? [data.t2, data.e]
        : [data.dx2y2, data.dxy, data.dz2, data.dxz, data.dyz];

    const minEnergy = Math.min(...energyValues);
    const maxEnergy = Math.max(...energyValues);
    const range = Math.max(maxEnergy - minEnergy, 0.001);
    const baselinePadding = Math.max(range * 0.1, 0.15);
    const topPadding = Math.max(range * 0.2, 0.3);
    const energyScale = range + baselinePadding + topPadding;

    return { minEnergy, maxEnergy, range, baselinePadding, topPadding, energyScale };
  }, [typedEnergies]);

  console.log('📊 Energy stats:', energyStats);

  const diagramRef = useRef<HTMLDivElement | null>(null);
  const [diagramSize, setDiagramSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    if (!diagramRef.current) return;

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      const { width, height } = entry.contentRect;
      setDiagramSize((prev) =>
        prev.width === width && prev.height === height ? prev : { width, height }
      );
    });

    observer.observe(diagramRef.current);

    return () => {
      observer.disconnect();
    };
  }, []);

  useEffect(() => {
    if (!diagramRef.current) return;
    const rect = diagramRef.current.getBoundingClientRect();
    setDiagramSize({ width: rect.width, height: rect.height });
  }, [geometryType]);

  const effectiveDiagramWidth = diagramSize.width || 360;
  const effectiveDiagramHeight = diagramSize.height || 300;
  const groundLineOffset = effectiveDiagramHeight <= 260 ? '2%' : effectiveDiagramHeight <= 320 ? '4%' : '6%';
  const splittingValue = typedEnergies?.data.splitting ?? 0;

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
        {geometryType === 'octahedral' ? 'Octahedral (Oh)' : geometryType === 'tetrahedral' ? 'Tetrahedral (Td)' : 'Square Planar (D4h)'}
      </Typography>
      
      <Box ref={diagramRef} sx={{ 
        position: 'relative', 
        flex: 1,
        minHeight: { xs: '140px', sm: '220px', md: '300px' },
        height: '100%',
        maxHeight: { xs: 'none', md: '420px' },
        minWidth: 0
      }}>
        {typedEnergies && typedEnergies.geometry === 'octahedral' && (
          <OctahedralDiagram
            energies={typedEnergies.data}
            isDarkMode={isDarkMode}
            diagramWidth={effectiveDiagramWidth}
            diagramHeight={effectiveDiagramHeight}
            minEnergyValue={energyStats.minEnergy}
            energyScale={energyStats.energyScale}
            baselinePadding={energyStats.baselinePadding}
            groundLineOffset={groundLineOffset}
          />
        )}
        {typedEnergies && typedEnergies.geometry === 'tetrahedral' && (
          <TetrahedralDiagram
            energies={typedEnergies.data}
            isDarkMode={isDarkMode}
            diagramWidth={effectiveDiagramWidth}
            diagramHeight={effectiveDiagramHeight}
            minEnergyValue={energyStats.minEnergy}
            energyScale={energyStats.energyScale}
            baselinePadding={energyStats.baselinePadding}
            groundLineOffset={groundLineOffset}
          />
        )}
        {typedEnergies && typedEnergies.geometry === 'squarePlanar' && (
          <SquarePlanarDiagram
            energies={typedEnergies.data}
            isDarkMode={isDarkMode}
            diagramWidth={effectiveDiagramWidth}
            diagramHeight={effectiveDiagramHeight}
            minEnergyValue={energyStats.minEnergy}
            energyScale={energyStats.energyScale}
            baselinePadding={energyStats.baselinePadding}
            groundLineOffset={groundLineOffset}
          />
        )}
      </Box>
      
      {/* Splitting value display */}
      <Box sx={{ mt: { xs: 0.5, sm: 1 }, textAlign: 'center' }}>
        <Typography 
          variant="body2" 
          sx={{ 
            color: isDarkMode ? '#aaa' : '#666',
            fontSize: { xs: '0.8rem', sm: '0.9rem' }
          }}
        >
        Δ = {splittingValue.toFixed(2)} eV
        </Typography>
      </Box>
    </Paper>
  );
}
