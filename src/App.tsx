import { lazy, Suspense, useCallback, useEffect, useRef, useState, type MutableRefObject } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { Box, Paper, Chip } from '@mui/material';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import './App.css';
import type { PerspectiveCamera } from 'three';
import FloatingCard, {
  CARD_IDS,
  clampCard,
  dockEdgeForPoint,
  dockSplitters,
  DockSplitter,
  layoutCardRects,
  loadCardLayout,
  normalizeLayout,
  previewRect,
  resolveDockSize,
  saveCardLayout,
  viewerBounds,
  type CardId,
  type CardLayout,
  type DockEdge,
} from './components/FloatingCard';
import ControlsPanel, { LigandDistanceControl } from './components/ControlsPanel';

type OrbitalKey = 'dxy' | 'dxz' | 'dyz' | 'dz2' | 'dx2y2';
type GeometryOption = 'octahedral' | 'tetrahedral' | 'squarePlanar';

const MetalComplexScene = lazy(() => import('./components/MetalComplexScene'));
const OrbitalSplittingDiagram = lazy(() => import('./components/OrbitalSplittingDiagram'));
const OrbitalControls = lazy(() => import('./components/OrbitalControls'));
const OrbitControlsLazy = lazy(async () => {
  const module = await import('@react-three/drei/core/OrbitControls');
  return { default: module.OrbitControls };
});

type ViewPan = { x: number; y: number };

// Shift-drag shifts the projection instead of the orbit target, so a later drag
// still spins the model around its own center.

function applyViewPan(camera: PerspectiveCamera, width: number, height: number, pan: ViewPan) {
  if (width < 1 || height < 1) {
    return;
  }
  if (pan.x === 0 && pan.y === 0) {
    if (camera.view?.enabled) {
      camera.clearViewOffset();
    }
    return;
  }
  const offsetX = -pan.x;
  const offsetY = -pan.y;
  const view = camera.view;
  if (
    view?.enabled
    && view.fullWidth === width
    && view.fullHeight === height
    && view.offsetX === offsetX
    && view.offsetY === offsetY
    && view.width === width
    && view.height === height
  ) {
    return;
  }
  camera.setViewOffset(width, height, offsetX, offsetY, width, height);
}

