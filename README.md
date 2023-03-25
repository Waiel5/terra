# Terra

**React geospatial visualization library** built on Deck.gl and MapLibre GL. Pre-built layers for heatmaps, point clusters, animated trajectories, geofence zones, and icon markers with a clean, composable API.

> Think of it as a higher-level `react-map-gl` with batteries included.

```
[ Screenshot: Dark-themed map with a plasma heatmap overlay showing earthquake   ]
[ density across the Mediterranean. Cluster markers visible at lower zoom levels ]
[ with animated vehicle trajectories rendered as glowing green trails.            ]
```

---

## Features

- **HeatmapLayer** -- Weighted density heatmaps with configurable color scales (heat, viridis, plasma, coolwarm)
- **ClusterLayer** -- Automatic spatial clustering with zoom-based expansion and click-to-zoom
- **TrajectoryLayer** -- Animated path rendering with trails, directional arrows, and endpoint markers
- **GeofenceLayer** -- Polygon zones with real-time enter/exit detection for tracked points
- **IconLayer** -- Custom markers (emoji, SVG, image) with hover tooltips and click handlers
- **Built-in controls** -- Zoom, layer toggle panel, geocoding search box
- **Hooks** -- `useViewport`, `useGeoJSON`, `useRealtime` (WebSocket subscriptions)
- **Geo utilities** -- Haversine distance, point-in-polygon, bounding box, path simplification
- **Color scales** -- Interpolation, sampling, domain mapping with built-in presets
- **Themes** -- Dark, satellite, light, and streets base maps out of the box

---

## Install

```bash
npm install @terra-gl/react
```

### Peer dependencies

```bash
npm install react react-dom @deck.gl/core @deck.gl/layers @deck.gl/aggregation-layers @deck.gl/react maplibre-gl
```

---

## Quickstart

```tsx
import {
  TerraMap,
  HeatmapLayer,
  TrajectoryLayer,
  GeofenceLayer,
  ZoomControl,
} from '@terra-gl/react';

function App() {
  return (
    <TerraMap center={[35.5, 33.9]} zoom={8} theme="dark">
      <HeatmapLayer data={earthquakes} weight="magnitude" radius={30} />
      <TrajectoryLayer data={vehicleTracks} color="#00ff88" animated />
      <GeofenceLayer
        zones={restrictedAreas}
        onEnter={(e) => alert(`Entered ${e.zone.name}`)}
      />
      <ZoomControl position="top-right" />
    </TerraMap>
  );
}
```

```
[ Screenshot: The quickstart example rendered -- a dark map centered on Beirut  ]
[ with earthquake heatmap, animated vehicle paths, and red geofence polygons.   ]
```

---

## API Reference

### `<TerraMap>`

Root container component. All layers and controls must be children of `TerraMap`.

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `center` | `[lon, lat]` | `[0, 0]` | Initial map center |
| `zoom` | `number` | `2` | Initial zoom level (0-22) |
| `pitch` | `number` | `0` | Map pitch in degrees |
| `bearing` | `number` | `0` | Map bearing in degrees |
| `theme` | `'dark' \| 'satellite' \| 'light' \| 'streets' \| string` | `'dark'` | Theme or custom style URL |
| `width` | `string \| number` | `'100%'` | Container width |
| `height` | `string \| number` | `'100%'` | Container height |
| `interactive` | `boolean` | `true` | Enable/disable user interactions |
| `onViewportChange` | `(viewport) => void` | -- | Viewport change callback |
| `onClick` | `(info) => void` | -- | Click callback with pick info |

The component exposes an imperative handle via `React.forwardRef`:

```tsx
const mapRef = useRef<TerraMapHandle>(null);

mapRef.current.flyTo(-73.98, 40.75, 12);
mapRef.current.fitBounds([-74.1, 40.6, -73.8, 40.9]);
```

---

### Layers

#### `<HeatmapLayer>`

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `data` | `T[]` | required | Point data array |
| `weight` | `keyof T \| number` | `1` | Weight field name or constant |
| `radius` | `number` | `30` | Heatmap radius in pixels |
| `intensity` | `number` | `1` | Intensity multiplier |
| `colorScale` | `'heat' \| 'viridis' \| 'plasma' \| 'coolwarm' \| RGBA[]` | `'heat'` | Color scale |
| `opacity` | `number` | `0.8` | Layer opacity |
| `getPosition` | `(d: T) => [lon, lat]` | -- | Custom position accessor |
| `getWeight` | `(d: T) => number` | -- | Custom weight accessor |

#### `<ClusterLayer>`

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `data` | `T[]` | required | Point data array |
| `clusterRadius` | `number` | `50` | Clustering radius in pixels |
| `maxClusterZoom` | `number` | `14` | Max zoom for clustering |
| `minPoints` | `number` | `2` | Min points per cluster |
| `clusterColor` | `ColorValue` | `'#ff6b6b'` | Cluster circle color |
| `pointColor` | `ColorValue` | `'#4dabf7'` | Unclustered point color |
| `onClusterClick` | `(cluster) => void` | -- | Cluster click handler |
| `onPointClick` | `(point) => void` | -- | Point click handler |

