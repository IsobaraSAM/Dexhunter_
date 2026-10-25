import test from "node:test";
import assert from "node:assert/strict";
import fs from "fs";
import { ethers } from "ethers";
import { selectFeed } from "./feed-rules.js";
import { FACTORY, TOPIC_LAUNCHED, createPonsIndexer } from "./pons-engine.js";

function memoryStore() {
  let data = null;
  return {
    load() {
      return data ? structuredClone(data) : null;
    },
    save(book) {
      data = structuredClone(book);
    },
  };
}

test("discovery awaits a bounded Pons catch-up before ingesting", () => {
  const src = fs.readFileSync(new URL("./discovery-engine.js", import.meta.url), "utf8");
  assert.match(src, /await this\.catchUpPons\(\);\s*this\.ingestPonsTokens\(\)/);
  assert.match(src, /catchUp\(\{\s*maxChunks:\s*4,\s*maxMs:\s*1200\s*\}\)/);
});

test("volumeComplete false Pons rows stay in Latest and Fresh Mints, not Trending or Momentum", async () => {
  const now = Date.now();
  const head = 9_000;
  const token = "0x3c92da3486bb24d547ebf00ef73ae650e134bc0b";
  const curve = "0x00000000000000000000000000000000000000c3";
  const deployer = "0x00000000000000000000000000000000000000d3";
  const coder = ethers.AbiCoder.defaultAbiCoder();
  const log = {
    address: FACTORY,
    topics: [
      TOPIC_LAUNCHED,
      ethers.zeroPadValue(token, 32),
      ethers.zeroPadValue(curve, 32),
      ethers.zeroPadValue(deployer, 32),
    ],
    data: coder.encode(["address", "uint256", "uint256"], [ethers.ZeroAddress, 1, 1000n]),
    blockNumber: ethers.toQuantity(head),
    transactionHash: `0x${"44".repeat(32)}`,
    logIndex: "0x1",
  };
  const engine = createPonsIndexer({
    provider: {
      async getBlockNumber() { return head; },
      async send() { return [log]; },
    },
    store: memoryStore(),
    startBlock: head - 10,
    chunk: 100,
    maxChunk: 100,
    minChunk: 1,
    confirmations: 0,
  });
  await engine.catchUp({ maxChunks: 2, maxMs: 5_000 });
  const indexed = engine.getTokens()[0];
  assert.ok(indexed);
  assert.equal(indexed.volumeComplete, false);
  assert.equal(indexed.isPonsLaunch, true);
  const row = {
    ...indexed,
    pairCreatedAt: now - 60_000,
    volume: { h24: 80_000 },
    totalVolume24h: 80_000,
    liquidity: { usd: 8_000 },
    marketUpdatedAt: now,
    volumeComplete: false,
  };
  assert.equal(selectFeed([row], "latest", now).length, 1);
  assert.equal(selectFeed([row], "fresh_mints", now)[0].baseToken.address, indexed.baseToken.address);
  assert.equal(selectFeed([row], "trending", now).length, 0);
  assert.equal(selectFeed([row], "momentum", now).length, 0);

  const crafted = engine.row({
    token,
    curve,
    pairToken: ethers.ZeroAddress,
    native: true,
    creator: deployer,
    when: now - 30_000,
    configId: 0,
    threshold: "1",
    tx: `0x${"55".repeat(32)}`,
  });
  assert.equal(crafted.volumeComplete, false);
  const loud = {
    ...crafted,
    volume: { h24: 50_000 },
    liquidity: { usd: 4_000 },
    marketUpdatedAt: now,
    volumeComplete: false,
  };
  assert.deepEqual(selectFeed([loud], "latest", now).map((item) => item.baseToken.address), [token]);
  assert.equal(selectFeed([loud], "fresh_mints", now).length, 1);
  assert.equal(selectFeed([loud], "trending", now).length, 0);
  assert.equal(selectFeed([loud], "momentum", now).length, 0);
});
