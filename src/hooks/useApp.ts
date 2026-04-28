import { useState, useEffect } from "react";

export function useCampgrounds() {
  const [campgrounds, setCampgrounds] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const fetchCampgrounds = async (reset = false) => {
    try {
      const pageToFetch = reset ? 1 : page;
      if (reset) setLoading(true);
      else setLoadingMore(true);

      const res = await fetch(`/api/campgrounds?page=${pageToFetch}&limit=20`);
      if (!res.ok) throw new Error("Failed to fetch campgrounds");
      const data = await res.json();
      
      setCampgrounds(prev => reset ? data.campgrounds : [...prev, ...data.campgrounds]);
      setHasMore(data.hasMore);
      setPage(prev => pageToFetch + 1);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    fetchCampgrounds(true);
  }, []);

  return { campgrounds, loading, loadingMore, error, hasMore, fetchMore: () => fetchCampgrounds(false), refresh: () => fetchCampgrounds(true) };
}

export function useMapData() {
  const [mapData, setMapData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMapData = async () => {
      try {
        const res = await fetch("/api/campgrounds/map-data");
        if (res.ok) {
          const data = await res.json();
          setMapData(data);
        }
      } catch (err) {
        console.error("Map Data Fetch Error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchMapData();
  }, []);

  return { mapData, loading };
}

export function useAuth() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  const login = (userData: any, token: string) => {
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(userData));
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
  };

  return { user, loading, login, logout, isAuthenticated: !!user };
}
