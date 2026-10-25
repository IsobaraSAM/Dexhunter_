import test from "node:test";
import assert from "node:assert/strict";
import { applyPonsIdentity, repairPonsIdentity } from "./pons-identity.js";

test("a later Pons enrich fills a blank Robinhood name and does not invent one", () => {
  const existing = {
    chainId: "robinhood",
    baseToken: { address: "0xabc", name: "", symbol: "" },
  };
  applyPonsIdentity(existing, {
    isPonsLaunch: true,
    baseToken: { address: "0xabc", name: "PearlNews", symbol: "PN", decimals: 18 },
    info: { imageUrl: "https://img.example/p.png" },
    priceUsd: "0.000004",
    marketCap: 4300,
    liquidity: { usd: 12 },
    primaryDexLogo: "/pons.png",
  });
  assert.equal(existing.baseToken.name, "PearlNews");
  assert.equal(existing.baseToken.symbol, "PN");
  assert.equal(existing.baseToken.decimals, 18);
  assert.equal(existing.info.imageUrl, "https://img.example/p.png");
  assert.equal(existing.priceUsd, "0.000004");
  assert.equal(existing.marketCap, 4300);
  assert.equal(existing.totalLiquidityUsd, 12);
  assert.equal(existing.primaryDex, "Pons V2");

  applyPonsIdentity(existing, { isPonsLaunch: true, baseToken: { name: "", symbol: "" } });
  assert.equal(existing.baseToken.name, "PearlNews");
  assert.equal(existing.baseToken.symbol, "PN");
});

test("repair copies the book onto the live index and enriches newest first", () => {
  const index = new Map();
  index.set("robinhood:0xaaa", { baseToken: { address: "0xaaa", name: "", symbol: "" } });
  index.set("robinhood:0xbbb", { baseToken: { address: "0xbbb", name: "Kept", symbol: "KEEP" } });
  const launches = new Map([
    ["0xaaa", { isPonsLaunch: true, pairCreatedAt: 10, baseToken: { address: "0xaaa", name: "New", symbol: "NEW" } }],
    ["0xbbb", { isPonsLaunch: true, pairCreatedAt: 5, baseToken: { address: "0xbbb", name: "", symbol: "" } }],
  ]);
  const pons = { launches, enrichQueue: ["0xbbb", "0xaaa"] };
  const repaired = repairPonsIdentity({ indexedTokens: index }, pons);
  assert.equal(repaired, 1);
  assert.equal(index.get("robinhood:0xaaa").baseToken.symbol, "NEW");
  assert.equal(index.get("robinhood:0xbbb").baseToken.symbol, "KEEP");
  assert.deepEqual(pons.enrichQueue, ["0xaaa", "0xbbb"]);
});

test("a stored Uniswap link on a Pons row is removed and the token page is kept", () => {
  const existing = {
    chainId: "robinhood",
    baseToken: { address: "0x39dBED3a2bd333467115dE45665cC57F813C4571", name: "Pons", symbol: "PONS" },
    primaryDexTradingUrl: "https://app.uniswap.org/swap?outputCurrency=0x39dBED3a2bd333467115dE45665cC57F813C4571&chain=ethereum",
  };
  applyPonsIdentity(existing, { isPonsLaunch: true, baseToken: { address: existing.baseToken.address } });
  assert.equal(existing.primaryDexTradingUrl, undefined);
  assert.equal(existing.launchpadDetailUrl, "https://ponsfamily.com/launchpad/0x39dBED3a2bd333467115dE45665cC57F813C4571");
});

test("a Pons row labeled PumpSwap is put back on Pons", () => {
  const existing = {
    chainId: "robinhood",
    dexId: "pumpswap",
    primaryDex: "PumpSwap",
    isGraduated: true,
    marketStage: "pumpswap",
    baseToken: { address: "0x6939C0CB6D8CeaeFd5a2824FC2E0BEd52d3c8076", name: "GIWAMAPS", symbol: "GIWAS" },
  };
  applyPonsIdentity(existing, { isPonsLaunch: true, baseToken: { address: existing.baseToken.address } });
  assert.equal(existing.dexId, "pons");
  assert.equal(existing.primaryDex, "Pons V2");
  assert.equal(existing.launchPlatform, "Pons V2");
});

test("a non-Pons row is left alone", () => {
  const existing = { baseToken: { name: "Pump", symbol: "P" } };
  assert.equal(applyPonsIdentity(existing, { baseToken: { name: "Other", symbol: "O" } }), false);
  assert.equal(existing.baseToken.symbol, "P");
});
