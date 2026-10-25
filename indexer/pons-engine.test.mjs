import test from "node:test";
import assert from "node:assert/strict";
import fs from "fs";
import os from "os";
import path from "path";
import { ethers } from "ethers";
import {
  CHAIN_ID,
  FACTORY,
  FACTORY_DEPLOY_BLOCK,
  TOPIC_LAUNCHED,
  createPonsIndexer,
  decodePonsLog,
} from "./pons-engine.js";

test("TokenLaunched topic and a live Robinhood log decode to token, curve, and 4.2 ETH", () => {
  assert.equal(TOPIC_LAUNCHED, "0x8d4aad4953d0ca700d468f3753aa14432d1b35b43ec6409f051fb6aa43a89607");
  const parsed = decodePonsLog({
    address: "0x7ed598bcef8bd9edd8c97a195c6d13f40801ec7e",
    topics: [
      TOPIC_LAUNCHED,
      "0x000000000000000000000000de5efe1ad1b157be163257fb66946e97e96f6da2",
      "0x00000000000000000000000088f35101fd0827b876e426d95d87cdb7a73dc1c6",
      "0x00000000000000000000000095720aca76948198713208c0a0f892c473147114",
    ],
    data: "0x000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000003a4965bf58a40000",
  });
  assert.equal(parsed.name, "TokenLaunched");
  assert.equal(parsed.args.token.toLowerCase(), "0xde5efe1ad1b157be163257fb66946e97e96f6da2");
  assert.equal(parsed.args.curve.toLowerCase(), "0x88f35101fd0827b876e426d95d87cdb7a73dc1c6");
  assert.equal(parsed.args.graduationThreshold, 4200000000000000000n);
});

const coder = ethers.AbiCoder.defaultAbiCoder();

function memoryStore() {
  let data = null;
  return {
    load() {
      return data ? structuredClone(data) : null;
    },
    save(book) {
      data = structuredClone(book);
    },
    peek() {
      return data;
    },
  };
}

function provider({ head, logs = [], fail = null, always = false }) {
  const calls = [];
  return {
    calls,
    async getBlockNumber() {
      return head;
    },
    async send(method, params) {
      if (method !== "eth_getLogs") throw new Error(`unexpected ${method}`);
      const query = params[0];
      const from = Number(query.fromBlock);
      const to = Number(query.toBlock);
      calls.push({ from, to, span: to - from + 1, address: query.address, topic: query.topics[0] });
      if (fail) throw (typeof fail === "function" ? fail() : fail);
      if (always) return logs;
      return logs.filter((log) => {
        const block = Number(log.blockNumber);
        return block >= from && block <= to;
      });
    },
  };
}

function launchLog({ token, block, tx, logIndex, curve = "0x00000000000000000000000000000000000000c1", deployer = "0x00000000000000000000000000000000000000d1" }) {
  return {
    address: FACTORY,
    topics: [
      TOPIC_LAUNCHED,
      ethers.zeroPadValue(token, 32),
      ethers.zeroPadValue(curve, 32),
      ethers.zeroPadValue(deployer, 32),
    ],
    data: coder.encode(["address", "uint256", "uint256"], [ethers.ZeroAddress, 1, 4200000000000000000n]),
    blockNumber: ethers.toQuantity(block),
    transactionHash: tx,
    logIndex: ethers.toQuantity(logIndex),
  };
}

function indexer(opts) {
  const src = opts.provider;
  return createPonsIndexer({
    provider: src,
    store: opts.store || (opts.bookPath ? undefined : memoryStore()),
    bookPath: opts.bookPath,
    book: opts.book,
    startBlock: opts.startBlock,
    chunk: opts.chunk,
    maxChunk: opts.maxChunk ?? opts.chunk,
    minChunk: opts.minChunk ?? 1,
    confirmations: opts.confirmations ?? 0,
  });
}

const NINETY_DAY_BLOCKS = Math.ceil((90 * 24 * 60 * 60 * 1000) / 101);

