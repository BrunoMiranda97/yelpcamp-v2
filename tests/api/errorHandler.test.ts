import { describe, expect, it, vi } from "vitest";
import type { Request, Response } from "express";
import { errorHandler } from "../../api/middleware/errorHandler.ts";

function run(err: unknown) {
  const res = { status: vi.fn().mockReturnThis(), json: vi.fn().mockReturnThis() };
  errorHandler(err, {} as Request, res as unknown as Response, vi.fn());
  return { status: res.status.mock.calls[0]?.[0], body: res.json.mock.calls[0]?.[0] };
}

describe("errorHandler", () => {
  it("maps a Cloudinary upload rejection to 400", () => {
    // Shape observed from Cloudinary when a text file is uploaded as .png
    const { status, body } = run({ name: "Error", http_code: 400, message: "An unknown file format not allowed" });

    expect(status).toBe(400);
    expect(body.message).toMatch(/JPEG or PNG/);
  });

  it("keeps Cloudinary outages as 500 without leaking details", () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    const { status, body } = run({ name: "Error", http_code: 503, message: "Service unavailable" });

    expect(status).toBe(500);
    expect(body).toEqual({ message: "Server error" });
  });
});
