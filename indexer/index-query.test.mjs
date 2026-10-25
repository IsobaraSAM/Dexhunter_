import test from "node:test";
import assert from "node:assert/strict";
import {
  DiscoveryQueryError,
  launchMs,
  parseDiscoveryParams,
  queryIndex,
  tokenIdentity,
} from "./index-query.js";

const now = 1_800_000_000_000;
const hour = 60 * 60 * 1000;

function row(partial) {
  return {
    chainId: partial.chain || "solana",
    baseToken: { address: partial.mint, symbol: partial.symbol || partial.mint },
    pairCreatedAt: partial.launched,
    firstSeenAt: partial.seen,
    volumeComplete: partial.volumeComplete,
    volume: partial.volume == null ? undefined : { h24: partial.volume },
    totalVolume24h: partial.totalVolume,
    liquidity: partial.liquidity == null ? undefined : { usd: partial.liquidity },
    totalLiquidityUsd: partial.totalLiquidity,
    marketCap: partial.marketCap,
    fdv: partial.fdv,
    marketUpdatedAt: partial.updated ?? now,
    launchPlatform: partial.platform,
    isPonsLaunch: partial.pons,
    isArgusLaunch: partial.argus,
    isBondingCurve: partial.curve,
  };
}

test("one hour keeps the exact boundary, seconds and milliseconds, and drops bad clocks", () => {
  const edge = row({ mint: "edge", launched: now - hour });
  const past = row({ mint: "past", launched: now - hour - 1 });
  const skew = row({ mint: "skew", launched: now + 120_000 });
  const ahead = row({ mint: "ahead", launched: now + 120_001 });
  const seconds = row({ mint: "sec", launched: Math.floor((now - 5_000) / 1000) });
  const invalid = row({ mint: "bad", launched: "nope", seen: now });
  const missing = row({ mint: "none", seen: now });
  const zero = row({ mint: "zero", launched: 0, seen: now });
  const feed = queryIndex([past, edge, ahead, skew, seconds, invalid, missing, zero], {
    mode: "latest",
    age: "1h",
    now,
    limit: 100,
  });
  assert.deepEqual(feed.tokens.map((t) => t.baseToken.address), ["skew", "sec", "edge"]);
  assert.equal(feed.total, 3);
  assert.equal(feed.nextCursor, null);
  assert.equal(launchMs(seconds), (Math.floor((now - 5_000) / 1000)) * 1000);
  assert.equal(launchMs(missing), null);
  assert.equal(launchMs({ pairCreatedAt: "nope", firstSeenAt: now }), null);
});

test("solana case is distinct and evm case is not", () => {
  const seconds = row({ mint: "MintA", launched: Math.floor((now - 60_000) / 1000), volume: 10 });
  const millis = row({ mint: "minta", chain: "Solana", launched: now - 30_000, volume: null });
  const arcUpper = row({ mint: "0xABC", chain: "arc", launched: now - 20_000 });
  const arcLower = row({ mint: "0xabc", chain: "Arc", launched: now - 10_000 });
  const feed = queryIndex([millis, seconds, arcUpper, arcLower], { mode: "latest", age: "all", now, limit: 10 });
  assert.equal(feed.total, 3);
  assert.equal(tokenIdentity(feed.tokens.find((t) => t.baseToken.address === "MintA")), "solana:MintA");
  assert.equal(tokenIdentity(feed.tokens.find((t) => t.baseToken.address === "minta")), "solana:minta");
  assert.equal(tokenIdentity(feed.tokens.find((t) => t.chainId === "arc")), "arc:0xabc");
});

test("a token that arrives during paging stays on the first page and does not skip the next one", () => {
  const newest = row({ mint: "n", launched: now - 1_000 });
  const middle = row({ mint: "m", launched: now - 2_000 });
  const oldest = row({ mint: "o", launched: now - 3_000 });
  const first = queryIndex([middle, oldest, newest], { mode: "latest", age: "all", now, limit: 1 });
  assert.equal(first.tokens[0].baseToken.address, "n");
  assert.equal(first.total, 3);
  const arrived = row({ mint: "live", launched: now - 100 });
  const second = queryIndex([middle, oldest, newest, arrived], {
    mode: "latest",
    age: "all",
    now,
    limit: 1,
    cursor: parseDiscoveryParams({ cursor: first.nextCursor }).cursor,
  });
  assert.equal(second.tokens[0].baseToken.address, "m");
  assert.equal(second.total, 4);
  const seen = new Set();
  let cursor = null;
  const source = [oldest, middle, newest, arrived];
  for (let i = 0; i < 6; i++) {
    const page = queryIndex(source, { mode: "latest", age: "all", now, limit: 1, cursor });
    for (const token of page.tokens) {
      const id = tokenIdentity(token);
      assert.equal(seen.has(id), false);
      seen.add(id);
    }
    if (!page.nextCursor) break;
    cursor = parseDiscoveryParams({ cursor: page.nextCursor }).cursor;
  }
  assert.deepEqual([...seen], ["solana:live", "solana:n", "solana:m", "solana:o"]);
});

