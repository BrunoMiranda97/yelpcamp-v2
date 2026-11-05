import express from "express";
import { isValidObjectId } from "mongoose";
import Campground from "../models/Campground.js";
import Review from "../models/Review.js";
import { authenticate, AuthRequest } from "../middleware/auth.js";
import { upload, cloudinary } from "../config/cloudinary.js";
import { asyncHandler, HttpError } from "../utils/http.js";
import { campgroundSchema, campgroundUpdateSchema, listQuerySchema, searchQuerySchema } from "../validation/schemas.js";
// @ts-ignore
import mbxGeocoding from "@mapbox/mapbox-sdk/services/geocoding.js";

const mapBoxToken = process.env.VITE_MAPBOX_TOKEN;
const geocoder = mapBoxToken ? mbxGeocoding({ accessToken: mapBoxToken }) : null;

type UploadedFile = { path: string; filename: string };

async function geocode(location: string) {
  if (!geocoder) return null;
  const geoData = await geocoder.forwardGeocode({ query: location, limit: 1 }).send();
  return geoData.body.features[0]?.geometry ?? null;
}

// Best-effort removal of Cloudinary images; failures must never block the request
async function destroyImages(filenames: string[]) {
  await Promise.allSettled(filenames.map((f) => cloudinary.uploader.destroy(f)));
}

// Case-insensitive match on title or location; user input is escaped so it is never treated as a regex
function searchFilter(search?: string) {
  if (!search) return {};
  const pattern = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
  return { $or: [{ title: pattern }, { location: pattern }] };
}

async function findOwnedCampground(req: AuthRequest) {
  const campground = await Campground.findById(req.params.id);
  if (!campground) throw new HttpError(404, "Campground not found");
  if (campground.author.toString() !== req.user?.id && !req.user?.isAdmin) {
    throw new HttpError(403, "Unauthorized");
  }
  return campground;
}

const router = express.Router();

// Reject malformed ids with 404 instead of letting Mongoose throw a CastError
router.param("id", (req, res, next, id) => {
  if (!isValidObjectId(id)) return res.status(404).json({ message: "Campground not found" });
  next();
});

// Get all with pagination
router.get(
  "/",
  asyncHandler(async (req, res) => {
    const { page, limit, search } = listQuerySchema.parse(req.query);
    const skip = (page - 1) * limit;
    const filter = searchFilter(search);

    const [total, campgrounds] = await Promise.all([
      Campground.countDocuments(filter),
      Campground.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).populate("author", "username")
    ]);

    res.json({ campgrounds, total, hasMore: skip + campgrounds.length < total });
  })
);

// Get all coordinates for the map
router.get(
  "/map-data",
  asyncHandler(async (req, res) => {
    const { search } = searchQuerySchema.parse(req.query);
    const campgrounds = await Campground.find(searchFilter(search), { geometry: 1, title: 1, location: 1 });
    res.json(campgrounds);
  })
);

// Get one
router.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const campground = await Campground.findById(req.params.id)
      .populate("author", "username")
      .populate({ path: "reviews", populate: { path: "author", select: "username" } });
    if (!campground) throw new HttpError(404, "Campground not found");
    res.json(campground);
  })
);

// Create
router.post(
  "/",
  authenticate,
  upload.array("images", 6),
  asyncHandler<AuthRequest>(async (req, res) => {
    const files = (req.files as UploadedFile[] | undefined) ?? [];

    const parsed = campgroundSchema.safeParse(req.body);
    if (!parsed.success) {
      // Files were already uploaded by multer; remove them so they don't become orphans
      await destroyImages(files.map((f) => f.filename));
      throw parsed.error;
    }
    const { title, price, description, location, imageUrl } = parsed.data;

    const images = files.map((f) => ({ url: f.path, filename: f.filename }));
    if (images.length === 0 && imageUrl) {
      images.push({ url: imageUrl, filename: "external-link" });
    }

    const geometry = (await geocode(location)) ?? { type: "Point", coordinates: [0, 0] };

    const campground = await Campground.create({
      title,
      price,
      description,
      location,
      images,
      geometry,
      author: req.user?.id
    });
    res.status(201).json(campground);
  })
);

// Update
router.put(
  "/:id",
  authenticate,
  asyncHandler<AuthRequest>(async (req, res) => {
    const campground = await findOwnedCampground(req);
    const { title, price, description, location, imageUrl } = campgroundUpdateSchema.parse(req.body);

    // A new cover URL replaces previous external links; uploaded images are kept
    if (imageUrl && imageUrl !== campground.images[0]?.url) {
      const uploaded = campground.images.filter((img) => img.filename !== "external-link");
      campground.set("images", [{ url: imageUrl, filename: "external-link" }, ...uploaded]);
    }

    if (location && location !== campground.location) {
      const geometry = await geocode(location);
      if (geometry) campground.geometry = geometry;
    }

    campground.title = title ?? campground.title;
    campground.price = price ?? campground.price;
    campground.description = description ?? campground.description;
    campground.location = location ?? campground.location;

    await campground.save();
    res.json(campground);
  })
);

// Delete
router.delete(
  "/:id",
  authenticate,
  asyncHandler<AuthRequest>(async (req, res) => {
    const campground = await findOwnedCampground(req);

    await Review.deleteMany({ _id: { $in: campground.reviews } });
    await Campground.deleteOne({ _id: campground._id });
    await destroyImages(
      campground.images
        .map((img) => img.filename)
        .filter((f): f is string => !!f && f !== "external-link")
    );

    res.json({ message: "Campground deleted" });
  })
);

export default router;
