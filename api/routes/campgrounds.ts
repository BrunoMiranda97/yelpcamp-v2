import express from "express";
import Campground from "../models/Campground.js";
import { authenticate, AuthRequest } from "../middleware/auth.js";
import { upload } from "../config/cloudinary.js";
// @ts-ignore
import mbxGeocoding from "@mapbox/mapbox-sdk/services/geocoding.js";

const mapBoxToken = process.env.VITE_MAPBOX_TOKEN;
const geocoder = mapBoxToken ? mbxGeocoding({ accessToken: mapBoxToken }) : null;

const router = express.Router();

// Get all with pagination
router.get("/", async (req, res) => {
  try {
    console.log("Step 1 - route started");

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    console.log("Step 2 - pagination ok");

    const total = await Campground.countDocuments({});
    console.log("Step 3 - total:", total);

    const campgrounds = await Campground.find({})
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("author", "username");

    console.log("Step 4 - find ok:", campgrounds.length);

    res.json({
      campgrounds,
      total,
      hasMore: skip + campgrounds.length < total
    });

  } catch (err) {
    console.error("FULL CAMPGROUNDS ERROR:", err);

    res.status(500).json({
      message: err instanceof Error ? err.message : "Server error"
    });
  }
});

// Get all coordinates for the map
router.get("/map-data", async (req, res) => {
  try {
    const campgrounds = await Campground.find({}, { geometry: 1, title: 1, location: 1 });
    res.json(campgrounds);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// Get one
router.get("/:id", async (req, res) => {
  try {
    const campground = await Campground.findById(req.params.id)
      .populate("author", "username")
      .populate({
        path: "reviews",
        populate: { path: "author", select: "username" }
      });
    if (!campground) return res.status(404).json({ message: "Campground not found" });
    res.json(campground);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// Create
router.post("/", authenticate, upload.array("images"), async (req: AuthRequest, res) => {
  try {
    const { title, price, description, location } = req.body;
    let geometry = { type: "Point", coordinates: [0, 0] };

    if (geocoder && location) {
      const geoData = await geocoder.forwardGeocode({
        query: location,
        limit: 1
      }).send();
      if (geoData.body.features.length > 0) {
        geometry = geoData.body.features[0].geometry;
      }
    }

    const images = (req.files as any[]).map(f => ({
      url: f.path,
      filename: f.filename
    }));

    // Fallback if no images are uploaded
    if (images.length === 0 && req.body.imageUrl) {
      images.push({
        url: req.body.imageUrl,
        filename: "external-link"
      });
    }

    const campground = new Campground({
      title,
      price,
      description,
      location,
      images,
      geometry,
      author: req.user?.id
    });
    await campground.save();
    res.json(campground);
  } catch (err) {
    console.error("Geocoding Error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// Update
router.put("/:id", authenticate, async (req: AuthRequest, res) => {
  try {
    const campground = await Campground.findById(req.params.id);
    if (!campground) return res.status(404).json({ message: "Campground not found" });

    if (campground.author.toString() !== req.user?.id && !req.user?.isAdmin) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    const { title, price, description, location } = req.body;

    if (location && location !== campground.location && geocoder) {
      const geoData = await geocoder.forwardGeocode({
        query: location,
        limit: 1
      }).send();
      if (geoData.body.features.length > 0) {
        campground.geometry = geoData.body.features[0].geometry;
      }
    }

    campground.title = title ?? campground.title;
    campground.price = price ?? campground.price;
    campground.description = description ?? campground.description;
    campground.location = location ?? campground.location;

    await campground.save();
    res.json(campground);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// Delete
router.delete("/:id", authenticate, async (req: AuthRequest, res) => {
  try {
    const campground = await Campground.findById(req.params.id);
    if (!campground) return res.status(404).json({ message: "Campground not found" });

    if (campground.author.toString() !== req.user?.id && !req.user?.isAdmin) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    await Campground.findByIdAndDelete(req.params.id);
    res.json({ message: "Campground deleted" });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
