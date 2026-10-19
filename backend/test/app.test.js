import { test } from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../src/app.js";

// A fake pool so tests run without a real database.
const fakePool = { query: async () => ({ rows: [], rowCount: 0 }) };
const config = { jwtSecret: "test-secret", jwtExpiresIn: "1h", corsOrigins: ["http://localhost:5173"] };

async function withServer(pool, fn) {
  const server = createApp(pool, config).listen(0);
  const { port } = server.address();
  try {
    await fn(`http://127.0.0.1:${port}`);
  } finally {
    server.close();
  }
}

test("GET /health returns ok", async () => {
  await withServer(fakePool, async (base) => {
    const res = await fetch(`${base}/health`);
    assert.equal(res.status, 200);
    assert.equal((await res.json()).status, "ok");
  });
});

test("GET /health/db returns 503 when database is down", async () => {
  const downPool = { query: async () => { throw new Error("boom"); } };
  await withServer(downPool, async (base) => {
    const res = await fetch(`${base}/health/db`);
    assert.equal(res.status, 503);
  });
});

test("GET /api/tasks without a token returns 401", async () => {
  await withServer(fakePool, async (base) => {
    const res = await fetch(`${base}/api/tasks`);
    assert.equal(res.status, 401);
  });
});

test("unknown route returns 404", async () => {
  await withServer(fakePool, async (base) => {
    const res = await fetch(`${base}/nope`);
    assert.equal(res.status, 404);
  });
});
