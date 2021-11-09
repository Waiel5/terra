import React, { useEffect, useMemo, useState, useRef, useCallback } from 'react';
import { useTerraContext } from '../TerraMap';
import { interpolateCoordinate, pathLength } from '../utils/geo';
import type { Trajectory, ColorValue, Coordinate } from '../utils/types';

export interface TrajectoryLayerProps {
  /** Unique layer identifier */
  id?: string;
  /** Array of trajectory data */
  data: Trajectory[];
  /** Path color */
  color?: ColorValue;
  /** Path width in pixels (default 2) */
  width?: number;
  /** Opacity 0-1 (default 0.9) */
  opacity?: number;
  /** Whether to animate the trajectories */
  animated?: boolean;
  /** Animation speed multiplier (default 1) */
  speed?: number;
  /** Animation trail length as fraction of path (default 0.15) */
  trailLength?: number;
  /** Whether to show directional arrows along the path */
  showArrows?: boolean;
  /** Whether to show start/end markers */
  showEndpoints?: boolean;
  /** Custom color accessor per trajectory */
  getColor?: (trajectory: Trajectory) => ColorValue;
  /** Custom width accessor per trajectory */
  getWidth?: (trajectory: Trajectory) => number;
  /** Callback when a trajectory is clicked */
  onClick?: (trajectory: Trajectory) => void;
  /** Layer visibility */
  visible?: boolean;
  /** Display name for layer toggle */
  label?: string;
}

/**
 * Compute an interpolated position along a trajectory path at time t (0-1).
 */
function getPositionAtTime(
  path: { position: Coordinate }[],
  t: number
): Coordinate {
  if (path.length === 0) return [0, 0];
  if (path.length === 1) return path[0].position;

  const clampedT = Math.max(0, Math.min(1, t));
  const totalSegments = path.length - 1;
  const segmentIndex = Math.min(
    Math.floor(clampedT * totalSegments),
    totalSegments - 1
  );
  const segmentT = (clampedT * totalSegments) - segmentIndex;

  return interpolateCoordinate(
    path[segmentIndex].position,
    path[segmentIndex + 1].position,
    segmentT
  );
}

/**
 * TrajectoryLayer renders animated paths showing movement over time.
 * Each trajectory is drawn as a line with optional animation that
 * shows a moving head along the path with a fading trail.
 *
 * @example
 * ```tsx
 * <TrajectoryLayer
 *   data={vehicleTracks}
 *   color="#00ff88"
 *   animated
 *   speed={2}
 *   trailLength={0.2}
 *   showArrows
 * />
 * ```
 */
