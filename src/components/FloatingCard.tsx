import { useEffect, useRef } from 'react';
import { Box, IconButton, Typography } from '@mui/material';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

export type DockEdge = 'left' | 'right' | 'top' | 'bottom';

export type CardFrame = {
  x: number;
  y: number;
  width: number;
  height: number;
  collapsed: boolean;
  dock: DockEdge | null;
  dockSize: number;
  dockWeight: number;
  dockOrder: number;
};

export type CardId = 'diagram' | 'settings' | 'orbitals';
export type CardLayout = Record<CardId, CardFrame>;

export type Rect = { x: number; y: number; width: number; height: number };

export type DockSplitterModel = {
  a: CardId;
  b: CardId;
  orientation: 'horizontal' | 'vertical';
  x: number;
  y: number;
  length: number;
  sizeA: number;
  sizeB: number;
};

export const CARD_IDS: CardId[] = ['diagram', 'settings', 'orbitals'];

const HEADER_HEIGHT = 44;
const VIEWPORT_MARGIN = 12;
const MIN_WIDTH = 280;
const MIN_HEIGHT = 220;
const MIN_DOCK = 180;
const MIN_SPAN = 120;
const DOCK_THRESHOLD = 64;
const DRAG_SLOP = 4;
const STORAGE_KEY = 'cft-floating-cards-v2';
const LEGACY_STORAGE_KEY = 'cft-floating-cards-v1';

type ResizeEdge = 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw';

type Gesture = {
  pointerId: number;
  mode: 'drag' | 'resize';
  edges: ResizeEdge[];
  startX: number;
  startY: number;
  frame: CardFrame;
  moved: boolean;
  detached: boolean;
};

const RESIZE_HANDLES: Array<{ edge: ResizeEdge; cursor: string; sx: Record<string, number | string> }> = [
  { edge: 'n', cursor: 'ns-resize', sx: { top: 0, left: 10, right: 10, height: 8 } },
  { edge: 's', cursor: 'ns-resize', sx: { bottom: 0, left: 10, right: 10, height: 8 } },
  { edge: 'e', cursor: 'ew-resize', sx: { right: 0, top: 10, bottom: 10, width: 8 } },
  { edge: 'w', cursor: 'ew-resize', sx: { left: 0, top: 10, bottom: 10, width: 8 } },
  { edge: 'nw', cursor: 'nwse-resize', sx: { top: 0, left: 0, width: 14, height: 14 } },
  { edge: 'ne', cursor: 'nesw-resize', sx: { top: 0, right: 0, width: 14, height: 14 } },
  { edge: 'sw', cursor: 'nesw-resize', sx: { bottom: 0, left: 0, width: 14, height: 14 } },
  { edge: 'se', cursor: 'nwse-resize', sx: { bottom: 0, right: 0, width: 18, height: 18 } },
];

const DOCK_EDGES: DockEdge[] = ['left', 'right', 'top', 'bottom'];

function viewportSize() {
  return {
    width: window.innerWidth,
    height: window.innerHeight,
  };
}

function withDefaults(frame: Partial<CardFrame>, fallback?: CardFrame): CardFrame {
  return {
    x: frame.x ?? fallback?.x ?? VIEWPORT_MARGIN,
    y: frame.y ?? fallback?.y ?? VIEWPORT_MARGIN,
    width: frame.width ?? fallback?.width ?? 360,
    height: frame.height ?? fallback?.height ?? 420,
    collapsed: frame.collapsed ?? fallback?.collapsed ?? false,
    dock: frame.dock ?? null,
    dockSize: frame.dockSize ?? fallback?.dockSize ?? 0,
    dockWeight: frame.dockWeight ?? fallback?.dockWeight ?? 1,
    dockOrder: frame.dockOrder ?? fallback?.dockOrder ?? 0,
  };
}

