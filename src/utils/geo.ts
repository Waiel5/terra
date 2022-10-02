import { BBox, Coordinate } from './types';

const EARTH_RADIUS_KM = 6371;

/** Convert degrees to radians */
function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

/** Convert radians to degrees */
function toDegrees(radians: number): number {
  return (radians * 180) / Math.PI;
}

/**
 * Calculate the Haversine distance between two coordinates.
 * Returns distance in kilometers.
 */
export function haversineDistance(a: Coordinate, b: Coordinate): number {
  const [lon1, lat1] = a;
  const [lon2, lat2] = b;

  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);

  const sinDLat = Math.sin(dLat / 2);
  const sinDLon = Math.sin(dLon / 2);

  const h =
    sinDLat * sinDLat +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * sinDLon * sinDLon;

  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(h));
}

/**
 * Compute the bounding box of a set of coordinates.
 * Returns [west, south, east, north].
 */
export function computeBBox(points: Coordinate[]): BBox {
  if (points.length === 0) {
    return [0, 0, 0, 0];
  }

  let west = Infinity;
  let south = Infinity;
  let east = -Infinity;
  let north = -Infinity;

  for (const [lon, lat] of points) {
    if (lon < west) west = lon;
    if (lon > east) east = lon;
    if (lat < south) south = lat;
    if (lat > north) north = lat;
  }

  return [west, south, east, north];
}

/**
 * Expand a bounding box by a given factor (0.1 = 10% padding on each side).
 */
export function expandBBox(bbox: BBox, factor: number): BBox {
  const [west, south, east, north] = bbox;
  const lonPad = (east - west) * factor;
  const latPad = (north - south) * factor;

  return [
    west - lonPad,
    south - latPad,
    east + lonPad,
    north + latPad,
  ];
}

/**
 * Determine if a point lies inside a polygon using the ray-casting algorithm.
 * The polygon should be a closed ring (first and last coordinates match).
 */
export function pointInPolygon(point: Coordinate, polygon: Coordinate[]): boolean {
  const [px, py] = point;
  let inside = false;
  const n = polygon.length;

  for (let i = 0, j = n - 1; i < n; j = i++) {
    const [xi, yi] = polygon[i];
    const [xj, yj] = polygon[j];

    const intersects =
      yi > py !== yj > py &&
      px < ((xj - xi) * (py - yi)) / (yj - yi) + xi;

    if (intersects) {
      inside = !inside;
    }
  }

  return inside;
}

/**
 * Calculate the centroid of a polygon.
 */
export function polygonCentroid(polygon: Coordinate[]): Coordinate {
  if (polygon.length === 0) return [0, 0];

  let lonSum = 0;
  let latSum = 0;
  const count = polygon.length;

  for (const [lon, lat] of polygon) {
    lonSum += lon;
    latSum += lat;
  }

  return [lonSum / count, latSum / count];
}

/**
 * Calculate the bearing from point A to point B in degrees.
 */
export function bearing(from: Coordinate, to: Coordinate): number {
  const [lon1, lat1] = from.map(toRadians) as [number, number];
  const [lon2, lat2] = to.map(toRadians) as [number, number];

  const dLon = lon2 - lon1;
  const y = Math.sin(dLon) * Math.cos(lat2);
  const x =
    Math.cos(lat1) * Math.sin(lat2) -
    Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);

  return (toDegrees(Math.atan2(y, x)) + 360) % 360;
}

/**
 * Interpolate between two coordinates using linear interpolation.
 * t should be between 0 and 1.
 */
export function interpolateCoordinate(
  a: Coordinate,
  b: Coordinate,
  t: number
): Coordinate {
  const clampedT = Math.max(0, Math.min(1, t));
  return [
    a[0] + (b[0] - a[0]) * clampedT,
    a[1] + (b[1] - a[1]) * clampedT,
  ];
}

/**
 * Calculate the total length of a path in kilometers.
 */
export function pathLength(path: Coordinate[]): number {
  let total = 0;
  for (let i = 1; i < path.length; i++) {
    total += haversineDistance(path[i - 1], path[i]);
  }
  return total;
}

/**
 * Simplify a path using the Ramer-Douglas-Peucker algorithm.
 * Epsilon is the tolerance in degrees.
 */
export function simplifyPath(path: Coordinate[], epsilon: number): Coordinate[] {
  if (path.length <= 2) return path;

  let maxDist = 0;
  let maxIdx = 0;
  const start = path[0];
  const end = path[path.length - 1];

  for (let i = 1; i < path.length - 1; i++) {
    const dist = perpendicularDistance(path[i], start, end);
    if (dist > maxDist) {
      maxDist = dist;
      maxIdx = i;
    }
  }

  if (maxDist > epsilon) {
    const left = simplifyPath(path.slice(0, maxIdx + 1), epsilon);
    const right = simplifyPath(path.slice(maxIdx), epsilon);
    return [...left.slice(0, -1), ...right];
  }

  return [start, end];
}

function perpendicularDistance(
  point: Coordinate,
  lineStart: Coordinate,
  lineEnd: Coordinate
): number {
  const [x, y] = point;
  const [x1, y1] = lineStart;
  const [x2, y2] = lineEnd;

  const dx = x2 - x1;
  const dy = y2 - y1;
  const lengthSq = dx * dx + dy * dy;

  if (lengthSq === 0) {
    return Math.sqrt((x - x1) ** 2 + (y - y1) ** 2);
  }

  const t = Math.max(0, Math.min(1, ((x - x1) * dx + (y - y1) * dy) / lengthSq));
  const projX = x1 + t * dx;
  const projY = y1 + t * dy;

  return Math.sqrt((x - projX) ** 2 + (y - projY) ** 2);
}
