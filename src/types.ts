export interface User {
  id: string;
  username: string;
  email?: string;
  isAdmin: boolean;
}

export interface Author {
  _id: string;
  username: string;
}

export interface CampgroundImage {
  url: string;
  filename?: string;
}

export interface Geometry {
  type: "Point";
  coordinates: [number, number];
}

export interface Review {
  _id: string;
  body: string;
  rating: number;
  author: Author | null;
  createdAt: string;
}

interface CampgroundBase {
  _id: string;
  title: string;
  price: number;
  description: string;
  location: string;
  images: CampgroundImage[];
  geometry: Geometry;
  author: Author | null;
  avgRating: number;
  createdAt: string;
  updatedAt: string;
}

/** Item returned by the list endpoint (reviews are not populated). */
export interface CampgroundSummary extends CampgroundBase {
  reviews: string[];
}

/** Full campground returned by GET /campgrounds/:id. */
export interface Campground extends CampgroundBase {
  reviews: Review[];
}

export type MapPoint = Pick<Campground, "_id" | "title" | "location" | "geometry">;

export interface PaginatedCampgrounds {
  campgrounds: CampgroundSummary[];
  total: number;
  hasMore: boolean;
}

export interface CampgroundInput {
  title: string;
  location: string;
  price: number;
  description: string;
  imageUrl?: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}
