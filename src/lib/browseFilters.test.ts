import { queryIndex } from "../../indexer/index-query.js";
import test from "node:test";
import assert from "node:assert/strict";
import {
  applyLoadedFilters,
  compareCreatedDesc,
  discoveryWindowStatus,
  createdMs,
  displayName,
  displaySymbol,
  hasSocial,
  liveRowChanged,
  launchMs,
  marketCapOf,
  matchesChainSelection,
  matchesSourceFilter,
  passesAge,
  passesMax,
  passesMin,
  toggleChainSelection,
  volumeForFilter,
  volumeForDisplay,
  ponsStageLabel,
} from "./browseFilters.ts";
import { classifyXUrl, readSocials } from "./xLinkKind.js";

test("launchpad filters do not cross Pons, Argus, and Pump.fun", () => {
  const pons = { chainId: "robinhood", isPonsLaunch: true, isBondingCurve: true, isGraduated: false, marketStage: "bonding_curve", launchPlatform: "Pons V2", primaryDex: "Pons V2" };
  const valued = { chainId: "robinhood", isPonsLaunch: true, isBondingCurve: false, isGraduated: true, marketStage: "graduated", launchPlatform: "Pons V2", primaryDex: "Pons V2" };
  const sweeping = { chainId: "robinhood", isPonsLaunch: true, isBondingCurve: false, isGraduated: false, marketStage: "sweeping", launchPlatform: "Pons V2", primaryDex: "Pons V2" };
  const argus = { chainId: "arc", isArgusLaunch: true, launchPlatform: "Argus", primaryDex: "Argus" };
  const pump = { chainId: "solana", isBondingCurve: true, marketStage: "bonding_curve", launchPlatform: "Pump.fun", dexId: "pumpfun" };
  assert.equal(matchesSourceFilter(pons, "pons"), false);
  assert.equal(matchesSourceFilter(pons, "ponsv2"), false);
  assert.equal(matchesSourceFilter(pons, "ponscurve"), true);
  assert.equal(matchesSourceFilter(valued, "pons"), true);
  assert.equal(matchesSourceFilter(valued, "ponsv2"), true);
  assert.equal(matchesSourceFilter(valued, "ponscurve"), false);
  assert.equal(matchesSourceFilter(sweeping, "ponscurve"), true);
  assert.equal(matchesSourceFilter(sweeping, "pons"), false);
  assert.equal(ponsStageLabel(pons), "Pons · bonding curve");
  assert.equal(ponsStageLabel(sweeping), "Pons · migrating");
  assert.equal(ponsStageLabel(valued), "Pons · valued");
  assert.equal(matchesSourceFilter(pons, "pumpfun"), false);
  assert.equal(matchesSourceFilter(pons, "argus"), false);
  assert.equal(matchesSourceFilter(argus, "argus"), true);
  assert.equal(matchesSourceFilter(argus, "pumpfun"), false);
  assert.equal(matchesSourceFilter(argus, "uniswap"), false);
  assert.equal(matchesSourceFilter(pump, "pumpfun"), true);
  assert.equal(matchesSourceFilter(pump, "pons"), false);
  assert.equal(matchesSourceFilter(pump, "all"), true);
  assert.equal(matchesSourceFilter(pump, "pumpfun,argus"), true);
  assert.equal(matchesSourceFilter(argus, "pumpfun,argus"), true);
  assert.equal(matchesSourceFilter(pons, "pumpfun,raydium"), false);
});


test("a missing or address-shaped name is not rendered as the contract address", () => {
  const unnamed = { baseToken: { address: "0xA18e30c0b15A3d1ef23062F754fD521624eD4e0D", name: "", symbol: "" } };
  assert.equal(displaySymbol(unnamed), "—");
  assert.equal(displayName(unnamed), "Name unverified");
  assert.equal(displaySymbol({ baseToken: { symbol: "UNKNOWN", address: "0xA18e30c0b15A3d1ef23062F754fD521624eD4e0D" } }), "—");
  assert.equal(displayName({ baseToken: { name: "0xA18e30c0b15A3d1ef23062F754fD521624eD4e0D", symbol: "PN", address: "0xA18e30c0b15A3d1ef23062F754fD521624eD4e0D" } }), "PN");
  assert.equal(displayName({ baseToken: { name: "0xA18e…4e0D", symbol: "", address: "0xA18e30c0b15A3d1ef23062F754fD521624eD4e0D" } }), "Name unverified");
  assert.equal(displaySymbol({ baseToken: { symbol: "PN" } }), "PN");
  assert.equal(displayName({ baseToken: { symbol: "PN", name: "PearlNews" } }), "PearlNews");
  assert.equal(displayName({ baseToken: { name: "PearlNews", symbol: "0xA18e…4e0D", address: "0xA18e30c0b15A3d1ef23062F754fD521624eD4e0D" } }), "PearlNews");
});

