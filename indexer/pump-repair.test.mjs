import test from "node:test";
import assert from "node:assert/strict";
import fs from "fs";
import os from "os";
import path from "path";
import { Keypair } from "@solana/web3.js";
import { chainTokenKey } from "../src/lib/addressCase.js";
import { readPumpMetaJobs, writePumpMetaJobs } from "./index-store.js";
import {
  NATIVE_SOL_SENTINEL,
  TRADE_EVENT_DISC,
  WRAPPED_SOL_MINT,
  describeQuote,
  decodeTradeDetails,
  foldTradeVolume,
  settleMetadataJob,
  valueReserves,
  withPumpDefaults,
} from "./pump-create.js";

const u64 = (n) => {
  const b = Buffer.alloc(8);
  b.writeBigUInt64LE(BigInt(n));
  return b;
};
const str = (s) => {
  const body = Buffer.from(s);
  const len = Buffer.alloc(4);
  len.writeUInt32LE(body.length);
  return Buffer.concat([len, body]);
};

test("mixed-case solana addresses stay distinct and arc addresses do not", () => {
  const mint = Keypair.generate().publicKey.toBase58();
  assert.equal(chainTokenKey("solana", mint), `solana:${mint}`);
  assert.notEqual(chainTokenKey("solana", mint), chainTokenKey("solana", mint.toLowerCase()));
  assert.equal(chainTokenKey("arc", "0xABC"), chainTokenKey("ARC", "0xabc"));
});

test("a missing trade time stays unknown and volume stays partial", () => {
  const folded = foldTradeVolume([], { tradedAt: undefined, quoteNative: true, quoteSol: 1, solUsd: 100, now: 2_000_000_000_000 });
  assert.equal(folded.partial, "time");
  assert.equal(folded.volumeComplete, false);
  assert.equal(folded.rows.length, 0);
  assert.equal(folded.volumeObservedUsd, null);
});

test("a non-SOL quote is not labeled SOL and an unknown supply is not a billion", () => {
  const quoteMint = Keypair.generate().publicKey.toBase58();
  const described = describeQuote(quoteMint, false);
  assert.equal(described.native, false);
  assert.equal(described.symbol, null);
  assert.equal(described.mint, quoteMint);
  const unknown = valueReserves({
    quoteRaw: 30_000_000_000n,
    baseRaw: 1_000_000_000_000n,
    supplyRaw: null,
    quoteMint,
    legacySol: false,
    baseDecimals: 6,
    solUsd: 100,
  });
  assert.equal(unknown.spotUsd, null);
  assert.equal(unknown.fdvUsd, null);
  assert.equal(unknown.quote.symbol, null);

  const sentinel = describeQuote(NATIVE_SOL_SENTINEL, false);
  assert.equal(sentinel.mint, WRAPPED_SOL_MINT);
  assert.equal(sentinel.symbol, "SOL");
  assert.notEqual(sentinel.mint, NATIVE_SOL_SENTINEL);

  const half = valueReserves({
    quoteRaw: 30_000_000_000n,
    baseRaw: 1_000_000_000_000n,
    supplyRaw: 500_000_000_000_000n,
    quoteMint: null,
    legacySol: true,
    baseDecimals: 6,
    solUsd: 100,
  });
  assert.equal(half.quote.native, true);
  assert.ok(Math.abs(half.spotUsd - 0.003) < 1e-9);
  assert.ok(Math.abs(half.fdvUsd - 1_500_000) < 1);
  const missingSupply = valueReserves({
    quoteRaw: 30_000_000_000n,
    baseRaw: 1_000_000_000_000n,
    supplyRaw: null,
    quoteMint: null,
    legacySol: true,
    baseDecimals: 6,
    solUsd: 100,
  });
  assert.equal(missingSupply.fdvUsd, null);
  assert.ok(missingSupply.spotUsd > 0);
  const filled = withPumpDefaults({
    quoteRaw: 30_000_000_000n,
    baseRaw: 1_073_000_000_000_000n,
    supplyRaw: null,
    quoteMint: null,
    legacySol: true,
    baseDecimals: null,
    solUsd: 100,
  });
  assert.ok(filled.spotUsd > 0);
  assert.ok(filled.fdvUsd > 0);
  const foreign = withPumpDefaults({
    quoteRaw: 30_000_000_000n,
    baseRaw: 1_000_000_000_000n,
    supplyRaw: null,
    quoteMint,
    legacySol: false,
    baseDecimals: null,
    solUsd: 100,
  });
  assert.equal(foreign.spotUsd, null);
  assert.equal(foreign.fdvUsd, null);
});

test("a trade event keeps a parsed non-SOL quote mint", () => {
  const mint = Keypair.generate().publicKey;
  const quote = Keypair.generate().publicKey;
  const user = Keypair.generate().publicKey;
  const buf = Buffer.concat([
    TRADE_EVENT_DISC,
    mint.toBuffer(),
    u64(5),
    u64(6),
    Buffer.from([1]),
    user.toBuffer(),
    u64(1_700_000_000),
    u64(1),
    u64(2),
    u64(3),
    u64(4),
    Keypair.generate().publicKey.toBuffer(),
    u64(1),
    u64(1),
    Keypair.generate().publicKey.toBuffer(),
    u64(1),
    u64(1),
    Buffer.from([0]),
    u64(0),
    u64(0),
    u64(0),
    u64(0),
    str("buy"),
    Buffer.from([0]),
    u64(0),
    u64(0),
    u64(0),
    u64(0),
    Buffer.alloc(4),
    quote.toBuffer(),
  ]);
  const details = decodeTradeDetails(buf);
  assert.equal(details.quoteKnown, true);
  assert.equal(details.quoteMint, quote.toBase58());
  assert.equal(details.legacySol, false);
});

test("metadata failures retry, then a restart can read the pending job", () => {
  const now = 1_700_000_000_000;
  const job = { mint: "MintCase", uri: "https://ipfs.io/ipfs/abc", attempts: 0 };
  for (const outcome of ["null", "timeout", "error", "no-image"]) {
    const next = settleMetadataJob(job, outcome, now);
    assert.equal(next.attempts, 1);
    assert.equal(next.mint, "MintCase");
    assert.ok(next.nextAt > now);
  }
  assert.equal(settleMetadataJob({ ...job, attempts: 5 }, "error", now), null);
  assert.equal(settleMetadataJob(job, "ready", now), null);
  const file = path.join(os.tmpdir(), `pump-meta-${process.pid}.json`);
  writePumpMetaJobs([{ mint: "MintCase", uri: job.uri, attempts: 2, nextAt: now + 1000 }], file);
  const loaded = readPumpMetaJobs(file);
  assert.equal(loaded.length, 1);
  assert.equal(loaded[0].mint, "MintCase");
  assert.equal(loaded[0].attempts, 2);
  fs.unlinkSync(file);
});
