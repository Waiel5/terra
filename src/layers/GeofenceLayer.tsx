import React, { useEffect, useMemo, useCallback, useRef } from 'react';
import { useTerraContext } from '../TerraMap';
import { pointInPolygon, polygonCentroid } from '../utils/geo';
import type { GeofenceZone, Coordinate, ColorValue } from '../utils/types';

export interface GeofenceEvent {
  type: 'enter' | 'exit';
  zone: GeofenceZone;
  point: Coordinate;
  timestamp: number;
}

export interface GeofenceLayerProps {
  /** Unique layer identifier */
  id?: string;
  /** Array of geofence zone polygons */
  zones: GeofenceZone[];
  /** Fill color for zones (default semi-transparent blue) */
  fillColor?: ColorValue;
  /** Border color for zones */
  strokeColor?: ColorValue;
  /** Border width in pixels (default 2) */
  strokeWidth?: number;
  /** Fill opacity 0-1 (default 0.2) */
  fillOpacity?: number;
  /** Whether to show zone labels at centroid */
  showLabels?: boolean;
  /** Font size for labels (default 12) */
  labelSize?: number;
  /** Points to track for enter/exit detection */
  trackedPoints?: Coordinate[];
  /** Callback when a tracked point enters a zone */
  onEnter?: (event: GeofenceEvent) => void;
  /** Callback when a tracked point exits a zone */
  onExit?: (event: GeofenceEvent) => void;
  /** Callback when a zone polygon is clicked */
  onZoneClick?: (zone: GeofenceZone) => void;
  /** Custom fill color per zone */
  getZoneColor?: (zone: GeofenceZone) => ColorValue;
  /** Layer visibility */
  visible?: boolean;
  /** Display name for layer toggle */
  label?: string;
}

/**
 * GeofenceLayer renders polygonal zones on the map and can detect
 * when tracked points enter or exit those zones. It supports
 * customizable styling, labels, and event callbacks.
 *
 * @example
 * ```tsx
 * <GeofenceLayer
 *   zones={restrictedAreas}
 *   fillColor="rgba(255, 0, 0, 0.15)"
 *   strokeColor="#ff4444"
 *   onEnter={(e) => alert(`Entered ${e.zone.name}`)}
 *   onExit={(e) => console.log(`Exited ${e.zone.name}`)}
 *   showLabels
 * />
 * ```
 */
export function GeofenceLayer({
  id = 'terra-geofences',
  zones,
  fillColor = 'rgba(66, 135, 245, 0.2)',
  strokeColor = '#4287f5',
  strokeWidth = 2,
  fillOpacity = 0.2,
  showLabels = false,
  labelSize = 12,
  trackedPoints,
  onEnter,
  onExit,
  onZoneClick,
  getZoneColor,
  visible = true,
  label = 'Geofences',
}: GeofenceLayerProps): React.ReactElement | null {
  const { theme, registerLayer, unregisterLayer } = useTerraContext();

  useEffect(() => {
    registerLayer(id, label);
    return () => unregisterLayer(id);
  }, [id, label, registerLayer, unregisterLayer]);

  // Track which points are inside which zones for enter/exit detection
  const previousStateRef = useRef<Map<string, Set<string>>>(new Map());

  // Perform enter/exit detection when tracked points change
  useEffect(() => {
    if (!trackedPoints || trackedPoints.length === 0) return;
    if (!onEnter && !onExit) return;

    const currentState = new Map<string, Set<string>>();
    const previousState = previousStateRef.current;

    // Build current containment state
    for (let pi = 0; pi < trackedPoints.length; pi++) {
      const point = trackedPoints[pi];
      const pointId = `${pi}`;
      const containingZones = new Set<string>();

      for (const zone of zones) {
        if (pointInPolygon(point, zone.polygon)) {
          containingZones.add(zone.id);
        }
      }

      currentState.set(pointId, containingZones);
    }

    // Detect enter/exit events
    const now = Date.now();

    for (const [pointId, currentZones] of currentState) {
      const previousZones = previousState.get(pointId) ?? new Set();
      const pi = parseInt(pointId, 10);
      const point = trackedPoints[pi];

      // Enter events: in current but not in previous
      for (const zoneId of currentZones) {
        if (!previousZones.has(zoneId)) {
          const zone = zones.find((z) => z.id === zoneId);
          if (zone && onEnter) {
            onEnter({ type: 'enter', zone, point, timestamp: now });
          }
        }
      }

      // Exit events: in previous but not in current
      for (const zoneId of previousZones) {
        if (!currentZones.has(zoneId)) {
          const zone = zones.find((z) => z.id === zoneId);
          if (zone && onExit) {
            onExit({ type: 'exit', zone, point, timestamp: now });
          }
        }
      }
    }

    previousStateRef.current = currentState;
  }, [trackedPoints, zones, onEnter, onExit]);

  const renderedZones = useMemo(() => {
    return zones.map((zone) => {
      const centroid = polygonCentroid(zone.polygon);
      const resolvedFillColor = getZoneColor ? getZoneColor(zone) : fillColor;

      // Convert polygon to SVG path points
      const svgPoints = zone.polygon
        .map((coord) => `${coord[0]},${coord[1]}`)
        .join(' ');

      return {
        zone,
        centroid,
        svgPoints,
        fillColor: resolvedFillColor,
      };
    });
  }, [zones, fillColor, getZoneColor]);

  const handleZoneClick = useCallback(
    (zone: GeofenceZone) => {
      onZoneClick?.(zone);
    },
    [onZoneClick]
  );

  if (!visible || zones.length === 0) return null;

  return (
    <div
      className="terra-layer terra-layer--geofences"
      data-layer-id={id}
      data-zone-count={zones.length}
      style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}
      aria-label={`Geofence layer: ${zones.length} zones`}
    >
      {renderedZones.map(({ zone, centroid, svgPoints, fillColor: zoneFill }) => (
        <div
          key={zone.id}
          className="terra-geofence"
          data-zone-id={zone.id}
          data-zone-name={zone.name}
          data-centroid={centroid.join(',')}
          style={{
            position: 'absolute',
            inset: 0,
            cursor: onZoneClick ? 'pointer' : undefined,
            pointerEvents: onZoneClick ? 'auto' : 'none',
          }}
          onClick={() => handleZoneClick(zone)}
        >
          <svg
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
            aria-hidden="true"
          >
            <polygon
              points={svgPoints}
              fill={typeof zoneFill === 'string' ? zoneFill : 'rgba(66,135,245,0.2)'}
              fillOpacity={fillOpacity}
              stroke={typeof strokeColor === 'string' ? strokeColor : '#4287f5'}
              strokeWidth={strokeWidth}
              strokeLinejoin="round"
            />
          </svg>

          {showLabels && (
            <div
              className="terra-geofence__label"
              style={{
                position: 'absolute',
                transform: 'translate(-50%, -50%)',
                fontSize: labelSize,
                fontWeight: 500,
                color: theme.controlText,
                backgroundColor: theme.tooltipBackground,
                padding: '2px 8px',
                borderRadius: 4,
                whiteSpace: 'nowrap',
                pointerEvents: 'none',
                userSelect: 'none',
              }}
              data-position={centroid.join(',')}
            >
              {zone.name}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