test("initial backfill walks to the factory deployment block across ticks, not head-1200 or 90 days", async () => {
  const head = 20_000;
  const startBlock = 1_000;
  const chunk = 400;
  const src = provider({ head });
  const engine = indexer({ provider: src, startBlock, chunk, confirmations: 0 });
  assert.equal(engine.startBlock, startBlock);
  const floors = [];
  for (let i = 0; i < 80 && (engine.historyFloor == null || engine.historyFloor >= startBlock); i++) {
    await engine.tick();
    floors.push(engine.historyFloor);
    assert.equal(engine.liveCursor, head);
    assert.notEqual(engine.liveCursor, head - 1200);
  }
  assert.equal(engine.historyFloor, startBlock - 1);
  assert.equal(engine.liveCursor, head);
  assert.ok(floors.length > 5);
  const crossed = floors.findIndex((floor) => floor <= head - 1200);
  assert.ok(crossed >= 0);
  assert.ok(floors.at(-1) < head - 1200);
  assert.ok(floors.length > crossed + 1);
  assert.ok(src.calls.some((call) => call.to < head - 1200));
  assert.ok(src.calls.every((call) => call.address.toLowerCase() === FACTORY.toLowerCase()));
  assert.equal(src.calls[0].topic, TOPIC_LAUNCHED);
});

test("backfill continues through the old 90-day cap down to the deployment block", async () => {
  const chunk = 20_000_000;
  const head = FACTORY_DEPLOY_BLOCK + NINETY_DAY_BLOCKS + 50_000;
  const oldStop = head - NINETY_DAY_BLOCKS;
  assert.ok(oldStop > FACTORY_DEPLOY_BLOCK);
  const src = provider({ head });
  const engine = indexer({
    provider: src,
    chunk,
    confirmations: 0,
  });
  assert.equal(engine.startBlock, FACTORY_DEPLOY_BLOCK);
  const floors = [];
  for (let i = 0; i < 12 && (engine.historyFloor == null || engine.historyFloor >= FACTORY_DEPLOY_BLOCK); i++) {
    await engine.tick();
    floors.push(engine.historyFloor);
  }
  assert.equal(engine.historyFloor, FACTORY_DEPLOY_BLOCK - 1);
  assert.equal(engine.liveCursor, head);
  assert.ok(floors.length >= 3);
  assert.ok(floors.some((floor) => floor > oldStop));
  assert.ok(engine.historyFloor < oldStop);
  assert.ok(src.calls.some((call) => call.from <= oldStop && call.to > oldStop));
  assert.ok(src.calls.every((call) => call.to !== head - 1200 || call.from < head - 1200));
});

test("a cursor more than 4800 blocks behind is preserved and walked forward and back", async () => {
  const head = 80_000;
  const chunk = 500;
  const behind = head - 10_000;
  const src = provider({ head });
  const engine = indexer({
    provider: src,
    startBlock: 100,
    chunk,
    confirmations: 0,
    book: { liveCursor: behind, historyFloor: behind, tokens: [], seen: [] },
  });
  assert.equal(engine.liveCursor, behind);
  let prevCursor = engine.liveCursor;
  let prevFloor = engine.historyFloor;
  for (let i = 0; i < 10; i++) {
    await engine.tick();
    const forward = engine.liveCursor - prevCursor;
    const back = prevFloor - engine.historyFloor;
    assert.ok(forward === 0 || forward === chunk, `forward jump ${forward}`);
    assert.ok(back === 0 || back === chunk, `back jump ${back}`);
    assert.ok(engine.liveCursor <= head);
    assert.notEqual(engine.liveCursor, head - 4800);
    assert.notEqual(engine.liveCursor, head - 1200);
    prevCursor = engine.liveCursor;
    prevFloor = engine.historyFloor;
  }
  assert.equal(engine.liveCursor, behind + 5 * chunk);
  assert.equal(engine.historyFloor, behind - 5 * chunk);
  assert.ok(head - engine.liveCursor > 4800);
});