export function resolveDockSize(edge: DockEdge, size: number, layout: CardLayout, ignoreId?: CardId) {
  const opposite: DockEdge = edge === 'left' ? 'right' : edge === 'right' ? 'left' : edge === 'top' ? 'bottom' : 'top';
  const oppositeSize = CARD_IDS
    .filter((id) => id !== ignoreId && layout[id].dock === opposite && !layout[id].collapsed)
    .reduce((max, id) => Math.max(max, layout[id].dockSize || 0), 0);
  const { width, height } = viewportSize();
  const limit = edge === 'left' || edge === 'right' ? width : height;
  const room = Math.max(140, limit - oppositeSize - 48);
  const maxSize = Math.min(room, limit * 0.8);
  const requested = size > 0 ? size : 320;
  return Math.min(Math.max(requested, Math.min(MIN_DOCK, maxSize)), maxSize);
}

export function clampDockSize(edge: DockEdge, size: number) {
  return resolveDockSize(edge, size, {
    diagram: withDefaults({}),
    settings: withDefaults({}),
    orbitals: withDefaults({}),
  });
}

export function clampCard(frame: CardFrame): CardFrame {
  const normalized = withDefaults(frame);
  if (normalized.dock) {
    return {
      ...normalized,
      dockSize: clampDockSize(normalized.dock, normalized.dockSize),
      dockWeight: Math.max(normalized.dockWeight, 0.2),
    };
  }

  const { width: viewWidth, height: viewHeight } = viewportSize();
  const maxWidth = Math.max(MIN_WIDTH, viewWidth - VIEWPORT_MARGIN * 2);
  const maxHeight = Math.max(MIN_HEIGHT, viewHeight - VIEWPORT_MARGIN * 2);
  const width = Math.min(Math.max(normalized.width, MIN_WIDTH), maxWidth);
  const height = Math.min(Math.max(normalized.height, MIN_HEIGHT), maxHeight);
  const visibleHeight = normalized.collapsed ? HEADER_HEIGHT : height;
  const x = Math.min(
    Math.max(normalized.x, VIEWPORT_MARGIN),
    Math.max(VIEWPORT_MARGIN, viewWidth - width - VIEWPORT_MARGIN)
  );
  const y = Math.min(
    Math.max(normalized.y, VIEWPORT_MARGIN),
    Math.max(VIEWPORT_MARGIN, viewHeight - visibleHeight - VIEWPORT_MARGIN)
  );
  return { ...normalized, x, y, width, height, dockWeight: Math.max(normalized.dockWeight, 0.2) };
}

function isPortrait() {
  const { width, height } = viewportSize();
  return height > width;
}

export function dockEdgeForPoint(x: number, y: number, layout?: CardLayout): DockEdge | null {
  const { width, height } = viewportSize();
  if (isPortrait()) {
    const topBoundary = Math.max(DOCK_THRESHOLD, layout ? edgeThickness(layout, 'top') : 0);
    const bottomBoundary = height - Math.max(DOCK_THRESHOLD, layout ? edgeThickness(layout, 'bottom') : 0);
    if (y <= DOCK_THRESHOLD) {
      return 'top';
    }
    if (height - y <= DOCK_THRESHOLD) {
      return 'bottom';
    }
    if (y < topBoundary || y > bottomBoundary) {
      return null;
    }
    if (x <= DOCK_THRESHOLD) {
      return 'left';
    }
    if (width - x <= DOCK_THRESHOLD) {
      return 'right';
    }
    return null;
  }

  const candidates: Array<{ edge: DockEdge; distance: number; bias: number }> = [
    { edge: 'left', distance: x, bias: 0 },
    { edge: 'right', distance: width - x, bias: 0 },
    { edge: 'top', distance: y, bias: 1 },
    { edge: 'bottom', distance: height - y, bias: 1 },
  ];
  candidates.sort((a, b) => a.distance - b.distance || a.bias - b.bias);
  return candidates[0].distance <= DOCK_THRESHOLD ? candidates[0].edge : null;
}

function cardsOnEdge(layout: CardLayout, edge: DockEdge) {
  return CARD_IDS
    .filter((id) => layout[id].dock === edge)
    .sort((a, b) => layout[a].dockOrder - layout[b].dockOrder || a.localeCompare(b));
}

function edgeThickness(layout: CardLayout, edge: DockEdge) {
  const expanded = cardsOnEdge(layout, edge).filter((id) => !layout[id].collapsed);
  if (!expanded.length) {
    return 0;
  }
  return clampDockSize(edge, Math.max(...expanded.map((id) => layout[id].dockSize)));
}

