import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { JWT_SECRET } from "../config/env.js";
import { asyncHandler, HttpError } from "../utils/http.js";
import { loginSchema, registerSchema } from "../validation/schemas.js";

const router = express.Router();

function authResponse(user: InstanceType<typeof User>) {
  const token = jwt.sign(
    { id: user._id, username: user.username, isAdmin: user.isAdmin },
    JWT_SECRET,
    { expiresIn: "1d", algorithm: "HS256" }
  );
  return {
    token,
    user: { id: user._id, username: user.username, email: user.email, isAdmin: user.isAdmin }
  };
}

// Register
router.post(
  "/register",
  asyncHandler(async (req, res) => {
    const { username, email, password } = registerSchema.parse(req.body);

    if (await User.exists({ $or: [{ email }, { username }] })) {
      throw new HttpError(400, "User already exists");
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({ username, email, password: hashedPassword });

    res.status(201).json(authResponse(user));
  })
);

// Login
router.post(
  "/login",
  asyncHandler(async (req, res) => {
    const { username, password } = loginSchema.parse(req.body);

    const user = await User.findOne({ $or: [{ email: username }, { username }] });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      throw new HttpError(400, "Invalid credentials");
    }

    res.json(authResponse(user));
  })
);

export default router;
