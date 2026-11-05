// Standalone server for local development and Docker. Vercel uses api/index.ts instead.
import "dotenv/config";
import path from "path";
import express from "express";
import app from "./app.js";
import { connectDB } from "./db.js";

const PORT = Number(process.env.PORT) || 3001;

if (process.env.NODE_ENV === "production") {
  const dist = path.resolve("dist");
  app.use(express.static(dist));
  app.get("*", (req, res) => res.sendFile(path.join(dist, "index.html")));
}

await connectDB();
app.listen(PORT, () => console.log(`API listening on http://localhost:${PORT}`));