test("repeated catchUp calls keep walking a multi-chunk gap", async () => {
  const head = 100_000;
  const chunk = 1_000;
  const startCursor = 1_000;
  const src = provider({ head });
  const engine = indexer({
    provider: src,
    startBlock: 100,
    chunk,
    confirmations: 0,
    book: { liveCursor: startCursor, historyFloor: 99, tokens: [], seen: [] },
  });
  const first = await engine.catchUp({ maxChunks: 4, maxMs: 5_000 });
  assert.equal(first.chunks, 4);
  assert.equal(engine.liveCursor, startCursor + 4 * chunk);
  assert.equal(engine.historyFloor, 99);
  const second = await engine.catchUp({ maxChunks: 4, maxMs: 5_000 });
  assert.equal(second.chunks, 4);
  assert.equal(engine.liveCursor, startCursor + 8 * chunk);
  assert.ok(engine.liveCursor < head - 4800);
});

test("durable cursor trails head by PONS_CONFIRMATIONS", async () => {
  const head = 5_000;
  const confirmations = 12;
  const src = provider({ head });
  const engine = indexer({
    provider: src,
    startBlock: 100,
    chunk: 100_000,
    confirmations,
  });
  const step = await engine.tick();
  assert.equal(step.done, true);
  assert.equal(engine.liveCursor, head - confirmations);
  assert.equal(engine.historyFloor, 99);
  assert.ok(src.calls.every((call) => call.to <= head - confirmations));
  assert.ok(src.calls.every((call) => call.from >= 100));
});

test("RPC range and timeout errors shrink the chunk and do not advance the cursor", async () => {
  const head = 50_000;
  const behind = head - 9_000;
  for (const message of ["timeout", "query spans 9000 blocks, but only 10000000 are allowed"]) {
    const src = provider({ head, fail: () => new Error(message) });
    const engine = indexer({
      provider: src,
      startBlock: 10,
      chunk: 8_000,
      minChunk: 250,
      confirmations: 0,
      book: { liveCursor: behind, historyFloor: behind, tokens: [], seen: [] },
    });
    const before = engine.liveCursor;
    await engine.catchUp({ maxChunks: 1, maxMs: 5_000 });
    assert.equal(engine.liveCursor, before);
    assert.equal(engine.historyFloor, behind);
    assert.ok(engine.chunk < 8_000);
    assert.ok(src.calls.length >= 2);
    for (let i = 1; i < src.calls.length; i++) {
      assert.ok(src.calls[i].span < src.calls[i - 1].span);
    }
    assert.equal(src.calls[0].span, 8_000);
  }
});

test("replayed logs do not double-insert and onNewLaunch fires once per token", async () => {
  const head = 4_000;
  const startBlock = 1_000;
  const logs = [
    launchLog({
      token: "0xb64c388496622c74f81221fc6b27951ee1c6c159",
      block: 3_500,
      tx: `0x${"ab".repeat(32)}`,
      logIndex: 1,
    }),
    launchLog({
      token: "0xe4f1855635666d4cad55608d1c6f81aaacdbdfba",
      block: 3_400,
      tx: `0x${"cd".repeat(32)}`,
      logIndex: 2,
      curve: "0x00000000000000000000000000000000000000c2",
    }),
  ];
  const src = provider({ head, logs, always: true });
  const store = memoryStore();
  const engine = indexer({ provider: src, store, startBlock, chunk: 700, confirmations: 0 });
  const seen = [];
  engine.onNewLaunch((row) => seen.push(row.baseToken.address.toLowerCase()));
  for (let i = 0; i < 20 && !engine.health().historyComplete; i++) await engine.tick();
  assert.equal(engine.historyFloor, startBlock - 1);
  assert.deepEqual(seen.sort(), [
    "0xb64c388496622c74f81221fc6b27951ee1c6c159",
    "0xe4f1855635666d4cad55608d1c6f81aaacdbdfba",
  ]);
  assert.equal(engine.getTokens().length, 2);
  assert.ok(engine.getTokens().every((row) => row.volumeComplete === false));
  await engine.catchUp({ maxChunks: 4, maxMs: 5_000 });
  assert.equal(seen.length, 2);
  assert.equal(engine.launches.size, 2);
  const saved = store.peek();
  assert.ok(saved.seen.every((id) => id.startsWith(`${CHAIN_ID}:`)));
  const rewound = structuredClone(saved);
  rewound.liveCursor = saved.liveCursor - 700;
  let replayed = 0;
  const again = createPonsIndexer({
    provider: provider({ head, logs, always: true }),
    store: { load: () => structuredClone(rewound), save() {} },
    startBlock,
    chunk: 700,
    maxChunk: 700,
    minChunk: 1,
    confirmations: 0,
  });
  again.onNewLaunch(() => { replayed += 1; });
  await again.catchUp({ maxChunks: 2, maxMs: 5_000 });
  assert.equal(again.getTokens().length, 2);
  assert.equal(replayed, 0);
});