test("all time includes unknown launch times and is not capped at the page size", () => {
  const dated = row({ mint: "dated", launched: now - 10 * 24 * 60 * 60 * 1000 });
  const undated = row({ mint: "undated", seen: now, platform: "Pump.fun" });
  const week = queryIndex([dated, undated], { mode: "latest", age: "1w", now, limit: 10 });
  assert.deepEqual(week.tokens.map((t) => t.baseToken.address), []);
  const all = queryIndex([undated, dated], { mode: "latest", age: "all", now, limit: 1 });
  assert.equal(all.total, 2);
  assert.equal(all.tokens[0].baseToken.address, "dated");
  assert.ok(all.nextCursor);
  const rest = queryIndex([undated, dated], {
    mode: "latest",
    age: "all",
    now,
    limit: 1,
    cursor: parseDiscoveryParams({ cursor: all.nextCursor }).cursor,
  });
  assert.equal(rest.tokens[0].baseToken.address, "undated");
  assert.equal(rest.tokens[0].pairCreatedAt, undefined);
  const mints = queryIndex([undated, dated], { mode: "fresh_mints", age: "all", now, limit: 10 });
  assert.deepEqual(mints.tokens.map((t) => t.baseToken.address), ["undated"]);
});

test("unknown metrics fail a bound and a real zero does not", () => {
  const missing = row({ mint: "missing", launched: now - 1_000 });
  const blank = row({ mint: "blank", launched: now - 1_000, volume: "", liquidity: "", marketCap: "" });
  const unfinished = row({
    mint: "life",
    launched: now - 1_000,
    volume: 80,
    volumeComplete: false,
    liquidity: 20,
    marketCap: 100,
  });
  const zero = row({ mint: "zero", launched: now - 1_000, volume: 0, liquidity: 0, marketCap: 0, volumeComplete: true });
  const fdvOnly = row({ mint: "fdv", launched: now - 1_000, volume: 25, liquidity: 10, fdv: 400 });
  const rich = row({ mint: "rich", launched: now - 1_000, volume: 100, liquidity: 50, marketCap: 1000 });
  const source = [missing, blank, unfinished, zero, fdvOnly, rich];
  const base = { mode: "latest", age: "all", now, limit: 20 };

  const minZero = queryIndex(source, { ...base, minVolume: 0, minLiquidity: 0, minMarketCap: 0 });
  assert.deepEqual(minZero.tokens.map((t) => t.baseToken.address).sort(), ["rich", "zero"]);

  const aboveZero = queryIndex(source, { ...base, minVolume: 1, minLiquidity: 1, minMarketCap: 1 });
  assert.deepEqual(aboveZero.tokens.map((t) => t.baseToken.address).sort(), ["rich"]);

  const onlyZero = queryIndex(source, { ...base, minVolume: 0, maxVolume: 0, minLiquidity: 0, maxLiquidity: 0 });
  assert.deepEqual(onlyZero.tokens.map((t) => t.baseToken.address), ["zero"]);

  const combined = queryIndex(source, { ...base, minVolume: 50, maxVolume: 150, minLiquidity: 40, maxMarketCap: 1000 });
  assert.deepEqual(combined.tokens.map((t) => t.baseToken.address), ["rich"]);
});

test("malformed filter params are a client error, not a silent zero", () => {
  assert.equal(parseDiscoveryParams({ minVolume: "0" }).minVolume, 0);
  assert.equal(parseDiscoveryParams({ minLiquidity: "" }).minLiquidity, undefined);
  assert.equal(parseDiscoveryParams({}).age, "1w");
  for (const params of [
    { minVolume: "foo" },
    { minLiquidity: "-1" },
    { maxVolume: "NaN" },
    { maxMarketCap: "Infinity" },
    { age: "2h" },
    { cursor: "not-a-cursor" },
    { limit: "0" },
  ]) {
    assert.throws(() => parseDiscoveryParams(params), DiscoveryQueryError);
  }
});

