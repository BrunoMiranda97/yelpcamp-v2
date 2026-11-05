import { afterAll, afterEach, beforeAll } from "vitest";
import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose, { Types } from "mongoose";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../../api/models/User.ts";
import Campground from "../../api/models/Campground.ts";

/** Spins up an in-memory MongoDB for the test file and wipes data between tests. */
export function useTestDatabase() {
  let mongo: MongoMemoryServer;

  beforeAll(async () => {
    mongo = await MongoMemoryServer.create();
    await mongoose.connect(mongo.getUri());
  });

  afterEach(async () => {
    await Promise.all(Object.values(mongoose.connection.collections).map((c) => c.deleteMany({})));
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongo?.stop();
  });
}

let counter = 0;

/** Inserts a user directly and returns a valid Authorization header for it. */
export async function createUser({ isAdmin = false, password = "password123" } = {}) {
  const username = `user${++counter}`;
  const user = await User.create({
    username,
    email: `${username}@test.com`,
    password: await bcrypt.hash(password, 4),
    isAdmin
  });
  const token = jwt.sign({ id: user._id, username, isAdmin }, process.env.JWT_SECRET!, { expiresIn: "1h" });
  return { user, password, auth: `Bearer ${token}` };
}

type CampgroundOverrides = Partial<{ title: string; location: string; images: { url: string; filename: string }[] }>;

export function createCampground(authorId: Types.ObjectId, overrides: CampgroundOverrides = {}) {
  return Campground.create({
    title: "Pine Ridge",
    price: 25,
    description: "Quiet spot by the lake",
    location: "Denver, CO",
    images: [],
    geometry: { type: "Point", coordinates: [-104.9, 39.7] },
    author: authorId,
    ...overrides
  });
}