export function viewerBounds(layout: CardLayout): Rect {
  const { width, height } = viewportSize();
  const left = edgeThickness(layout, 'left');
  const right = edgeThickness(layout, 'right');
  const top = edgeThickness(layout, 'top');
  const bottom = edgeThickness(layout, 'bottom');
  return {
    x: left,
    y: top,
    width: Math.max(width - left - right, 1),
    height: Math.max(height - top - bottom, 1),
  };
}

function placeStacked(
  ids: CardId[],
  layout: CardLayout,
  origin: number,
  length: number,
  crossOrigin: number,
  thickness: number,
  vertical: boolean,
  rects: Record<CardId, Rect>
) {
  if (!ids.length || length <= 0 || thickness <= 0) {
    return;
  }
  const expanded = ids.filter((id) => !layout[id].collapsed);
  const collapsedCount = ids.length - expanded.length;
  const headerTotal = collapsedCount * HEADER_HEIGHT;
  let expandedBudget = Math.max(length - headerTotal, 0);
  const minExpanded = expanded.length * MIN_SPAN;
  let headerSize = HEADER_HEIGHT;
  if (expanded.length && expandedBudget < minExpanded) {
    expandedBudget = Math.min(length, minExpanded);
    headerSize = collapsedCount > 0 ? Math.max(32, (length - expandedBudget) / collapsedCount) : HEADER_HEIGHT;
  }
  const weightSum = expanded.reduce((sum, id) => sum + Math.max(layout[id].dockWeight, 0.2), 0) || 1;
  const rawSpans = ids.map((id) => (
    layout[id].collapsed
      ? headerSize
      : (Math.max(layout[id].dockWeight, 0.2) / weightSum) * expandedBudget
  ));
  const rawTotal = rawSpans.reduce((sum, span) => sum + span, 0) || 1;
  const scale = rawTotal > length ? length / rawTotal : 1;
  let cursor = origin;
  ids.forEach((id, index) => {
    const span = rawSpans[index] * scale;
    if (vertical) {
      rects[id] = { x: crossOrigin, y: cursor, width: thickness, height: span };
    } else {
      rects[id] = { x: cursor, y: crossOrigin, width: span, height: thickness };
    }
    cursor += span;
  });
}

function placeCollapsedEdge(
  ids: CardId[],
  layout: CardLayout,
  edge: DockEdge,
  rects: Record<CardId, Rect>,
  portrait: boolean,
  insets: { top: number; bottom: number }
) {
  const { width: viewWidth, height: viewHeight } = viewportSize();
  const bar = Math.min(clampDockSize(edge, layout[ids[0]].dockSize || 300), 360);
  ids.forEach((id, index) => {
    if (edge === 'left') {
      const y = (portrait ? insets.top : 0) + index * HEADER_HEIGHT;
      rects[id] = {
        x: 0,
        y: Math.min(y, Math.max(portrait ? insets.top : 0, viewHeight - insets.bottom - HEADER_HEIGHT)),
        width: bar,
        height: HEADER_HEIGHT,
      };
    } else if (edge === 'right') {
      const y = (portrait ? insets.top : 0) + index * HEADER_HEIGHT;
      rects[id] = {
        x: viewWidth - bar,
        y: Math.min(y, Math.max(portrait ? insets.top : 0, viewHeight - insets.bottom - HEADER_HEIGHT)),
        width: bar,
        height: HEADER_HEIGHT,
      };
    } else if (edge === 'top') {
      rects[id] = { x: index * bar, y: 0, width: bar, height: HEADER_HEIGHT };
    } else {
      rects[id] = { x: index * bar, y: viewHeight - HEADER_HEIGHT, width: bar, height: HEADER_HEIGHT };
    }
  });
}

