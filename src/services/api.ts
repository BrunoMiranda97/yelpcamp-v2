import type {
  AuthResponse,
  Campground,
  CampgroundInput,
  MapPoint,
  PaginatedCampgrounds,
  Review
} from "../types.ts";
import { getToken, UNAUTHORIZED_EVENT } from "./session.ts";

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

interface RequestOptions {
  method?: "GET" | "POST" | "PUT" | "DELETE";
  body?: unknown;
  signal?: AbortSignal;
}

async function request<T>(path: string, { method = "GET", body, signal }: RequestOptions = {}): Promise<T> {
  const headers: Record<string, string> = {};
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  let payload: BodyInit | undefined;
  if (body instanceof FormData) {
    payload = body; // the browser sets the multipart boundary
  } else if (body !== undefined) {
    headers["Content-Type"] = "application/json";
    payload = JSON.stringify(body);
  }

  let res: Response;
  try {
    res = await fetch(`/api${path}`, { method, headers, body: payload, signal });
  } catch (err) {
    if (signal?.aborted) throw err;
    throw new ApiError(0, "Network error. Please check your connection.");
  }

  const data = await res.json().catch(() => null);
  if (!res.ok) {
    if (res.status === 401 && token) window.dispatchEvent(new Event(UNAUTHORIZED_EVENT));
    throw new ApiError(res.status, data?.message ?? `Request failed (${res.status})`);
  }
  return data as T;
}

const query = (params: Record<string, string | number | undefined>) => {
  const qs = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "") qs.set(key, String(value));
  }
  const str = qs.toString();
  return str ? `?${str}` : "";
};

export const authApi = {
  login: (username: string, password: string) =>
    request<AuthResponse>("/auth/login", { method: "POST", body: { username, password } }),
  register: (username: string, email: string, password: string) =>
    request<AuthResponse>("/auth/register", { method: "POST", body: { username, email, password } })
};

export const campgroundsApi = {
  list: ({ page = 1, limit = 20, search, signal }: { page?: number; limit?: number; search?: string; signal?: AbortSignal }) =>
    request<PaginatedCampgrounds>(`/campgrounds${query({ page, limit, search })}`, { signal }),
  mapData: (search?: string, signal?: AbortSignal) =>
    request<MapPoint[]>(`/campgrounds/map-data${query({ search })}`, { signal }),
  get: (id: string, signal?: AbortSignal) => request<Campground>(`/campgrounds/${encodeURIComponent(id)}`, { signal }),
  create: (data: FormData) => request<Campground>("/campgrounds", { method: "POST", body: data }),
  update: (id: string, data: Partial<CampgroundInput>) =>
    request<Campground>(`/campgrounds/${encodeURIComponent(id)}`, { method: "PUT", body: data }),
  remove: (id: string) => request<{ message: string }>(`/campgrounds/${encodeURIComponent(id)}`, { method: "DELETE" })
};

export const reviewsApi = {
  create: (campgroundId: string, body: string, rating: number) =>
    request<Review>(`/campgrounds/${encodeURIComponent(campgroundId)}/reviews`, {
      method: "POST",
      body: { body, rating }
    }),
  remove: (campgroundId: string, reviewId: string) =>
    request<{ message: string }>(
      `/campgrounds/${encodeURIComponent(campgroundId)}/reviews/${encodeURIComponent(reviewId)}`,
      { method: "DELETE" }
    )
};

export const errorMessage = (err: unknown, fallback = "Something went wrong") =>
  err instanceof Error && err.message ? err.message : fallback;
