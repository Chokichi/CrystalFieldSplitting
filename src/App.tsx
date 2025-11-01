import React, { useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { Box, Grid, Paper, Chip } from '@mui/material';
import MetalComplexScene from './components/MetalComplexScene';
import OrbitalSplittingDiagram from './components/OrbitalSplittingDiagram';
import ControlsPanel from './components/ControlsPanel';
import OrbitalControls from './components/OrbitalControls';
import './App.css';

const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#90caf9',
    },
    secondary: {
      main: '#f48fb1',
    },
    background: {
      default: '#121212',
      paper: '#1e1e1e',
    },
  },
});

const lightTheme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
    background: {
      default: '#fafafa',
      paper: '#ffffff',
    },
    text: {
      primary: '#212121',
      secondary: '#666666',
    },
  },
});

function App() {
  const [geometryType, setGeometryType] = useState('octahedral');
  const [distance, setDistance] = useState(2.0);
  const [ligandStrength, setLigandStrength] = useState(6);
  const [showOrbitals, setShowOrbitals] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(true);
  
  // Individual orbital controls
  const [orbitalStates, setOrbitalStates] = useState({
    dz2: true,
    dx2y2: true,
    dxy: true,
    dxz: true,
    dyz: true
  });
  
  const [orbitalScales, setOrbitalScales] = useState({
    dz2: 0.6,
    dx2y2: 1.0,
    dxy: 1.0,
    dxz: 1.0,
    dyz: 1.0
  });

  const ligands = [
    { name: 'I⁻', strength: 1, color: '#ff6b6b' },
    { name: 'Br⁻', strength: 2, color: '#4ecdc4' },
    { name: 'Cl⁻', strength: 3, color: '#45b7d1' },
    { name: 'NO₂⁻', strength: 9, color: '#a8e6cf' },
    { name: 'OH⁻', strength: 5, color: '#88d8c0' },
    { name: 'F⁻', strength: 4, color: '#ffd93d' },
    { name: 'H₂O', strength: 6, color: '#96ceb4' },
    { name: 'NH₃', strength: 7, color: '#feca57' },
    { name: 'en', strength: 8, color: '#ff9ff3' },
    { name: 'CN⁻', strength: 10, color: '#c44569' },
  ];

  const selectedLigand = ligands.find(l => l.strength === ligandStrength) || ligands[4];
  const currentTheme = isDarkMode ? darkTheme : lightTheme;

  return (
    <ThemeProvider theme={currentTheme}>
      <CssBaseline />
      <Box 
        sx={{ 
          height: '100vh', 
          width: '100vw',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' }
        }}
      >
        {/* Left Panel - 3D Scene */}
        <Box 
          sx={{ 
            flex: 1,
            height: { xs: '50vh', md: '100vh' },
            width: { xs: '100vw', md: '50vw' },
            minHeight: { xs: '300px', md: '100vh' }
          }}
        >
          <Paper 
            elevation={3} 
            sx={{ 
              height: '100%', 
              width: '100%',
              borderRadius: 0,
              background: isDarkMode 
                ? 'linear-gradient(135deg, #1e1e1e 0%, #2d2d2d 100%)'
                : 'linear-gradient(135deg, #f5f5f5 0%, #e8e8e8 100%)',
              position: 'relative'
            }}
          >
            {/* D-Orbital Chip Filters */}
            {showOrbitals && (
              <Box
                sx={{
                  position: 'absolute',
                  top: '10px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  display: 'flex',
                  gap: 1,
                  zIndex: 10,
                  flexWrap: 'wrap',
                  justifyContent: 'center',
                  maxWidth: '90%'
                }}
              >
                {[
                  { key: 'dxy', label: 'dxy', color: '#4fc3f7', darkBg: '#4fc3f7', lightBg: '#0288d1' },
                  { key: 'dxz', label: 'dxz', color: '#66bb6a', darkBg: '#66bb6a', lightBg: '#388e3c' },
                  { key: 'dyz', label: 'dyz', color: '#ef5350', darkBg: '#ef5350', lightBg: '#c62828' },
                  { key: 'dz2', label: 'dz²', color: '#26c6da', darkBg: '#26c6da', lightBg: '#00838f' },
                  { key: 'dx2y2', label: 'dx²-y²', color: '#ab47bc', darkBg: '#ab47bc', lightBg: '#7b1fa2' }
                ].map((orbital) => (
                  <Chip
                    key={orbital.key}
                    label={orbital.label}
                    onClick={() => {
                      setOrbitalStates(prev => ({
                        ...prev,
                        [orbital.key]: !prev[orbital.key]
                      }));
                    }}
                    sx={{
                      backgroundColor: orbitalStates[orbital.key]
                        ? orbital.darkBg
                        : (isDarkMode ? `${orbital.darkBg}33` : `${orbital.lightBg}33`),
                      color: orbitalStates[orbital.key] ? 'white' : (isDarkMode ? orbital.darkBg : orbital.lightBg),
                      border: orbitalStates[orbital.key]
                        ? 'none'
                        : `1px solid ${isDarkMode ? orbital.darkBg : orbital.lightBg}`,
                      cursor: 'pointer',
                      fontWeight: orbitalStates[orbital.key] ? 'bold' : 'normal',
                      fontSize: { xs: '0.7rem', sm: '0.8rem' },
                      '&:hover': {
                        backgroundColor: orbitalStates[orbital.key]
                          ? orbital.darkBg
                          : (isDarkMode ? `${orbital.darkBg}66` : `${orbital.lightBg}66`),
                      }
                    }}
                  />
                ))}
              </Box>
            )}
            
            <Canvas
              camera={{ position: [5, 5, 5], fov: 50 }}
              style={{ 
                height: '100%', 
                width: '100%',
                background: 'transparent',
                position: 'absolute',
                top: 0,
                left: 0
              }}
              onCreated={({ camera }) => {
                // Set z-axis to point up (standard chemistry convention)
                camera.up.set(0, 0, 1);
                camera.lookAt(0, 0, 0);
              }}
            >
              <ambientLight intensity={0.4} />
              <directionalLight position={[10, 10, 5]} intensity={0.6} />
              <pointLight position={[-10, -10, -5]} intensity={0.3} />
              
              <MetalComplexScene
                geometryType={geometryType}
                distance={distance}
                showOrbitals={showOrbitals}
                ligandColor={selectedLigand.color}
                orbitalStates={orbitalStates}
                orbitalScales={orbitalScales}
                isDarkMode={isDarkMode}
              />
              
              <OrbitControls 
                enablePan={true}
                enableZoom={true}
                enableRotate={true}
                minDistance={3}
                maxDistance={20}
              />
            </Canvas>
          </Paper>
        </Box>

        {/* Right Panel - Energy Diagram and Controls */}
        <Box 
          sx={{ 
            flex: 1,
            height: { xs: '50vh', md: '100vh' },
            width: { xs: '100vw', md: '50vw' },
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
          }}
        >
          {/* Energy Diagram */}
          <Box 
            sx={{ 
              flex: 1,
              p: { xs: 1, sm: 2 },
              minHeight: { xs: '200px', md: '300px' },
              overflow: 'hidden'
            }}
          >
            <OrbitalSplittingDiagram
              geometryType={geometryType}
              distance={distance}
              ligandStrength={ligandStrength}
              isDarkMode={isDarkMode}
            />
          </Box>

          {/* Controls Panel */}
          <Box 
            sx={{ 
              p: { xs: 1, sm: 2 },
              borderTop: '1px solid #333',
              maxHeight: { xs: '50vh', md: '40vh' },
              overflow: 'auto'
            }}
          >
            <ControlsPanel
              geometryType={geometryType}
              setGeometryType={setGeometryType}
              distance={distance}
              setDistance={setDistance}
              ligandStrength={ligandStrength}
              setLigandStrength={setLigandStrength}
              ligands={ligands}
              isDarkMode={isDarkMode}
              setIsDarkMode={setIsDarkMode}
            />
            
            {/* Orbital Controls */}
            <Box sx={{ mt: 2 }}>
              <OrbitalControls
                orbitalStates={orbitalStates}
                setOrbitalStates={setOrbitalStates}
                orbitalScales={orbitalScales}
                setOrbitalScales={setOrbitalScales}
                isDarkMode={isDarkMode}
              />
            </Box>
          </Box>
        </Box>
      </Box>
    </ThemeProvider>
  );
}

export default App;
