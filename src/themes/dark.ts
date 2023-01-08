/** Dark map style URL — uses MapLibre's dark-matter basemap */
export const DARK_STYLE = 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json';

export const darkTheme = {
  id: 'dark' as const,
  name: 'Dark',
  styleUrl: DARK_STYLE,
  background: '#0d1117',
  foreground: '#c9d1d9',
  accent: '#58a6ff',
  controlBackground: 'rgba(13, 17, 23, 0.85)',
  controlBorder: 'rgba(48, 54, 61, 0.8)',
  controlText: '#c9d1d9',
  tooltipBackground: 'rgba(13, 17, 23, 0.92)',
  tooltipText: '#f0f6fc',
};
