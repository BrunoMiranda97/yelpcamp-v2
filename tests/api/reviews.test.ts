import { describe, expect, it } from "vitest";
import request from "supertest";
import app from "../../api/app.ts";
import Campground from "../../api/models/Campground.ts";
import { createCampground, createUser, useTestDatabase } from "./helpers.ts";

useTestDatabase();

const postReview = (campId: unknown, auth: string, body: object) =>
  request(app).post(`/api/campgrounds/${campId}/reviews`).set("Authorization", auth).send(body);

describe("reviews", () => {
  it("creates reviews and keeps the average rating up to date", async () => {
    const host = await createUser();
    const camp = await createCampground(host.user._id);
    const a = await createUser();
    const b = await createUser();

    const first = await postReview(camp._id, a.auth, { body: "Good", rating: 4 });
    await postReview(camp._id, b.auth, { body: "Great", rating: 5 });

    expect(first.status).toBe(201);
    expect(first.body.author.username).toBe(a.user.username);

    const updated = await Campground.findById(camp._id);
    expect(updated?.reviews).toHaveLength(2);
    expect(updated?.avgRating).toBe(4.5);
  });

  it("keeps the average exact under concurrent reviews", async () => {
    const host = await createUser();
    const camp = await createCampground(host.user._id);
    const reviewers = await Promise.all([1, 2, 3, 4, 5].map(() => createUser()));

    // All requests race each other; the single-document update pipeline must not lose any
    const results = await Promise.all(
      reviewers.map((r, i) => postReview(camp._id, r.auth, { body: "Race", rating: i + 1 }))
    );

    expect(results.every((r) => r.status === 201)).toBe(true);
    const updated = await Campground.findById(camp._id);
    expect(updated?.reviews).toHaveLength(5);
    expect(updated?.avgRating).toBe(3);
  });

  it("rejects ratings outside 1-5", async () => {
    const { user, auth } = await createUser();
    const camp = await createCampground(user._id);

    const res = await postReview(camp._id, auth, { body: "Too good", rating: 6 });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/between 1 and 5/);
  });

  it("returns 404 when the campground does not exist", async () => {
    const { auth } = await createUser();
    const res = await postReview("507f1f77bcf86cd799439011", auth, { body: "Hi", rating: 3 });
    expect(res.status).toBe(404);
  });

  it("only lets the author (or an admin) delete a review", async () => {
    const author = await createUser();
    const other = await createUser();
    const camp = await createCampground(author.user._id);
    const { body: review } = await postReview(camp._id, author.auth, { body: "Mine", rating: 2 });
    const url = `/api/campgrounds/${camp._id}/reviews/${review._id}`;

    expect((await request(app).delete(url).set("Authorization", other.auth)).status).toBe(403);
    expect((await request(app).delete(url).set("Authorization", author.auth)).status).toBe(200);

    const updated = await Campground.findById(camp._id);
    expect(updated?.reviews).toHaveLength(0);
    expect(updated?.avgRating).toBe(0);
  });

  it("does not delete a review through a different campground's URL", async () => {
    const author = await createUser();
    const campA = await createCampground(author.user._id);
    const campB = await createCampground(author.user._id, { title: "Other" });
    const { body: review } = await postReview(campA._id, author.auth, { body: "On A", rating: 5 });

    const res = await request(app)
      .delete(`/api/campgrounds/${campB._id}/reviews/${review._id}`)
      .set("Authorization", author.auth);

    expect(res.status).toBe(404);
    expect((await Campground.findById(campA._id))?.reviews).toHaveLength(1);
  });
});
