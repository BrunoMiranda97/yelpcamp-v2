import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import mongoSanitize from "express-mongo-sanitize";

import { ALLOWED_ORIGINS } from "./config/env.js";
import authRoutes from "./routes/auth.js";
import campgroundRoutes from "./routes/campgrounds.js";
import reviewRoutes from "./routes/reviews.js";
import { errorHandler, notFound } from "./middleware/errorHandler.js";

const app = express();

// Vercel sits behind a proxy; needed so rate limiting sees the real client IP
app.set("trust proxy", 1);

// CSP matters when Express serves the SPA (Docker): it limits the damage of any XSS,
// including access to the token in localStorage. Hosts below are what the app needs.
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        "default-src": ["'self'"],
        "script-src": ["'self'"],
        "style-src": ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://api.mapbox.com"],
        "font-src": ["'self'", "data:", "https://fonts.gstatic.com"],
        // Campground images may be any https URL provided by users
        "img-src": ["'self'", "data:", "blob:", "https:"],
        "connect-src": ["'self'", "https://*.mapbox.com"],
        "worker-src": ["'self'", "blob:"],
        "child-src": ["blob:"],
        "object-src": ["'none'"],
        "frame-ancestors": ["'none'"]
      }
    }
  })
);
// Same-origin requests need no CORS; only explicitly allowed origins get access
app.use(cors({ origin: ALLOWED_ORIGINS.length ? ALLOWED_ORIGINS : false }));
app.use(express.json({ limit: "100kb" }));
app.use(mongoSanitize());

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { message: "Too many attempts, please try again later" }
});

app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/auth", authLimiter, authRoutes);
app.use("/api/campgrounds/:id/reviews", reviewRoutes);
app.use("/api/campgrounds", campgroundRoutes);

app.use("/api", notFound);
app.use(errorHandler);

export default app;
