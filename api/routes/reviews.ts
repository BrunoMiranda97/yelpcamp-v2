import express from "express";
import Review from "../models/Review.js";
import Campground from "../models/Campground.js";
import { authenticate, AuthRequest } from "../middleware/auth.js";

const router = express.Router({ mergeParams: true });

// Create Review
router.post("/", authenticate, async (req: AuthRequest, res) => {
  try {
    const campground = await Campground.findById(req.params.id);
    if (!campground) return res.status(404).json({ message: "Campground not found" });

    const review = new Review({
      body: req.body.body,
      rating: req.body.rating,
      author: req.user?.id
    });

    campground.reviews.push(review._id as any);
    await review.save();
    await campground.save();

    const fullReview = await Review.findById(review._id).populate("author", "username");
    res.json(fullReview);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// Delete Review
router.delete("/:reviewId", authenticate, async (req: AuthRequest, res) => {
  try {
    const { id, reviewId } = req.params;
    const review = await Review.findById(reviewId);
    if (!review) return res.status(404).json({ message: "Review not found" });

    if (review.author.toString() !== req.user?.id && !req.user?.isAdmin) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    await Campground.findByIdAndUpdate(id, { $pull: { reviews: reviewId } });
    await Review.findByIdAndDelete(reviewId);

    res.json({ message: "Review deleted" });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
