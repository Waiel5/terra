import React, { useState } from 'react';
import { TerraMap, ClusterLayer } from '../src';
import type { ClusterPoint, ClusterGroup } from '../src';

export default {
  title: 'Layers/ClusterLayer',
  component: ClusterLayer,
  parameters: {
    layout: 'fullscreen',
  },
};

// Generate random sensor data across a city grid
function generateSensorData(count: number): ClusterPoint[] {
  const points: ClusterPoint[] = [];
  const baseLon = -73.98;
  const baseLat = 40.75;

  for (let i = 0; i < count; i++) {
    points.push({
      position: [
        baseLon + (Math.random() - 0.5) * 0.15,
        baseLat + (Math.random() - 0.5) * 0.1,
      ],
      properties: {
        id: `sensor-${i}`,
        type: ['temperature', 'humidity', 'air-quality'][Math.floor(Math.random() * 3)],
        value: Math.round(Math.random() * 100),
      },
    });
  }

  return points;
}

const sensorData = generateSensorData(300);

export const Default = () => (
  <TerraMap center={[-73.98, 40.75]} zoom={12} theme="dark" height="100vh">
    <ClusterLayer data={sensorData} clusterRadius={50} />
  </TerraMap>
);

export const CustomColors = () => (
  <TerraMap center={[-73.98, 40.75]} zoom={12} theme="dark" height="100vh">
    <ClusterLayer
      data={sensorData}
      clusterRadius={60}
      clusterColor="#e040fb"
      pointColor="#00e5ff"
      pointSize={8}
    />
  </TerraMap>
);

export const WithClickHandlers = () => {
  const [selected, setSelected] = useState<string | null>(null);

  return (
    <TerraMap center={[-73.98, 40.75]} zoom={12} theme="dark" height="100vh">
      <ClusterLayer
        data={sensorData}
        clusterRadius={50}
        onClusterClick={(cluster: ClusterGroup) => {
          setSelected(`Cluster of ${cluster.pointCount} points`);
        }}
        onPointClick={(point: ClusterPoint) => {
          setSelected(`Point at ${point.position.join(', ')}`);
        }}
      />
      {selected && (
        <div
          style={{
            position: 'absolute',
            bottom: 20,
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'rgba(0,0,0,0.8)',
            color: '#fff',
            padding: '8px 16px',
            borderRadius: 8,
            fontSize: 13,
          }}
        >
          {selected}
        </div>
      )}
    </TerraMap>
  );
};

export const LargeDataset = () => {
  const largeData = generateSensorData(5000);
  return (
    <TerraMap center={[-73.98, 40.75]} zoom={10} theme="dark" height="100vh">
      <ClusterLayer
        data={largeData}
        clusterRadius={80}
        maxClusterZoom={16}
      />
    </TerraMap>
  );
};
