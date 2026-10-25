import test from "node:test";
import assert from "node:assert/strict";
import { ethers } from "ethers";
import {
  CURVE_BUY_TOPIC,
  CURVE_SELL_TOPIC,
  applyMarketPatch,
  createTradeBook,
  decodeCurveTrade,
  metricsFromState,
  noteCurveTrade,
  progressFromReserves,
  quotePerTokenFromReserves,
} from "./pons-market.js";

const NOW = 1_800_000_000_000;
const DAY = 24 * 60 * 60 * 1000;
const CURVE = "0x88f35101FD0827b876e426d95d87CDB7A73Dc1C6";
const OTHER = "0x1111111111111111111111111111111111111111";
const BUYER = "0x1111111111111111111111111111111111111111";
const RECIPIENT = "0x2222222222222222222222222222222222222222";

// Executed clamped buy. quoteIn = 1.5 USDC (6 decimals). tokensOut = 0.05 token.
// fee = 0.015 USDC is separate and must not be added to volume.
// A requested 10 USDC is not in the log. At a spot of 2 USDC/token, tokensOut
// implies only 0.1 USDC, which is also not the volume.
const CLAMPED_BUY = {
  topics: [
    "0xec36bf571f136799e8dc0b0b8bea4b04d8bd3d43de838aab0d5fc21d4cbfc455",
    "0x0000000000000000000000001111111111111111111111111111111111111111",
    "0x0000000000000000000000002222222222222222222222222222222222222222",
  ],
  data: "0x000000000000000000000000000000000000000000000000000000000016e36000000000000000000000000000000000000000000000000000b1a2bc2ec500000000000000000000000000000000000000000000000000000000000000003a980000000000000000000000000000000000000000000000000000000000000000",
};
const REQUESTED_QUOTE_USDC = 10;

const tradeIface = new ethers.Interface([
  "event CurveBuy(address indexed buyer, address indexed recipient, uint256 quoteIn, uint256 tokensOut, uint256 fee, uint256 tax)",
  "event CurveSell(address indexed seller, address indexed recipient, uint256 tokensIn, uint256 quoteOut, uint256 fee, uint256 tax)",
]);

function close(actual, expected, eps = 1e-9) {
  assert.equal(typeof actual, "number");
  assert.ok(Number.isFinite(actual), String(actual));
  assert.ok(Math.abs(actual - expected) <= eps, `${actual} != ${expected}`);
}

function sellLog(quoteOut, tokensIn = 1n) {
  return tradeIface.encodeEventLog("CurveSell", [BUYER, RECIPIENT, tokensIn, quoteOut, 0n, 0n]);
}

function note(book, log, extra = {}) {
  return noteCurveTrade(book, log, {
    curve: CURVE,
    blockNumber: 10,
    txHash: extra.txHash || "0xabc",
    logIndex: extra.logIndex ?? 0,
    blockTimestampMs: extra.blockTimestampMs ?? NOW - 1_000,
    ...extra,
  });
}

test("curve trade topics match the documented signatures", () => {
  assert.equal(CURVE_BUY_TOPIC, "0xec36bf571f136799e8dc0b0b8bea4b04d8bd3d43de838aab0d5fc21d4cbfc455");
  assert.equal(CURVE_SELL_TOPIC, "0x8113d738abdcb6b38357e9d53a54a7157861a09031b453651f0fe7fe151f59df");
  assert.equal(decodeCurveTrade({ topics: ["0xdead"], data: "0x" }), null);
  assert.equal(decodeCurveTrade(null), null);
});

