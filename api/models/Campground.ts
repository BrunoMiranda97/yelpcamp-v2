import mongoose, { Schema } from "mongoose";

const CampgroundSchema = new Schema({
  title: { type: String, required: true },
  price: { type: Number, required: true },
  description: { type: String, required: true },
  location: { type: String, required: true },
  images: [
    {
      url: String,
      filename: String
    }
  ],
  author: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  avgRating: { type: Number, default: 0 },
  // Running total of ratings so the average can be updated atomically with the reviews array
  ratingSum: { type: Number, default: 0 },
  reviews: [
    {
      type: Schema.Types.ObjectId,
      ref: "Review"
    }
  ],
  // Optional: absent when the location could not be geocoded (never a fake [0, 0] point)
  geometry: {
    type: { type: String, enum: ["Point"] },
    coordinates: { type: [Number], default: undefined }
  }
}, { timestamps: true });

/**
 * Update-pipeline stage deriving avgRating from ratingSum and the reviews array.
 * Shared by review writes and the backfill migration so both round identically (MongoDB $round).
 */
export const averageStage = {
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

export default mongoose.model("Campground", CampgroundSchema);
