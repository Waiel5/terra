// Core
export { TerraMap, TerraContext, useTerraContext } from './TerraMap';
export type { TerraMapProps, TerraMapHandle, PickInfo, TerraContextValue } from './TerraMap';

// Layers
export {
  HeatmapLayer,
  ClusterLayer,
  TrajectoryLayer,
  GeofenceLayer,
  IconLayer,
} from './layers';
export type {
  HeatmapLayerProps,
  ClusterLayerProps,
  ClusterPoint,
  ClusterGroup,
  TrajectoryLayerProps,
  GeofenceLayerProps,
  GeofenceEvent,
  IconLayerProps,
} from './layers';

// Controls
export { ZoomControl, LayerToggle, SearchBox } from './controls';
export type { ZoomControlProps, LayerToggleProps, SearchBoxProps } from './controls';

// Hooks
export { useViewport, useGeoJSON, useRealtime } from './hooks';
export type {
  UseViewportOptions,
  UseViewportReturn,
  UseGeoJSONOptions,
  UseGeoJSONReturn,
  UseRealtimeOptions,
  UseRealtimeReturn,
  ConnectionStatus,
} from './hooks';

// Utilities
export {
  haversineDistance,
  computeBBox,
  expandBBox,
  pointInPolygon,
  polygonCentroid,
  bearing,
  interpolateCoordinate,
  pathLength,
  simplifyPath,
} from './utils/geo';

export {
  parseColor,
  colorToHex,
  interpolateColor,
  createColorScale,
  sampleColorScale,
  domainColor,
} from './utils/color';
export type { ColorScalePreset } from './utils/color';

// Themes
export { darkTheme, DARK_STYLE } from './themes/dark';
export { satelliteTheme, SATELLITE_STYLE } from './themes/satellite';

// Types
export type {
  Coordinate,
  Coordinate3D,
  BBox,
  ViewportState,
  GeoFeature,
  GeoFeatureCollection,
  WeightedPoint,
  TrajectoryPoint,
  Trajectory,
  GeofenceZone,
  IconMarker,
  ControlPosition,
  ThemeId,
  ColorValue,
  LayerVisibility,
  RealtimeMessage,
  GeocodingResult,
} from './utils/types';
