import test from "node:test";
import assert from "node:assert/strict";
import { acceptDiscoveryPoll, openDiscoveryPoll } from "./discoveryPoll.js";

test("a discovery poll opened on Trending does not merge after Latest opens", () => {
  let generation = 0;
  const trending = openDiscoveryPoll(generation);
  generation = trending;
  const latest = openDiscoveryPoll(generation);
  generation = latest;
  assert.notEqual(trending, latest);
  assert.equal(acceptDiscoveryPoll(trending, generation, false, false, 10), false);
  assert.equal(acceptDiscoveryPoll(latest, generation, false, false, 10), true);
});

test("the same open poll still applies, and an empty page or a paging change does not", () => {
  const opened = openDiscoveryPoll(0);
  assert.equal(acceptDiscoveryPoll(opened, opened, false, false, 4), true);
  assert.equal(acceptDiscoveryPoll(opened, opened, false, false, 0), false);
  assert.equal(acceptDiscoveryPoll(opened, opened, true, false, 4), false);
});