function ModelViewPan({ panRef }: { panRef: MutableRefObject<ViewPan> }) {
  const camera = useThree((state) => state.camera) as PerspectiveCamera;
  const gl = useThree((state) => state.gl);
  const get = useThree((state) => state.get);

  useEffect(() => {
    const element = gl.domElement;
    let dragging = false;
    let lastX = 0;
    let lastY = 0;

    const isPanGesture = (event: PointerEvent) => (
      event.button === 2 || (event.button === 0 && (event.shiftKey || event.ctrlKey || event.metaKey))
    );

    const onPointerDown = (event: PointerEvent) => {
      if (!isPanGesture(event)) {
        return;
      }
      dragging = true;
      lastX = event.clientX;
      lastY = event.clientY;
      event.preventDefault();
      event.stopPropagation();
    };

    const onPointerMove = (event: PointerEvent) => {
      if (!dragging) {
        return;
      }
      panRef.current.x += event.clientX - lastX;
      panRef.current.y += event.clientY - lastY;
      lastX = event.clientX;
      lastY = event.clientY;
      event.preventDefault();
      event.stopPropagation();
    };

    const onPointerUp = (event: PointerEvent) => {
      if (!dragging) {
        return;
      }
      dragging = false;
      event.stopPropagation();
    };

    element.addEventListener('pointerdown', onPointerDown, true);
    window.addEventListener('pointermove', onPointerMove, true);
    window.addEventListener('pointerup', onPointerUp, true);
    window.addEventListener('pointercancel', onPointerUp, true);
    return () => {
      element.removeEventListener('pointerdown', onPointerDown, true);
      window.removeEventListener('pointermove', onPointerMove, true);
      window.removeEventListener('pointerup', onPointerUp, true);
      window.removeEventListener('pointercancel', onPointerUp, true);
    };
  }, [gl, panRef]);

  useFrame(() => {
    const { width, height } = get().size;
    applyViewPan(camera, width, height, panRef.current);
  });

  return null;
}

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
  const [cardLayout, setCardLayout] = useState<CardLayout>(() => loadCardLayout());
  const [cardOrder, setCardOrder] = useState<CardId[]>(['settings', 'orbitals', 'diagram']);
  const [dockPreview, setDockPreview] = useState<{ id: CardId; edge: DockEdge } | null>(null);
  const cameraRef = useRef<PerspectiveCamera | null>(null);
  const orbitControlsRef = useRef<any>(null);
  const viewPanRef = useRef<ViewPan>({ x: 0, y: 0 });
  
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

  const updateCard = useCallback((id: CardId, frame: CardLayout[CardId]) => {
    setCardLayout((current) => {
      const fitted = frame.dock
        ? { ...frame, dockSize: resolveDockSize(frame.dock, frame.dockSize, current, id) }
        : frame;
      const next: CardLayout = { ...current, [id]: fitted };
      if (fitted.dock && fitted.dockSize !== current[id].dockSize) {
        CARD_IDS.forEach((other) => {
          if (other !== id && next[other].dock === fitted.dock) {
            next[other] = { ...next[other], dockSize: fitted.dockSize };
          }
        });
      }
      saveCardLayout(next);
      return next;
    });
  }, []);

  const dropCard = useCallback((id: CardId, frame: CardLayout[CardId], point: { x: number; y: number }) => {
    setCardLayout((current) => {
      const edge = dockEdgeForPoint(point.x, point.y, current);
      let nextFrame = clampCard({ ...frame, dock: null });
      if (edge) {
        const siblings = CARD_IDS.filter((cardId) => cardId !== id && current[cardId].dock === edge);
        const dockSize = resolveDockSize(
          edge,
          siblings.length
            ? current[siblings[0]].dockSize
            : (edge === 'left' || edge === 'right' ? frame.width : frame.height),
          current,
          id
        );
        const dockOrder = siblings.reduce((max, cardId) => Math.max(max, current[cardId].dockOrder), 0) + 1;
        nextFrame = clampCard({
          ...frame,
          dock: edge,
          dockSize,
          dockOrder,
          collapsed: false,
        });
      }
      const next: CardLayout = { ...current, [id]: nextFrame };
      saveCardLayout(next);
      return next;
    });
    setDockPreview(null);
  }, []);

  const updateDockWeights = useCallback((a: CardId, weightA: number, b: CardId, weightB: number) => {
    setCardLayout((current) => {
      const next = {
        ...current,
        [a]: { ...current[a], dockWeight: weightA },
        [b]: { ...current[b], dockWeight: weightB },
      };
      saveCardLayout(next);
      return next;
    });
  }, []);

  const focusCard = useCallback((id: CardId) => {
    setCardOrder((current) => (current[current.length - 1] === id ? current : [...current.filter((cardId) => cardId !== id), id]));
  }, []);

  useEffect(() => {
    const clampToViewport = () => {
      setCardLayout((current) => {
        const next = normalizeLayout(current);
        saveCardLayout(next);
        return next;
      });
    };
    window.addEventListener('resize', clampToViewport);
    return () => window.removeEventListener('resize', clampToViewport);
  }, []);

  const resetCameraView = useCallback(() => {
    const camera = cameraRef.current;
    const controls = orbitControlsRef.current;
    viewPanRef.current.x = 0;
    viewPanRef.current.y = 0;

    if (camera) {
      camera.clearViewOffset();
      camera.position.set(6, 6, 5);
      camera.up.set(0, 0, 1);
      camera.lookAt(0, 0, 0);
    }

    if (controls) {
      controls.target.set(0, 0, 0);
      controls.update();
    }
  }, []);

  const view = viewerBounds(cardLayout);

  const metalSceneCard = (
    <Paper
      elevation={3}
      sx={{
        position: 'absolute',
        left: view.x,
        top: view.y,
        width: view.width,
        height: view.height,
        borderRadius: 0,
        overflow: 'hidden',
        background: isDarkMode
          ? 'linear-gradient(135deg, #1e1e1e 0%, #2d2d2d 100%)'
          : 'linear-gradient(135deg, #f5f5f5 0%, #e8e8e8 100%)',
      }}
    >
      <Box
        sx={{
          position: 'absolute',
          bottom: 16,
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 12,
          display: 'flex',
          gap: 1
        }}
      >
        <Button
          size="small"
          variant="contained"
          color="primary"
          onClick={resetCameraView}
        >
          Reset View
        </Button>
      </Box>

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
          cameraRef.current = camera as PerspectiveCamera;
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

        <ModelViewPan panRef={viewPanRef} />
        <Suspense fallback={null}>
          <OrbitControlsLazy
            enablePan={false}
            enableZoom={true}
            enableRotate={true}
            minDistance={3}
            maxDistance={20}
            ref={orbitControlsRef}
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
        embedded
      />
    </Suspense>
  );

  const controlsContent = (
    <Suspense fallback={<PanelFallback />}>
      <ControlsPanel
        geometryType={geometryType}
        setGeometryType={setGeometryType}
        ligandStrength={ligandStrength}
        setLigandStrength={setLigandStrength}
        ligands={ligands}
        isDarkMode={isDarkMode}
        setIsDarkMode={setIsDarkMode}
      />
    </Suspense>
  );

  const orbitalToolsContent = (
    <>
      <LigandDistanceControl
        distance={distance}
        setDistance={setDistance}
        isDarkMode={isDarkMode}
      />
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

  const rects = layoutCardRects(cardLayout);
  const splitters = dockSplitters(cardLayout, rects);
  const preview = dockPreview ? previewRect(cardLayout, dockPreview.id, dockPreview.edge) : null;

  return (
    <ThemeProvider theme={currentTheme}>
      <CssBaseline />
      <Box
        sx={{
          position: 'relative',
          height: '100vh',
          width: '100%',
          overflow: 'hidden',
          backgroundColor: currentTheme.palette.background.default
        }}
      >
        {metalSceneCard}
        {preview && (
          <Box
            aria-hidden
            sx={{
              position: 'absolute',
              left: preview.x,
              top: preview.y,
              width: preview.width,
              height: preview.height,
              zIndex: 11,
              pointerEvents: 'none',
              border: `2px solid ${isDarkMode ? 'rgba(144, 202, 249, 0.9)' : 'rgba(25, 118, 210, 0.9)'}`,
              background: isDarkMode ? 'rgba(144, 202, 249, 0.16)' : 'rgba(25, 118, 210, 0.12)',
            }}
          />
        )}
        <FloatingCard
          title="Crystal Field Splitting"
          frame={cardLayout.diagram}
          rect={rects.diagram}
          zIndex={cardLayout.diagram.dock ? 12 : 20 + cardOrder.indexOf('diagram')}
          isDarkMode={isDarkMode}
          fillBody
          onChange={(frame) => updateCard('diagram', frame)}
          onDrop={(frame, point) => dropCard('diagram', frame, point)}
          dockEdgeAt={(x, y) => dockEdgeForPoint(x, y, cardLayout)}
          onDockPreview={(edge) => setDockPreview(edge ? { id: 'diagram', edge } : null)}
          onFocus={() => focusCard('diagram')}
        >
          <Box sx={{ flex: 1, minHeight: 0, height: '100%' }}>
            {orbitalDiagramContent}
          </Box>
        </FloatingCard>
        <FloatingCard
          title="Settings"
          frame={cardLayout.settings}
          rect={rects.settings}
          zIndex={cardLayout.settings.dock ? 12 : 20 + cardOrder.indexOf('settings')}
          isDarkMode={isDarkMode}
          onChange={(frame) => updateCard('settings', frame)}
          onDrop={(frame, point) => dropCard('settings', frame, point)}
          dockEdgeAt={(x, y) => dockEdgeForPoint(x, y, cardLayout)}
          onDockPreview={(edge) => setDockPreview(edge ? { id: 'settings', edge } : null)}
          onFocus={() => focusCard('settings')}
        >
          <Box sx={{ p: 1.5 }}>
            {controlsContent}
          </Box>
        </FloatingCard>
        <FloatingCard
          title="Distance & Orbitals"
          frame={cardLayout.orbitals}
          rect={rects.orbitals}
          zIndex={cardLayout.orbitals.dock ? 12 : 20 + cardOrder.indexOf('orbitals')}
          isDarkMode={isDarkMode}
          onChange={(frame) => updateCard('orbitals', frame)}
          onDrop={(frame, point) => dropCard('orbitals', frame, point)}
          dockEdgeAt={(x, y) => dockEdgeForPoint(x, y, cardLayout)}
          onDockPreview={(edge) => setDockPreview(edge ? { id: 'orbitals', edge } : null)}
          onFocus={() => focusCard('orbitals')}
        >
          <Box sx={{ p: 1.5 }}>
            {orbitalToolsContent}
          </Box>
        </FloatingCard>
        {splitters.map((splitter) => (
          <DockSplitter
            key={`${splitter.a}-${splitter.b}`}
            splitter={splitter}
            layout={cardLayout}
            isDarkMode={isDarkMode}
            onWeights={updateDockWeights}
          />
        ))}
      </Box>
    </ThemeProvider>
  );
}

export default App;
