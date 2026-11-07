import express from "express";
import { isValidObjectId, Types } from "mongoose";
import Review from "../models/Review.js";
import Campground from "../models/Campground.js";
import { authenticate, AuthRequest } from "../middleware/auth.js";
import { asyncHandler, HttpError } from "../utils/http.js";
import { reviewSchema } from "../validation/schemas.js";

const router = express.Router({ mergeParams: true });

// avgRating derived from the running sum and the reviews array, computed inside the same update
const averageStage = {
  $set: {
    avgRating: {
      $cond: [
        { $gt: [{ $size: "$reviews" }, 0] },
        { $round: [{ $divide: ["$ratingSum", { $size: "$reviews" }] }, 1] },
        0
      ]
    }
  }
};

/**
 * Adds a review reference and updates the rating in a single-document update pipeline.
 * Single-document writes are atomic in MongoDB, so concurrent reviews can't produce a stale average.
 */
function attachReview(campgroundId: string, reviewId: Types.ObjectId, rating: number) {
  return Campground.updateOne(
    { _id: campgroundId },
    [
      {
        $set: {
          reviews: { $concatArrays: [{ $ifNull: ["$reviews", []] }, [reviewId]] },
          ratingSum: { $add: [{ $ifNull: ["$ratingSum", 0] }, rating] }
        }
      },
      averageStage
    ],
    { updatePipeline: true }
  );
}

function detachReview(campgroundId: string, reviewId: Types.ObjectId, rating: number) {
  return Campground.updateOne(
    { _id: campgroundId, reviews: reviewId },
    [
      {
        $set: {
          reviews: { $filter: { input: "$reviews", cond: { $ne: ["$$this", reviewId] } } },
          ratingSum: { $max: [0, { $subtract: [{ $ifNull: ["$ratingSum", 0] }, rating] }] }
        }
      },
      averageStage
    ],
    { updatePipeline: true }
  );
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

    // Save the review first so a failure never leaves a dangling reference on the campground.
    // If attaching fails (or the campground was deleted meanwhile), undo the insert.
    const review = await Review.create({ body, rating, author: req.user?.id });
    try {
      const { matchedCount } = await attachReview(id, review._id, rating);
      if (matchedCount === 0) throw new HttpError(404, "Campground not found");
    } catch (err) {
      await Review.deleteOne({ _id: review._id }).catch(() => undefined);
      throw err;
    }

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

    // Detach first: if the delete below fails, the leftover review is unreferenced and invisible
    const { matchedCount } = await detachReview(id, review._id, review.rating);
    if (matchedCount === 0) throw new HttpError(404, "Review not found");
    await Review.deleteOne({ _id: reviewId });

    res.json({ message: "Review deleted" });
  })
);

export default router;
