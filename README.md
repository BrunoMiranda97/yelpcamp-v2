# YelpCamp V2 🏕️

[![CI](https://github.com/BrunoMiranda97/yelpcamp-v2/actions/workflows/ci.yml/badge.svg)](https://github.com/BrunoMiranda97/yelpcamp-v2/actions/workflows/ci.yml)

A full-stack campground marketplace built with React 19, TypeScript, Express and MongoDB. Users can list campsites with photos and map locations, browse them on a clustered map, and leave reviews.

**Live demo:** https://yelpcamp-v2-eight.vercel.app/
**Previous version (V1):** https://github.com/BrunoMiranda97/yelpcamp-v1

---

## Why V2?

V1 was built while I was learning backend fundamentals. V2 is a rebuild with typed code end to end, a separated API, cloud deployment and Docker.

After the first release, I ran a **technical audit** of V2 and fixed what it found: a stored XSS, a hard-coded JWT fallback secret, unmounted review routes, missing input validation, a broken Docker setup and no automated tests. The [Engineering notes](#engineering-notes) section explains these decisions.

---

## Tech stack

| Layer | Technologies |
| --- | --- |
| Frontend | React 19, TypeScript (strict), Vite, React Router 7, Tailwind CSS 4, Motion, Mapbox GL |
| Backend | Node.js, Express, MongoDB / Mongoose, Zod, JWT, bcrypt, Multer + Cloudinary |
| Security | Helmet (CSP), CORS allow-list, express-rate-limit, express-mongo-sanitize |
| Testing | Vitest, Supertest, mongodb-memory-server, Testing Library |
| Infra | Docker (multi-stage), Docker Compose, Vercel (serverless API + static SPA), GitHub Actions |

---

## Features

- **Auth:** registration and login with JWT, protected routes with redirect back after login, automatic logout when the token expires.
- **Campgrounds:** create/edit/delete (owner or admin only), image upload to Cloudinary or an external image URL, geocoding with Mapbox.
- **Browse:** infinite scroll with server-side pagination, server-side search across all records, clustered map.
- **Reviews:** 1–5 star ratings with a server-computed average; only the author or an admin can delete a review.

---

## Architecture

```text
yelpcamp-v2/
├── api/                      # Express API
│   ├── app.ts                # Express app: security middleware, routes, error handler
│   ├── index.ts              # Vercel serverless entry
│   ├── server.ts             # Standalone server (local dev, Docker); serves the SPA in production
│   ├── db.ts                 # Cached MongoDB connection (serverless-friendly)
│   ├── config/               # Env validation, Cloudinary/Multer
│   ├── middleware/           # JWT auth, centralized error handling
│   ├── models/               # Mongoose schemas
│   ├── routes/               # auth, campgrounds, reviews
│   ├── utils/                # HttpError, asyncHandler
│   └── validation/           # Zod schemas
├── src/                      # React SPA
│   ├── components/           # UI, layout, campground/* (map, carousel, reviews)
│   ├── context/              # Auth and theme providers
│   ├── hooks/                # Data hooks with request cancellation
│   ├── pages/                # Route components (map-heavy pages are lazy-loaded)
│   ├── services/             # Typed HTTP client and session storage
│   └── types.ts              # Shared domain types
├── tests/
│   ├── api/                  # Integration tests against an in-memory MongoDB
│   └── web/                  # Frontend unit/component tests
├── Dockerfile                # Multi-stage build → Node runtime serving API + SPA
├── docker-compose.yml        # App + MongoDB
└── vercel.json               # Serverless API + static build
```

The same Express app runs in two places: as a Vercel serverless function (`api/index.ts`) and as a standalone server (`api/server.ts`) for local development and Docker.

---

## Getting started

**Requirements:** Node.js 20+, a MongoDB database (or Docker), and Cloudinary and Mapbox accounts.

```bash
git clone https://github.com/BrunoMiranda97/yelpcamp-v2.git
cd yelpcamp-v2
npm install
cp .env.example .env   # then fill in the values
npm run dev            # API on :3001 + Vite on :5173 (proxied /api)
```

### Environment variables

| Variable | Required | Description |
| --- | --- | --- |
| `MONGODB_URI` | yes | MongoDB connection string |
| `JWT_SECRET` | yes | At least 32 characters; the API refuses to start otherwise |
| `CLOUDINARY_CLOUD_NAME` / `CLOUDINARY_KEY` / `CLOUDINARY_SECRET` | yes | Image uploads |
| `VITE_MAPBOX_TOKEN` | yes | Public Mapbox token (maps and geocoding) |
| `ALLOWED_ORIGINS` | no | Comma-separated origins allowed to call the API cross-origin |
| `PORT` | no | Local API port (default `3001`) |

### Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | API (tsx watch) and frontend (Vite) together |
| `npm test` | All tests (API integration + frontend) |
| `npm run lint` | TypeScript type check (strict) |
| `npm run build` / `npm run build:api` | Build the SPA / compile the API to `build/api` |
| `npm start` | Run the compiled API (serves the SPA when `NODE_ENV=production`) |
| `npm run migrate:ratings` | Backfill rating totals for legacy data (dry run; `-- --apply` to write) |

### Docker

```bash
docker compose up --build   # http://localhost:3001
```

Compose starts the app together with a local MongoDB, so the stack runs with one command. The image is a multi-stage build: it contains only production dependencies and compiled output, runs as a non-root user and has a health check.

---

## Testing and CI

There are 51 tests. The API tests are integration tests that run against a real MongoDB in memory. They cover:

- **Authentication:** validation, password hashing, blocking self-assigned admin rights, NoSQL injection, forged tokens and rate limiting.
- **Authorization:** users cannot edit or delete other users' campgrounds or reviews, and a review cannot be deleted through another campground's URL.
- **Data integrity:** the average rating stays exact even under concurrent reviews, and deleting a campground also deletes its reviews.
- **Search and pagination:** search runs on the server, regex input is escaped and page sizes are capped.
- **Geocoding** (Mapbox mocked): unknown locations are rejected, upstream failures save nothing and edits never keep a stale map point.
- **Migration:** the rating backfill fixes legacy data, is idempotent and writes nothing in dry-run mode.
- **Frontend:** restoring a session (expired or corrupted data) and the route guard.

GitHub Actions runs the lint, tests and both builds on every push and pull request, and also checks that the Docker image builds.

---

## Engineering notes

Key fixes from the audit, and the reasoning behind them:

- **Stored XSS in map popups:** popups were built with `setHTML()` and user-provided titles. They now use DOM nodes and `textContent`, and a Content Security Policy adds a second layer of protection. The CSP ran in report-only mode in production first and was enforced once no violations showed up.
- **JWT secret:** the hard-coded fallback secret was removed. Configuration is validated at startup, so the app fails fast instead of signing tokens with a known key.
- **Validation and errors:** every input goes through Zod schemas, and a central error handler maps errors to consistent 4xx responses without leaking internals. Malformed IDs return 404 instead of 500.
- **Data integrity:** deleting a campground also removes its reviews and its Cloudinary images. If validation, geocoding or saving fails after an upload, the uploaded images are deleted again.
- **Rating consistency:** a review reference and the rating total are written in a single-document update pipeline, so the average is computed atomically and concurrent reviews cannot overwrite each other. If attaching a review fails, the review document is removed again. This works without transactions, which would need a replica set and would rule out a standalone MongoDB. For data created before the running total existed, `npm run migrate:ratings` recomputes it from the reviews. It is a dry run by default; add `-- --apply` to write the changes.
- **Locations:** a location that cannot be geocoded is rejected instead of being stored at `[0, 0]`. Campgrounds without coordinates are left off the map.
- **Search:** search used to filter only the page already loaded in the browser. It now runs on the server, with debounce and cancellation of outdated requests.
- **Type safety:** the project had no React type definitions and strict mode was off, so most frontend code was effectively `any`. The codebase now type-checks under `strict`, with shared domain types.

### Known trade-offs

- **The JWT is stored in `localStorage`.** This keeps the API stateless and simple. The risk is mitigated by removing the XSS sources and by the CSP. An HttpOnly cookie with CSRF protection is the next step if the app grows.
- **Uploads are validated by Cloudinary.** Files stream straight to Cloudinary, which only accepts real JPEG and PNG images (`allowed_formats`), and nothing is served from this server. Checking magic bytes on the server would require buffering every upload first.
- **Rate limiting is in memory.** On serverless, each instance keeps its own counters. A shared store such as Redis or Upstash would make the limit global.

---

## Author

**Bruno Miranda**
GitHub: https://github.com/BrunoMiranda97
LinkedIn: https://www.linkedin.com/in/brunomiranda97/
