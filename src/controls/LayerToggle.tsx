import React, { useState, useCallback } from 'react';
import { useTerraContext } from '../TerraMap';
import type { ControlPosition, LayerVisibility } from '../utils/types';

export interface LayerToggleProps {
  /** Control position on the map (default 'top-left') */
  position?: ControlPosition;
  /** Layer visibility definitions */
  layers: LayerVisibility[];
  /** Callback when a layer's visibility is toggled */
  onToggle: (layerId: string, visible: boolean) => void;
  /** Whether the panel is initially collapsed */
  collapsed?: boolean;
  /** Panel title */
  title?: string;
  /** Custom class name */
  className?: string;
}

const POSITION_STYLES: Record<ControlPosition, React.CSSProperties> = {
  'top-left': { top: 12, left: 12 },
  'top-right': { top: 12, right: 12 },
  'bottom-left': { bottom: 12, left: 12 },
  'bottom-right': { bottom: 12, right: 12 },
};

/**
 * LayerToggle provides a panel for toggling layer visibility.
 * It can be collapsed to save space and integrates with
 * TerraMap's theming.
 *
 * @example
 * ```tsx
 * const [layers, setLayers] = useState([
 *   { id: 'heatmap', label: 'Heatmap', visible: true },
 *   { id: 'clusters', label: 'Clusters', visible: false },
 * ]);
 *
 * <LayerToggle
 *   layers={layers}
 *   onToggle={(id, vis) =>
 *     setLayers(ls => ls.map(l => l.id === id ? { ...l, visible: vis } : l))
 *   }
 * />
 * ```
 */
export function LayerToggle({
  position = 'top-left',
  layers,
  onToggle,
  collapsed: initialCollapsed = false,
  title = 'Layers',
  className,
}: LayerToggleProps): React.ReactElement {
  const { theme } = useTerraContext();
  const [collapsed, setCollapsed] = useState(initialCollapsed);

  const toggleCollapse = useCallback(() => {
    setCollapsed((prev) => !prev);
  }, []);

  const handleToggle = useCallback(
    (layerId: string, currentVisible: boolean) => {
      onToggle(layerId, !currentVisible);
    },
    [onToggle]
  );

  return (
    <div
      className={className ? `terra-control terra-layer-toggle ${className}` : 'terra-control terra-layer-toggle'}
      style={{
        position: 'absolute',
        ...POSITION_STYLES[position],
        zIndex: 10,
        backgroundColor: theme.controlBackground,
        border: `1px solid ${theme.controlBorder}`,
        borderRadius: 6,
        overflow: 'hidden',
        boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
        minWidth: 160,
      }}
      role="region"
      aria-label="Layer visibility controls"
    >
      <button
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          width: '100%',
          padding: '8px 12px',
          border: 'none',
          backgroundColor: 'transparent',
          color: theme.controlText,
          cursor: 'pointer',
          fontSize: 13,
          fontWeight: 600,
        }}
        onClick={toggleCollapse}
        aria-expanded={!collapsed}
      >
        <span>{title}</span>
        <span style={{ transform: collapsed ? 'rotate(-90deg)' : 'rotate(0)', transition: 'transform 0.2s' }}>
          &#x25BE;
        </span>
      </button>

      {!collapsed && (
        <div style={{ padding: '4px 0' }}>
          {layers.map((layer) => (
            <label
              key={layer.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '6px 12px',
                cursor: 'pointer',
                fontSize: 12,
                color: theme.controlText,
                transition: 'background-color 0.1s',
              }}
            >
              <input
                type="checkbox"
                checked={layer.visible}
                onChange={() => handleToggle(layer.id, layer.visible)}
                style={{ margin: 0, accentColor: theme.accent }}
              />
              <span style={{ opacity: layer.visible ? 1 : 0.5 }}>{layer.label}</span>
            </label>
          ))}
          {layers.length === 0 && (
            <div style={{ padding: '8px 12px', fontSize: 11, color: theme.controlText, opacity: 0.5 }}>
              No layers
            </div>
          )}
        </div>
      )}
    </div>
  );
}