test("quotePerToken uses getReserves order quote then token, for 6 and 18 decimals", () => {
  const usdc = quotePerTokenFromReserves({
    quoteReserve: 5_000_000n,
    tokenReserve: 2n * 10n ** 18n,
    tokenDecimals: 18,
    quoteDecimals: 6,
  });
  close(usdc, 2.5);
  const dai = quotePerTokenFromReserves({
    quoteReserve: 4n * 10n ** 18n,
    tokenReserve: 2n * 10n ** 18n,
    tokenDecimals: 18,
    quoteDecimals: 18,
  });
  close(dai, 2);
  const swapped = quotePerTokenFromReserves({
    quoteReserve: 2n * 10n ** 18n,
    tokenReserve: 5_000_000n,
    tokenDecimals: 6,
    quoteDecimals: 18,
  });
  assert.ok(Math.abs(swapped - 2.5) > 1);
});

test("zero, empty, and undecimaled reserves are unusable", () => {
  assert.equal(quotePerTokenFromReserves({}), null);
  assert.equal(quotePerTokenFromReserves({
    quoteReserve: 0n,
    tokenReserve: 10n ** 18n,
    tokenDecimals: 18,
    quoteDecimals: 18,
  }), null);
  assert.equal(quotePerTokenFromReserves({
    quoteReserve: 10n ** 18n,
    tokenReserve: 0n,
    tokenDecimals: 18,
    quoteDecimals: 18,
  }), null);
  assert.equal(quotePerTokenFromReserves({
    quoteReserve: "",
    tokenReserve: "1000",
    tokenDecimals: 18,
    quoteDecimals: 18,
  }), null);
  assert.equal(quotePerTokenFromReserves({
    quoteReserve: 5_000_000n,
    tokenReserve: 10n ** 18n,
    tokenDecimals: 18,
  }), null);
});

test("native price stays in quote units when ethUsd is missing", () => {
  const quotePerToken = quotePerTokenFromReserves({
    quoteReserve: 2n * 10n ** 18n,
    tokenReserve: 1n * 10n ** 18n,
    tokenDecimals: 18,
    quoteDecimals: 18,
  });
  close(quotePerToken, 2);
  const patch = metricsFromState({
    phase: 0,
    quotePerToken,
    quoteIsNative: true,
    quoteDecimals: 18,
    quoteSymbol: "ETH",
    ethUsd: null,
    totalSupplyWhole: 1_000_000,
    realQuoteReserve: 10n ** 18n,
    graduationThreshold: 4n * 10n ** 18n,
    nowMs: NOW,
  });
  close(patch.priceQuote, 2);
  assert.equal("priceUsd" in patch, false);
  assert.equal("marketCap" in patch, false);
  assert.equal("fdv" in patch, false);
  assert.equal("liquidity" in patch, false);
  assert.equal("marketUpdatedAt" in patch, false);
  assert.equal(patch.marketStage, "bonding_curve");
  assert.equal(patch.isBondingCurve, true);
  assert.equal(patch.isGraduated, false);
});

test("native ETH converts only through the supplied ethUsd", () => {
  const patch = metricsFromState({
    phase: 0,
    quotePerToken: 0.5,
    quoteIsNative: true,
    quoteSymbol: "ETH",
    ethUsd: 2_000,
    totalSupplyWhole: 1_000,
    realQuoteReserve: 5n * 10n ** 17n,
    graduationThreshold: 2n * 10n ** 18n,
    nowMs: NOW,
  });
  assert.equal(patch.priceUsd, "1000");
  assert.equal(patch.marketCap, 1_000_000);
  assert.equal(patch.fdv, 1_000_000);
  assert.equal(patch.marketCapBasis, "total_supply");
  assert.equal(patch.marketCapMethod, "spot_x_total_supply");
  close(patch.liquidity.usd, 1_000);
  assert.equal(patch.totalLiquidityUsd, 1_000);
  assert.equal(patch.marketUpdatedAt, NOW);
});

