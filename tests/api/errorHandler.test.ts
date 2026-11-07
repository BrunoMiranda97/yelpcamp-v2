import { describe, expect, it, vi } from "vitest";
import type { Request, Response } from "express";
import { errorHandler } from "../../api/middleware/errorHandler.ts";

function run(err: unknown) {
  const res = { status: vi.fn().mockReturnThis(), json: vi.fn().mockReturnThis() };
  errorHandler(err, {} as Request, res as unknown as Response, vi.fn());
  return { status: res.status.mock.calls[0]?.[0], body: res.json.mock.calls[0]?.[0] };
}

describe("errorHandler: Cloudinary errors", () => {
  it("maps a rejected file to 400", () => {
    // Shape observed from Cloudinary when a text file is uploaded as .png
    const { status, body } = run({ name: "Error", http_code: 400, message: "An unknown file format not allowed" });

    expect(status).toBe(400);
    expect(body.message).toMatch(/JPEG or PNG/);
  });

  it("maps an oversized file to 413", () => {
    const { status } = run({ name: "Error", http_code: 413, message: "File size too large" });
    expect(status).toBe(413);
  });

  it.each([401, 403, 420, 503])("treats %i (configuration, quota or outage) as a server error", (code) => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    const { status, body } = run({ name: "Error", http_code: code, message: "Invalid api_key" });

    expect(status).toBe(500);
    expect(body).toEqual({ message: "Server error" }); // no internal details leaked
  });
});
