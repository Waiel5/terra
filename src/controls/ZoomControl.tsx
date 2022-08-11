import React, { useCallback } from 'react';
import { useTerraContext } from '../TerraMap';
import type { ControlPosition } from '../utils/types';

export interface ZoomControlProps {
  /** Control position on the map (default 'top-right') */
  position?: ControlPosition;
  /** Whether to show the compass/reset bearing button */
  showCompass?: boolean;
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
 * ZoomControl provides zoom in/out buttons and an optional compass
 * button that resets bearing and pitch to zero.
 *
 * @example
 * ```tsx
 * <TerraMap>
 *   <ZoomControl position="top-right" showCompass />
 * </TerraMap>
 * ```
 */
export function ZoomControl({
  position = 'top-right',
  showCompass = false,
  className,
}: ZoomControlProps): React.ReactElement {
  const { viewport, theme } = useTerraContext();

  const buttonStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 32,
    height: 32,
    border: 'none',
    backgroundColor: 'transparent',
    color: theme.controlText,
    cursor: 'pointer',
    fontSize: 18,
    lineHeight: 1,
    padding: 0,
    transition: 'background-color 0.15s ease',
  };

  const separatorStyle: React.CSSProperties = {
    height: 1,
    backgroundColor: theme.controlBorder,
    margin: '0 4px',
  };

  return (
    <div
      className={className ? `terra-control terra-zoom-control ${className}` : 'terra-control terra-zoom-control'}
      style={{
        position: 'absolute',
        ...POSITION_STYLES[position],
        zIndex: 10,
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: theme.controlBackground,
        border: `1px solid ${theme.controlBorder}`,
        borderRadius: 6,
        overflow: 'hidden',
        boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
      }}
      role="group"
      aria-label="Map zoom controls"
    >
      <button
        style={buttonStyle}
        aria-label="Zoom in"
        title="Zoom in"
        data-action="zoom-in"
      >
        +
      </button>
      <div style={separatorStyle} />
      <button
        style={buttonStyle}
        aria-label="Zoom out"
        title="Zoom out"
        data-action="zoom-out"
      >
        &#x2212;
      </button>
      {showCompass && (
        <>
          <div style={separatorStyle} />
          <button
            style={{
              ...buttonStyle,
              transform: `rotate(${-viewport.bearing}deg)`,
              transition: 'transform 0.3s ease, background-color 0.15s ease',
            }}
            aria-label="Reset bearing"
            title="Reset bearing"
            data-action="reset-bearing"
          >
            &#x25B2;
          </button>
        </>
      )}
    </div>
  );
}