test("a verified 6-decimal stable is $1 and an 18-decimal stable is $1", () => {
  const six = metricsFromState({
    phase: 0,
    quotePerToken: 0.25,
    quoteIsNative: false,
    quoteDecimals: 6,
    quoteSymbol: "USDC",
    quoteAddress: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
    stableUsd: 1,
    totalSupplyWhole: 4_000,
    realQuoteReserve: 2_000_000n,
    graduationThreshold: 8_000_000n,
    nowMs: NOW,
  });
  assert.equal(six.priceUsd, "0.25");
  assert.equal(six.marketCap, 1_000);
  assert.equal(six.marketCapBasis, "total_supply");
  close(six.liquidity.usd, 2);
  close(six.bondingProgress, 25);

  const eighteen = metricsFromState({
    phase: 0,
    quotePerToken: 3,
    quoteIsNative: false,
    quoteDecimals: 18,
    quoteSymbol: "DAI",
    stableUsd: 1,
    totalSupplyWhole: 10,
    realQuoteReserve: 3n * 10n ** 18n,
    nowMs: NOW,
  });
  assert.equal(eighteen.priceUsd, "3");
  assert.equal(eighteen.fdv, 30);
  assert.equal(eighteen.marketCapMethod, "spot_x_total_supply");
});

test("an ERC-20 quote is not USD just because its symbol looks like a stable", () => {
  const patch = metricsFromState({
    phase: 0,
    quotePerToken: 4,
    quoteIsNative: false,
    quoteDecimals: 6,
    quoteSymbol: "USDC",
    quoteAddress: "0x1234567890abcdef1234567890abcdef12345678",
    stableUsd: null,
    ethUsd: 3_000,
    totalSupplyWhole: 100,
    realQuoteReserve: 5_000_000n,
    book: createTradeBook(),
    curve: CURVE,
    nowMs: NOW,
    windowComplete: true,
  });
  close(patch.priceQuote, 4);
  assert.equal("priceUsd" in patch, false);
  assert.equal("marketCap" in patch, false);
  assert.equal("liquidity" in patch, false);
  assert.equal(patch.volumeComplete, false);
  assert.equal("volume" in patch, false);
});

test("stableUsd 1 without quote decimals does not invent a USD price", () => {
  const patch = metricsFromState({
    phase: 0,
    quotePerToken: 1,
    quoteIsNative: false,
    quoteSymbol: "USDC",
    stableUsd: 1,
    totalSupplyWhole: 10,
    nowMs: NOW,
  });
  close(patch.priceQuote, 1);
  assert.equal("priceUsd" in patch, false);
  assert.equal("fdv" in patch, false);
});

test("phase 0 progress uses real quote over threshold and caps at 100", () => {
  assert.equal(progressFromReserves({ realQuoteReserve: 10n, graduationThreshold: 0n }), null);
  assert.equal(progressFromReserves({ realQuoteReserve: 0n, graduationThreshold: 100n }), 0);
  close(progressFromReserves({
    realQuoteReserve: 15n * 10n ** 17n,
    graduationThreshold: 42n * 10n ** 17n,
  }), 35.71);
  assert.equal(progressFromReserves({ realQuoteReserve: 5_000n, graduationThreshold: 1_000n }), 100);

  const partial = metricsFromState({
    phase: 0,
    realQuoteReserve: 15n * 10n ** 17n,
    graduationThreshold: 42n * 10n ** 17n,
    quoteIsNative: true,
    nowMs: NOW,
  });
  close(partial.bondingProgress, 35.71);
  assert.equal(partial.marketStage, "bonding_curve");

  const full = metricsFromState({
    phase: 0,
    realQuoteReserve: 9n,
    graduationThreshold: 4n,
    quoteIsNative: true,
    ethUsd: 1,
    nowMs: NOW,
  });
  assert.equal(full.bondingProgress, 100);

  const noThreshold = metricsFromState({
    phase: 0,
    realQuoteReserve: 1n,
    graduationThreshold: 0n,
    nowMs: NOW,
  });
  assert.equal("bondingProgress" in noThreshold, false);
});

