import { lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { Box, Paper, Chip } from '@mui/material';
import Button from '@mui/material/Button';
import SwipeableDrawer from '@mui/material/SwipeableDrawer';
import useMediaQuery from '@mui/material/useMediaQuery';
import CircularProgress from '@mui/material/CircularProgress';
import './App.css';

type OrbitalKey = 'dxy' | 'dxz' | 'dyz' | 'dz2' | 'dx2y2';
type GeometryOption = 'octahedral' | 'tetrahedral' | 'squarePlanar';

const MetalComplexScene = lazy(() => import('./components/MetalComplexScene'));
const OrbitalSplittingDiagram = lazy(() => import('./components/OrbitalSplittingDiagram'));
const ControlsPanel = lazy(() => import('./components/ControlsPanel'));
const OrbitalControls = lazy(() => import('./components/OrbitalControls'));
const OrbitControlsLazy = lazy(async () => {
  const module = await import('@react-three/drei/core/OrbitControls');
  return { default: module.OrbitControls };
});

const ORBITAL_FILTERS: ReadonlyArray<{
  key: OrbitalKey;
  label: string;
  color: string;
  darkBg: string;
  lightBg: string;
}> = [
  { key: 'dxy', label: 'dxy', color: '#4fc3f7', darkBg: '#4fc3f7', lightBg: '#0288d1' },
  { key: 'dxz', label: 'dxz', color: '#66bb6a', darkBg: '#66bb6a', lightBg: '#388e3c' },
  { key: 'dyz', label: 'dyz', color: '#ef5350', darkBg: '#ef5350', lightBg: '#c62828' },
  { key: 'dz2', label: 'dz²', color: '#26c6da', darkBg: '#26c6da', lightBg: '#00838f' },
  { key: 'dx2y2', label: 'dx²-y²', color: '#ab47bc', darkBg: '#ab47bc', lightBg: '#7b1fa2' }
] as const;

function PanelFallback({ minHeight = 160 }: { minHeight?: number | string }) {
  return (
    <Box
      sx={{
        minHeight,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%'
      }}
    >
      <CircularProgress size={28} />
    </Box>
  );
}

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
  const [geometryType, setGeometryType] = useState<GeometryOption>('octahedral');
  const [distance, setDistance] = useState(2.0);
  const [ligandStrength, setLigandStrength] = useState(6);
  const showOrbitals = true;
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [isControlsDrawerOpen, setIsControlsDrawerOpen] = useState(false);
  const [mobileSplitRatio, setMobileSplitRatio] = useState(0.55);
  const [isSplitResizing, setIsSplitResizing] = useState(false);
  
  // Individual orbital controls
  const [orbitalStates, setOrbitalStates] = useState<Record<OrbitalKey, boolean>>({
    dz2: true,
    dx2y2: true,
    dxy: true,
    dxz: true,
    dyz: true
  });
  
  const [orbitalScales, setOrbitalScales] = useState<Record<OrbitalKey, number>>({
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
  const isMobile = useMediaQuery('(max-width:900px)');
  const splitContainerRef = useRef<HTMLDivElement | null>(null);
  const splitResizeStateRef = useRef({ startY: 0, startRatio: 0.55, containerHeight: 1 });
  const previousUserSelectRef = useRef<string>('');

  const handleSplitResizeMove = useCallback((event: PointerEvent) => {
    const { startY, startRatio, containerHeight } = splitResizeStateRef.current;
    if (containerHeight <= 0) {
      return;
    }
    const delta = event.clientY - startY;
    const ratioDelta = delta / containerHeight;
    const minRatio = 0.12;
    const maxRatio = 0.75;
    const nextRatio = Math.min(Math.max(startRatio + ratioDelta, minRatio), maxRatio);
    setMobileSplitRatio(nextRatio);
  }, []);

  const stopSplitResize = useCallback(() => {
    setIsSplitResizing(false);
    window.removeEventListener('pointermove', handleSplitResizeMove);
    window.removeEventListener('pointerup', stopSplitResize);
    if (typeof document !== 'undefined') {
      document.body.style.userSelect = previousUserSelectRef.current;
    }
  }, [handleSplitResizeMove]);

  const handleSplitResizeStart = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (!isMobile) {
        return;
      }
      const container = splitContainerRef.current;
      if (!container) {
        return;
      }
      const rect = container.getBoundingClientRect();
      splitResizeStateRef.current = {
        startY: event.clientY,
        startRatio: mobileSplitRatio,
        containerHeight: rect.height || 1,
      };
      previousUserSelectRef.current =
        typeof document !== 'undefined' ? document.body.style.userSelect : '';
      if (typeof document !== 'undefined') {
        document.body.style.userSelect = 'none';
      }
      setIsSplitResizing(true);
      window.addEventListener('pointermove', handleSplitResizeMove);
      window.addEventListener('pointerup', stopSplitResize);
      event.preventDefault();
    },
    [handleSplitResizeMove, isMobile, mobileSplitRatio, stopSplitResize]
  );

  useEffect(() => {
    if (!isMobile && isControlsDrawerOpen) {
      setIsControlsDrawerOpen(false);
    }
  }, [isMobile, isControlsDrawerOpen]);

  useEffect(() => {
    return () => {
      window.removeEventListener('pointermove', handleSplitResizeMove);
      window.removeEventListener('pointerup', stopSplitResize);
      if (typeof document !== 'undefined') {
        document.body.style.userSelect = previousUserSelectRef.current;
      }
    };
  }, [handleSplitResizeMove, stopSplitResize]);

  const metalSceneCard = (
    <Paper
      elevation={3}
      sx={{
        flex: 1,
        height: '100%',
        width: '100%',
        borderRadius: 0,
        background: isDarkMode
          ? 'linear-gradient(135deg, #1e1e1e 0%, #2d2d2d 100%)'
          : 'linear-gradient(135deg, #f5f5f5 0%, #e8e8e8 100%)',
        position: 'relative'
      }}
    >
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
          {ORBITAL_FILTERS.map((orbital) => (
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
          camera.up.set(0, 0, 1);
          camera.lookAt(0, 0, 0);
        }}
      >
        <ambientLight intensity={0.4} />
        <directionalLight position={[10, 10, 5]} intensity={0.6} />
        <pointLight position={[-10, -10, -5]} intensity={0.3} />

        <Suspense fallback={null}>
          <MetalComplexScene
            geometryType={geometryType}
            distance={distance}
            showOrbitals={showOrbitals}
            ligandColor={selectedLigand.color}
            orbitalStates={orbitalStates}
            orbitalScales={orbitalScales}
            isDarkMode={isDarkMode}
          />
        </Suspense>

        <Suspense fallback={null}>
          <OrbitControlsLazy
            enablePan={true}
            enableZoom={true}
            enableRotate={true}
            minDistance={3}
            maxDistance={20}
          />
        </Suspense>
      </Canvas>
    </Paper>
  );

  const orbitalDiagramContent = (
    <Suspense fallback={<PanelFallback minHeight="220px" />}>
      <OrbitalSplittingDiagram
        geometryType={geometryType}
        distance={distance}
        ligandStrength={ligandStrength}
        isDarkMode={isDarkMode}
      />
    </Suspense>
  );

  const controlsContent = (
    <>
      <Suspense fallback={<PanelFallback />}>
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
      </Suspense>
      <Box sx={{ mt: 2 }}>
        <Suspense fallback={<PanelFallback minHeight={140} />}>
          <OrbitalControls
            orbitalStates={orbitalStates}
            setOrbitalStates={setOrbitalStates}
            orbitalScales={orbitalScales}
            setOrbitalScales={setOrbitalScales}
            isDarkMode={isDarkMode}
          />
        </Suspense>
      </Box>
    </>
  );

  const mobileLayout = (
    <Box
      sx={{
        height: '100vh',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        backgroundColor: currentTheme.palette.background.default
      }}
    >
      <Box
        ref={splitContainerRef}
        sx={{
          flex: 1,
          minHeight: 0,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}
      >
        <Box
          sx={{
            flexGrow: mobileSplitRatio,
            flexBasis: 0,
            minHeight: 220,
            minWidth: 0,
            display: 'flex',
            flexDirection: 'column'
          }}
        >
          {metalSceneCard}
        </Box>

        <Box
          onPointerDown={handleSplitResizeStart}
          sx={{
            flexShrink: 0,
            height: 18,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'row-resize',
            touchAction: 'none',
            userSelect: 'none',
            opacity: isSplitResizing ? 1 : 0.9
          }}
        >
          <Box
            sx={{
              width: 48,
              height: 4,
              borderRadius: 999,
              backgroundColor: isDarkMode ? 'rgba(144, 202, 249, 0.6)' : 'rgba(25, 118, 210, 0.6)'
            }}
          />
        </Box>

        <Box
          sx={{
            flexGrow: 1 - mobileSplitRatio,
            flexBasis: 0,
            minHeight: 220,
            minWidth: 0,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            p: { xs: 1, sm: 2 },
            pt: { xs: 0.5, sm: 1.5 }
          }}
        >
          <Box sx={{ flex: 1, minHeight: 0 }}>
            {orbitalDiagramContent}
          </Box>
        </Box>
      </Box>

      <Box
        sx={{
          flexShrink: 0,
          p: { xs: 1, sm: 2 },
          borderTop: `1px solid ${isDarkMode ? '#333' : '#e0e0e0'}`,
          backgroundColor: isDarkMode ? '#1e1e1e' : '#ffffff'
        }}
      >
        <Button
          variant="contained"
          color="primary"
          fullWidth
          onClick={() => setIsControlsDrawerOpen(true)}
        >
          Open Controls
        </Button>
      </Box>

      <SwipeableDrawer
        anchor="bottom"
        open={isControlsDrawerOpen}
        onClose={() => setIsControlsDrawerOpen(false)}
        onOpen={() => setIsControlsDrawerOpen(true)}
        disableDiscovery
        PaperProps={{
          sx: {
            background: 'transparent'
          }
        }}
      >
        <Box
          sx={{
            background: isDarkMode
              ? 'linear-gradient(135deg, #1e1e1e 0%, #2a2a2a 100%)'
              : 'linear-gradient(135deg, #ffffff 0%, #f5f5f5 100%)',
            borderTopLeftRadius: 16,
            borderTopRightRadius: 16,
            p: { xs: 2, sm: 3 },
            pb: { xs: 4, sm: 5 },
            maxHeight: '80vh',
            overflowY: 'auto'
          }}
        >
          {controlsContent}
          <Button
            variant="outlined"
            fullWidth
            sx={{ mt: 2 }}
            onClick={() => setIsControlsDrawerOpen(false)}
          >
            Close
          </Button>
        </Box>
      </SwipeableDrawer>
    </Box>
  );

  const desktopLayout = (
    <Box
      sx={{
        minHeight: '100vh',
        width: '100%',
        display: 'flex',
        flexDirection: 'row',
        overflow: 'hidden'
      }}
    >
      <Box
        sx={{
          flex: 1,
          minWidth: 0,
          height: '100vh',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {metalSceneCard}
      </Box>

      <Box
        sx={{
          flex: 1,
          minWidth: 0,
          height: '100vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}
      >
        <Box
          sx={{
            flex: 1,
            minHeight: 0,
            p: { xs: 1, sm: 2 },
            overflow: 'hidden'
          }}
        >
          <Box sx={{ flex: 1, minHeight: 0 }}>
            {orbitalDiagramContent}
          </Box>
        </Box>

        <Box
          sx={{
            p: { xs: 1, sm: 2 },
            borderTop: `1px solid ${isDarkMode ? '#333' : '#e0e0e0'}`,
            maxHeight: '40vh',
            overflowY: 'auto'
          }}
        >
          {controlsContent}
        </Box>
      </Box>
    </Box>
  );

  return (
    <ThemeProvider theme={currentTheme}>
      <CssBaseline />
      {isMobile ? mobileLayout : desktopLayout}
    </ThemeProvider>
  );
}

export default App;