export function layoutCardRects(layout: CardLayout): Record<CardId, Rect> {
  const { width: viewWidth, height: viewHeight } = viewportSize();
  const portrait = viewHeight > viewWidth;
  const leftT = edgeThickness(layout, 'left');
  const rightT = edgeThickness(layout, 'right');
  const topT = edgeThickness(layout, 'top');
  const bottomT = edgeThickness(layout, 'bottom');
  const rects = {} as Record<CardId, Rect>;
  const sideLength = Math.max(viewHeight - (portrait ? topT + bottomT : 0), MIN_SPAN);
  const crossLength = Math.max(viewWidth - (portrait ? 0 : leftT + rightT), MIN_SPAN);

  DOCK_EDGES.forEach((edge) => {
    const ids = cardsOnEdge(layout, edge);
    const expanded = ids.filter((id) => !layout[id].collapsed);
    if (!ids.length) {
      return;
    }
    if (!expanded.length) {
      placeCollapsedEdge(ids, layout, edge, rects, portrait, { top: topT, bottom: bottomT });
      return;
    }
    if (portrait) {
      if (edge === 'top') {
        placeStacked(ids, layout, 0, viewWidth, 0, topT, false, rects);
      } else if (edge === 'bottom') {
        placeStacked(ids, layout, 0, viewWidth, viewHeight - bottomT, bottomT, false, rects);
      } else if (edge === 'left') {
        placeStacked(ids, layout, topT, sideLength, 0, leftT, true, rects);
      } else {
        placeStacked(ids, layout, topT, sideLength, viewWidth - rightT, rightT, true, rects);
      }
      return;
    }
    if (edge === 'left') {
      placeStacked(ids, layout, 0, viewHeight, 0, leftT, true, rects);
    } else if (edge === 'right') {
      placeStacked(ids, layout, 0, viewHeight, viewWidth - rightT, rightT, true, rects);
    } else if (edge === 'top') {
      placeStacked(ids, layout, leftT, crossLength, 0, topT, false, rects);
    } else {
      placeStacked(ids, layout, leftT, crossLength, viewHeight - bottomT, bottomT, false, rects);
    }
  });

  CARD_IDS.forEach((id) => {
    if (layout[id].dock) {
      return;
    }
    const frame = clampCard(layout[id]);
    rects[id] = {
      x: frame.x,
      y: frame.y,
      width: frame.width,
      height: frame.collapsed ? HEADER_HEIGHT : frame.height,
    };
  });

  return rects;
}

export function previewRect(layout: CardLayout, id: CardId, edge: DockEdge): Rect {
  const siblings = cardsOnEdge(layout, edge).filter((cardId) => cardId !== id);
  const dockSize = siblings.length
    ? layout[siblings[0]].dockSize
    : clampDockSize(edge, layout[id].dockSize || (edge === 'left' || edge === 'right' ? layout[id].width : layout[id].height));
  const dockOrder = siblings.reduce((max, cardId) => Math.max(max, layout[cardId].dockOrder), 0) + 1;
  const next: CardLayout = {
    ...layout,
    [id]: {
      ...layout[id],
      dock: edge,
      dockSize,
      dockOrder,
      collapsed: false,
    },
  };
  return layoutCardRects(next)[id];
}

export function dockSplitters(layout: CardLayout, rects: Record<CardId, Rect>): DockSplitterModel[] {
  const splitters: DockSplitterModel[] = [];
  DOCK_EDGES.forEach((edge) => {
    const ordered = cardsOnEdge(layout, edge);
    for (let index = 0; index < ordered.length - 1; index += 1) {
      const a = ordered[index];
      const b = ordered[index + 1];
      if (layout[a].collapsed || layout[b].collapsed) {
        continue;
      }
      const rectA = rects[a];
      const rectB = rects[b];
      if (!rectA || !rectB) {
        continue;
      }
      if (edge === 'left' || edge === 'right') {
        splitters.push({
          a,
          b,
          orientation: 'horizontal',
          x: rectA.x,
          y: rectA.y + rectA.height - 4,
          length: rectA.width,
          sizeA: rectA.height,
          sizeB: rectB.height,
        });
      } else {
        splitters.push({
          a,
          b,
          orientation: 'vertical',
          x: rectA.x + rectA.width - 4,
          y: rectA.y,
          length: rectA.height,
          sizeA: rectA.width,
          sizeB: rectB.width,
        });
      }
    }
  });
  return splitters;
}

function floatingFrame(width: number, height: number, x: number, y: number, extras?: Partial<CardFrame>): CardFrame {
  return clampCard({
    x,
    y,
    width,
    height,
    collapsed: false,
    dock: null,
    dockSize: 0,
    dockWeight: 1,
    dockOrder: 0,
    ...extras,
  });
}

