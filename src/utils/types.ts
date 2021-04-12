/** Longitude, Latitude pair */
export type Coordinate = [longitude: number, latitude: number];

/** Longitude, Latitude, Altitude triple */
export type Coordinate3D = [longitude: number, latitude: number, altitude: number];

/** Bounding box: [west, south, east, north] */
export type BBox = [west: number, south: number, east: number, north: number];

/** Viewport state for the map */
export interface ViewportState {
  longitude: number;
  latitude: number;
  zoom: number;
  pitch: number;
  bearing: number;
  transitionDuration?: number;
}

/** A GeoJSON-like feature with generic properties */
export interface GeoFeature<P = Record<string, unknown>> {
  type: 'Feature';
  geometry: {
    type: 'Point' | 'MultiPoint' | 'LineString' | 'MultiLineString' | 'Polygon' | 'MultiPolygon';
    coordinates: number[] | number[][] | number[][][] | number[][][][];
  };
  properties: P;
}

/** A GeoJSON FeatureCollection */
export interface GeoFeatureCollection<P = Record<string, unknown>> {
  type: 'FeatureCollection';
  features: GeoFeature<P>[];
}

/** A weighted point for heatmap rendering */
export interface WeightedPoint {
  position: Coordinate;
  weight?: number;
}

/** A trajectory: ordered sequence of timestamped positions */
export interface TrajectoryPoint {
  position: Coordinate;
  timestamp: number;
}

export interface Trajectory {
  id: string;
  path: TrajectoryPoint[];
  properties?: Record<string, unknown>;
}

/** A geofence zone defined as a polygon */
export interface GeofenceZone {
  id: string;
  name: string;
  polygon: Coordinate[];
  properties?: Record<string, unknown>;
}

/** Icon marker data */
export interface IconMarker {
  id: string;
  position: Coordinate;
  icon?: string;
  label?: string;
  properties?: Record<string, unknown>;
}

/** Position anchor for controls */
export type ControlPosition =
  | 'top-left'
  | 'top-right'
  | 'bottom-left'
  | 'bottom-right';

/** Terra theme identifiers */
export type ThemeId = 'dark' | 'satellite' | 'light' | 'streets';

/** Color value: hex string, rgb array, or rgba array */
export type ColorValue = string | [number, number, number] | [number, number, number, number];

/** Layer visibility state */
export interface LayerVisibility {
  id: string;
  label: string;
  visible: boolean;
}

/** Realtime data message from WebSocket */
export interface RealtimeMessage<T = unknown> {
  type: string;
  payload: T;
  timestamp: number;
}

/** Geocoding search result */
export interface GeocodingResult {
  label: string;
  position: Coordinate;
  bbox?: BBox;
}
