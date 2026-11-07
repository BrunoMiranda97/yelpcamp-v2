import { describe, expect, it } from "vitest";
import request from "supertest";
import app from "../../api/app.ts";
import Campground from "../../api/models/Campground.ts";
import Review from "../../api/models/Review.ts";
import { createCampground, createUser, useTestDatabase } from "./helpers.ts";

useTestDatabase();

const validFields = {
  title: "Lakeside",
  price: "30",
  description: "Beautiful lake view",
  location: "Austin, TX",
  imageUrl: "https://example.com/lake.jpg"
};

describe("GET /api/campgrounds", () => {
  it("paginates results", async () => {
    const { user } = await createUser();
    for (let i = 0; i < 3; i++) await createCampground(user._id, { title: `Camp ${i}` });

    const res = await request(app).get("/api/campgrounds?limit=2");

    expect(res.status).toBe(200);
    expect(res.body.campgrounds).toHaveLength(2);
    expect(res.body).toMatchObject({ total: 3, hasMore: true });
  });

  it("rejects page sizes above the limit", async () => {
    const res = await request(app).get("/api/campgrounds?limit=999");
    expect(res.status).toBe(400);
  });

  it("searches title and location on the server", async () => {
    const { user } = await createUser();
    await createCampground(user._id, { title: "Desert Star", location: "Moab, UT" });
    await createCampground(user._id, { title: "Forest Edge", location: "Portland, OR" });

    const byTitle = await request(app).get("/api/campgrounds?search=desert");
    const byLocation = await request(app).get("/api/campgrounds?search=portland");

    expect(byTitle.body.campgrounds.map((c: { title: string }) => c.title)).toEqual(["Desert Star"]);
    expect(byLocation.body.campgrounds.map((c: { title: string }) => c.title)).toEqual(["Forest Edge"]);
  });

  it("treats regex characters in the search as plain text", async () => {
    const res = await request(app).get("/api/campgrounds?search=" + encodeURIComponent("(.*"));
    expect(res.status).toBe(200);
    expect(res.body.campgrounds).toHaveLength(0);
  });
});

describe("GET /api/campgrounds/map-data", () => {
  it("only returns campgrounds with real coordinates", async () => {
    const { user } = await createUser();
    await createCampground(user._id, { title: "Mapped" });
    await createCampground(user._id, { title: "Null Island", geometry: { type: "Point", coordinates: [0, 0] } });
    await createCampground(user._id, { title: "Unknown", geometry: undefined });

    const res = await request(app).get("/api/campgrounds/map-data");

    expect(res.body.map((c: { title: string }) => c.title)).toEqual(["Mapped"]);
  });
});

describe("GET /api/campgrounds/:id", () => {
  it("returns 404 for malformed and unknown ids", async () => {
    expect((await request(app).get("/api/campgrounds/not-an-id")).status).toBe(404);
    expect((await request(app).get("/api/campgrounds/507f1f77bcf86cd799439011")).status).toBe(404);
  });
});

describe("POST /api/campgrounds", () => {
  it("requires authentication", async () => {
    const res = await request(app).post("/api/campgrounds").field(validFields);
    expect(res.status).toBe(401);
  });

  it("validates the payload", async () => {
    const { auth } = await createUser();
    const res = await request(app)
      .post("/api/campgrounds")
      .set("Authorization", auth)
      .field({ ...validFields, price: "-5" });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/Price/);
  });

  it("only accepts https image URLs", async () => {
    const { auth } = await createUser();
    const res = await request(app)
      .post("/api/campgrounds")
      .set("Authorization", auth)
      .field({ ...validFields, imageUrl: "http://example.com/lake.jpg" });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/https/);
  });

  it("stores no fake coordinates when geocoding is unavailable", async () => {
    const { auth } = await createUser();
    const res = await request(app).post("/api/campgrounds").set("Authorization", auth).field(validFields);

    expect(res.status).toBe(201);
    expect(res.body.geometry).toBeUndefined();
  });

  it("creates a campground owned by the requester", async () => {
    const { user, auth } = await createUser();
    const res = await request(app).post("/api/campgrounds").set("Authorization", auth).field(validFields);

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ title: "Lakeside", price: 30, author: String(user._id) });
    expect(res.body.images).toEqual([expect.objectContaining({ url: validFields.imageUrl, filename: "external-link" })]);
  });
});

describe("PUT /api/campgrounds/:id", () => {
  it("forbids editing someone else's campground", async () => {
    const owner = await createUser();
    const intruder = await createUser();
    const camp = await createCampground(owner.user._id);

    const res = await request(app)
      .put(`/api/campgrounds/${camp._id}`)
      .set("Authorization", intruder.auth)
      .send({ title: "Hacked" });

    expect(res.status).toBe(403);
    expect((await Campground.findById(camp._id))?.title).toBe("Pine Ridge");
  });

  it("lets the owner and admins edit", async () => {
    const owner = await createUser();
    const admin = await createUser({ isAdmin: true });
    const camp = await createCampground(owner.user._id);

    const byOwner = await request(app).put(`/api/campgrounds/${camp._id}`).set("Authorization", owner.auth).send({ price: 40 });
    const byAdmin = await request(app).put(`/api/campgrounds/${camp._id}`).set("Authorization", admin.auth).send({ title: "Renamed" });

    expect(byOwner.status).toBe(200);
    expect(byAdmin.status).toBe(200);
    expect(byAdmin.body).toMatchObject({ price: 40, title: "Renamed" });
  });

  it("drops the old map point when a new location cannot be geocoded", async () => {
    const owner = await createUser();
    const camp = await createCampground(owner.user._id);

    const res = await request(app)
      .put(`/api/campgrounds/${camp._id}`)
      .set("Authorization", owner.auth)
      .send({ location: "Somewhere else" });

    expect(res.status).toBe(200);
    expect(res.body.location).toBe("Somewhere else");
    expect(res.body.geometry).toBeUndefined();
  });

  it("replaces the cover image when a new URL is sent", async () => {
    const owner = await createUser();
    const camp = await createCampground(owner.user._id, { images: [{ url: "https://old.com/a.jpg", filename: "external-link" }] });

    const res = await request(app)
      .put(`/api/campgrounds/${camp._id}`)
      .set("Authorization", owner.auth)
      .send({ imageUrl: "https://new.com/b.jpg" });

    expect(res.body.images.map((i: { url: string }) => i.url)).toEqual(["https://new.com/b.jpg"]);
  });
});

describe("DELETE /api/campgrounds/:id", () => {
  it("removes the campground and its reviews", async () => {
    const owner = await createUser();
    const camp = await createCampground(owner.user._id);
    const review = await Review.create({ body: "Nice", rating: 5, author: owner.user._id });
    await Campground.updateOne({ _id: camp._id }, { $push: { reviews: review._id } });

    const res = await request(app).delete(`/api/campgrounds/${camp._id}`).set("Authorization", owner.auth);

    expect(res.status).toBe(200);
    expect(await Campground.exists({ _id: camp._id })).toBeNull();
    expect(await Review.exists({ _id: review._id })).toBeNull();
  });
});