test("phase 2 does not emit a curve USD price and phase wins over reserve progress", () => {
  const hidden = metricsFromState({
    phase: 2,
    quotePerToken: 2,
    quoteIsNative: true,
    quoteDecimals: 18,
    ethUsd: 3_000,
    totalSupplyWhole: 1_000,
    realQuoteReserve: 1n,
    graduationThreshold: 100n,
    nowMs: NOW,
  });
  assert.equal(hidden.marketStage, "graduated");
  assert.equal(hidden.isGraduated, true);
  assert.equal(hidden.isBondingCurve, false);
  assert.equal(hidden.bondingProgress, 100);
  assert.equal("priceUsd" in hidden, false);
  assert.equal("priceQuote" in hidden, false);
  assert.equal("marketCap" in hidden, false);
  assert.equal("liquidity" in hidden, false);
  assert.equal("marketUpdatedAt" in hidden, false);

  const pooled = metricsFromState({
    phase: 2,
    quotePerToken: 2,
    quoteIsNative: true,
    ethUsd: 3_000,
    poolPriceUsd: "0.25",
    totalSupplyWhole: 1_000,
    realQuoteReserve: 10n ** 18n,
    nowMs: NOW,
  });
  assert.equal(pooled.priceUsd, "0.25");
  assert.notEqual(pooled.priceUsd, "6000");
  assert.equal(pooled.marketCap, 250);
  assert.equal(pooled.fdv, 250);
  assert.equal(pooled.marketCapBasis, "total_supply");
  assert.equal(pooled.marketCapMethod, "spot_x_total_supply");
  assert.equal("liquidity" in pooled, false);
});

test("phase 1 is sweeping at 100 and phase 3 is rescued without a curve price", () => {
  const sweeping = metricsFromState({
    phase: 1,
    quotePerToken: 1,
    quoteIsNative: true,
    ethUsd: 100,
    realQuoteReserve: 1n,
    graduationThreshold: 10n,
    nowMs: NOW,
  });
  assert.equal(sweeping.marketStage, "sweeping");
  assert.equal(sweeping.isBondingCurve, false);
  assert.equal(sweeping.isGraduated, false);
  assert.equal(sweeping.bondingProgress, 100);
  assert.equal(sweeping.priceUsd, "100");

  const rescued = metricsFromState({
    phase: 3,
    quotePerToken: 5,
    quoteIsNative: true,
    ethUsd: 100,
    totalSupplyWhole: 10,
    nowMs: NOW,
  });
  assert.equal(rescued.marketStage, "rescued");
  assert.equal(rescued.isGraduated, false);
  assert.equal(rescued.isBondingCurve, false);
  assert.equal("priceUsd" in rescued, false);
  assert.equal("bondingProgress" in rescued, false);
});

test("duplicate log and a replay of the same tx plus logIndex do not double volume", () => {
  const book = createTradeBook();
  const meta = {
    curve: CURVE,
    blockNumber: 20,
    txHash: "0xAbC",
    logIndex: 2,
    blockTimestampMs: NOW - 5_000,
  };
  assert.deepEqual(noteCurveTrade(book, CLAMPED_BUY, meta), { added: true });
  assert.deepEqual(noteCurveTrade(book, CLAMPED_BUY, meta), { added: false });
  assert.equal(book.trades.length, 1);

  book.seen = new Set();
  assert.deepEqual(noteCurveTrade(book, CLAMPED_BUY, { ...meta, txHash: "0xabc" }), { added: false });
  assert.equal(book.trades.length, 1);

  const restored = createTradeBook();
  assert.deepEqual(noteCurveTrade(restored, CLAMPED_BUY, meta), { added: true });
  assert.deepEqual(noteCurveTrade(restored, CLAMPED_BUY, meta), { added: false });

  const patch = metricsFromState({
    phase: 0,
    quoteIsNative: false,
    quoteDecimals: 6,
    quoteSymbol: "USDC",
    stableUsd: 1,
    book,
    curve: CURVE,
    nowMs: NOW,
    windowComplete: true,
  });
  close(patch.volume.h24, 1.5);
  assert.equal(patch.totalVolume24h, patch.volume.h24);
  assert.equal(patch.volumeComplete, true);
});

