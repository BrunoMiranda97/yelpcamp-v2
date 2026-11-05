import { z } from "zod";

const text = (field: string, max: number) =>
  z
    .string({ error: `${field} is required` })
    .trim()
    .min(1, `${field} is required`)
    .max(max, `${field} must be at most ${max} characters`);

const httpUrl = z
  .string()
  .trim()
  .max(2000, "Image URL is too long")
  .refine((v) => {
    if (v === "") return true;
    try {
      return ["http:", "https:"].includes(new URL(v).protocol);
    } catch {
      return false;
    }
  }, "Image URL must be a valid http(s) URL");

export const campgroundSchema = z.object({
  title: text("Title", 100),
  location: text("Location", 200),
  description: text("Description", 5000),
  price: z.coerce
    .number({ error: "Price must be a number" })
    .positive("Price must be greater than zero")
    .max(10000, "Price must be at most 10000"),
  imageUrl: httpUrl.optional()
});

export const campgroundUpdateSchema = campgroundSchema.partial();

export const reviewSchema = z.object({
  body: text("Review", 2000),
  rating: z.coerce
    .number({ error: "Rating must be a number" })
    .int("Rating must be an integer")
    .min(1, "Rating must be between 1 and 5")
    .max(5, "Rating must be between 1 and 5")
});

export const registerSchema = z.object({
  username: text("Username", 30)
    .min(3, "Username must have at least 3 characters")
    .regex(/^[a-zA-Z0-9_.-]+$/, "Username may only contain letters, numbers, '.', '_' and '-'"),
  email: z.email("Invalid email").trim().max(254),
  // bcrypt only uses the first 72 bytes of a password
  password: z
    .string({ error: "Password is required" })
    .min(8, "Password must have at least 8 characters")
    .max(72, "Password must be at most 72 characters")
});

export const loginSchema = z.object({
  username: text("Username or email", 254),
  password: z.string({ error: "Password is required" }).min(1, "Password is required").max(200)
});

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20)
});

export const listQuerySchema = paginationSchema.extend({
  search: z.string().trim().max(100).optional()
});

export const searchQuerySchema = listQuerySchema.pick({ search: true });