test("a missing volume does not pass a minimum or a maximum", () => {
  assert.equal(passesMin(undefined, 1000), false);
  assert.equal(passesMax(undefined, 1000), false);
  assert.equal(passesMin(null, 0), false);
  assert.equal(passesMax(null, 0), false);
});

test("a real zero is not treated as missing", () => {
  assert.equal(passesMin(0, 0), true);
  assert.equal(passesMax(0, 1000), true);
  assert.equal(passesMin(0, 1), false);
});

test("market cap does not borrow fdv and still rejects a blank pair", () => {
  assert.equal(marketCapOf({ marketCap: undefined, fdv: 2500 }), null);
  assert.equal(marketCapOf({ marketCap: 10, fdv: 2500 }), 10);
  assert.equal(marketCapOf({}), null);
  assert.equal(passesMax(marketCapOf({}), 10_000), false);
  assert.equal(passesMin(marketCapOf({ fdv: 4000 }), 1000), false);
  assert.equal(passesMin(marketCapOf({ marketCap: 4000, fdv: 1 }), 1000), true);
});

test("a missing price change does not satisfy a minimum move", () => {
  assert.equal(passesMin(undefined, 10), false);
  assert.equal(passesMin(25, 10), true);
  assert.equal(passesMin(-5, 0), false);
});

test("seconds and milliseconds sort as the same clock", () => {
  const olderSeconds = { pairCreatedAt: 1_700_000_000 };
  const newerMs = { pairCreatedAt: 1_700_000_100_000 };
  assert.equal(createdMs(olderSeconds.pairCreatedAt), 1_700_000_000_000);
  const ordered = [olderSeconds, newerMs].sort(compareCreatedDesc);
  assert.equal(ordered[0], newerMs);
});

test("telegram and chain filters run on the loaded coins", () => {
  const now = 1_800_000_000_000;
  const telegram = {
    chainId: "robinhood",
    pairCreatedAt: now - 60_000,
    telegram: "https://t.me/liegeagents",
    info: { socials: [{ type: "telegram", url: "https://t.me/liegeagents" }] },
    launchPlatform: "Pons V2",
    primaryDex: "Pons V2",
  };
  const sol = {
    chainId: "solana",
    pairCreatedAt: now - 60_000,
    info: { socials: [{ type: "twitter", url: "https://x.com/coin" }] },
    launchPlatform: "Pump.fun",
    dexId: "pumpfun",
  };
  const arc = {
    chainId: "arc",
    pairCreatedAt: now - 60_000,
    launchPlatform: "Argus",
    primaryDex: "Argus",
    info: { websites: [{ type: "website", url: "https://argus.example" }] },
  };
  const base = {
    chain: "all",
    dex: "all",
    age: "1w",
    minVolume: "" as const,
    maxVolume: "" as const,
    minLiquidity: "" as const,
    minMarketCap: "" as const,
    maxMarketCap: "" as const,
    minPriceChange: "" as const,
    telegram: false,
    twitter: false,
    discord: false,
    website: false,
    verified: false,
    now,
  };
  assert.equal(hasSocial(telegram, "telegram"), true);
  assert.equal(hasSocial(sol, "telegram"), false);
  const tgOnly = applyLoadedFilters([telegram, sol, arc], { ...base, telegram: true });
  assert.deepEqual(tgOnly, [telegram]);
  assert.equal(toggleChainSelection("all", "solana"), "solana");
  assert.equal(toggleChainSelection("solana", "arc"), "arc,solana");
  assert.equal(toggleChainSelection("arc,solana", "solana"), "arc");
  assert.equal(toggleChainSelection("arc", "arc"), "all");
  assert.equal(matchesChainSelection("solana", "arc,solana"), true);
  assert.equal(matchesChainSelection("base", "arc,solana"), false);
  const both = applyLoadedFilters([telegram, sol, arc], { ...base, chain: "arc,solana" });
  assert.deepEqual(both.map((row) => row.chainId), ["solana", "arc"]);
});

