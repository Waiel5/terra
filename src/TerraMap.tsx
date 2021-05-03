import React, {
  useEffect,
  useRef,
  useState,
  useCallback,
  useMemo,
  forwardRef,
  useImperativeHandle,
  createContext,
  useContext,
} from 'react';
import type {
  Coordinate,
  ViewportState,
  ThemeId,
  BBox,
  ControlPosition,
} from './utils/types';
import { darkTheme } from './themes/dark';
import { satelliteTheme } from './themes/satellite';

/** Theme registry maps theme IDs to their style URLs and color tokens */
const THEME_REGISTRY = {
  dark: darkTheme,
  satellite: satelliteTheme,
  light: {
    id: 'light' as const,
    name: 'Light',
    styleUrl: 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json',
    background: '#ffffff',
    foreground: '#24292f',
    accent: '#0969da',
    controlBackground: 'rgba(255, 255, 255, 0.9)',
    controlBorder: 'rgba(208, 215, 222, 0.8)',
    controlText: '#24292f',
    tooltipBackground: 'rgba(255, 255, 255, 0.95)',
    tooltipText: '#24292f',
  },
  streets: {
    id: 'streets' as const,
    name: 'Streets',
    styleUrl: 'https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json',
    background: '#f6f8fa',
    foreground: '#24292f',
    accent: '#2da44e',
    controlBackground: 'rgba(246, 248, 250, 0.9)',
    controlBorder: 'rgba(208, 215, 222, 0.8)',
    controlText: '#24292f',
    tooltipBackground: 'rgba(246, 248, 250, 0.95)',
    tooltipText: '#24292f',
  },
} as const;

type ThemeConfig = typeof THEME_REGISTRY[ThemeId];

export interface TerraContextValue {
  viewport: ViewportState;
  theme: ThemeConfig;
  mapRef: React.RefObject<unknown>;
  registerLayer: (id: string, label: string) => void;
  unregisterLayer: (id: string) => void;
}

export const TerraContext = createContext<TerraContextValue | null>(null);

/** Access the TerraMap context from child components */
export function useTerraContext(): TerraContextValue {
  const ctx = useContext(TerraContext);
  if (!ctx) {
    throw new Error('useTerraContext must be used within a <TerraMap> component');
  }
  return ctx;
}

export interface TerraMapProps {
  /** Map center as [longitude, latitude] */
  center?: Coordinate;
  /** Initial zoom level */
  zoom?: number;
  /** Map pitch in degrees */
  pitch?: number;
  /** Map bearing in degrees */
  bearing?: number;
  /** Theme identifier or a custom MapLibre style URL */
  theme?: ThemeId | string;
  /** Map width (default '100%') */
  width?: string | number;
  /** Map height (default '100%') */
  height?: string | number;
  /** Minimum zoom */
  minZoom?: number;
  /** Maximum zoom */
  maxZoom?: number;
  /** Whether user interactions are enabled */
  interactive?: boolean;
  /** Callback when the viewport changes */
  onViewportChange?: (viewport: ViewportState) => void;
  /** Callback when a feature on any layer is clicked */
  onClick?: (info: PickInfo) => void;
  /** Callback when a feature is hovered */
  onHover?: (info: PickInfo) => void;
  /** Child layer and control components */
  children?: React.ReactNode;
  /** Custom CSS class name */
  className?: string;
  /** Custom inline styles */
  style?: React.CSSProperties;
}

export interface PickInfo {
  object?: unknown;
  coordinate?: Coordinate;
  x: number;
  y: number;
  layer?: { id: string };
}

export interface TerraMapHandle {
  flyTo: (lon: number, lat: number, zoom?: number) => void;
  fitBounds: (bbox: BBox) => void;
  getViewport: () => ViewportState;
}

/**
 * TerraMap is the root container for all Terra layers and controls.
 * It initializes Deck.gl and MapLibre, manages viewport state,
 * and provides context to child components.
 *
 * @example
 * ```tsx
 * <TerraMap center={[35.5, 33.9]} zoom={8} theme="dark">
 *   <HeatmapLayer data={points} weight="magnitude" radius={30} />
 *   <ZoomControl position="top-right" />
 * </TerraMap>
 * ```
 */