test("restart loads the persisted cursor and book from disk", async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "pons-book-"));
  const bookPath = path.join(dir, "pons-book.json");
  const head = 8_000;
  const log = launchLog({
    token: "0x68fd8119b64c4344e3fd69a16c3a33e798fb2fc6",
    block: 7_000,
    tx: `0x${"12".repeat(32)}`,
    logIndex: 4,
  });
  const first = indexer({
    provider: provider({ head, logs: [log] }),
    bookPath,
    startBlock: 6_000,
    chunk: 5_000,
    confirmations: 3,
  });
  const step = await first.tick();
  assert.equal(step.done, true);
  assert.equal(fs.existsSync(bookPath), true);
  assert.equal(fs.readdirSync(dir).some((name) => name.endsWith(".tmp")), false);
  const disk = JSON.parse(fs.readFileSync(bookPath, "utf8"));
  assert.equal(disk.liveCursor, head - 3);
  assert.equal(disk.historyFloor, 5_999);
  assert.equal(disk.tokens.length, 1);
  const second = indexer({
    provider: provider({ head }),
    bookPath,
    startBlock: 6_000,
    chunk: 5_000,
    confirmations: 3,
  });
  assert.equal(second.liveCursor, first.liveCursor);
  assert.equal(second.historyFloor, first.historyFloor);
  assert.equal(second.getTokens().length, 1);
  assert.equal(second.getTokens()[0].baseToken.address.toLowerCase(), "0x68fd8119b64c4344e3fd69a16c3a33e798fb2fc6");
  assert.equal(second.seenLogs.size, 1);
});

test("catchUp stays inside maxMs when the RPC hangs", async () => {
  const src = {
    async getBlockNumber() { return 10_000; },
    async send() {
      await new Promise((resolve) => setTimeout(resolve, 1_000));
      return [];
    },
  };
  const engine = indexer({
    provider: src,
    startBlock: 100,
    chunk: 1_000,
    confirmations: 0,
  });
  const started = Date.now();
  const result = await engine.catchUp({ maxChunks: 4, maxMs: 250 });
  const elapsed = Date.now() - started;
  assert.ok(elapsed < 1_000, `elapsed ${elapsed}`);
  assert.equal(engine.liveCursor, null);
  assert.ok(result.chunks >= 1);
});

test("a failed chunk does not write a cursor", async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "pons-fail-"));
  const bookPath = path.join(dir, "pons-book.json");
  const engine = indexer({
    provider: provider({ head: 10_000, fail: () => new Error("timeout") }),
    bookPath,
    startBlock: 100,
    chunk: 1_000,
    minChunk: 100,
    confirmations: 0,
  });
  await engine.catchUp({ maxChunks: 1, maxMs: 5_000 });
  assert.equal(engine.liveCursor, null);
  assert.equal(fs.existsSync(bookPath), false);
});

const KNOWN_LAUNCHES = [
  "0xb64c388496622c74f81221fc6b27951ee1c6c159",
  "0xe4f1855635666d4cad55608d1c6f81aaacdbdfba",
  "0x68fd8119b64c4344e3fd69a16c3a33e798fb2fc6",
  "0x3c92da3486bb24d547ebf00ef73ae650e134bc0b",
  "0xbac4d6fda073ef4c03c6f181fa61c38af0fb90a5",
  "0x8d6c0514a2687de1bbfe10f01cf5f5eb96c56dde",
  "0x8bc79c1d3c403ef4f85499bd623a83326835de99",
  "0x8f632a038d31026a32939688ded721139e8d30c6",
];

