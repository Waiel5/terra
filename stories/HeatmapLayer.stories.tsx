import React from 'react';
import { TerraMap, HeatmapLayer } from '../src';
import type { WeightedPoint } from '../src';

export default {
  title: 'Layers/HeatmapLayer',
  component: HeatmapLayer,
  parameters: {
    layout: 'fullscreen',
  },
};

// Generate random earthquake-like data around the Mediterranean
function generateEarthquakeData(count: number): WeightedPoint[] {
  const points: WeightedPoint[] = [];
  const centers = [
    { lon: 35.5, lat: 33.9 },  // Lebanon
    { lon: 28.9, lat: 41.0 },  // Istanbul
    { lon: 23.7, lat: 37.9 },  // Athens
    { lon: 14.5, lat: 37.6 },  // Sicily
    { lon: 12.5, lat: 41.9 },  // Rome
  ];

  for (let i = 0; i < count; i++) {
    const center = centers[Math.floor(Math.random() * centers.length)];
    points.push({
      position: [
        center.lon + (Math.random() - 0.5) * 6,
        center.lat + (Math.random() - 0.5) * 4,
      ],
      weight: Math.random() * 7 + 1, // magnitude 1-8
    });
  }

  return points;
}

const earthquakeData = generateEarthquakeData(500);

export const Default = () => (
  <TerraMap center={[25, 38]} zoom={5} theme="dark" height="100vh">
    <HeatmapLayer data={earthquakeData} weight="weight" radius={30} />
  </TerraMap>
);

export const PlasmaScale = () => (
  <TerraMap center={[25, 38]} zoom={5} theme="dark" height="100vh">
    <HeatmapLayer
      data={earthquakeData}
      weight="weight"
      radius={40}
      colorScale="plasma"
      intensity={1.5}
    />
  </TerraMap>
);

export const ViridisScale = () => (
  <TerraMap center={[25, 38]} zoom={5} theme="light" height="100vh">
    <HeatmapLayer
      data={earthquakeData}
      weight="weight"
      radius={25}
      colorScale="viridis"
      opacity={0.7}
    />
  </TerraMap>
);

export const HighDensity = () => {
  const denseData = generateEarthquakeData(2000);
  return (
    <TerraMap center={[25, 38]} zoom={5} theme="dark" height="100vh">
      <HeatmapLayer
        data={denseData}
        weight="weight"
        radius={20}
        intensity={2}
        threshold={0.1}
      />
    </TerraMap>
  );
};
