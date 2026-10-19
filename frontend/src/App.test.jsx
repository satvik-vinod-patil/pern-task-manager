import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import App from "./App.jsx";

function mockFetch(handler) {
  globalThis.fetch = vi.fn(async (url, options) => {
    const { status = 200, body } = handler(url, options);
    return { ok: status < 400, status, json: async () => body };
  });
}

beforeEach(() => localStorage.clear());
afterEach(() => cleanup());

describe("App", () => {
  it("shows the login form when logged out", () => {
    render(<App />);
    expect(screen.getByRole("heading", { name: "Log in" })).toBeInTheDocument();
  });

  it("shows tasks when logged in", async () => {
    localStorage.setItem("token", "abc");
    mockFetch(() => ({
      body: [{ id: 1, title: "Learn CI/CD", completed: false }],
    }));
    render(<App />);
    expect(await screen.findByText("Learn CI/CD")).toBeInTheDocument();
  });

  it("shows an error when the API fails", async () => {
    localStorage.setItem("token", "abc");
    mockFetch(() => ({ status: 503, body: { error: "Database is unavailable." } }));
    render(<App />);
    await waitFor(() =>
      expect(screen.getByRole("alert")).toHaveTextContent("Database is unavailable.")
    );
  });
});
