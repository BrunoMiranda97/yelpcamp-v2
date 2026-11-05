// Deterministic environment for every test file, independent of any local .env
process.env.JWT_SECRET = "test-secret-that-is-long-enough-for-validation-0123456789";
process.env.VITE_MAPBOX_TOKEN = ""; // disables geocoding (no network calls in tests)
process.env.ALLOWED_ORIGINS = "";
