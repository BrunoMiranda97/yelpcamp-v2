import Campground, { averageStage } from "../models/Campground.js";
import Review from "../models/Review.js";

export interface BackfillResult {
  scanned: number;
  updated: number;
  /** Changed by live traffic while the migration ran; safe to re-run. */
  skipped: number;
}

/**
 * Recomputes ratingSum (and avgRating) from the Review collection for campgrounds created before
 * ratingSum existed, and drops references to reviews that no longer exist.
 * Idempotent: running it again changes nothing.
 */
export async function backfillRatingSum({ dryRun = false } = {}): Promise<BackfillResult> {
  const result: BackfillResult = { scanned: 0, updated: 0, skipped: 0 };
  // Missing ratingSum also matches $ne: 0, so legacy documents are always included
  const cursor = Campground.find(
    { $or: [{ "reviews.0": { $exists: true } }, { ratingSum: { $ne: 0 } }] },
    { reviews: 1, ratingSum: 1, avgRating: 1 }
  ).cursor();

  for await (const campground of cursor) {
    result.scanned++;
    const found = await Review.find({ _id: { $in: campground.reviews } }, { rating: 1 }).lean();
    const ratingById = new Map(found.map((r) => [String(r._id), r.rating]));

    const reviews = campground.reviews.filter((id) => ratingById.has(String(id)));
    const ratingSum = reviews.reduce((sum, id) => sum + ratingById.get(String(id))!, 0);

    // Expected average computed by MongoDB with the same stage the review routes use, so rounding
    // matches exactly (JS rounding would differ on values like 4.25 and break idempotency)
    const [expected] = await Campground.aggregate<{ avgRating: number }>([
      { $match: { _id: campground._id } },
      { $set: { reviews, ratingSum } },
      averageStage,
      { $project: { avgRating: 1 } }
    ]);

    const raw = campground.toObject();
    const unchanged =
      raw.ratingSum === ratingSum &&
      reviews.length === campground.reviews.length &&
      raw.avgRating === expected?.avgRating;
    if (unchanged) continue;

    if (dryRun) {
      result.updated++;
      continue;
    }

    // Only write if the reviews array is still what we read (no concurrent review in between)
    const { matchedCount } = await Campground.updateOne(
      { _id: campground._id, reviews: campground.reviews },
      [{ $set: { reviews, ratingSum } }, averageStage],
      { updatePipeline: true }
    );
    if (matchedCount) result.updated++;
    else result.skipped++;
  }

  return result;
}