test("book cap keeps the newest launches and an oversized file keeps its cursors", () => {
  const store = memoryStore();
  const engine = createPonsIndexer({
    provider: provider({ head: 10 }),
    store,
    maxBook: 2,
    startBlock: 1,
    confirmations: 0,
  });
  const heard = [];
  engine.onNewLaunch((row) => heard.push(row.baseToken.address));
  const row = (n, at) => ({
    pairCreatedAt: at,
    baseToken: { address: `0x${n.toString(16).padStart(40, "0")}`, name: `T${n}`, symbol: "T" },
  });
  engine.publish(row(1, 10));
  engine.publish(row(2, 30));
  engine.publish(row(3, 20));
  assert.equal(engine.launches.size, 2);
  assert.deepEqual(engine.getTokens().map((token) => token.baseToken.name), ["T2", "T3"]);
  assert.equal(heard.length, 3);
  engine.publish(row(1, 10));
  assert.equal(heard.length, 3);
  assert.equal(engine.launches.has(`0x${"1".padStart(40, "0")}`), false);
  engine.saveBook(true);
  assert.equal(store.peek().tokens.length, 2);

  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "pons-slim-"));
  const file = path.join(dir, "pons-book.json");
  const fat = {
    version: 2,
    chainId: 4663,
    startBlock: 26841846,
    historyFloor: 63851892,
    liveCursor: 95860147,
    chunk: 400000,
    confirmations: 12,
    tokens: [1, 2, 3, 4, 5].map((n) => ({
      pairCreatedAt: 5000 - n,
      baseToken: {
        address: `0x${n.toString(16).padStart(40, "0")}`,
        name: n === 1 ? "A".repeat(1024 * 1024 + 80) : `N${n}`,
        symbol: "S",
      },
    })),
    seen: ["x".repeat(9 * 1024 * 1024)],
  };
  fs.writeFileSync(file, JSON.stringify(fat));
  assert.ok(fs.statSync(file).size > 8 * 1024 * 1024);
  const slim = createPonsIndexer({
    provider: provider({ head: 10 }),
    bookPath: file,
    maxBook: 3,
    startBlock: 1,
    confirmations: 0,
  });
  assert.equal(slim.historyFloor, 63851892);
  assert.equal(slim.liveCursor, 95860147);
  assert.equal(slim.chunk, 400000);
  assert.equal(slim.launches.size, 3);
  const disk = JSON.parse(fs.readFileSync(file, "utf8"));
  assert.equal(disk.historyFloor, 63851892);
  assert.equal(disk.liveCursor, 95860147);
  assert.equal(disk.chunk, 400000);
  assert.equal(disk.tokens.length, 5);
  assert.equal(disk.seen.length, 0);
  assert.equal(disk.tokens[0].baseToken.name.length, 1024 * 1024 + 80);
  assert.ok(fs.statSync(file).size < 2 * 1024 * 1024);
});

test("live smoke: chain id, head, and known TokenLaunched logs", { skip: process.env.PONS_LIVE !== "1" }, async () => {
  const floor = 89_117_979;
  async function rpc(method, params) {
    const res = await fetch("https://rpc.mainnet.chain.robinhood.com", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
    });
    const json = await res.json();
    if (json.error) throw new Error(JSON.stringify(json.error));
    return json.result;
  }
  assert.equal(Number(await rpc("eth_chainId", [])), 4663);
  const head = Number(await rpc("eth_blockNumber", []));
  assert.ok(head > floor);
  for (const addr of KNOWN_LAUNCHES) {
    const logs = await rpc("eth_getLogs", [{
      address: FACTORY,
      topics: [TOPIC_LAUNCHED, ethers.zeroPadValue(addr, 32)],
      fromBlock: ethers.toQuantity(floor),
      toBlock: "latest",
    }]);
    assert.ok(Array.isArray(logs) && logs.length >= 1, addr);
    assert.ok(Number(logs[0].blockNumber) >= floor);
  }
});
