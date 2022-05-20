import { useState, useEffect, useCallback, useRef } from 'react';
import type { GeoFeatureCollection } from '../utils/types';

export interface UseGeoJSONOptions {
  /** URL to fetch GeoJSON from */
  url: string;
  /** Auto-fetch on mount (default true) */
  autoFetch?: boolean;
  /** Transform the fetched data before storing */
  transform?: (data: GeoFeatureCollection) => GeoFeatureCollection;
  /** Refetch interval in milliseconds (0 = disabled) */
  refetchInterval?: number;
}

export interface UseGeoJSONReturn<P = Record<string, unknown>> {
  data: GeoFeatureCollection<P> | null;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

/**
 * Hook to fetch and parse GeoJSON data from a URL.
 *
 * @example
 * ```tsx
 * const { data, loading, error } = useGeoJSON({
 *   url: 'https://api.example.com/points.geojson',
 * });
 * ```
 */
export function useGeoJSON<P = Record<string, unknown>>(
  options: UseGeoJSONOptions
): UseGeoJSONReturn<P> {
  const { url, autoFetch = true, transform, refetchInterval = 0 } = options;

  const [data, setData] = useState<GeoFeatureCollection<P> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const transformRef = useRef(transform);
  transformRef.current = transform;

  const refetch = useCallback(async () => {
    if (abortRef.current) {
      abortRef.current.abort();
    }

    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(url, { signal: controller.signal });

      if (!response.ok) {
        throw new Error(`Failed to fetch GeoJSON: ${response.status} ${response.statusText}`);
      }

      const contentType = response.headers.get('content-type');
      if (contentType && !contentType.includes('json') && !contentType.includes('geo')) {
        throw new Error(`Unexpected content-type: ${contentType}`);
      }

      const json = (await response.json()) as GeoFeatureCollection<P>;

      if (json.type !== 'FeatureCollection' || !Array.isArray(json.features)) {
        throw new Error('Invalid GeoJSON: expected a FeatureCollection with features array');
      }

      const result = transformRef.current
        ? (transformRef.current(json as GeoFeatureCollection) as GeoFeatureCollection<P>)
        : json;

      setData(result);
    } catch (err) {
      if (err instanceof Error && err.name !== 'AbortError') {
        setError(err);
      }
    } finally {
      setLoading(false);
    }
  }, [url]);

  useEffect(() => {
    if (autoFetch) {
      refetch();
    }
    return () => {
      abortRef.current?.abort();
    };
  }, [autoFetch, refetch]);

  useEffect(() => {
    if (refetchInterval <= 0) return;

    const intervalId = setInterval(() => {
      refetch();
    }, refetchInterval);

    return () => clearInterval(intervalId);
  }, [refetchInterval, refetch]);

  return { data, loading, error, refetch };
}
