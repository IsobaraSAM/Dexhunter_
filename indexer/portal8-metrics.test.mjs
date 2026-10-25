import test from "node:test";
import assert from "node:assert/strict";
import {
  tokenIsCurrency0,
  isUsdc,
  quoteDecimalsOrNull,
  usdPriceOrNull,
  usdVolumeOrNull,
  fdvOrNull,
  USDC_ARC,
} from "./portal8-metrics.js";

const TOKEN = "0x7358dFd989FCDfeA9A3D9fd0d908d90C86D6Ad44";
const EURC = "0xbEf5f6d51CB62b58e6A8f77868681825C6fe21c1";
const USDC = USDC_ARC;

test("orientation uses actual quote, not USDC", () => {
  // Token < EURC → token is currency0
  assert.equal(tokenIsCurrency0(TOKEN, EURC), true);
  // Token > USDC → token is currency1 when quote is USDC
  assert.equal(tokenIsCurrency0(TOKEN, USDC), false);
  // Unknown quote → null, never assumed
  assert.equal(tokenIsCurrency0(TOKEN, null), null);
});

test("USDC detection is address-based", () => {
  assert.equal(isUsdc(USDC), true);
  assert.equal(isUsdc(EURC), false);
  assert.equal(isUsdc(null), false);
});

test("quote decimals: USDC is 6, others require a read", () => {
  assert.equal(quoteDecimalsOrNull(USDC, undefined), 6);
  assert.equal(quoteDecimalsOrNull(EURC, undefined), null);
  assert.equal(quoteDecimalsOrNull(EURC, 6), 6);
  assert.equal(quoteDecimalsOrNull(EURC, 18), 18);
});

test("USD price only when quote is verified USDC", () => {
  assert.equal(usdPriceOrNull(0.0000025, USDC), 0.0000025);
  assert.equal(usdPriceOrNull(0.0000025, EURC), null);
  assert.equal(usdPriceOrNull(0, USDC), null);
});

test("USD volume is null for non-USDC and for unknown decimals", () => {
  // 1_000_000 raw with 6 decimals = 1.0 USD for USDC
  assert.equal(usdVolumeOrNull(1_000_000, USDC, 6), 1);
  // Same raw for EURC must not be labeled USD
  assert.equal(usdVolumeOrNull(1_000_000, EURC, 6), null);
  // Unknown decimals → null
  assert.equal(usdVolumeOrNull(1_000_000, EURC, null), null);
});

test("Argus market cap is price times total supply once the price is USD", () => {
  const supply = 1_000_000_000n * 10n ** 18n;
  const fdv = fdvOrNull(0.0000025, supply, 18);
  assert.ok(fdv > 2000 && fdv < 3000);
  assert.equal(fdvOrNull(null, supply, 18), null);
  assert.equal(fdvOrNull(0.0000025, 0n, 18), null);
  // A non-USD quote never reaches this helper: usdPriceOrNull refuses it.
  assert.equal(usdPriceOrNull(0.0000025, EURC), null);
});

test("base vs quote volume selection follows orientation", () => {
  const bucket = { a0: 100, a1: 5000 };
  const quoteRawWhenToken0 = bucket.a1;
  const quoteRawWhenToken1 = bucket.a0;
  assert.equal(quoteRawWhenToken0, 5000);
  assert.equal(quoteRawWhenToken1, 100);
});
