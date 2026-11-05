// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from "vitest";
import { readStoredUser } from "../../src/services/session.ts";
import { fakeToken } from "./utils.ts";

const user = { id: "1", username: "camper", isAdmin: false };

const inOneHour = () => Math.floor(Date.now() / 1000) + 3600;

describe("readStoredUser", () => {
  beforeEach(() => localStorage.clear());

  it("restores a valid session", () => {
    localStorage.setItem("token", fakeToken({ exp: inOneHour() }));
    localStorage.setItem("user", JSON.stringify(user));
    expect(readStoredUser()).toEqual(user);
  });

  it("discards an expired token", () => {
    localStorage.setItem("token", fakeToken({ exp: 1 }));
    localStorage.setItem("user", JSON.stringify(user));

    expect(readStoredUser()).toBeNull();
    expect(localStorage.getItem("token")).toBeNull();
  });

  it("survives corrupted user data", () => {
    localStorage.setItem("token", fakeToken({ exp: inOneHour() }));
    localStorage.setItem("user", "{not json");

    expect(readStoredUser()).toBeNull();
  });
});