export function defaultCardLayout(): CardLayout {
  const { width, height } = viewportSize();
  const margin = 16;
  const narrow = width < 900;

  if (narrow) {
    const cardWidth = Math.min(width - margin * 2, 440);
    const diagramHeight = Math.min(300, Math.max(MIN_HEIGHT, height * 0.38));
    return {
      diagram: floatingFrame(cardWidth, diagramHeight, margin, margin, { dockOrder: 1 }),
      settings: floatingFrame(cardWidth, 420, margin, margin + diagramHeight + 8, { collapsed: true, dockOrder: 2 }),
      orbitals: floatingFrame(cardWidth, 420, margin, margin + diagramHeight + HEADER_HEIGHT + 16, { collapsed: true, dockOrder: 3 }),
    };
  }

  const diagramWidth = Math.min(460, Math.max(340, width * 0.3));
  const settingsWidth = Math.min(360, Math.max(MIN_WIDTH, width * 0.24));
  const settingsHeight = Math.min(460, height - margin * 2);
  const orbitalHeight = Math.min(420, Math.max(MIN_HEIGHT, height - settingsHeight - margin * 3));

  return {
    diagram: floatingFrame(diagramWidth, Math.min(height - margin * 2, 560), width - diagramWidth - margin, margin, { dockOrder: 1 }),
    settings: floatingFrame(settingsWidth, settingsHeight, margin, margin, { dockOrder: 2 }),
    orbitals: floatingFrame(settingsWidth, orbitalHeight, margin, margin + settingsHeight + 12, { dockOrder: 3 }),
  };
}

function isPartialFrame(value: unknown): value is Partial<CardFrame> {
  if (!value || typeof value !== 'object') {
    return false;
  }
  const frame = value as Partial<CardFrame>;
  return typeof frame.x === 'number' && typeof frame.y === 'number' && typeof frame.width === 'number' && typeof frame.height === 'number';
}

export function loadCardLayout(): CardLayout {
  const defaults = defaultCardLayout();
  try {
    const currentRaw = localStorage.getItem(STORAGE_KEY);
    const legacyRaw = localStorage.getItem(LEGACY_STORAGE_KEY);
    const parsed = currentRaw
      ? JSON.parse(currentRaw) as Partial<CardLayout>
      : legacyRaw
        ? JSON.parse(legacyRaw) as Partial<CardLayout>
        : null;
    if (!parsed) {
      return defaults;
    }
    const layout = {} as CardLayout;
    CARD_IDS.forEach((id) => {
      const saved = parsed[id];
      layout[id] = isPartialFrame(saved) ? clampCard(withDefaults(saved, defaults[id])) : defaults[id];
    });
    return layout;
  } catch {
    return defaults;
  }
}

export function saveCardLayout(layout: CardLayout) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(layout));
  } catch {
    // Ignore storage failures; the layout still works for this session.
  }
}

export function normalizeLayout(layout: CardLayout): CardLayout {
  const next = {} as CardLayout;
  CARD_IDS.forEach((id) => {
    next[id] = clampCard(layout[id]);
  });
  return next;
}

function innerDockEdge(edge: DockEdge): ResizeEdge {
  if (edge === 'left') return 'e';
  if (edge === 'right') return 'w';
  if (edge === 'top') return 's';
  return 'n';
}

function applyGesture(gesture: Gesture, clientX: number, clientY: number): CardFrame {
  const dx = clientX - gesture.startX;
  const dy = clientY - gesture.startY;
  const start = gesture.frame;

  if (gesture.mode === 'resize' && start.dock) {
    let dockSize = start.dockSize || 320;
    const edges = new Set(gesture.edges);
    if (start.dock === 'left' && edges.has('e')) dockSize += dx;
    if (start.dock === 'right' && edges.has('w')) dockSize -= dx;
    if (start.dock === 'top' && edges.has('s')) dockSize += dy;
    if (start.dock === 'bottom' && edges.has('n')) dockSize -= dy;
    return clampCard({ ...start, dockSize });
  }

  if (gesture.mode === 'drag') {
    return clampCard({ ...start, dock: null, x: start.x + dx, y: start.y + dy });
  }

  let { x, y, width, height } = start;
  const edges = new Set(gesture.edges);
  if (edges.has('e')) width += dx;
  if (edges.has('s')) height += dy;
  if (edges.has('w')) {
    width -= dx;
    x += dx;
  }
  if (edges.has('n')) {
    height -= dy;
    y += dy;
  }
  if (width < MIN_WIDTH) {
    if (edges.has('w')) x -= MIN_WIDTH - width;
    width = MIN_WIDTH;
  }
  if (height < MIN_HEIGHT) {
    if (edges.has('n')) y -= MIN_HEIGHT - height;
    height = MIN_HEIGHT;
  }
  return clampCard({ ...start, dock: null, x, y, width, height });
}