test("an unfinished volume window is not a number, a finished zero is", () => {
  assert.equal(volumeForFilter({ volumeComplete: false, volume: { h24: 40 }, totalVolume24h: 40 }), null);
  assert.equal(volumeForFilter({ volumeComplete: false, totalVolume24h: 0 }), null);
  assert.equal(volumeForFilter({ volume: { h24: 0 }, totalVolume24h: 0, volumeComplete: true }), 0);
  assert.equal(passesMax(volumeForFilter({ volumeComplete: false, volume: { h24: 10 } }), 1000), false);
  assert.equal(passesMax(volumeForFilter({ volumeComplete: true, volume: { h24: 0 } }), 1000), true);
  assert.equal(passesMin(volumeForFilter({}), 1), false);
  assert.equal(volumeForDisplay({ volumeComplete: false, volume: { h24: 40 } }), 40);
  assert.equal(volumeForDisplay({ volumeObservedUsd: 0, volumeComplete: false }), 0);
  assert.equal(volumeForDisplay({}), null);
});

test("a full window does not pretend filtered rows are still loading", () => {
  assert.equal(discoveryWindowStatus(3, 3), "3 in this window");
  assert.equal(
    discoveryWindowStatus(5000, 7489),
    `${(5000).toLocaleString()} loaded of ${(7489).toLocaleString()} in this window`
  );
  assert.equal(discoveryWindowStatus(0, null), "Loading this window");
});

test("a detection time is not a launch time", () => {
  const launched = { pairCreatedAt: 1_700_000_000, firstSeenAt: 1 };
  const detectedOnly = { firstSeenAt: 1_900_000_000_000 };
  assert.equal(launchMs(detectedOnly), null);
  assert.equal([detectedOnly, launched].sort(compareCreatedDesc)[0], launched);
});

test("unknown age fails every bounded window and passes all time", () => {
  const now = 1_800_000_000_000;
  const undated = { firstSeenAt: now };
  assert.equal(passesAge(undated, "1w", now), false);
  assert.equal(passesAge(undated, "1h", now), false);
  assert.equal(passesAge(undated, "1m", now), false);
  assert.equal(passesAge(undated, "all", now), true);
  assert.equal(passesAge({ pairCreatedAt: 0 }, "1w", now), false);
});

test("age windows include the exact boundary and a two-minute clock skew", () => {
  const now = 1_800_000_000_000;
  const week = 7 * 24 * 60 * 60 * 1000;
  const hour = 60 * 60 * 1000;
  assert.equal(passesAge({ pairCreatedAt: now - week }, "1w", now), true);
  assert.equal(passesAge({ pairCreatedAt: now - week - 1 }, "1w", now), false);
  assert.equal(passesAge({ pairCreatedAt: now - hour }, "1h", now), true);
  assert.equal(passesAge({ pairCreatedAt: now - hour - 1 }, "1h", now), false);
  assert.equal(passesAge({ pairCreatedAt: Math.floor((now - 30_000) / 1000) }, "1h", now), true);
  assert.equal(passesAge({ pairCreatedAt: now + 120_000 }, "1w", now), true);
  assert.equal(passesAge({ pairCreatedAt: now + 120_001 }, "1w", now), false);
  assert.equal(passesAge({ pairCreatedAt: now - 8 * 24 * 60 * 60 * 1000 }, "1m", now), true);
  assert.equal(passesAge({ pairCreatedAt: now - 31 * 24 * 60 * 60 * 1000 }, "1m", now), false);
});
test("a later name or symbol is a live update, an unchanged row is not", () => {
  const prev = { baseToken: { name: "", symbol: "UNK" }, priceUsd: "1" };
  const named = { baseToken: { name: "LossTrade", symbol: "TRADE" }, priceUsd: "1" };
  const same = { baseToken: { name: "", symbol: "UNK" }, priceUsd: "1" };
  assert.equal(liveRowChanged(prev, named), true);
  assert.equal(liveRowChanged(prev, same), false);
});