test("a partial window does not set volume.h24", () => {
  const book = createTradeBook();
  note(book, CLAMPED_BUY, { txHash: "0x1", logIndex: 1, blockTimestampMs: NOW - 1_000 });
  const patch = metricsFromState({
    phase: 0,
    quoteIsNative: false,
    quoteDecimals: 6,
    quoteSymbol: "USDC",
    stableUsd: 1,
    quotePerToken: 2,
    totalSupplyWhole: 100,
    book,
    curve: CURVE,
    nowMs: NOW,
    windowComplete: false,
  });
  assert.equal(patch.volumeComplete, false);
  assert.equal("volume" in patch, false);
  assert.equal("totalVolume24h" in patch, false);
  close(patch.volumeObservedUsd, 1.5);
  assert.equal(patch.priceUsd, "2");
});

test("a complete window sets h24 from executed buys and sells inside the window", () => {
  const book = createTradeBook();
  note(book, CLAMPED_BUY, { txHash: "0xbuy", logIndex: 1, blockTimestampMs: NOW - DAY });
  note(book, sellLog(250_000n), { txHash: "0xsell", logIndex: 2, blockTimestampMs: NOW - 60_000 });
  note(book, sellLog(9_000_000n), { txHash: "0xold", logIndex: 3, blockTimestampMs: NOW - DAY - 1 });
  note(book, sellLog(8_000_000n), {
    txHash: "0xother",
    logIndex: 4,
    curve: OTHER,
    blockTimestampMs: NOW - 60_000,
  });
  const patch = metricsFromState({
    phase: 0,
    quoteIsNative: false,
    quoteDecimals: 6,
    stableUsd: 1,
    book,
    curve: CURVE,
    nowMs: NOW,
    windowMs: DAY,
    windowComplete: true,
  });
  close(patch.volume.h24, 1.75);
  close(patch.totalVolume24h, 1.75);
  assert.equal(patch.volumeComplete, true);
});

test("clamped buy volume is the event quoteIn, not a requested size or tokensOut times spot", () => {
  const word0 = BigInt(CLAMPED_BUY.data.slice(0, 66));
  assert.equal(word0, 1_500_000n);
  const decoded = decodeCurveTrade(CLAMPED_BUY);
  assert.equal(decoded.side, "buy");
  assert.equal(decoded.quoteIn, 1_500_000n);
  assert.equal(decoded.tokensOut, 50_000_000_000_000_000n);
  assert.equal(decoded.fee, 15_000n);
  assert.equal(decoded.quoteAmount, decoded.quoteIn);

  const book = createTradeBook();
  note(book, CLAMPED_BUY, { txHash: "0xclamp", logIndex: 7 });
  const quotePerToken = 2;
  const patch = metricsFromState({
    phase: 0,
    quotePerToken,
    quoteIsNative: false,
    quoteDecimals: 6,
    quoteSymbol: "USDC",
    stableUsd: 1,
    book,
    curve: CURVE,
    nowMs: NOW,
    windowComplete: true,
  });
  const naiveFromTokensOut = 0.05 * quotePerToken;
  close(patch.volume.h24, 1.5);
  assert.notEqual(patch.volume.h24, REQUESTED_QUOTE_USDC);
  assert.notEqual(patch.volume.h24, naiveFromTokensOut);
  assert.notEqual(patch.volume.h24, 1.515);
});

