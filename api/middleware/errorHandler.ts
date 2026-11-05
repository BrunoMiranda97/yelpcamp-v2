import { ErrorRequestHandler, RequestHandler } from "express";
import mongoose from "mongoose";
import multer from "multer";
import { ZodError } from "zod";
import { HttpError } from "../utils/http.js";

export const notFound: RequestHandler = (req, res) => {
  res.status(404).json({ message: "Route not found" });
};

export const errorHandler: ErrorRequestHandler = (err, req, res, _next) => {
  if (err instanceof HttpError) {
    return res.status(err.status).json({ message: err.message });
  }
  if (err instanceof ZodError) {
    const errors = err.issues.map((i) => ({ path: i.path.join("."), message: i.message }));
    return res.status(400).json({ message: errors[0]?.message ?? "Invalid input", errors });
  }
  if (err instanceof mongoose.Error.CastError) {
    return res.status(404).json({ message: "Resource not found" });
  }
  if (err instanceof mongoose.Error.ValidationError) {
    return res.status(400).json({ message: "Invalid data" });
  }
  if (err instanceof multer.MulterError) {
    return res.status(400).json({ message: `Upload error: ${err.message}` });
  }
  if (err?.code === 11000) {
    return res.status(409).json({ message: "Resource already exists" });
  }
  if (err?.type === "entity.parse.failed") {
    return res.status(400).json({ message: "Malformed JSON body" });
  }
  if (err?.type === "entity.too.large") {
    return res.status(413).json({ message: "Request body too large" });
  }

  console.error(err);
  res.status(500).json({ message: "Server error" });
};
