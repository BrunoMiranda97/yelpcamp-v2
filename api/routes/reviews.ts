import express from "express";
import { isValidObjectId } from "mongoose";
import Review from "../models/Review.js";
import Campground from "../models/Campground.js";
import { authenticate, AuthRequest } from "../middleware/auth.js";
import { asyncHandler, HttpError } from "../utils/http.js";
import { reviewSchema } from "../validation/schemas.js";

const router = express.Router({ mergeParams: true });

async function updateAvgRating(campgroundId: string) {
  const campground = await Campground.findById(campgroundId).populate<{ reviews: { rating: number }[] }>(
    "reviews",
    "rating"
  );
  if (!campground) return;
  const ratings = campground.reviews.map((r) => r.rating);
  const avg = ratings.length ? ratings.reduce((a, b) => a + b, 0) / ratings.length : 0;
  await Campground.updateOne({ _id: campgroundId }, { avgRating: Math.round(avg * 10) / 10 });
}

// Create Review
router.post(
  "/",
  authenticate,
  asyncHandler<AuthRequest>(async (req, res) => {
    const { id } = req.params as { id: string };
    if (!isValidObjectId(id) || !(await Campground.exists({ _id: id }))) {
      throw new HttpError(404, "Campground not found");
    }

    const { body, rating } = reviewSchema.parse(req.body);

    // Save the review first so a failure never leaves a dangling reference on the campground
    const review = await Review.create({ body, rating, author: req.user?.id });
    await Campground.updateOne({ _id: id }, { $push: { reviews: review._id } });
    await updateAvgRating(id);

    const fullReview = await Review.findById(review._id).populate("author", "username");
    res.status(201).json(fullReview);
  })
);

// Delete Review
router.delete(
  "/:reviewId",
  authenticate,
  asyncHandler<AuthRequest>(async (req, res) => {
    const { id, reviewId } = req.params as { id: string; reviewId: string };
    if (!isValidObjectId(id) || !isValidObjectId(reviewId)) {
      throw new HttpError(404, "Review not found");
    }

    // Ensure the review actually belongs to the campground in the URL
    const belongs = await Campground.exists({ _id: id, reviews: reviewId });
    const review = belongs ? await Review.findById(reviewId) : null;
    if (!review) throw new HttpError(404, "Review not found");

    if (review.author.toString() !== req.user?.id && !req.user?.isAdmin) {
      throw new HttpError(403, "Unauthorized");
    }

    await Campground.updateOne({ _id: id }, { $pull: { reviews: reviewId } });
    await Review.deleteOne({ _id: reviewId });
    await updateAvgRating(id);

    res.json({ message: "Review deleted" });
  })
);

export default router;
