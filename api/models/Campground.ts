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
  reviews: [
    {
      type: Schema.Types.ObjectId,
      ref: "Review"
    }
  ],
  geometry: {
    type: {
      type: String,
      enum: ["Point"],
      required: true
    },
    coordinates: {
      type: [Number],
      required: true
    }
  }
}, { timestamps: true });

export default mongoose.model("Campground", CampgroundSchema);
