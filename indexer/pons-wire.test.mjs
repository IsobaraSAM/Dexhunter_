import test from "node:test";
import assert from "node:assert/strict";
import { ethers } from "ethers";
import { CURVE_BUY_TOPIC } from "./pons-market.js";
import { createPonsIndexer } from "./pons-engine.js";

function memoryStore() {
  let data = null;
  return {
    load() { return data ? structuredClone(data) : null; },
    save(book) { data = structuredClone(book); },
  };
}

const token = "0x0000000000000000000000000000000000000b01";
const curve = "0x0000000000000000000000000000000000000c01";

function engine() {
  return createPonsIndexer({
    provider: { async getBlockNumber() { return 1_000_000; }, async send() { return []; } },
    store: memoryStore(),
    startBlock: 1,
    confirmations: 0,
    scanTrades: false,
  });
}

test("native curve spot becomes USD only when ethUsd is known, and market cap is total supply", () => {
  const ix = engine();
  ix.ethUsd = 2000;
  ix.headSample = { block: 1_000_000, timeMs: Date.now() };
  const rec = ix.row({
    token,
    curve,
    pairToken: ethers.ZeroAddress,
    native: true,
    creator: "0x0000000000000000000000000000000000000d01",
    when: Date.now(),
    configId: 1,
    threshold: (4n * 10n ** 18n).toString(),
    tx: "0x" + "ab".repeat(32),
  });
  rec.baseToken.decimals = 18;
  rec.totalSupply = (1_000_000_000n * 10n ** 18n).toString();
  // 1 ETH phantom quote against 1e9 tokens => 1e-9 ETH per token => $0.000002 at $2000.
  rec._reserves = [10n ** 18n, 1_000_000_000n * 10n ** 18n];
  rec._raised = 5n * 10n ** 17n;
  rec._phase = 0;
  rec.ponsGraduationThreshold = (4n * 10n ** 18n).toString();
  ix.applyMarket(rec);
  assert.equal(rec.ponsPhase, 0);
  assert.equal(rec.marketStage, "bonding_curve");
  assert.ok(Math.abs(Number(rec.priceUsd) - 0.000002) < 1e-12);
  assert.equal(rec.marketCapBasis, "total_supply");
  assert.equal(rec.marketCapMethod, "spot_x_total_supply");
  assert.ok(Math.abs(rec.marketCap - 2000) < 1e-6);
  assert.equal(rec.fdv, rec.marketCap);
  assert.ok(Math.abs(rec.liquidity.usd - 1000) < 1e-6);
  assert.equal(rec.volumeComplete, false);
  assert.equal(rec.volume, undefined);

  const bare = ix.row({
    token,
    curve,
    pairToken: ethers.ZeroAddress,
    native: true,
    creator: "0x0000000000000000000000000000000000000d01",
    when: rec.pairCreatedAt,
    configId: 1,
    threshold: (4n * 10n ** 18n).toString(),
    tx: "0x" + "ab".repeat(32),
  });
  ix.launches.set(token.toLowerCase(), rec);
  ix.publish(bare);
  const kept = ix.launches.get(token.toLowerCase());
  assert.ok(Math.abs(Number(kept.priceUsd) - 0.000002) < 1e-12);
  assert.equal(kept.marketCap, rec.marketCap);
  assert.equal(kept.liquidity.usd, rec.liquidity.usd);
});

test("missing ethUsd leaves the quote price and does not invent USD", () => {
  const ix = engine();
  const rec = ix.row({
    token,
    curve,
    pairToken: ethers.ZeroAddress,
    native: true,
    creator: "0x0000000000000000000000000000000000000d01",
    when: Date.now(),
    configId: 1,
    threshold: "1",
    tx: "0x" + "cd".repeat(32),
  });
  rec.baseToken.decimals = 18;
  rec.totalSupply = (10n ** 18n).toString();
  rec._reserves = [2n * 10n ** 18n, 1n * 10n ** 18n];
  rec._raised = 10n ** 18n;
  rec._phase = 0;
  ix.applyMarket(rec);
  assert.equal(rec.priceQuote, 2);
  assert.equal(rec.priceUsd, undefined);
  assert.equal(rec.marketCap, undefined);
  assert.equal(rec.liquidity, undefined);
});

