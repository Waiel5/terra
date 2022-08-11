import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useTerraContext } from '../TerraMap';
import type { ControlPosition, GeocodingResult } from '../utils/types';

export interface SearchBoxProps {
  /** Control position on the map (default 'top-left') */
  position?: ControlPosition;
  /** Geocoding API URL template. Use {query} as a placeholder. */
  geocodeUrl?: string;
  /** Placeholder text */
  placeholder?: string;
  /** Maximum number of results to show */
  maxResults?: number;
  /** Debounce delay in ms (default 300) */
  debounceMs?: number;
  /** Callback when a search result is selected */
  onSelect?: (result: GeocodingResult) => void;
  /** Custom result parser for non-standard geocoding APIs */
  parseResults?: (response: unknown) => GeocodingResult[];
  /** Custom class name */
  className?: string;
}

const POSITION_STYLES: Record<ControlPosition, React.CSSProperties> = {
  'top-left': { top: 12, left: 12 },
  'top-right': { top: 12, right: 12 },
  'bottom-left': { bottom: 12, left: 12 },
  'bottom-right': { bottom: 12, right: 12 },
};

const DEFAULT_GEOCODE_URL = 'https://nominatim.openstreetmap.org/search?format=json&q={query}&limit=5';

/**
 * Parse Nominatim-format results into our GeocodingResult type.
 */
function parseNominatimResults(response: unknown): GeocodingResult[] {
  if (!Array.isArray(response)) return [];
  return response.map((item: Record<string, unknown>) => ({
    label: String(item.display_name ?? ''),
    position: [
      parseFloat(String(item.lon ?? 0)),
      parseFloat(String(item.lat ?? 0)),
    ] as [number, number],
    bbox: item.boundingbox
      ? [
          parseFloat(String((item.boundingbox as string[])[2])),
          parseFloat(String((item.boundingbox as string[])[0])),
          parseFloat(String((item.boundingbox as string[])[3])),
          parseFloat(String((item.boundingbox as string[])[1])),
        ] as [number, number, number, number]
      : undefined,
  }));
}

/**
 * SearchBox provides a geocoding search input with autocomplete results.
 * It defaults to using the Nominatim API but supports any geocoding
 * service via the geocodeUrl and parseResults props.
 *
 * @example
 * ```tsx
 * <SearchBox
 *   position="top-left"
 *   onSelect={(result) => map.flyTo(result.position[0], result.position[1], 14)}
 *   placeholder="Search places..."
 * />
 * ```
 */
export function SearchBox({
  position = 'top-left',
  geocodeUrl = DEFAULT_GEOCODE_URL,
  placeholder = 'Search location...',
  maxResults = 5,
  debounceMs = 300,
  onSelect,
  parseResults,
  className,
}: SearchBoxProps): React.ReactElement {
  const { theme } = useTerraContext();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<GeocodingResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const fetchResults = useCallback(
    async (q: string) => {
      if (q.trim().length < 2) {
        setResults([]);
        setIsOpen(false);
        return;
      }

      setLoading(true);
      try {
        const url = geocodeUrl.replace('{query}', encodeURIComponent(q));
        const response = await fetch(url);
        const json = await response.json();

        const parsed = parseResults ? parseResults(json) : parseNominatimResults(json);
        setResults(parsed.slice(0, maxResults));
        setIsOpen(parsed.length > 0);
        setSelectedIndex(-1);
      } catch {
        setResults([]);
        setIsOpen(false);
      } finally {
        setLoading(false);
      }
    },
    [geocodeUrl, maxResults, parseResults]
  );

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setQuery(value);

      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => fetchResults(value), debounceMs);
    },
    [fetchResults, debounceMs]
  );

  const handleSelect = useCallback(
    (result: GeocodingResult) => {
      setQuery(result.label);
      setIsOpen(false);
      setResults([]);
      onSelect?.(result);
    },
    [onSelect]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!isOpen) return;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex((prev) => Math.min(prev + 1, results.length - 1));
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex((prev) => Math.max(prev - 1, 0));
          break;
        case 'Enter':
          e.preventDefault();
          if (selectedIndex >= 0 && selectedIndex < results.length) {
            handleSelect(results[selectedIndex]);
          }
          break;
        case 'Escape':
          setIsOpen(false);
          break;
      }
    },
    [isOpen, results, selectedIndex, handleSelect]
  );

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div
      ref={containerRef}
      className={className ? `terra-control terra-search-box ${className}` : 'terra-control terra-search-box'}
      style={{
        position: 'absolute',
        ...POSITION_STYLES[position],
        zIndex: 15,
        width: 280,
      }}
      role="search"
      aria-label="Location search"
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          backgroundColor: theme.controlBackground,
          border: `1px solid ${theme.controlBorder}`,
          borderRadius: isOpen ? '6px 6px 0 0' : 6,
          padding: '0 10px',
          transition: 'border-radius 0.15s',
        }}
      >
        <span style={{ fontSize: 14, marginRight: 6, opacity: 0.5 }} aria-hidden="true">
          &#x1F50D;
        </span>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => results.length > 0 && setIsOpen(true)}
          placeholder={placeholder}
          style={{
            flex: 1,
            border: 'none',
            outline: 'none',
            backgroundColor: 'transparent',
            color: theme.controlText,
            fontSize: 13,
            padding: '8px 0',
            width: '100%',
          }}
          role="combobox"
          aria-expanded={isOpen}
          aria-autocomplete="list"
          aria-controls="terra-search-results"
        />
        {loading && (
          <span
            style={{ fontSize: 12, opacity: 0.5, animation: 'spin 1s linear infinite' }}
            aria-label="Loading"
          >
            &#x21BB;
          </span>
        )}
      </div>

      {isOpen && results.length > 0 && (
        <ul
          id="terra-search-results"
          role="listbox"
          style={{
            listStyle: 'none',
            margin: 0,
            padding: 0,
            backgroundColor: theme.controlBackground,
            border: `1px solid ${theme.controlBorder}`,
            borderTop: 'none',
            borderRadius: '0 0 6px 6px',
            maxHeight: 200,
            overflowY: 'auto',
          }}
        >
          {results.map((result, index) => (
            <li
              key={`${result.position.join(',')}-${index}`}
              role="option"
              aria-selected={index === selectedIndex}
              style={{
                padding: '8px 12px',
                fontSize: 12,
                color: theme.controlText,
                cursor: 'pointer',
                backgroundColor: index === selectedIndex ? theme.accent + '20' : 'transparent',
                borderBottom: index < results.length - 1 ? `1px solid ${theme.controlBorder}` : undefined,
                transition: 'background-color 0.1s',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
              onClick={() => handleSelect(result)}
              onMouseEnter={() => setSelectedIndex(index)}
            >
              {result.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
