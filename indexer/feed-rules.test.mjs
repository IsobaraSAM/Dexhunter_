import test from "node:test";
import assert from "node:assert/strict";
import {
  FEED_RULES,
  isMomentumEligible,
  isTrendingEligible,
  selectFeed,
  trendingScore,
} from "./feed-rules.js";

const now = 1_800_000_000_000;
const fresh = now - 60_000;

function token(partial) {
  return {
    chainId: partial.chain || "solana",
    baseToken: { address: partial.mint, symbol: partial.symbol || partial.mint },
    pairCreatedAt: partial.launched ?? now - 3_600_000,
    firstSeenAt: partial.seen ?? now - 3_000_000,
    marketUpdatedAt: partial.updated,
    volume: partial.volume == null ? undefined : { h24: partial.volume, h1: partial.h1, m5: partial.m5 },
    liquidity: partial.liquidity == null ? undefined : { usd: partial.liquidity },
    ...partial.extra,
  };
}

test("latest shows a new launch before it can trend, ordered by launch time", () => {
  const brandNew = token({ mint: "new", launched: now - 1_000, volume: null, liquidity: null, updated: undefined });
  const older = token({ mint: "old", launched: now - 50_000, volume: 9_000, liquidity: 2_000, updated: fresh });
  const feed = selectFeed([older, brandNew], "latest", now);
  assert.deepEqual(feed.map((t) => t.baseToken.address), ["new", "old"]);
  assert.equal(isTrendingEligible(brandNew, now), false);
});

test("missing volume cannot qualify, and a stored zero is not invented by the rule", () => {
  const unknown = token({ mint: "u", volume: null, liquidity: 10_000, updated: fresh });
  const below = token({ mint: "b", volume: FEED_RULES.trendingMinVolume24h - 1, liquidity: 10_000, updated: fresh });
  assert.equal(isTrendingEligible(unknown, now), false);
  assert.equal(isTrendingEligible(below, now), false);
  assert.equal(selectFeed([unknown, below], "trending", now).length, 0);
});

test("stale market data cannot qualify", () => {
  const stale = token({
    mint: "s",
    volume: 50_000,
    liquidity: 10_000,
    updated: now - FEED_RULES.marketDataMaxAgeMs - 1,
  });
  assert.equal(isTrendingEligible(stale, now), false);
});

test("eligible token with recent activity ranks above one with the same 24h volume but no recent flow", () => {
  const rising = token({ mint: "up", volume: 20_000, liquidity: 5_000, h1: 8_000, updated: fresh });
  const flat = token({ mint: "flat", volume: 20_000, liquidity: 5_000, h1: 0, updated: fresh });
  const feed = selectFeed([flat, rising], "trending", now);
  assert.deepEqual(feed.map((t) => t.baseToken.address), ["up", "flat"]);
  assert.ok(feed[0].scoreBreakdown.total > feed[1].scoreBreakdown.total);
});

test("a token does not trend just because it was just detected", () => {
  const detected = token({ mint: "seen", launched: now, volume: null, liquidity: null });
  assert.equal(selectFeed([detected], "trending", now).length, 0);
  assert.equal(selectFeed([detected], "latest", now)[0].baseToken.address, "seen");
});

test("momentum keeps active tokens that are under the trending volume floor", () => {
  const early = token({ mint: "m", volume: FEED_RULES.momentumMinVolume24h, liquidity: FEED_RULES.momentumMinLiquidity, updated: fresh });
  assert.equal(isTrendingEligible(early, now), false);
  assert.equal(isMomentumEligible(early, now), true);
  assert.equal(selectFeed([early], "momentum", now)[0].feedClass, "momentum");
});

test("process-lifetime volume is not treated as 24h volume", () => {
  const partial = token({
    mint: "life",
    volume: 20_000,
    liquidity: 5_000,
    updated: fresh,
    extra: { volumeComplete: false },
  });
  assert.equal(isTrendingEligible(partial, now), false);
  assert.equal(selectFeed([partial], "latest", now)[0].baseToken.address, "life");
});

test("unknown launch time is outside the week even if it was just detected", () => {
  const undated = token({ mint: "undated", extra: { pairCreatedAt: undefined, firstSeenAt: now } });
  const onTheBoundary = token({ mint: "edge", launched: now - 7 * 24 * 60 * 60 * 1000 });
  const justOver = token({ mint: "old", launched: now - 7 * 24 * 60 * 60 * 1000 - 1 });
  const ahead = token({ mint: "ahead", launched: now + 121_000 });
  const skew = token({ mint: "skew", launched: now + 120_000 });
  assert.equal(selectFeed([undated], "latest", now).length, 0);
  assert.equal(selectFeed([undated], "fresh_mints", now).length, 0);
  assert.deepEqual(selectFeed([justOver, onTheBoundary, ahead, skew], "latest", now).map((t) => t.baseToken.address), ["skew", "edge"]);
});
test("ranking is deterministic", () => {
  const rows = [
    token({ mint: "a", volume: 12_000, liquidity: 1_000, updated: fresh }),
    token({ mint: "b", volume: 40_000, liquidity: 2_000, h1: 1_000, updated: fresh }),
  ];
  assert.deepEqual(trendingScore(rows[0]), trendingScore(rows[0]));
  assert.deepEqual(
    selectFeed(rows, "trending", now).map((t) => t.baseToken.address),
    selectFeed([...rows].reverse(), "trending", now).map((t) => t.baseToken.address)
  );
});
