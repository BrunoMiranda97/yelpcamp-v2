import { describe, expect, it, vi } from "vitest";
import request from "supertest";

// Enable geocoding for this file only and replace the Mapbox SDK with a controllable fake
// (a plain function, not vi.fn: Vitest reports errors thrown by spies even when the code catches them)
const geocoderResponse = vi.hoisted(() => {
  process.env.VITE_MAPBOX_TOKEN = "test-token";
  return { next: async (): Promise<unknown> => ({ body: { features: [] } }) };
});
vi.mock("@mapbox/mapbox-sdk/services/geocoding.js", () => ({
  default: () => ({ forwardGeocode: () => ({ send: () => geocoderResponse.next() }) })
}));

const { default: app } = await import("../../api/app.ts");
const { default: Campground } = await import("../../api/models/Campground.ts");
const { createUser, useTestDatabase } = await import("./helpers.ts");

useTestDatabase();

const fields = { title: "Somewhere", price: "10", description: "Nice", location: "Nowhere land" };

describe("geocoding on create", () => {
  it("stores the geocoded point", async () => {
    geocoderResponse.next = async () => ({
      body: { features: [{ geometry: { type: "Point", coordinates: [-105, 40] } }] }
    });
    const { auth } = await createUser();

    const res = await request(app).post("/api/campgrounds").set("Authorization", auth).field(fields);

    expect(res.status).toBe(201);
    expect(res.body.geometry).toEqual({ type: "Point", coordinates: [-105, 40] });
  });

  it("rejects locations that cannot be found instead of using [0, 0]", async () => {
    geocoderResponse.next = async () => ({ body: { features: [] } });
    const { auth } = await createUser();

    const res = await request(app).post("/api/campgrounds").set("Authorization", auth).field(fields);

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/Location not found/);
    expect(await Campground.countDocuments()).toBe(0);
  });

  it("reports an upstream failure without saving anything", async () => {
    geocoderResponse.next = async () => {
      throw new Error("network down");
    };
    const { auth } = await createUser();

    const res = await request(app).post("/api/campgrounds").set("Authorization", auth).field(fields);

    expect(res.status).toBe(502);
    expect(await Campground.countDocuments()).toBe(0);
  });
});
