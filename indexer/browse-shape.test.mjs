import test from "node:test";
import assert from "node:assert/strict";
import { projectBrowseToken } from "./browse-shape.js";

test("browse rows keep the list fields and drop unused launch internals", () => {
  const row = projectBrowseToken({
    chainId: "robinhood",
    baseToken: { address: "0xabc", name: "Primer", symbol: "PRIMER" },
    primaryDex: "Pons V2",
    primaryDexTradingUrl: "https://example.test/token/0xabc",
    url: "https://example.test/token/0xabc",
    pairCreatedAt: 1_700_000_000_000,
    priceUsd: "0.1",
    txHash: "0xdead",
    virtualSolReserves: "123",
    firstSeenAt: 1_700_000_000_000,
    ponsCurve: "0xcurve",
    argusPoolId: "9",
    creator: "0xcreator",
    info: { imageUrl: "https://img", description: "hello" },
  });
  assert.equal(row.baseToken.symbol, "PRIMER");
  assert.equal(row.pairCreatedAt, 1_700_000_000_000);
  assert.equal(row.creator, "0xcreator");
  assert.equal(row.info.description, "hello");
  assert.equal(row.url, undefined);
  assert.equal(row.primaryDexTradingUrl, "https://example.test/token/0xabc");
  assert.equal(row.txHash, undefined);
  assert.equal(row.virtualSolReserves, undefined);
  assert.equal(row.firstSeenAt, undefined);
  assert.equal(row.ponsCurve, undefined);
});

test("a different chart url is kept", () => {
  const row = projectBrowseToken({
    url: "https://dexscreener.com/solana/pair",
    primaryDexTradingUrl: "https://pump.fun/coin/mint",
  });
  assert.equal(row.url, "https://dexscreener.com/solana/pair");
});
