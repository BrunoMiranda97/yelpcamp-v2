import { describe, expect, it } from "vitest";
import request from "supertest";
import { Types } from "mongoose";
import app from "../../api/app.ts";
import Campground from "../../api/models/Campground.ts";
import Review from "../../api/models/Review.ts";
import { backfillRatingSum } from "../../api/migrations/backfillRatingSum.ts";
import { createCampground, createUser, useTestDatabase } from "./helpers.ts";

useTestDatabase();

/** A campground as it looked before ratingSum existed: reviews referenced, no running total. */
async function legacyCampground(ratings: number[]) {
  const { user } = await createUser();
  const camp = await createCampground(user._id);
  const reviews = await Review.insertMany(ratings.map((rating) => ({ body: "Old", rating, author: user._id })));
  const danglingRef = new Types.ObjectId(); // review deleted long ago, reference left behind
  await Campground.collection.updateOne(
    { _id: camp._id },
    { $set: { reviews: [...reviews.map((r) => r._id), danglingRef], avgRating: 4 }, $unset: { ratingSum: "" } }
  );
  return camp;
}

describe("backfillRatingSum", () => {
  it("does not write anything in dry-run mode", async () => {
    const camp = await legacyCampground([4, 5, 3]);

    const result = await backfillRatingSum({ dryRun: true });

    expect(result.updated).toBe(1);
    const raw = await Campground.collection.findOne({ _id: camp._id });
    expect(raw?.ratingSum).toBeUndefined();
  });

  it("restores ratingSum so new reviews keep a correct average", async () => {
    const camp = await legacyCampground([4, 5, 3]);

    const result = await backfillRatingSum();
    expect(result).toMatchObject({ updated: 1, skipped: 0 });

    const migrated = await Campground.findById(camp._id);
    expect(migrated?.ratingSum).toBe(12);
    expect(migrated?.reviews).toHaveLength(3); // dangling reference removed
    expect(migrated?.avgRating).toBe(4);

    // The scenario from the audit: without the backfill this would give (0 + 5) / 4
    const reviewer = await createUser();
    await request(app)
      .post(`/api/campgrounds/${camp._id}/reviews`)
      .set("Authorization", reviewer.auth)
      .send({ body: "New", rating: 5 });

    const after = await Campground.findById(camp._id);
    expect(after?.ratingSum).toBe(17);
    expect(after?.avgRating).toBe(4.2); // 17 / 4 = 4.25, MongoDB $round is half-to-even
  });

  it("is idempotent", async () => {
    await legacyCampground([2, 4]);
    await backfillRatingSum();

    const secondRun = await backfillRatingSum();

    expect(secondRun.updated).toBe(0);
  });
});
