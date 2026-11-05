import { useCallback, useEffect, useRef, useState } from "react";
import { ApiError, campgroundsApi, errorMessage } from "../services/api.ts";
import type { Campground, CampgroundSummary, MapPoint } from "../types.ts";

const PAGE_SIZE = 20;

/** Paginated, server-side searched campground list. Stale requests are aborted. */
export function useCampgrounds(search: string) {
  const [campgrounds, setCampgrounds] = useState<CampgroundSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const nextPage = useRef(1);
  const controllerRef = useRef<AbortController | null>(null);

  const load = useCallback(
    async (reset: boolean) => {
      controllerRef.current?.abort();
      const controller = new AbortController();
      controllerRef.current = controller;

      const page = reset ? 1 : nextPage.current;
      if (reset) setLoading(true);
      else setLoadingMore(true);
      setError(null);

      try {
        const data = await campgroundsApi.list({ page, limit: PAGE_SIZE, search, signal: controller.signal });
        setCampgrounds((prev) => (reset ? data.campgrounds : [...prev, ...data.campgrounds]));
        setHasMore(data.hasMore);
        nextPage.current = page + 1;
      } catch (err) {
        if (!controller.signal.aborted) setError(errorMessage(err, "Failed to fetch campgrounds"));
      } finally {
        if (controllerRef.current === controller) {
          setLoading(false);
          setLoadingMore(false);
        }
      }
    },
    [search]
  );

  useEffect(() => {
    load(true);
    return () => controllerRef.current?.abort();
  }, [load]);

  const fetchMore = useCallback(() => load(false), [load]);

  return { campgrounds, loading, loadingMore, error, hasMore, fetchMore };
}

/** Lightweight coordinates for the cluster map, filtered by the same search. */
export function useMapData(search: string) {
  const [mapData, setMapData] = useState<MapPoint[]>([]);

  useEffect(() => {
    const controller = new AbortController();
    campgroundsApi
      .mapData(search, controller.signal)
      .then(setMapData)
      .catch((err) => {
        if (!controller.signal.aborted) console.error("Map data fetch error:", err);
      });
    return () => controller.abort();
  }, [search]);

  return mapData;
}

/** Single campground with reviews; `reload` refreshes it without a loading flash. */
export function useCampground(id: string | undefined) {
  const [campground, setCampground] = useState<Campground | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<ApiError | null>(null);

  const load = useCallback(
    async (signal?: AbortSignal) => {
      if (!id) return;
      try {
        setCampground(await campgroundsApi.get(id, signal));
        setError(null);
      } catch (err) {
        if (signal?.aborted) return;
        setError(err instanceof ApiError ? err : new ApiError(0, "Failed to load campground"));
      } finally {
        if (!signal?.aborted) setLoading(false);
      }
    },
    [id]
  );

  useEffect(() => {
    setLoading(true);
    const controller = new AbortController();
    load(controller.signal);
    return () => controller.abort();
  }, [load]);

  const reload = useCallback(() => load(), [load]);

  return { campground, loading, error, reload };
}

/** Returns `value` after it has stopped changing for `delay` ms. */
export function useDebouncedValue<T>(value: T, delay = 300) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}
