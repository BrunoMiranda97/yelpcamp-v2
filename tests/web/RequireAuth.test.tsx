// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { AuthProvider } from "../../src/context/AuthContext.tsx";
import { RequireAuth } from "../../src/components/RequireAuth.tsx";
import { fakeToken } from "./utils.ts";

function renderProtected() {
  return render(
    <AuthProvider>
      <MemoryRouter initialEntries={["/campgrounds/new"]}>
        <Routes>
          <Route path="/login" element={<p>Login page</p>} />
          <Route
            path="/campgrounds/new"
            element={
              <RequireAuth>
                <p>New campground form</p>
              </RequireAuth>
            }
          />
        </Routes>
      </MemoryRouter>
    </AuthProvider>
  );
}

describe("RequireAuth", () => {
  afterEach(() => {
    cleanup();
    localStorage.clear();
  });

  it("redirects anonymous visitors to the login page", () => {
    renderProtected();
    expect(screen.getByText("Login page")).toBeTruthy();
    expect(screen.queryByText("New campground form")).toBeNull();
  });

  it("renders the page for signed-in users", () => {
    localStorage.setItem("token", fakeToken({ exp: Math.floor(Date.now() / 1000) + 3600 }));
    localStorage.setItem("user", JSON.stringify({ id: "1", username: "camper", isAdmin: false }));

    renderProtected();
    expect(screen.getByText("New campground form")).toBeTruthy();
  });
});
