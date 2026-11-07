// Usage: npm run migrate:ratings            (dry run: reports what would change)
//        npm run migrate:ratings -- --apply (writes the changes)
import "dotenv/config";
import mongoose from "mongoose";
import { connectDB } from "../api/db.ts";
import { backfillRatingSum } from "../api/migrations/backfillRatingSum.ts";

const apply = process.argv.includes("--apply");

await connectDB();
try {
  const result = await backfillRatingSum({ dryRun: !apply });
  console.log(`${apply ? "Applied" : "Dry run"}:`, result);
  if (!apply && result.updated > 0) console.log("Re-run with --apply to write these changes.");
} finally {
  await mongoose.disconnect();
}
