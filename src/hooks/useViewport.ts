import { useState, useCallback, useRef } from 'react';
import type { ViewportState, BBox } from '../utils/types';

export interface UseViewportOptions {
  /** Initial longitude */
  longitude?: number;
  /** Initial latitude */
  latitude?: number;
  /** Initial zoom level (0-22) */
  zoom?: number;
  /** Initial pitch in degrees */
  pitch?: number;
  /** Initial bearing in degrees */
  bearing?: number;
  /** Minimum zoom level */
  minZoom?: number;
  /** Maximum zoom level */
  maxZoom?: number;
  /** Transition duration in ms for programmatic viewport changes */
  transitionDuration?: number;
}

export interface UseViewportReturn {
  viewport: ViewportState;
  setViewport: (viewport: Partial<ViewportState>) => void;
  onViewportChange: (nextViewport: ViewportState) => void;
  flyTo: (longitude: number, latitude: number, zoom?: number) => void;
  fitBounds: (bbox: BBox, padding?: number) => void;
  zoomIn: () => void;
  zoomOut: () => void;
  resetBearing: () => void;
}

/**
 * Hook for managing map viewport state with convenient helpers.
 *
 * @example
 * ```tsx
 * const { viewport, onViewportChange, flyTo } = useViewport({
 *   longitude: -73.98,
 *   latitude: 40.75,
 *   zoom: 12,
 * });
 * ```
 */
export function useViewport(options: UseViewportOptions = {}): UseViewportReturn {
  const {
    longitude = 0,
    latitude = 0,
    zoom = 2,
    pitch = 0,
    bearing = 0,
    minZoom = 0,
    maxZoom = 22,
    transitionDuration = 300,
  } = options;

  const [viewport, setViewportState] = useState<ViewportState>({
    longitude,
    latitude,
    zoom,
    pitch,
    bearing,
  });

  const minZoomRef = useRef(minZoom);
  const maxZoomRef = useRef(maxZoom);
  const transitionRef = useRef(transitionDuration);

  minZoomRef.current = minZoom;
  maxZoomRef.current = maxZoom;
  transitionRef.current = transitionDuration;

  const setViewport = useCallback((partial: Partial<ViewportState>) => {
    setViewportState((prev) => {
      const next = { ...prev, ...partial };
      next.zoom = Math.max(minZoomRef.current, Math.min(maxZoomRef.current, next.zoom));
      return next;
    });
  }, []);

  const onViewportChange = useCallback(
    (nextViewport: ViewportState) => {
      setViewportState({
        ...nextViewport,
        zoom: Math.max(minZoomRef.current, Math.min(maxZoomRef.current, nextViewport.zoom)),
      });
    },
    []
  );

  const flyTo = useCallback(
    (lng: number, lat: number, z?: number) => {
      setViewportState((prev) => ({
        ...prev,
        longitude: lng,
        latitude: lat,
        zoom: z !== undefined ? Math.max(minZoomRef.current, Math.min(maxZoomRef.current, z)) : prev.zoom,
        transitionDuration: transitionRef.current,
      }));
    },
    []
  );

  const fitBounds = useCallback(
    (bbox: BBox, padding = 40) => {
      const [west, south, east, north] = bbox;
      const centerLon = (west + east) / 2;
      const centerLat = (south + north) / 2;

      const latDelta = north - south;
      const lonDelta = east - west;
      const maxDelta = Math.max(latDelta, lonDelta);

      let fitZoom: number;
      if (maxDelta === 0) {
        fitZoom = 14;
      } else {
        fitZoom = Math.floor(Math.log2(360 / maxDelta)) - (padding > 0 ? 1 : 0);
      }

      fitZoom = Math.max(minZoomRef.current, Math.min(maxZoomRef.current, fitZoom));

      setViewportState((prev) => ({
        ...prev,
        longitude: centerLon,
        latitude: centerLat,
        zoom: fitZoom,
        transitionDuration: transitionRef.current,
      }));
    },
    []
  );

  const zoomIn = useCallback(() => {
    setViewportState((prev) => ({
      ...prev,
      zoom: Math.min(maxZoomRef.current, prev.zoom + 1),
      transitionDuration: transitionRef.current,
    }));
  }, []);

  const zoomOut = useCallback(() => {
    setViewportState((prev) => ({
      ...prev,
      zoom: Math.max(minZoomRef.current, prev.zoom - 1),
      transitionDuration: transitionRef.current,
    }));
  }, []);

  const resetBearing = useCallback(() => {
    setViewportState((prev) => ({
      ...prev,
      bearing: 0,
      pitch: 0,
      transitionDuration: transitionRef.current,
    }));
  }, []);

  return {
    viewport,
    setViewport,
    onViewportChange,
    flyTo,
    fitBounds,
    zoomIn,
    zoomOut,
    resetBearing,
  };
}
