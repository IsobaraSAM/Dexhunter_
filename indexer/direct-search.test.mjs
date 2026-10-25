import assert from "node:assert/strict";
import test from "node:test";
import { tokenFromRaydiumLaunch, matchesTextQuery } from "./direct-search.js";

test("a Raydium LaunchLab row keeps price, cap, and the mint", () => {
  const token = tokenFromRaydiumLaunch({
    mint: "EnYE8vdyoR8Gb3m7Fg5PU2fM9ov9g6eCU1NZ8w4tiray",
    poolId: "3hrJJGgDcfTuDuA6aru5JsefgkVCdu8U4vux5b59mzir",
    name: "Hoggo",
    symbol: "HOGO",
    supply: 10000000000,
    marketCap: 4302.96,
    volumeU: 0,
    finishingRate: 0.13,
    createAt: 1789757145791,
    imgUrl: "https://ipfs.io/ipfs/bafy",
    mintB: { address: "So11111111111111111111111111111111111111112", symbol: "WSOL" },
  });
  assert.equal(token.baseToken.symbol, "HOGO");
  assert.equal(token.baseToken.address, "EnYE8vdyoR8Gb3m7Fg5PU2fM9ov9g6eCU1NZ8w4tiray");
  assert.ok(Number(token.priceUsd) > 0);
  assert.equal(token.marketCap, 4302.96);
  assert.equal(token.volume.h24, 0);
  assert.equal(token.volumeComplete, true);
  assert.equal(token.isBondingCurve, true);
  assert.equal(token.bondingProgress, 13);
  assert.equal(token.chainId, "solana");
  assert.match(token.primaryDexTradingUrl, /raydium\.io\/launchpad/);
});

test("a name search does not match telegram or a mint that happens to contain the letters", () => {
  const gram = { baseToken: { symbol: "GRAM", name: "Gram (prev. Toncoin)", address: "Mint111" } };
  const grams = { baseToken: { symbol: "GRAMS", name: "GRAMS", address: "Mint222" } };
  const telegram = { baseToken: { symbol: "FOMO", name: "THE FOMOAPP TELEGRAM BOT", address: "xxgramxx" } };
  const insta = { baseToken: { symbol: "INSTA", name: "Instagram", address: "AbCgramDeF" } };
  const programmed = { baseToken: { symbol: "programmed", name: "programmed", address: "Mint333" } };
  assert.equal(matchesTextQuery(gram, "GRAM"), true);
  assert.equal(matchesTextQuery(grams, "gram"), true);
  assert.equal(matchesTextQuery(telegram, "GRAM"), false);
  assert.equal(matchesTextQuery(insta, "GRAM"), false);
  assert.equal(matchesTextQuery(programmed, "GRAM"), false);
});
