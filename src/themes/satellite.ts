/** Satellite map style URL — uses a free satellite tile source */
export const SATELLITE_STYLE = 'https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json';

export const satelliteTheme = {
  id: 'satellite' as const,
  name: 'Satellite',
  styleUrl: SATELLITE_STYLE,
  background: '#1b2838',
  foreground: '#ffffff',
  accent: '#4fc3f7',
  controlBackground: 'rgba(27, 40, 56, 0.85)',
  controlBorder: 'rgba(79, 195, 247, 0.3)',
  controlText: '#ffffff',
  tooltipBackground: 'rgba(27, 40, 56, 0.92)',
  tooltipText: '#ffffff',
};