test("a quote that only calls itself USDC is not priced as USD", () => {
  const ix = engine();
  const quote = "0x0000000000000000000000000000000000000e01";
  const rec = ix.row({
    token,
    curve,
    pairToken: quote,
    native: false,
    creator: "0x0000000000000000000000000000000000000d01",
    when: Date.now(),
    configId: 1,
    threshold: "1",
    tx: "0x" + "ef".repeat(32),
  });
  rec.quoteToken = { address: quote, symbol: "USDC" };
  rec.baseToken.decimals = 18;
  rec._quoteDec = 6;
  rec.totalSupply = (1_000_000n * 10n ** 18n).toString();
  rec._reserves = [1_000_000n, 1_000_000n * 10n ** 18n];
  rec._raised = 500_000n;
  rec._phase = 0;
  ix.applyMarket(rec);
  assert.equal(rec.priceUsd, undefined);
  assert.ok(rec.priceQuote > 0);
});

test("phase 2 does not keep the curve spot as the pool price", () => {
  const ix = engine();
  ix.ethUsd = 3000;
  const rec = ix.row({
    token,
    curve,
    pairToken: ethers.ZeroAddress,
    native: true,
    creator: "0x0000000000000000000000000000000000000d01",
    when: Date.now(),
    configId: 1,
    threshold: "1",
    tx: "0x" + "11".repeat(32),
  });
  rec.baseToken.decimals = 18;
  rec.totalSupply = (10n ** 18n).toString();
  rec._reserves = [10n ** 18n, 10n ** 18n];
  rec._raised = 10n ** 18n;
  rec._phase = 2;
  ix.applyMarket(rec);
  assert.equal(rec.ponsPhase, 2);
  assert.equal(rec.marketStage, "graduated");
  assert.equal(rec.isGraduated, true);
  assert.equal(rec.priceUsd, undefined);
  assert.equal(rec.liquidity, undefined);
  assert.equal(rec.bondingProgress, 100);
});

test("curve trade logs advance that curve's window and do not move the factory cursor", async () => {
  const head = 50_000;
  const buy = {
    address: curve,
    topics: [
      CURVE_BUY_TOPIC,
      ethers.zeroPadValue("0x00000000000000000000000000000000000000aa", 32),
      ethers.zeroPadValue("0x00000000000000000000000000000000000000bb", 32),
    ],
    data: ethers.AbiCoder.defaultAbiCoder().encode(
      ["uint256", "uint256", "uint256", "uint256"],
      [1500000n, 10n, 1n, 1n],
    ),
    blockNumber: ethers.toQuantity(head - 10),
    transactionHash: "0x" + "22".repeat(32),
    logIndex: "0x1",
  };
  const calls = [];
  const ix = createPonsIndexer({
    provider: {
      async getBlockNumber() { return head; },
      async send(_method, params) {
        calls.push(params[0]);
        return [buy];
      },
    },
    store: memoryStore(),
    startBlock: 1,
    confirmations: 0,
    scanTrades: true,
  });
  ix.headSample = { block: head, timeMs: Date.now() };
  const rec = ix.row({
    token,
    curve,
    pairToken: ethers.ZeroAddress,
    native: true,
    creator: "0x0000000000000000000000000000000000000d01",
    when: Date.now() - 60_000,
    configId: 1,
    threshold: "1",
    tx: "0x" + "33".repeat(32),
  });
  ix.launches.set(token.toLowerCase(), rec);
  ix.liveCursor = 123;
  ix.historyFloor = 100;
  await ix.pullTradeChunk();
  assert.equal(ix.liveCursor, 123);
  assert.equal(ix.historyFloor, 100);
  assert.equal(calls.length, 1);
  assert.equal(calls[0].address.toLowerCase(), curve.toLowerCase());
  assert.ok(ix.tradeFloors.get(curve.toLowerCase()) < head);
  await ix.pullTradeChunk();
  assert.equal(ix.tradeBook.trades.length, 1);
});
