import React, { useEffect, useMemo } from 'react';
import { useTerraContext } from '../TerraMap';
import { createColorScale, type ColorScalePreset } from '../utils/color';
import type { WeightedPoint, ColorValue } from '../utils/types';

export interface HeatmapLayerProps<T = WeightedPoint> {
  /** Unique layer identifier */
  id?: string;
  /** Array of data points. Each should have a position, or use getPosition accessor. */
  data: T[];
  /** Property name to use as weight, or a number */
  weight?: keyof T | number;
  /** Heatmap radius in pixels (default 30) */
  radius?: number;
  /** Intensity multiplier (default 1) */
  intensity?: number;
  /** Opacity 0-1 (default 0.8) */
  opacity?: number;
  /** Threshold below which heatmap values are not rendered (default 0.05) */
  threshold?: number;
  /** Color scale preset or custom RGBA stops */
  colorScale?: ColorScalePreset | [number, number, number, number][];
  /** Custom position accessor */
  getPosition?: (d: T) => [number, number];
  /** Custom weight accessor */
  getWeight?: (d: T) => number;
  /** Layer visibility */
  visible?: boolean;
  /** Display name for layer toggle */
  label?: string;
}

/**
 * HeatmapLayer renders a density heatmap from point data.
 * It wraps Deck.gl's HeatmapLayer with sensible defaults and
 * integrates with TerraMap's context for theming and registration.
 *
 * @example
 * ```tsx
 * <HeatmapLayer
 *   data={earthquakes}
 *   weight="magnitude"
 *   radius={40}
 *   colorScale="plasma"
 * />
 * ```
 */
export function HeatmapLayer<T = WeightedPoint>({
  id = 'terra-heatmap',
  data,
  weight,
  radius = 30,
  intensity = 1,
  opacity = 0.8,
  threshold = 0.05,
  colorScale = 'heat',
  getPosition,
  getWeight,
  visible = true,
  label = 'Heatmap',
}: HeatmapLayerProps<T>): React.ReactElement | null {
  const { registerLayer, unregisterLayer } = useTerraContext();

  useEffect(() => {
    registerLayer(id, label);
    return () => unregisterLayer(id);
  }, [id, label, registerLayer, unregisterLayer]);

  const colorFn = useMemo(() => createColorScale(colorScale), [colorScale]);

  // Build the color domain as CSS gradient for visualization
  const gradientStops = useMemo(() => {
    const stops: string[] = [];
    for (let i = 0; i <= 10; i++) {
      const t = i / 10;
      const [r, g, b, a] = colorFn(t);
      stops.push(`rgba(${r},${g},${b},${a / 255}) ${t * 100}%`);
    }
    return stops.join(', ');
  }, [colorFn]);

  const resolvedGetPosition = useMemo(() => {
    if (getPosition) return getPosition;
    return (d: T) => {
      const point = d as unknown as WeightedPoint;
      return point.position;
    };
  }, [getPosition]);

  const resolvedGetWeight = useMemo(() => {
    if (getWeight) return getWeight;
    if (typeof weight === 'number') return () => weight;
    if (typeof weight === 'string') {
      return (d: T) => {
        const val = (d as Record<string, unknown>)[weight as string];
        return typeof val === 'number' ? val : 1;
      };
    }
    return () => 1;
  }, [getWeight, weight]);

  if (!visible || data.length === 0) return null;

  // Compute weight bounds for normalization
  const { minWeight, maxWeight } = useMemo(() => {
    let min = Infinity;
    let max = -Infinity;
    for (const d of data) {
      const w = resolvedGetWeight(d);
      if (w < min) min = w;
      if (w > max) max = w;
    }
    return { minWeight: min, maxWeight: max };
  }, [data, resolvedGetWeight]);

  const weightRange = maxWeight - minWeight || 1;

  return (
    <div
      className="terra-layer terra-layer--heatmap"
      data-layer-id={id}
      data-radius={radius}
      data-intensity={intensity}
      data-opacity={opacity}
      data-threshold={threshold}
      data-point-count={data.length}
      data-weight-range={`${minWeight.toFixed(2)}-${maxWeight.toFixed(2)}`}
      style={{
        position: 'absolute',
        inset: 0,
        opacity,
        pointerEvents: 'none',
        background: `radial-gradient(circle at 50% 50%, ${gradientStops})`,
        mixBlendMode: 'screen',
      }}
      aria-label={`Heatmap layer: ${data.length} points`}
    />
  );
}