test("without a USD conversion, complete-window volume stays in quote units", () => {
  const book = createTradeBook();
  const raw = sellLog(2n * 10n ** 18n);
  note(book, raw, { txHash: "0xeth", logIndex: 1 });
  const decoded = decodeCurveTrade(raw);
  assert.equal(decoded.side, "sell");
  assert.equal(decoded.quoteOut, 2n * 10n ** 18n);
  const patch = metricsFromState({
    phase: 0,
    quotePerToken: 0.01,
    quoteIsNative: true,
    quoteDecimals: 18,
    quoteSymbol: "ETH",
    ethUsd: null,
    book,
    curve: CURVE,
    nowMs: NOW,
    windowComplete: true,
  });
  close(patch.priceQuote, 0.01);
  assert.equal("priceUsd" in patch, false);
  assert.equal(patch.volumeComplete, false);
  assert.equal("volume" in patch, false);
  close(patch.volumeQuote, 2);
  assert.equal(patch.volumeQuoteSymbol, "ETH");
});

test("an 18-decimal ERC-20 stable sums raw quote to whole units", () => {
  const book = createTradeBook();
  const log = tradeIface.encodeEventLog("CurveBuy", [
    BUYER,
    RECIPIENT,
    2n * 10n ** 18n,
    1n,
    10n ** 16n,
    0n,
  ]);
  note(book, log, { txHash: "0xdai", logIndex: 4 });
  const patch = metricsFromState({
    phase: 0,
    quoteIsNative: false,
    quoteDecimals: 18,
    quoteSymbol: "DAI",
    stableUsd: 1,
    book,
    curve: CURVE,
    nowMs: NOW,
    windowComplete: true,
  });
  close(patch.volume.h24, 2);
  assert.equal(patch.volumeComplete, true);
});

test("liquidity uses real quote reserve, not the phantom getReserves side", () => {
  const spot = quotePerTokenFromReserves({
    quoteReserve: 10_000_000n,
    tokenReserve: 1n * 10n ** 18n,
    tokenDecimals: 18,
    quoteDecimals: 6,
  });
  close(spot, 10);
  const patch = metricsFromState({
    phase: 0,
    quotePerToken: spot,
    quoteIsNative: false,
    quoteDecimals: 6,
    stableUsd: 1,
    realQuoteReserve: 2_000_000n,
    graduationThreshold: 20_000_000n,
    nowMs: NOW,
  });
  close(patch.liquidity.usd, 2);
  assert.notEqual(patch.liquidity.usd, 10);
  close(patch.bondingProgress, 10);
});

test("applyMarketPatch keeps a known price when the new patch has no volume", () => {
  const record = {
    priceUsd: "1.5",
    priceQuote: 1.5,
    marketCap: 15,
    fdv: 15,
    volumeComplete: true,
    volume: { h24: 40, h1: 3 },
    totalVolume24h: 40,
    liquidity: { usd: 9 },
    totalLiquidityUsd: 9,
    marketUpdatedAt: NOW - 10,
  };
  const patch = metricsFromState({
    phase: 0,
    quoteIsNative: false,
    quoteDecimals: 6,
    stableUsd: null,
    realQuoteReserve: 1_000_000n,
    graduationThreshold: 4_000_000n,
    nowMs: NOW,
    windowComplete: false,
  });
  assert.equal(patch.volumeComplete, false);
  assert.equal("priceUsd" in patch, false);
  assert.equal("volume" in patch, false);
  assert.equal("liquidity" in patch, false);

  const next = applyMarketPatch(record, patch);
  assert.equal(next, record);
  assert.equal(next.priceUsd, "1.5");
  assert.equal(next.priceQuote, 1.5);
  assert.equal(next.marketCap, 15);
  assert.equal(next.volume.h24, 40);
  assert.equal(next.volume.h1, 3);
  assert.equal(next.liquidity.usd, 9);
  assert.equal(next.volumeComplete, false);
  assert.equal(next.marketStage, "bonding_curve");
  close(next.bondingProgress, 25);

  const explicit = applyMarketPatch(
    { priceUsd: "4", liquidity: { usd: 8 } },
    { volumeComplete: false },
  );
  assert.equal(explicit.priceUsd, "4");
  assert.equal(explicit.liquidity.usd, 8);
  assert.equal(explicit.volumeComplete, false);
});