test("x profiles and x posts are separate and combine with OR", () => {
  const now = 1_800_000_000_000;
  const profile = {
    chainId: "solana",
    pairCreatedAt: now - 1_000,
    twitter: "https://x.com/Account?s=21",
  };
  const post = {
    chainId: "solana",
    pairCreatedAt: now - 2_000,
    info: { socials: [{ type: "twitter", url: "https://twitter.com/Account/status/123456?s=20" }] },
  };
  const ambiguous = {
    chainId: "solana",
    pairCreatedAt: now - 3_000,
    twitter: "https://x.com/search?q=coin",
  };
  const bare = { chainId: "base", pairCreatedAt: now - 4_000, x: "@project" };
  assert.equal(classifyXUrl("https://x.com/Account?s=21"), "profile");
  assert.equal(classifyXUrl("https://twitter.com/Account/status/123456?s=20"), "post");
  assert.equal(classifyXUrl("https://x.com/i/web/status/99"), "post");
  assert.equal(classifyXUrl("https://x.com/search?q=coin"), null);
  assert.equal(classifyXUrl("https://x.com/intent/tweet?text=hi"), null);
  assert.equal(classifyXUrl("https://x.com/i/communities/1"), null);
  assert.equal(readSocials(post).xPost, "https://twitter.com/Account/status/123456?s=20");
  assert.equal(readSocials(post).xProfile, null);
  assert.equal(readSocials(profile).xProfile, "https://x.com/Account?s=21");
  assert.equal(hasSocial(ambiguous, "twitter"), false);
  const base = {
    chain: "all",
    dex: "all",
    age: "all",
    minVolume: "" as const,
    maxVolume: "" as const,
    minLiquidity: "" as const,
    minMarketCap: "" as const,
    maxMarketCap: "" as const,
    minPriceChange: "" as const,
    telegram: false,
    twitter: false,
    discord: false,
    website: false,
    verified: false,
    now,
  };
  const rows = [profile, post, ambiguous, bare];
  assert.deepEqual(applyLoadedFilters(rows, { ...base, xProfile: true }).map((row) => row.pairCreatedAt), [profile.pairCreatedAt, bare.pairCreatedAt]);
  assert.deepEqual(applyLoadedFilters(rows, { ...base, xPost: true }), [post]);
  assert.deepEqual(applyLoadedFilters(rows, { ...base, xProfile: true, xPost: true }).length, 3);
  assert.equal(applyLoadedFilters(rows, base).length, 4);
});

test("browse filters and the discovery index keep the same rows", () => {
  const now = 1_800_000_000_000;
  const rows = [
    {
      chainId: "solana",
      baseToken: { address: "profile" },
      pairCreatedAt: now - 1_000,
      twitter: "https://x.com/Account?s=21",
      volume: { h24: 80 },
      volumeComplete: true,
      liquidity: { usd: "" },
      totalLiquidityUsd: 30,
      marketCap: 100,
      priceChange: { h24: 12 },
      dexId: "pumpfun",
    },
    {
      chainId: "solana",
      baseToken: { address: "post" },
      pairCreatedAt: now - 2_000,
      twitter: "https://x.com/Account/status/55?s=20",
      volume: { h24: 10 },
      volumeComplete: true,
      liquidity: { usd: 5 },
      marketCap: 100,
      priceChange: { h24: -4 },
      dexId: "raydium",
    },
    {
      chainId: "arc",
      baseToken: { address: "arc" },
      pairCreatedAt: now - 3_000,
      volumeComplete: false,
      volume: { h24: 999 },
      liquidity: { usd: 80 },
      marketCap: 100,
      priceChange: { h24: 40 },
    },
    {
      chainId: "base",
      baseToken: { address: "base" },
      pairCreatedAt: now - 4_000,
      volume: { h24: 80 },
      volumeComplete: true,
      liquidity: { usd: 80 },
      marketCap: 5000,
      priceChange: { h24: 1 },
    },
  ];
  const base = {
    chain: "all",
    dex: "all",
    age: "all",
    minVolume: "" as const,
    maxVolume: "" as const,
    minLiquidity: "" as const,
    minMarketCap: "" as const,
    maxMarketCap: "" as const,
    minPriceChange: "" as const,
    telegram: false,
    twitter: false,
    discord: false,
    website: false,
    verified: false,
    now,
  };
  const cases = [
    { xProfile: true },
    { xPost: true },
    { xProfile: true, xPost: true },
    { twitter: true },
    { chain: "arc,solana" },
    { minVolume: 50 },
    { minLiquidity: 20 },
    { minPriceChange: 10 },
    { maxMarketCap: 1000 },
    { dex: "pumpfun" },
  ];
  for (const extra of cases) {
    const client = applyLoadedFilters(rows, { ...base, ...extra })
      .map((row) => row.baseToken.address)
      .sort();
    const server = queryIndex(rows, { mode: "latest", age: "all", now, limit: 10, ...extra }).tokens
      .map((row) => row.baseToken.address)
      .sort();
    assert.deepEqual(client, server, JSON.stringify(extra));
  }
});