function detachFrame(frame: CardFrame, rect: Rect, clientX: number, clientY: number): CardFrame {
  const grabX = Math.min(Math.max(clientX - rect.x, 24), Math.max(frame.width - 32, 24));
  const grabY = Math.min(Math.max(clientY - rect.y, 8), HEADER_HEIGHT / 2);
  return clampCard({
    ...frame,
    dock: null,
    x: clientX - grabX,
    y: clientY - grabY,
  });
}

type FloatingCardProps = {
  title: string;
  frame: CardFrame;
  rect: Rect;
  zIndex: number;
  isDarkMode: boolean;
  fillBody?: boolean;
  onChange: (frame: CardFrame) => void;
  onDrop: (frame: CardFrame, point: { x: number; y: number }) => void;
  onDockPreview: (edge: DockEdge | null) => void;
  dockEdgeAt: (x: number, y: number) => DockEdge | null;
  onFocus: () => void;
  children: React.ReactNode;
};

export default function FloatingCard({
  title,
  frame,
  rect,
  zIndex,
  isDarkMode,
  fillBody = false,
  onChange,
  onDrop,
  onDockPreview,
  dockEdgeAt,
  onFocus,
  children,
}: FloatingCardProps) {
  const gestureRef = useRef<Gesture | null>(null);
  const onChangeRef = useRef(onChange);
  const onDropRef = useRef(onDrop);
  const onPreviewRef = useRef(onDockPreview);
  const dockEdgeAtRef = useRef(dockEdgeAt);
  const rectRef = useRef(rect);
  onChangeRef.current = onChange;
  onDropRef.current = onDrop;
  onPreviewRef.current = onDockPreview;
  dockEdgeAtRef.current = dockEdgeAt;
  rectRef.current = rect;

  const listenersRef = useRef<{
    move: (event: PointerEvent) => void;
    end: (event: PointerEvent) => void;
  } | null>(null);

  if (!listenersRef.current) {
    const move = (event: PointerEvent) => {
      const gesture = gestureRef.current;
      if (!gesture || gesture.pointerId !== event.pointerId) {
        return;
      }
      const distance = Math.hypot(event.clientX - gesture.startX, event.clientY - gesture.startY);
      if (!gesture.moved && distance < DRAG_SLOP) {
        return;
      }
      gesture.moved = true;
      event.preventDefault();

      if (gesture.mode === 'drag' && gesture.frame.dock && !gesture.detached) {
        const floating = detachFrame(gesture.frame, rectRef.current, event.clientX, event.clientY);
        gesture.frame = floating;
        gesture.startX = event.clientX;
        gesture.startY = event.clientY;
        gesture.detached = true;
        onChangeRef.current(floating);
        onPreviewRef.current(dockEdgeAtRef.current(event.clientX, event.clientY));
        return;
      }

      const next = applyGesture(gesture, event.clientX, event.clientY);
      onChangeRef.current(next);
      if (gesture.mode === 'drag') {
        onPreviewRef.current(dockEdgeAtRef.current(event.clientX, event.clientY));
      }
    };
    const end = (event: PointerEvent) => {
      const gesture = gestureRef.current;
      if (!gesture || gesture.pointerId !== event.pointerId) {
        return;
      }
      gestureRef.current = null;
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', end);
      window.removeEventListener('pointercancel', end);
      onPreviewRef.current(null);
      if (gesture.mode === 'drag' && gesture.moved && (!gesture.frame.dock || gesture.detached)) {
        const next = gesture.detached && event.clientX === gesture.startX && event.clientY === gesture.startY
          ? gesture.frame
          : applyGesture(gesture, event.clientX, event.clientY);
        onDropRef.current(next, { x: event.clientX, y: event.clientY });
      }
    };
    listenersRef.current = { move, end };
  }

  useEffect(() => {
    const listeners = listenersRef.current;
    return () => {
      if (!listeners) {
        return;
      }
      window.removeEventListener('pointermove', listeners.move);
      window.removeEventListener('pointerup', listeners.end);
      window.removeEventListener('pointercancel', listeners.end);
    };
  }, []);

  const borderColor = isDarkMode ? '#3a3a3a' : '#d0d0d0';
  const headerColor = isDarkMode ? '#e3f2fd' : '#1a1a1a';
  const mutedColor = isDarkMode ? '#90caf9' : '#1976d2';
  const surface = isDarkMode ? '#1b1b1b' : '#ffffff';
  const headerSurface = isDarkMode ? '#262626' : '#f3f6f8';
  const docked = Boolean(frame.dock);
  const handles = docked
    ? RESIZE_HANDLES.filter((handle) => handle.edge === innerDockEdge(frame.dock as DockEdge))
    : frame.collapsed
      ? []
      : RESIZE_HANDLES;

  const beginGesture = (
    event: React.PointerEvent<HTMLElement>,
    mode: Gesture['mode'],
    edges: ResizeEdge[] = []
  ) => {
    if (event.button !== 0) {
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    gestureRef.current = {
      pointerId: event.pointerId,
      mode,
      edges,
      startX: event.clientX,
      startY: event.clientY,
      frame,
      moved: false,
      detached: false,
    };
    const listeners = listenersRef.current;
    if (listeners) {
      window.removeEventListener('pointermove', listeners.move);
      window.removeEventListener('pointerup', listeners.end);
      window.removeEventListener('pointercancel', listeners.end);
      window.addEventListener('pointermove', listeners.move);
      window.addEventListener('pointerup', listeners.end);
      window.addEventListener('pointercancel', listeners.end);
    }
    try {
      event.currentTarget.setPointerCapture(event.pointerId);
    } catch {
      // Window listeners still track the pointer if capture is unavailable.
    }
    onFocus();
  };

  const toggleCollapsed = () => {
    onChange(clampCard({ ...frame, collapsed: !frame.collapsed }));
  };

  return (
    <Box
      onPointerDown={onFocus}
      onPointerDownCapture={onFocus}
      sx={{
        position: 'absolute',
        left: rect.x,
        top: rect.y,
        width: rect.width,
        height: rect.height,
        zIndex,
        display: 'flex',
        flexDirection: 'column',
        borderRadius: docked ? 0 : 2,
        overflow: 'hidden',
        transition: 'none',
        border: `1px solid ${borderColor}`,
        background: surface,
        boxShadow: docked
          ? 'none'
          : isDarkMode
            ? '0 12px 32px rgba(0, 0, 0, 0.45)'
            : '0 12px 28px rgba(0, 0, 0, 0.16)',
        color: isDarkMode ? '#f5f5f5' : '#212121',
      }}
    >
      <Box
        onPointerDown={(event) => beginGesture(event, 'drag')}
        onDoubleClick={toggleCollapsed}
        sx={{
          height: HEADER_HEIGHT,
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          px: 1.25,
          cursor: 'grab',
          touchAction: 'none',
          userSelect: 'none',
          background: headerSurface,
          borderBottom: frame.collapsed ? 'none' : `1px solid ${borderColor}`,
          '&:active': { cursor: 'grabbing' },
        }}
      >
        <Typography
          component="h2"
          sx={{
            flex: 1,
            minWidth: 0,
            fontSize: '0.95rem',
            fontWeight: 700,
            color: headerColor,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {title}
        </Typography>
        <IconButton
          size="small"
          aria-label={frame.collapsed ? `Expand ${title}` : `Collapse ${title}`}
          onPointerDown={(event) => event.stopPropagation()}
          onClick={toggleCollapsed}
          sx={{ color: mutedColor }}
        >
          {frame.collapsed ? <ExpandMoreIcon /> : <ExpandLessIcon />}
        </IconButton>
      </Box>

      {!frame.collapsed && (
        <Box
          sx={{
            flex: 1,
            minHeight: 0,
            overflow: fillBody ? 'hidden' : 'auto',
            display: 'flex',
            flexDirection: 'column',
            background: surface,
          }}
        >
          {children}
        </Box>
      )}

      {handles.map((handle) => (
        <Box
          key={handle.edge}
          role="separator"
          aria-label={docked ? `Resize ${title} dock` : `Resize ${title}`}
          aria-orientation={handle.edge === 'e' || handle.edge === 'w' ? 'vertical' : 'horizontal'}
          onPointerDown={(event) => beginGesture(event, 'resize', handle.edge.split('') as ResizeEdge[])}
            sx={{
              position: 'absolute',
              zIndex: 2,
              touchAction: 'none',
              cursor: handle.cursor,
              ...handle.sx,
              ...(docked && {
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  background: mutedColor,
                  borderRadius: 1,
                  opacity: 0.9,
                  ...(handle.edge === 'e' || handle.edge === 'w'
                    ? { top: '35%', bottom: '35%', width: 3, left: 2 }
                    : { left: '35%', right: '35%', height: 3, top: 2 }),
                },
              }),
            }}
        />
      ))}

      {!docked && !frame.collapsed && (
        <Box
          aria-hidden
          sx={{
            position: 'absolute',
            right: 3,
            bottom: 3,
            width: 10,
            height: 10,
            pointerEvents: 'none',
            background: `linear-gradient(135deg, transparent 50%, ${mutedColor} 50%)`,
            opacity: 0.9,
          }}
        />
      )}
    </Box>
  );
}

type DockSplitterProps = {
  splitter: DockSplitterModel;
  layout: CardLayout;
  isDarkMode: boolean;
  onWeights: (a: CardId, weightA: number, b: CardId, weightB: number) => void;
};

export function DockSplitter({ splitter, layout, isDarkMode, onWeights }: DockSplitterProps) {
  const gestureRef = useRef<{ pointerId: number; start: number; sizeA: number; sizeB: number } | null>(null);
  const onWeightsRef = useRef(onWeights);
  onWeightsRef.current = onWeights;

  const applyDelta = (delta: number) => {
    const gesture = gestureRef.current;
    if (!gesture) {
      return;
    }
    const total = gesture.sizeA + gesture.sizeB;
    const nextA = Math.min(Math.max(gesture.sizeA + delta, MIN_SPAN), total - MIN_SPAN);
    const nextB = total - nextA;
    const weightA = Math.max(layout[splitter.a].dockWeight, 0.2);
    const weightB = Math.max(layout[splitter.b].dockWeight, 0.2);
    const weightSum = weightA + weightB;
    onWeightsRef.current(
      splitter.a,
      (nextA / total) * weightSum,
      splitter.b,
      (nextB / total) * weightSum
    );
  };

  return (
    <Box
      role="separator"
      aria-orientation={splitter.orientation === 'horizontal' ? 'horizontal' : 'vertical'}
      aria-label="Resize dock split"
      onPointerDown={(event) => {
        if (event.button !== 0) {
          return;
        }
        event.preventDefault();
        event.stopPropagation();
        gestureRef.current = {
          pointerId: event.pointerId,
          start: splitter.orientation === 'horizontal' ? event.clientY : event.clientX,
          sizeA: splitter.sizeA,
          sizeB: splitter.sizeB,
        };
        event.currentTarget.setPointerCapture(event.pointerId);
      }}
      onPointerMove={(event) => {
        const gesture = gestureRef.current;
        if (!gesture || gesture.pointerId !== event.pointerId) {
          return;
        }
        const current = splitter.orientation === 'horizontal' ? event.clientY : event.clientX;
        applyDelta(current - gesture.start);
      }}
      onPointerUp={(event) => {
        if (gestureRef.current?.pointerId === event.pointerId) {
          gestureRef.current = null;
        }
      }}
      sx={{
        position: 'absolute',
        left: splitter.x,
        top: splitter.y,
        width: splitter.orientation === 'horizontal' ? splitter.length : 8,
        height: splitter.orientation === 'horizontal' ? 8 : splitter.length,
        zIndex: 16,
        cursor: splitter.orientation === 'horizontal' ? 'ns-resize' : 'ew-resize',
        touchAction: 'none',
        background: isDarkMode ? 'rgba(144, 202, 249, 0.35)' : 'rgba(25, 118, 210, 0.28)',
      }}
    />
  );
}
