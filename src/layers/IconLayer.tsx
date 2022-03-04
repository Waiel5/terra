import React, { useEffect, useMemo, useCallback, useState } from 'react';
import { useTerraContext } from '../TerraMap';
import type { IconMarker, ColorValue } from '../utils/types';

export interface IconLayerProps<T = IconMarker> {
  /** Unique layer identifier */
  id?: string;
  /** Array of icon marker data */
  data: T[];
  /** Default icon URL or emoji character */
  icon?: string;
  /** Icon size in pixels (default 24) */
  iconSize?: number;
  /** Icon anchor point */
  anchor?: 'center' | 'top' | 'bottom' | 'left' | 'right';
  /** Icon color tint (for SVG/emoji icons) */
  color?: ColorValue;
  /** Whether to show tooltips on hover */
  showTooltip?: boolean;
  /** Custom tooltip content renderer */
  renderTooltip?: (item: T) => React.ReactNode;
  /** Custom position accessor */
  getPosition?: (d: T) => [number, number];
  /** Custom icon accessor */
  getIcon?: (d: T) => string;
  /** Custom label accessor */
  getLabel?: (d: T) => string;
  /** Callback when an icon is clicked */
  onClick?: (item: T) => void;
  /** Layer visibility */
  visible?: boolean;
  /** Display name for layer toggle */
  label?: string;
}

/**
 * IconLayer renders custom icon markers with optional tooltips.
 * It supports emojis, image URLs, and custom renderers for tooltip content.
 *
 * @example
 * ```tsx
 * <IconLayer
 *   data={stations}
 *   icon="https://example.com/marker.svg"
 *   iconSize={32}
 *   showTooltip
 *   renderTooltip={(s) => <StationInfo station={s} />}
 *   onClick={(s) => selectStation(s.id)}
 * />
 * ```
 */
export function IconLayer<T = IconMarker>({
  id = 'terra-icons',
  data,
  icon = '\u{1F4CD}',
  iconSize = 24,
  anchor = 'bottom',
  color,
  showTooltip = false,
  renderTooltip,
  getPosition,
  getIcon,
  getLabel,
  onClick,
  visible = true,
  label = 'Icons',
}: IconLayerProps<T>): React.ReactElement | null {
  const { theme, registerLayer, unregisterLayer } = useTerraContext();
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  useEffect(() => {
    registerLayer(id, label);
    return () => unregisterLayer(id);
  }, [id, label, registerLayer, unregisterLayer]);

  const resolvedGetPosition = useMemo(() => {
    if (getPosition) return getPosition;
    return (d: T) => (d as unknown as IconMarker).position;
  }, [getPosition]);

  const resolvedGetIcon = useMemo(() => {
    if (getIcon) return getIcon;
    return () => icon;
  }, [getIcon, icon]);

  const resolvedGetLabel = useMemo(() => {
    if (getLabel) return getLabel;
    return (d: T) => (d as unknown as IconMarker).label ?? '';
  }, [getLabel]);

  const handleClick = useCallback(
    (item: T) => {
      onClick?.(item);
    },
    [onClick]
  );

  const anchorTransform = useMemo(() => {
    switch (anchor) {
      case 'top': return 'translate(-50%, 0)';
      case 'bottom': return 'translate(-50%, -100%)';
      case 'left': return 'translate(0, -50%)';
      case 'right': return 'translate(-100%, -50%)';
      default: return 'translate(-50%, -50%)';
    }
  }, [anchor]);

  if (!visible || data.length === 0) return null;

  return (
    <div
      className="terra-layer terra-layer--icons"
      data-layer-id={id}
      data-icon-count={data.length}
      style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}
      aria-label={`Icon layer: ${data.length} markers`}
    >
      {data.map((item, index) => {
        const position = resolvedGetPosition(item);
        const itemIcon = resolvedGetIcon(item);
        const itemLabel = resolvedGetLabel(item);
        const isHovered = hoveredIndex === index;

        const isEmoji = !itemIcon.startsWith('http') && !itemIcon.startsWith('/');

        return (
          <div
            key={`icon-${index}`}
            className="terra-icon-marker"
            data-position={position.join(',')}
            style={{
              position: 'absolute',
              transform: anchorTransform,
              cursor: onClick ? 'pointer' : 'default',
              pointerEvents: 'auto',
              transition: 'transform 0.15s ease',
              zIndex: isHovered ? 10 : 1,
            }}
            onClick={() => handleClick(item)}
            onMouseEnter={() => setHoveredIndex(index)}
            onMouseLeave={() => setHoveredIndex(null)}
          >
            {isEmoji ? (
              <span
                style={{
                  fontSize: iconSize,
                  lineHeight: 1,
                  filter: color ? `drop-shadow(0 0 2px ${typeof color === 'string' ? color : 'transparent'})` : undefined,
                }}
              >
                {itemIcon}
              </span>
            ) : (
              <img
                src={itemIcon}
                alt={itemLabel || 'Map marker'}
                width={iconSize}
                height={iconSize}
                style={{ display: 'block' }}
              />
            )}

            {/* Label below the icon */}
            {itemLabel && (
              <div
                className="terra-icon-marker__label"
                style={{
                  textAlign: 'center',
                  fontSize: 10,
                  fontWeight: 500,
                  color: theme.controlText,
                  marginTop: 2,
                  whiteSpace: 'nowrap',
                  userSelect: 'none',
                }}
              >
                {itemLabel}
              </div>
            )}

            {/* Tooltip on hover */}
            {showTooltip && isHovered && (
              <div
                className="terra-icon-marker__tooltip"
                style={{
                  position: 'absolute',
                  bottom: '100%',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  marginBottom: 8,
                  padding: '6px 10px',
                  backgroundColor: theme.tooltipBackground,
                  color: theme.tooltipText,
                  borderRadius: 6,
                  fontSize: 12,
                  whiteSpace: 'nowrap',
                  boxShadow: '0 2px 12px rgba(0,0,0,0.25)',
                  pointerEvents: 'none',
                  zIndex: 20,
                }}
              >
                {renderTooltip ? renderTooltip(item) : itemLabel || `${position[1].toFixed(4)}, ${position[0].toFixed(4)}`}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
