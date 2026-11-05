import { describe, expect, it } from "vitest";
import request from "supertest";
import jwt from "jsonwebtoken";
import app from "../../api/app.ts";
import User from "../../api/models/User.ts";
import { createUser, useTestDatabase } from "./helpers.ts";

useTestDatabase();

describe("POST /api/auth/register", () => {
  it("creates a user with a hashed password and returns a token", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({ username: "camper", email: "camper@test.com", password: "password123" });

    expect(res.status).toBe(201);
    expect(res.body.token).toEqual(expect.any(String));
    expect(res.body.user).toMatchObject({ username: "camper", isAdmin: false });
    expect(res.body.user.password).toBeUndefined();

    const stored = await User.findOne({ username: "camper" });
    expect(stored?.password).not.toBe("password123");
  });

  it("rejects invalid input with a readable message", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({ username: "camper", email: "camper@test.com", password: "123" });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/at least 8 characters/);
  });

  it("does not allow self-assigning admin rights", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({ username: "sneaky", email: "sneaky@test.com", password: "password123", isAdmin: true });

    expect(res.status).toBe(201);
    expect(res.body.user.isAdmin).toBe(false);
  });

  it("rejects duplicated users", async () => {
    const { user } = await createUser();
    const res = await request(app)
      .post("/api/auth/register")
      .send({ username: user.username, email: "other@test.com", password: "password123" });

    expect(res.status).toBe(400);
  });
});

describe("POST /api/auth/login", () => {
  it("accepts username or email", async () => {
    const { user, password } = await createUser();

    const byName = await request(app).post("/api/auth/login").send({ username: user.username, password });
    const byEmail = await request(app).post("/api/auth/login").send({ username: user.email, password });

    expect(byName.status).toBe(200);
    expect(byEmail.status).toBe(200);
  });

  it("rejects a wrong password", async () => {
    const { user } = await createUser();
    const res = await request(app).post("/api/auth/login").send({ username: user.username, password: "wrong-pass" });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe("Invalid credentials");
  });

  it("blocks NoSQL operator injection", async () => {
    await createUser();
    const res = await request(app)
      .post("/api/auth/login")
      .send({ username: { $ne: null }, password: { $ne: null } });

    expect(res.status).toBe(400);
    expect(res.body.token).toBeUndefined();
  });
});

describe("token verification", () => {
  it("rejects tokens signed with another secret", async () => {
    const { user } = await createUser();
    const forged = jwt.sign({ id: user._id, username: user.username, isAdmin: true }, "attacker-secret");

    const res = await request(app)
      .post("/api/campgrounds/507f1f77bcf86cd799439011/reviews")
      .set("Authorization", `Bearer ${forged}`)
      .send({ body: "x", rating: 5 });

    expect(res.status).toBe(401);
  });
});

// Keep last: it exhausts the auth rate limit for this module instance
describe("rate limiting", () => {
  it("throttles repeated auth attempts", async () => {
    let status = 0;
    for (let i = 0; i < 25 && status !== 429; i++) {
      status = (await request(app).post("/api/auth/login").send({ username: "nobody", password: "x" })).status;
    }
    expect(status).toBe(429);
  });
});