test("a disappeared cursor row resumes at the next strict tuple", () => {
  const a = row({ mint: "a", launched: now - 1_000 });
  const b = row({ mint: "b", launched: now - 2_000 });
  const c = row({ mint: "c", launched: now - 3_000 });
  const first = queryIndex([a, b, c], { mode: "latest", age: "1h", now, limit: 1 });
  const next = queryIndex([a, c], {
    mode: "latest",
    age: "1h",
    now,
    limit: 10,
    cursor: parseDiscoveryParams({ cursor: first.nextCursor }).cursor,
  });
  assert.deepEqual(next.tokens.map((t) => t.baseToken.address), ["c"]);
});

test("a higher score that arrives while paging stays off the later page", () => {
  const low = row({ mint: "low", launched: now - 1_000, volume: 6_000, liquidity: 1_000, updated: now });
  const high = row({ mint: "high", launched: now - 1_000, volume: 40_000, liquidity: 5_000, updated: now });
  const first = queryIndex([low, high], { mode: "trending", age: "1h", now, limit: 1 });
  assert.equal(first.tokens[0].baseToken.address, "high");
  const hotter = row({ mint: "hot", launched: now - 500, volume: 90_000, liquidity: 8_000, updated: now });
  const second = queryIndex([low, high, hotter], {
    mode: "trending",
    age: "1h",
    now,
    limit: 1,
    cursor: first.nextCursor,
  });
  assert.equal(second.tokens[0].baseToken.address, "low");
  assert.equal(second.tokens.some((token) => token.baseToken.address === "hot"), false);
});

test("x profile and x post filters use OR and do not treat an arbitrary x url as both", () => {
  const profile = row({ mint: "profile", launched: now - 1_000 });
  profile.twitter = "https://x.com/account";
  const post = row({ mint: "post", launched: now - 2_000 });
  post.info = { socials: [{ type: "twitter", url: "https://x.com/account/status/123?s=20" }] };
  const search = row({ mint: "search", launched: now - 3_000 });
  search.twitter = "https://x.com/search?q=coin";
  const both = row({ mint: "both", launched: now - 4_000 });
  both.twitter = "https://twitter.com/name";
  both.info = { socials: [{ type: "twitter", url: "https://x.com/name/status/9" }] };
  const base = { mode: "latest", age: "all", now, limit: 20 };
  const profiles = queryIndex([profile, post, search, both], { ...base, xProfile: true });
  assert.deepEqual(profiles.tokens.map((t) => t.baseToken.address), ["profile", "both"]);
  const posts = queryIndex([profile, post, search, both], { ...base, xPost: true });
  assert.deepEqual(posts.tokens.map((t) => t.baseToken.address), ["post", "both"]);
  const either = queryIndex([profile, post, search, both], { ...base, xProfile: true, xPost: true });
  assert.deepEqual(either.tokens.map((t) => t.baseToken.address), ["profile", "post", "both"]);
  const legacy = queryIndex([profile, post, search], { ...base, twitter: true });
  assert.deepEqual(legacy.tokens.map((t) => t.baseToken.address), ["profile", "post"]);
  assert.equal(queryIndex([profile, post, search], base).total, 3);
  const parsed = parseDiscoveryParams({ xProfile: "1", xPost: "true", minPriceChange: "-5", chain: "arc,solana", dex: "pumpfun" });
  assert.equal(parsed.xProfile, true);
  assert.equal(parsed.xPost, true);
  assert.equal(parsed.minPriceChange, -5);
  assert.equal(parsed.chain, "arc,solana");
  assert.equal(parsed.dex, "pumpfun");
});

test("chain lists, venues, and price change agree with the browse filters", () => {
  const sol = row({ mint: "s", chain: "solana", launched: now - 1_000, platform: "Pump.fun", curve: true });
  sol.priceChange = { h24: 12 };
  sol.dexId = "pumpfun";
  const arc = row({ mint: "a", chain: "arc", launched: now - 2_000 });
  arc.priceChange = { h24: -4 };
  const baseChain = row({ mint: "b", chain: "base", launched: now - 3_000 });
  baseChain.priceChange = { h24: 30 };
  const chains = queryIndex([sol, arc, baseChain], { mode: "latest", age: "all", now, limit: 10, chain: "arc,solana" });
  assert.deepEqual(chains.tokens.map((t) => t.baseToken.address), ["s", "a"]);
  const move = queryIndex([sol, arc, baseChain], { mode: "latest", age: "all", now, limit: 10, minPriceChange: 10 });
  assert.deepEqual(move.tokens.map((t) => t.baseToken.address), ["s", "b"]);
  const pump = queryIndex([sol, arc, baseChain], { mode: "latest", age: "all", now, limit: 10, dex: "pumpfun" });
  assert.deepEqual(pump.tokens.map((t) => t.baseToken.address), ["s"]);
  assert.throws(() => parseDiscoveryParams({ minPriceChange: "nope" }), /minPriceChange/);
});