export function TrajectoryLayer({
  id = 'terra-trajectories',
  data,
  color = '#00ff88',
  width = 2,
  opacity = 0.9,
  animated = false,
  speed = 1,
  trailLength = 0.15,
  showArrows = false,
  showEndpoints = false,
  getColor,
  getWidth,
  onClick,
  visible = true,
  label = 'Trajectories',
}: TrajectoryLayerProps): React.ReactElement | null {
  const { registerLayer, unregisterLayer } = useTerraContext();
  const [animationProgress, setAnimationProgress] = useState(0);
  const frameRef = useRef<number>(0);
  const startTimeRef = useRef<number>(0);

  useEffect(() => {
    registerLayer(id, label);
    return () => unregisterLayer(id);
  }, [id, label, registerLayer, unregisterLayer]);

  // Animation loop
  useEffect(() => {
    if (!animated || !visible || data.length === 0) return;

    startTimeRef.current = performance.now();

    const animate = (now: number) => {
      const elapsed = now - startTimeRef.current;
      const duration = 8000 / speed; // full cycle in ms
      const t = (elapsed % duration) / duration;
      setAnimationProgress(t);
      frameRef.current = requestAnimationFrame(animate);
    };

    frameRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frameRef.current);
  }, [animated, visible, speed, data.length]);

  const trajectoryPaths = useMemo(() => {
    return data.map((trajectory) => {
      const coords = trajectory.path.map((p) => p.position);
      const length = pathLength(coords);
      const resolvedColor = getColor ? getColor(trajectory) : color;
      const resolvedWidth = getWidth ? getWidth(trajectory) : width;

      // Generate SVG path data
      const pathData = coords
        .map((c, i) => `${i === 0 ? 'M' : 'L'} ${c[0]} ${c[1]}`)
        .join(' ');

      return {
        id: trajectory.id,
        coords,
        length,
        color: resolvedColor,
        width: resolvedWidth,
        pathData,
        start: coords[0],
        end: coords[coords.length - 1],
        headPosition: animated
          ? getPositionAtTime(trajectory.path, animationProgress)
          : null,
        trailStart: animated
          ? Math.max(0, animationProgress - trailLength)
          : 0,
      };
    });
  }, [data, color, width, getColor, getWidth, animated, animationProgress, trailLength]);

  const handleTrajectoryClick = useCallback(
    (trajectory: Trajectory) => {
      onClick?.(trajectory);
    },
    [onClick]
  );

  if (!visible || data.length === 0) return null;

  return (
    <div
      className="terra-layer terra-layer--trajectories"
      data-layer-id={id}
      data-trajectory-count={data.length}
      data-animated={animated}
      style={{ position: 'absolute', inset: 0, pointerEvents: 'none', opacity }}
      aria-label={`Trajectory layer: ${data.length} paths`}
    >
      {trajectoryPaths.map((path) => (
        <div
          key={path.id}
          className="terra-trajectory"
          data-trajectory-id={path.id}
          data-path-length-km={path.length.toFixed(2)}
          data-path-data={path.pathData}
          data-color={typeof path.color === 'string' ? path.color : undefined}
          data-width={path.width}
          style={{
            position: 'absolute',
            inset: 0,
            cursor: onClick ? 'pointer' : undefined,
            pointerEvents: onClick ? 'auto' : 'none',
          }}
          onClick={() => {
            const trajectory = data.find((d) => d.id === path.id);
            if (trajectory) handleTrajectoryClick(trajectory);
          }}
        >
          {/* Path line */}
          <svg
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
            aria-hidden="true"
          >
            <path
              d={path.pathData}
              fill="none"
              stroke={typeof path.color === 'string' ? path.color : '#00ff88'}
              strokeWidth={path.width}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {showArrows && (
              <path
                d={path.pathData}
                fill="none"
                stroke={typeof path.color === 'string' ? path.color : '#00ff88'}
                strokeWidth={1}
                strokeDasharray="8 16"
                markerEnd="url(#terra-arrow)"
                opacity={0.6}
              />
            )}
          </svg>

          {/* Animated head */}
          {animated && path.headPosition && (
            <div
              className="terra-trajectory__head"
              style={{
                position: 'absolute',
                width: 8,
                height: 8,
                borderRadius: '50%',
                backgroundColor: typeof path.color === 'string' ? path.color : '#00ff88',
                boxShadow: `0 0 12px ${typeof path.color === 'string' ? path.color : '#00ff88'}`,
                transform: 'translate(-50%, -50%)',
              }}
              data-position={path.headPosition.join(',')}
            />
          )}

          {/* Endpoint markers */}
          {showEndpoints && path.start && (
            <>
              <div
                className="terra-trajectory__start"
                style={{
                  position: 'absolute',
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  backgroundColor: '#4caf50',
                  border: '2px solid #fff',
                }}
                data-position={path.start.join(',')}
              />
              <div
                className="terra-trajectory__end"
                style={{
                  position: 'absolute',
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  backgroundColor: '#f44336',
                  border: '2px solid #fff',
                }}
                data-position={path.end.join(',')}
              />
            </>
          )}
        </div>
      ))}

      {/* SVG defs for arrow markers */}
      {showArrows && (
        <svg style={{ position: 'absolute', width: 0, height: 0 }}>
          <defs>
            <marker
              id="terra-arrow"
              markerWidth="6"
              markerHeight="6"
              refX="3"
              refY="3"
              orient="auto"
            >
              <polygon points="0,0 6,3 0,6" fill={typeof color === 'string' ? color : '#00ff88'} />
            </marker>
          </defs>
        </svg>
      )}
    </div>
  );
}
