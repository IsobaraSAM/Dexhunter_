import test from "node:test";
import assert from "node:assert/strict";
import fs from "fs";
import os from "os";
import path from "path";
import { createMetrics, recordUnique, recordUpdate, restoreMetrics, snapshot } from "./metrics.js";
import { loadIndex, retainTokens, saveIndex } from "./index-store.js";

test("a live launch counts once and a later update is not a new token", () => {
  const now = 1_000_000;
  const metrics = createMetrics(now);
  recordUnique(metrics, "onchain", now);
  recordUpdate(metrics, now + 1000);
  const view = snapshot(metrics, now + 1000);
  assert.equal(view.cumulative.uniqueTokens, 1);
  assert.equal(view.cumulative.liveLaunches, 1);
  assert.equal(view.cumulative.updates, 1);
  assert.equal(view.liveLaunchesPerMin, 1);
});

test("historical on-chain backfill does not inflate the live per-minute rate", () => {
  const now = 9_000_000;
  const metrics = createMetrics(now);
  recordUnique(metrics, "backfill", now);
  recordUnique(metrics, "onchain", now);
  const view = snapshot(metrics, now);
  assert.equal(view.cumulative.liveLaunches, 2);
  assert.equal(view.liveLaunchesPerMin, 1);
});

test("search inserts are not reported as live launch throughput", () => {
  const now = 5_000_000;
  const metrics = createMetrics(now);
  recordUnique(metrics, "search", now);
  const view = snapshot(metrics, now);
  assert.equal(view.liveLaunchesPerMin, 0);
  assert.equal(view.searchInsertsPerMin, 1);
});

test("zero samples and a restored process do not invent a rate from the total", () => {
  const empty = snapshot(createMetrics(10), 10);
  assert.equal(empty.liveLaunchesPerMin, 0);
  const restored = restoreMetrics({
    cumulative: { uniqueTokens: 5000, liveLaunches: 5000, searchInserts: 0, updates: 0, rejected: 0, enrichOk: 0, enrichFail: 0 },
    liveLaunchTimes: [1_000],
  }, 2_000_000);
  assert.equal(snapshot(restored, 2_000_000).liveLaunchesPerMin, 0);
  assert.equal(restored.cumulative.uniqueTokens, 5000);
});

test("index save reloads the same identity and drops a duplicate", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "dx-"));
  const file = path.join(dir, "index.json");
  const tokens = retainTokens([
    { chainId: "solana", discoveryMode: "onchain", baseToken: { address: "MintA" }, pairCreatedAt: 2 },
    { chainId: "solana", discoveryMode: "search", baseToken: { address: "MintA" }, pairCreatedAt: 9 },
    { chainId: "arc", discoveryMode: "onchain", baseToken: { address: "0xabc" }, pairCreatedAt: 3 },
  ]);
  assert.equal(tokens.length, 2);
  saveIndex(file, { version: 1, tokens });
  const loaded = loadIndex(file);
  assert.equal(loaded.tokens.length, 2);
  assert.equal(loaded.tokens.find((t) => t.chainId === "solana").discoveryMode, "onchain");
});
