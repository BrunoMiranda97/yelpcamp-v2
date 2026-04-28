import mongoose, { Schema } from "mongoose";

const UserSchema = new Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  avatar: { type: String, default: "https://images.unsplash.com/photo-1511367461989-f85a21fda167?w=400&h=400&fit=crop" },
  isAdmin: { type: Boolean, default: false }
}, { timestamps: true });

export default mongoose.model("User", UserSchema);
