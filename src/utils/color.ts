import { ColorValue } from './types';

/** Parse a hex color string to [r, g, b, a] */
export function parseColor(color: ColorValue): [number, number, number, number] {
  if (Array.isArray(color)) {
    if (color.length === 4) return color as [number, number, number, number];
    return [...color, 255] as [number, number, number, number];
  }

  const hex = color.replace('#', '');
  if (hex.length === 3) {
    const r = parseInt(hex[0] + hex[0], 16);
    const g = parseInt(hex[1] + hex[1], 16);
    const b = parseInt(hex[2] + hex[2], 16);
    return [r, g, b, 255];
  }

  if (hex.length === 6) {
    const r = parseInt(hex.slice(0, 2), 16);
    const g = parseInt(hex.slice(2, 4), 16);
    const b = parseInt(hex.slice(4, 6), 16);
    return [r, g, b, 255];
  }

  if (hex.length === 8) {
    const r = parseInt(hex.slice(0, 2), 16);
    const g = parseInt(hex.slice(2, 4), 16);
    const b = parseInt(hex.slice(4, 6), 16);
    const a = parseInt(hex.slice(6, 8), 16);
    return [r, g, b, a];
  }

  return [0, 0, 0, 255];
}

/** Convert [r, g, b, a?] to a hex string */
export function colorToHex(color: [number, number, number] | [number, number, number, number]): string {
  const r = Math.round(color[0]).toString(16).padStart(2, '0');
  const g = Math.round(color[1]).toString(16).padStart(2, '0');
  const b = Math.round(color[2]).toString(16).padStart(2, '0');
  return `#${r}${g}${b}`;
}

/** Linearly interpolate between two RGBA colors */
export function interpolateColor(
  from: [number, number, number, number],
  to: [number, number, number, number],
  t: number
): [number, number, number, number] {
  const ct = Math.max(0, Math.min(1, t));
  return [
    from[0] + (to[0] - from[0]) * ct,
    from[1] + (to[1] - from[1]) * ct,
    from[2] + (to[2] - from[2]) * ct,
    from[3] + (to[3] - from[3]) * ct,
  ];
}

/** A built-in set of color scale presets */
const COLOR_SCALE_PRESETS = {
  heat: [
    [0, 0, 128, 255],
    [0, 0, 255, 255],
    [0, 255, 255, 255],
    [0, 255, 0, 255],
    [255, 255, 0, 255],
    [255, 128, 0, 255],
    [255, 0, 0, 255],
  ],
  viridis: [
    [68, 1, 84, 255],
    [72, 40, 120, 255],
    [62, 74, 137, 255],
    [49, 104, 142, 255],
    [38, 130, 142, 255],
    [31, 158, 137, 255],
    [53, 183, 121, 255],
    [110, 206, 88, 255],
    [181, 222, 43, 255],
    [253, 231, 37, 255],
  ],
  plasma: [
    [13, 8, 135, 255],
    [75, 3, 161, 255],
    [125, 3, 168, 255],
    [168, 34, 150, 255],
    [203, 70, 121, 255],
    [229, 107, 93, 255],
    [248, 148, 65, 255],
    [253, 195, 40, 255],
    [240, 249, 33, 255],
  ],
  coolwarm: [
    [59, 76, 192, 255],
    [98, 130, 234, 255],
    [141, 176, 254, 255],
    [184, 208, 249, 255],
    [221, 221, 221, 255],
    [245, 196, 173, 255],
    [244, 154, 123, 255],
    [222, 96, 77, 255],
    [180, 4, 38, 255],
  ],
} as const;

export type ColorScalePreset = keyof typeof COLOR_SCALE_PRESETS;

/**
 * Create a color scale function from a preset or custom color stops.
 * Returns a function that maps a value in [0, 1] to an RGBA color.
 */
export function createColorScale(
  scaleOrStops: ColorScalePreset | [number, number, number, number][]
): (t: number) => [number, number, number, number] {
  const stops: [number, number, number, number][] =
    typeof scaleOrStops === 'string'
      ? (COLOR_SCALE_PRESETS[scaleOrStops] as unknown as [number, number, number, number][])
      : scaleOrStops;

  return (t: number): [number, number, number, number] => {
    const ct = Math.max(0, Math.min(1, t));
    const scaledIndex = ct * (stops.length - 1);
    const lowerIndex = Math.floor(scaledIndex);
    const upperIndex = Math.min(lowerIndex + 1, stops.length - 1);
    const localT = scaledIndex - lowerIndex;

    return interpolateColor(stops[lowerIndex], stops[upperIndex], localT);
  };
}

/**
 * Generate an array of evenly-spaced colors from a scale.
 */
export function sampleColorScale(
  scale: (t: number) => [number, number, number, number],
  count: number
): [number, number, number, number][] {
  const result: [number, number, number, number][] = [];
  for (let i = 0; i < count; i++) {
    result.push(scale(count === 1 ? 0.5 : i / (count - 1)));
  }
  return result;
}

/**
 * Compute a color for a value within a numeric domain using a color scale.
 */
export function domainColor(
  value: number,
  domain: [number, number],
  scale: (t: number) => [number, number, number, number]
): [number, number, number, number] {
  const [min, max] = domain;
  if (max === min) return scale(0.5);
  const t = (value - min) / (max - min);
  return scale(t);
}
