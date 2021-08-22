import React, { useEffect, useMemo, useCallback } from 'react';
import { useTerraContext } from '../TerraMap';
import type { Coordinate, ColorValue } from '../utils/types';

export interface ClusterPoint<P = Record<string, unknown>> {
  position: Coordinate;
  properties?: P;
}

export interface ClusterGroup {
  id: number;
  center: Coordinate;
  pointCount: number;
  expansionZoom: number;
  points: ClusterPoint[];
}

export interface ClusterLayerProps<T = ClusterPoint> {
  /** Unique layer identifier */
  id?: string;
  /** Array of point data */
  data: T[];
  /** Cluster radius in pixels (default 50) */
  clusterRadius?: number;
  /** Maximum zoom at which clustering is applied (default 14) */
  maxClusterZoom?: number;
  /** Minimum number of points to form a cluster (default 2) */
  minPoints?: number;
  /** Color for individual (unclustered) points */
  pointColor?: ColorValue;
  /** Color for cluster circles */
  clusterColor?: ColorValue;
  /** Point radius in pixels (default 6) */
  pointSize?: number;
  /** Custom position accessor */
  getPosition?: (d: T) => Coordinate;
  /** Callback when a cluster is clicked — receives cluster details */
  onClusterClick?: (cluster: ClusterGroup) => void;
  /** Callback when an individual point is clicked */
  onPointClick?: (point: T) => void;
  /** Layer visibility */
  visible?: boolean;
  /** Display name for layer toggle */
  label?: string;
}

/**
 * Spatial index for point clustering using a grid-based approach.
 * In production, this would delegate to Supercluster; here we
 * implement a lightweight version for self-contained operation.
 */
function clusterPoints<T>(
  data: T[],
  getPosition: (d: T) => Coordinate,
  zoom: number,
  radius: number,
  maxZoom: number,
  minPoints: number
): { clusters: ClusterGroup[]; unclustered: T[] } {
  if (zoom >= maxZoom) {
    return { clusters: [], unclustered: data };
  }

  const cellSize = radius / (256 * Math.pow(2, zoom));
  const grid = new Map<string, { points: T[]; lonSum: number; latSum: number }>();

  for (const d of data) {
    const [lon, lat] = getPosition(d);
    const cellX = Math.floor(lon / cellSize);
    const cellY = Math.floor(lat / cellSize);
    const key = `${cellX}:${cellY}`;

    const existing = grid.get(key);
    if (existing) {
      existing.points.push(d);
      existing.lonSum += lon;
      existing.latSum += lat;
    } else {
      grid.set(key, { points: [d], lonSum: lon, latSum: lat });
    }
  }

  const clusters: ClusterGroup[] = [];
  const unclustered: T[] = [];
  let clusterId = 0;

  for (const cell of grid.values()) {
    if (cell.points.length >= minPoints) {
      const count = cell.points.length;
      clusters.push({
        id: clusterId++,
        center: [cell.lonSum / count, cell.latSum / count],
        pointCount: count,
        expansionZoom: Math.min(zoom + 2, maxZoom),
        points: cell.points.map((p) => ({
          position: getPosition(p),
          properties: p as unknown as Record<string, unknown>,
        })),
      });
    } else {
      unclustered.push(...cell.points);
    }
  }

  return { clusters, unclustered };
}

/**
 * ClusterLayer groups nearby points into clusters that expand on zoom.
 * It provides automatic spatial indexing and smooth transitions
 * between zoom levels.
 *
 * @example
 * ```tsx
 * <ClusterLayer
 *   data={sensors}
 *   clusterRadius={60}
 *   clusterColor="#ff6b6b"
 *   onClusterClick={(c) => map.flyTo(c.center, c.expansionZoom)}
 * />
 * ```
 */
export function ClusterLayer<T = ClusterPoint>({
  id = 'terra-clusters',
  data,
  clusterRadius = 50,
  maxClusterZoom = 14,
  minPoints = 2,
  pointColor = '#4dabf7',
  clusterColor = '#ff6b6b',
  pointSize = 6,
  getPosition,
  onClusterClick,
  onPointClick,
  visible = true,
  label = 'Clusters',
}: ClusterLayerProps<T>): React.ReactElement | null {
  const { viewport, registerLayer, unregisterLayer } = useTerraContext();

  useEffect(() => {
    registerLayer(id, label);
    return () => unregisterLayer(id);
  }, [id, label, registerLayer, unregisterLayer]);

  const resolvedGetPosition = useMemo(() => {
    if (getPosition) return getPosition;
    return (d: T) => (d as unknown as ClusterPoint).position;
  }, [getPosition]);

  const { clusters, unclustered } = useMemo(
    () =>
      clusterPoints(
        data,
        resolvedGetPosition,
        viewport.zoom,
        clusterRadius,
        maxClusterZoom,
        minPoints
      ),
    [data, resolvedGetPosition, viewport.zoom, clusterRadius, maxClusterZoom, minPoints]
  );

  const handleClusterClick = useCallback(
    (cluster: ClusterGroup) => {
      onClusterClick?.(cluster);
    },
    [onClusterClick]
  );

  const handlePointClick = useCallback(
    (point: T) => {
      onPointClick?.(point);
    },
    [onPointClick]
  );

  if (!visible || data.length === 0) return null;

  // Compute size scale for clusters (log-based sizing)
  const maxCount = Math.max(...clusters.map((c) => c.pointCount), 1);

  return (
    <div
      className="terra-layer terra-layer--clusters"
      data-layer-id={id}
      data-cluster-count={clusters.length}
      data-unclustered-count={unclustered.length}
      style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}
      aria-label={`Cluster layer: ${clusters.length} clusters, ${unclustered.length} points`}
    >
      {clusters.map((cluster) => {
        const sizeBase = 24;
        const sizeScale = Math.log2(cluster.pointCount + 1) / Math.log2(maxCount + 1);
        const size = sizeBase + sizeScale * 36;

        return (
          <div
            key={`cluster-${cluster.id}`}
            className="terra-cluster"
            style={{
              position: 'absolute',
              width: size,
              height: size,
              borderRadius: '50%',
              backgroundColor: typeof clusterColor === 'string' ? clusterColor : undefined,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
              pointerEvents: 'auto',
              boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
              transition: 'all 0.3s ease',
            }}
            onClick={() => handleClusterClick(cluster)}
            data-center={cluster.center.join(',')}
            data-count={cluster.pointCount}
          >
            {cluster.pointCount}
          </div>
        );
      })}
    </div>
  );
}
