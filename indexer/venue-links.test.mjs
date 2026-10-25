import test from "node:test";
import assert from "node:assert/strict";
import { actionHref, argusLaunchpadUrl, clientTradeHref, dexTradeUrl, ponsLaunchpadUrl } from "./venue-links.js";

const curve = {
  chainId: "robinhood",
  isPonsLaunch: true,
  primaryDex: "Pons V2",
  isBondingCurve: true,
  isGraduated: false,
  marketStage: "bonding_curve",
  baseToken: { address: "0x39dBED3a2bd333467115dE45665cC57F813C4571" },
  primaryDexTradingUrl: "https://app.uniswap.org/swap?outputCurrency=0x39dBED3a2bd333467115dE45665cC57F813C4571&chain=ethereum",
};

const other = {
  chainId: "robinhood",
  isPonsLaunch: true,
  primaryDex: "Pons V2",
  baseToken: { address: "0x1111111111111111111111111111111111111111" },
};

test("a Pons curve token links to its own launchpad page, never Uniswap", () => {
  assert.equal(dexTradeUrl(curve), null);
  assert.equal(actionHref(curve), "https://ponsfamily.com/launchpad/0x39dBED3a2bd333467115dE45665cC57F813C4571");
  assert.equal(clientTradeHref(curve, "https://app.uniswap.org"), actionHref(curve));
});

test("two Pons tokens do not share one page", () => {
  assert.notEqual(ponsLaunchpadUrl(curve.baseToken.address), ponsLaunchpadUrl(other.baseToken.address));
  assert.match(actionHref(other), /0x1111111111111111111111111111111111111111$/);
});

test("a Pump.fun mint opens that coin, and a Pons curve never does", () => {
  const pump = {
    chainId: "solana",
    launchPlatform: "Pump.fun",
    dexId: "pumpfun",
    isBondingCurve: true,
    baseToken: { address: "So11111111111111111111111111111111111111112" },
    url: "https://pump.fun/coin/So11111111111111111111111111111111111111112",
  };
  assert.equal(actionHref(pump), "https://pump.fun/coin/So11111111111111111111111111111111111111112");
  assert.equal(clientTradeHref(curve, "https://pump.fun/coin/0x39dBED3a2bd333467115dE45665cC57F813C4571"), actionHref(curve));
  assert.equal(actionHref(curve).includes("pump.fun"), false);
});

test("a graduated Pons token still does not invent an Uniswap v4 url", () => {
  const pool = { ...curve, isGraduated: true, marketStage: "graduated", isBondingCurve: false };
  assert.equal(dexTradeUrl(pool), null);
  assert.equal(actionHref(pool), actionHref(curve));
});

test("Argus opens its own token page and does not fall through to Uniswap or arguspad", () => {
  const argus = {
    chainId: "arc",
    isArgusLaunch: true,
    primaryDex: "Argus",
    baseToken: { address: "0x2222222222222222222222222222222222222222" },
    primaryDexTradingUrl: "https://arguspad.io/token/0x2222222222222222222222222222222222222222",
    url: "https://app.uniswap.org",
  };
  const page = "https://argus.world/token/0x2222222222222222222222222222222222222222";
  assert.equal(argusLaunchpadUrl(argus.baseToken.address), page);
  assert.equal(dexTradeUrl(argus), page);
  assert.equal(actionHref(argus), page);
  assert.equal(clientTradeHref(argus, "https://app.uniswap.org/swap?chain=ethereum"), page);
});
