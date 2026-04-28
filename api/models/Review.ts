import mongoose, { Schema } from "mongoose";

const ReviewSchema = new Schema({
  body: { type: String, required: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  author: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true
  }
}, { timestamps: true });

export default mongoose.model("Review", ReviewSchema);