#### `<TrajectoryLayer>`

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `data` | `Trajectory[]` | required | Trajectory data |
| `color` | `ColorValue` | `'#00ff88'` | Path color |
| `width` | `number` | `2` | Path width in pixels |
| `animated` | `boolean` | `false` | Enable path animation |
| `speed` | `number` | `1` | Animation speed multiplier |
| `trailLength` | `number` | `0.15` | Trail length (0-1) |
| `showArrows` | `boolean` | `false` | Show direction arrows |
| `showEndpoints` | `boolean` | `false` | Show start/end markers |

#### `<GeofenceLayer>`

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `zones` | `GeofenceZone[]` | required | Polygon zone definitions |
| `fillColor` | `ColorValue` | `'rgba(66,135,245,0.2)'` | Zone fill color |
| `strokeColor` | `ColorValue` | `'#4287f5'` | Zone border color |
| `showLabels` | `boolean` | `false` | Show zone name labels |
| `trackedPoints` | `Coordinate[]` | -- | Points to track for enter/exit |
| `onEnter` | `(event) => void` | -- | Zone enter callback |
| `onExit` | `(event) => void` | -- | Zone exit callback |

#### `<IconLayer>`

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `data` | `T[]` | required | Marker data array |
| `icon` | `string` | `'📍'` | Default icon (emoji/URL) |
| `iconSize` | `number` | `24` | Icon size in pixels |
| `showTooltip` | `boolean` | `false` | Enable hover tooltips |
| `renderTooltip` | `(item: T) => ReactNode` | -- | Custom tooltip renderer |
| `onClick` | `(item: T) => void` | -- | Click handler |

---

### Controls

#### `<ZoomControl>`

```tsx
<ZoomControl position="top-right" showCompass />
```

#### `<LayerToggle>`

```tsx
<LayerToggle
  layers={[
    { id: 'heatmap', label: 'Heatmap', visible: true },
    { id: 'clusters', label: 'Clusters', visible: false },
  ]}
  onToggle={(id, visible) => handleToggle(id, visible)}
/>
```

#### `<SearchBox>`

```tsx
<SearchBox
  position="top-left"
  onSelect={(result) => mapRef.current.flyTo(...result.position, 14)}
/>
```

---

### Hooks

#### `useViewport`

```tsx
const { viewport, flyTo, fitBounds, zoomIn, zoomOut } = useViewport({
  longitude: -73.98,
  latitude: 40.75,
  zoom: 12,
  minZoom: 4,
  maxZoom: 18,
});
```

#### `useGeoJSON`

```tsx
const { data, loading, error, refetch } = useGeoJSON({
  url: 'https://api.example.com/points.geojson',
  refetchInterval: 30000,
});
```

#### `useRealtime`

```tsx
const { data, status, send } = useRealtime({
  url: 'wss://api.example.com/vehicles/stream',
  messageFilter: 'position_update',
  reconnect: true,
});
```

---

### Utilities

#### Geo

```ts
import { haversineDistance, pointInPolygon, computeBBox, simplifyPath } from '@terra-gl/react';

const km = haversineDistance([35.5, 33.9], [35.8, 34.1]);
const inside = pointInPolygon([35.5, 33.9], polygonCoords);
const bbox = computeBBox(points);
const simplified = simplifyPath(densePath, 0.001);
```

#### Color

```ts
import { createColorScale, domainColor, parseColor } from '@terra-gl/react';

const scale = createColorScale('viridis');
const color = scale(0.5); // [38, 130, 142, 255]
const mapped = domainColor(6.5, [0, 10], scale);
```

---

## Themes

| Theme | Description |
|-------|-------------|
| `dark` | Dark Matter (Carto) -- ideal for data-dense overlays |
| `satellite` | Voyager (Carto) -- good for terrain context |
| `light` | Positron (Carto) -- clean, minimal background |
| `streets` | Voyager variant -- labeled roads and POIs |

Pass a custom MapLibre style URL for full control:

```tsx
<TerraMap theme="https://tiles.example.com/style.json" />
```

---

## Data Types

```ts
interface WeightedPoint {
  position: [longitude: number, latitude: number];
  weight?: number;
}

interface Trajectory {
  id: string;
  path: { position: [lon, lat]; timestamp: number }[];
}

interface GeofenceZone {
  id: string;
  name: string;
  polygon: [lon, lat][];
}

interface IconMarker {
  id: string;
  position: [lon, lat];
  icon?: string;
  label?: string;
}
```

---

## Development

```bash
git clone https://github.com/Waiel5/terra.git
cd terra
npm install
npm run dev          # watch mode
npm run storybook    # component stories
npm test             # run tests
```

---

## License

MIT