export const TerraMap = forwardRef<TerraMapHandle, TerraMapProps>(function TerraMap(
  {
    center = [0, 0],
    zoom = 2,
    pitch = 0,
    bearing = 0,
    theme = 'dark',
    width = '100%',
    height = '100%',
    minZoom = 0,
    maxZoom = 22,
    interactive = true,
    onViewportChange,
    onClick,
    onHover,
    children,
    className,
    style,
  },
  ref
) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<unknown>(null);
  const layersRef = useRef<Map<string, string>>(new Map());

  const [viewport, setViewportInternal] = useState<ViewportState>({
    longitude: center[0],
    latitude: center[1],
    zoom,
    pitch,
    bearing,
  });

  const onViewportChangeRef = useRef(onViewportChange);
  onViewportChangeRef.current = onViewportChange;

  const setViewport = useCallback((next: ViewportState) => {
    const clamped = {
      ...next,
      zoom: Math.max(minZoom, Math.min(maxZoom, next.zoom)),
    };
    setViewportInternal(clamped);
    onViewportChangeRef.current?.(clamped);
  }, [minZoom, maxZoom]);

  // Resolve theme configuration
  const themeConfig = useMemo<ThemeConfig>(() => {
    if (theme in THEME_REGISTRY) {
      return THEME_REGISTRY[theme as ThemeId];
    }
    // Custom style URL: use dark theme tokens with the custom URL
    return { ...darkTheme, styleUrl: theme };
  }, [theme]);

  // Sync center/zoom prop changes
  useEffect(() => {
    setViewportInternal((prev) => ({
      ...prev,
      longitude: center[0],
      latitude: center[1],
      zoom,
      pitch,
      bearing,
    }));
  }, [center, zoom, pitch, bearing]);

  // Layer registration for the LayerToggle control
  const registerLayer = useCallback((id: string, label: string) => {
    layersRef.current.set(id, label);
  }, []);

  const unregisterLayer = useCallback((id: string) => {
    layersRef.current.delete(id);
  }, []);

  // Imperative handle for external control
  useImperativeHandle(ref, () => ({
    flyTo: (lon: number, lat: number, z?: number) => {
      setViewport({
        ...viewport,
        longitude: lon,
        latitude: lat,
        zoom: z ?? viewport.zoom,
        transitionDuration: 800,
      });
    },
    fitBounds: (bbox: BBox) => {
      const [west, south, east, north] = bbox;
      const centerLon = (west + east) / 2;
      const centerLat = (south + north) / 2;
      const maxDelta = Math.max(north - south, east - west);
      const fitZoom = maxDelta === 0 ? 14 : Math.floor(Math.log2(360 / maxDelta));
      setViewport({
        ...viewport,
        longitude: centerLon,
        latitude: centerLat,
        zoom: fitZoom,
        transitionDuration: 800,
      });
    },
    getViewport: () => viewport,
  }), [viewport, setViewport]);

  const contextValue = useMemo<TerraContextValue>(
    () => ({
      viewport,
      theme: themeConfig,
      mapRef: mapInstanceRef,
      registerLayer,
      unregisterLayer,
    }),
    [viewport, themeConfig, registerLayer, unregisterLayer]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!onHover) return;
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;
      onHover({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
    },
    [onHover]
  );

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!onClick) return;
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;
      onClick({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
    },
    [onClick]
  );

  // Handle scroll wheel zoom when interactive
  const handleWheel = useCallback(
    (e: React.WheelEvent<HTMLDivElement>) => {
      if (!interactive) return;
      e.preventDefault();
      const delta = e.deltaY > 0 ? -0.5 : 0.5;
      setViewport({
        ...viewport,
        zoom: viewport.zoom + delta,
      });
    },
    [interactive, viewport, setViewport]
  );

  const containerStyle: React.CSSProperties = {
    position: 'relative',
    width: typeof width === 'number' ? `${width}px` : width,
    height: typeof height === 'number' ? `${height}px` : height,
    overflow: 'hidden',
    background: themeConfig.background,
    cursor: interactive ? 'grab' : 'default',
    ...style,
  };

  return (
    <TerraContext.Provider value={contextValue}>
      <div
        ref={containerRef}
        className={className ? `terra-map ${className}` : 'terra-map'}
        style={containerStyle}
        onClick={handleClick}
        onMouseMove={handleMouseMove}
        onWheel={handleWheel}
        role="application"
        aria-label="Interactive map"
        data-terra-theme={themeConfig.id}
        data-terra-zoom={viewport.zoom.toFixed(1)}
      >
        {/* Map tile layer would be rendered by Deck.gl + MapLibre here */}
        <div
          className="terra-map__viewport"
          style={{ position: 'absolute', inset: 0 }}
          data-style-url={themeConfig.styleUrl}
          data-longitude={viewport.longitude}
          data-latitude={viewport.latitude}
          data-zoom={viewport.zoom}
          data-pitch={viewport.pitch}
          data-bearing={viewport.bearing}
        />

        {/* Layer and control children */}
        {children}
      </div>
    </TerraContext.Provider>
  );
});
