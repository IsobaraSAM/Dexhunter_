import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { Keypair } from "@solana/web3.js";
import {
  CREATE_EVENT_DISC,
  TRADE_EVENT_DISC,
  createTimestamp,
  decodeCreateEvent,
  decodeTradeEvent,
  extractLaunch,
  extractLaunches,
  extractLaunchesFromTransaction,
  logsNeedTransaction,
  nextSignatureCursor,
  programDataBuffers,
} from "./pump-create.js";

const str = (s) => {
  const b = Buffer.from(s);
  const l = Buffer.alloc(4);
  l.writeUInt32LE(b.length);
  return Buffer.concat([l, b]);
};
const u64 = (n) => {
  const b = Buffer.alloc(8);
  b.writeBigUInt64LE(BigInt(n));
  return b;
};

test("discriminators match the Anchor event names", () => {
  assert.ok(createHash("sha256").update("event:CreateEvent").digest().subarray(0, 8).equals(CREATE_EVENT_DISC));
  assert.ok(createHash("sha256").update("event:TradeEvent").digest().subarray(0, 8).equals(TRADE_EVENT_DISC));
});

test("create log decodes name, mint, curve, creator, and the same-tx dev buy", () => {
  const [mint, curve, user, creator] = [Keypair.generate(), Keypair.generate(), Keypair.generate(), Keypair.generate()];
  const create = Buffer.concat([
    CREATE_EVENT_DISC,
    str("Test Coin"),
    str("TEST"),
    str("https://ipfs.io/ipfs/abc"),
    mint.publicKey.toBuffer(),
    curve.publicKey.toBuffer(),
    user.publicKey.toBuffer(),
    creator.publicKey.toBuffer(),
    u64(1700000000),
  ]);
  const trade = Buffer.concat([
    TRADE_EVENT_DISC,
    mint.publicKey.toBuffer(),
    u64(2_000_000_000),
    u64(5),
    Buffer.from([1]),
    user.publicKey.toBuffer(),
  ]);
  const logs = [
    "Program 6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P invoke [1]",
    `Program data: ${create.toString("base64")}`,
    `Program data: ${trade.toString("base64")}`,
  ];
  const bufs = programDataBuffers(logs);
  const ev = decodeCreateEvent(bufs[0]);
  assert.equal(ev.name, "Test Coin");
  assert.equal(ev.symbol, "TEST");
  assert.equal(ev.mint, mint.publicKey.toBase58());
  assert.equal(ev.bondingCurve, curve.publicKey.toBase58());
  assert.equal(ev.creator, creator.publicKey.toBase58());
  assert.equal(ev.timestampMs, 1_700_000_000_000);
  const launch = extractLaunch(logs);
  assert.equal(launch.devBuy.solAmount, 2_000_000_000n);
  assert.equal(decodeCreateEvent(bufs[1]), null);
  assert.equal(logsNeedTransaction(logs), false);
});

test("a create that only exists as an inner emit_cpi instruction is still a launch", () => {
  const [mint, curve, user, creator] = [Keypair.generate(), Keypair.generate(), Keypair.generate(), Keypair.generate()];
  const event = Buffer.concat([
    CREATE_EVENT_DISC,
    str("Inner Coin"),
    str("IN"),
    str("ipfs://cid"),
    mint.publicKey.toBuffer(),
    curve.publicKey.toBuffer(),
    user.publicKey.toBuffer(),
    creator.publicKey.toBuffer(),
    u64(1700000001),
  ]);
  const tag = Buffer.from("e445a52e51cb9a1d", "hex");
  const data = Buffer.concat([tag, event]);
  const tx = {
    blockTime: 1700000001,
    meta: {
      logMessages: ["Program log: Instruction: Create"],
      innerInstructions: [{ index: 0, instructions: [{ programIdIndex: 0, accounts: [], data }] }],
    },
    transaction: {
      message: {
        accountKeys: ["6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P"],
        instructions: [],
      },
    },
  };
  assert.equal(extractLaunch(tx.meta.logMessages), null);
  const found = extractLaunchesFromTransaction(tx);
  assert.equal(found.launches.length, 1);
  assert.equal(found.launches[0].ev.name, "Inner Coin");
  assert.equal(found.launches[0].ev.mint, mint.publicKey.toBase58());
  assert.equal(found.launches[0].ev.timestampMs, 1_700_000_001_000);
});

test("truncated or empty mint-authority logs still need the transaction", () => {
  assert.equal(logsNeedTransaction([]), true);
  assert.equal(logsNeedTransaction(["Log truncated"]), true);
  assert.equal(logsNeedTransaction(["Program log: Instruction: Create"]), true);
});

test("a create without chain time does not invent a launch clock", () => {
  assert.equal(createTimestamp(undefined), null);
  assert.equal(createTimestamp(1_700_000_000), 1_700_000_000_000);
  assert.equal(createTimestamp(1_700_000_000_123), 1_700_000_000_123);
});

test("two creates in one log are both launches", () => {
  const a = Keypair.generate();
  const b = Keypair.generate();
  const user = Keypair.generate();
  const pack = (mint, name) => Buffer.concat([
    CREATE_EVENT_DISC,
    str(name),
    str("T"),
    str("https://ipfs.io/ipfs/abc"),
    mint.publicKey.toBuffer(),
    Keypair.generate().publicKey.toBuffer(),
    user.publicKey.toBuffer(),
  ]);
  const logs = [
    `Program data: ${pack(a, "One").toString("base64")}`,
    `Program data: ${pack(b, "Two").toString("base64")}`,
  ];
  const launches = extractLaunches(logs);
  assert.deepEqual(launches.map((row) => row.ev.name), ["One", "Two"]);
  assert.equal(launches[0].ev.timestampMs, undefined);
});

test("a 40-signature page does not skip the tail when processing is capped", () => {
  const rows = Array.from({ length: 40 }, (_, i) => ({ signature: `sig-${i}` }));
  const all = nextSignatureCursor(rows, () => "ok");
  assert.equal(all.before, "sig-39");
  assert.equal(all.headComplete, true);
  const hole = nextSignatureCursor(rows, (_row, i) => (i === 12 ? "retry" : "ok"));
  assert.equal(hole.before, "sig-11");
  assert.equal(hole.headComplete, true);
  const head = nextSignatureCursor(rows, (_row, i) => (i === 0 ? "retry" : "ok"));
  assert.equal(head.before, "");
  assert.equal(head.headComplete, false);
});
