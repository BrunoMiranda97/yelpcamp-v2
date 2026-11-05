import mongoose from "mongoose";

type MongooseCache = { conn: typeof mongoose | null; promise: Promise<typeof mongoose> | null };

declare global {
  // eslint-disable-next-line no-var
  var mongooseCache: MongooseCache | undefined;
}

// Cached on globalThis so serverless invocations and dev hot-reloads reuse one connection
const cached: MongooseCache = (globalThis.mongooseCache ??= { conn: null, promise: null });

export async function connectDB() {
  if (cached.conn) return cached.conn;

  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("MONGODB_URI is not defined");

  cached.promise ??= mongoose.connect(uri, { serverSelectionTimeoutMS: 10000 });

  try {
    cached.conn = await cached.promise;
  } catch (err) {
    // Allow the next request to retry instead of reusing a rejected promise forever
    cached.promise = null;
    throw err;
  }
  return cached.conn;
}
