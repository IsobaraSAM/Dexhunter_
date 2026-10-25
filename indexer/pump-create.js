// @ts-nocheck
// Pump.fun create-log reader. Mint-authority notifications are creates only.
// The Anchor CreateEvent arrives as a base64 "Program data:" line, so a launch
// does not need getTransaction unless that line was truncated.

import { PublicKey } from "@solana/web3.js";
import bs58 from "bs58";

export const CREATE_EVENT_DISC = Buffer.from([27, 114, 169, 77, 222, 235, 99, 118]);
export const TRADE_EVENT_DISC = Buffer.from([189, 219, 127, 211, 78, 230, 97, 238]);
export const PUMP_PROGRAM = "6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P";
// Anchor emit_cpi! prefix. Pump writes CreateEvent here, not in "Program data:" logs.
export const EVENT_IX_TAG = Buffer.from("e445a52e51cb9a1d", "hex");
const IX_CREATE = Buffer.from([24, 30, 200, 40, 5, 28, 7, 119]);
const IX_CREATE_V2 = Buffer.from([214, 144, 76, 236, 95, 139, 49, 180]);

class Reader {
  constructor(buf) {
    this.buf = buf;
    this.off = 0;
  }
  remaining() {
    return this.buf.length - this.off;
  }
  string() {
    const len = this.buf.readUInt32LE(this.off);
    this.off += 4;
    if (len > 2048 || this.off + len > this.buf.length) throw new Error("bad string length");
    const s = this.buf.subarray(this.off, this.off + len).toString("utf8");
    this.off += len;
    return s;
  }
  pubkey() {
    if (this.off + 32 > this.buf.length) throw new Error("short buffer");
    const k = new PublicKey(this.buf.subarray(this.off, this.off + 32)).toBase58();
    this.off += 32;
    return k;
  }
  u64() {
    const v = this.buf.readBigUInt64LE(this.off);
    this.off += 8;
    return v;
  }
  bool() {
    return this.buf.readUInt8(this.off++) === 1;
  }
}

export function decodeCreateEvent(buf) {
  if (!Buffer.isBuffer(buf) || buf.length < 8 || !buf.subarray(0, 8).equals(CREATE_EVENT_DISC)) return null;
  const r = new Reader(buf.subarray(8));
  const ev = {
    name: r.string(),
    symbol: r.string(),
    uri: r.string(),
    mint: r.pubkey(),
    bondingCurve: r.pubkey(),
    user: r.pubkey(),
    creator: null,
  };
  if (r.remaining() >= 32) ev.creator = r.pubkey();
  if (r.remaining() >= 8) {
    const seconds = Number(r.u64());
    if (Number.isFinite(seconds) && seconds > 1e9 && seconds < 1e12) ev.timestampMs = Math.round(seconds * 1000);
  }
  if (r.remaining() >= 32) {
    ev.virtualTokenReserves = r.u64().toString();
    ev.virtualSolReserves = r.u64().toString();
    ev.realTokenReserves = r.u64().toString();
    ev.tokenTotalSupply = r.u64().toString();
  }
  if (r.remaining() >= 32 + 1 + 1 + 32) {
    ev.tokenProgram = r.pubkey();
    r.bool();
    r.bool();
    ev.quoteMint = r.pubkey();
  }
  return ev;
}

export function decodeTradeEvent(buf) {
  if (!Buffer.isBuffer(buf) || buf.length < 8 || !buf.subarray(0, 8).equals(TRADE_EVENT_DISC)) return null;
  const r = new Reader(buf.subarray(8));
  return {
    mint: r.pubkey(),
    solAmount: r.u64(),
    tokenAmount: r.u64(),
    isBuy: r.bool(),
    user: r.pubkey(),
  };
}

export function programDataBuffers(logs) {
  const out = [];
  for (const line of logs || []) {
    const m = /^Program data: (\S+)$/.exec(line);
    if (!m) continue;
    try {
      out.push(Buffer.from(m[1], "base64"));
    } catch {
      /* ignore */
    }
  }
  return out;
}

export function launchesFromBuffers(bufs) {
  const events = [];
  for (const b of bufs) {
    try {
      const ev = decodeCreateEvent(b);
      if (ev?.mint) events.push(ev);
    } catch {
      /* a non-create payload is not a launch */
    }
  }
  return events.map((ev) => {
    let devBuy = null;
    let tradeRaw = null;
    for (const b of bufs) {
      try {
        const trade = decodeTradeEvent(b);
        if (trade && trade.isBuy && trade.mint === ev.mint) {
          devBuy = trade;
          tradeRaw = b;
          break;
        }
      } catch {
        /* ignore */
      }
    }
    return { ev, devBuy, tradeRaw };
  });
}

export function extractLaunches(logs) {
  return launchesFromBuffers(programDataBuffers(logs));
}

function keyOf(k) {
  if (!k) return "";
  if (typeof k === "string") return k;
  if (typeof k.toBase58 === "function") return k.toBase58();
  return String(k);
}

function toData(d) {
  if (!d) return Buffer.alloc(0);
  if (Buffer.isBuffer(d)) return d;
  if (d instanceof Uint8Array) return Buffer.from(d);
  if (typeof d === "string") {
    try {
      return Buffer.from(bs58.decode(d));
    } catch {
      try {
        return Buffer.from(d, "base64");
      } catch {
        return Buffer.alloc(0);
      }
    }
  }
  return Buffer.alloc(0);
}

export function decodeCreateInstruction(data, accounts) {
  const buf = toData(data);
  const isV2 = buf.length >= 8 && buf.subarray(0, 8).equals(IX_CREATE_V2);
  if (!isV2 && !(buf.length >= 8 && buf.subarray(0, 8).equals(IX_CREATE))) return null;
  const r = new Reader(buf.subarray(8));
  const name = r.string();
  const symbol = r.string();
  const uri = r.string();
  let creator = null;
  if (r.remaining() >= 32) creator = r.pubkey();
  const mint = accounts?.[0] || null;
  if (!mint) return null;
  return {
    name,
    symbol,
    uri,
    mint,
    bondingCurve: accounts[2] || null,
    user: accounts[isV2 ? 5 : 7] || null,
    creator,
    timestampMs: null,
  };
}

export function parsePumpTransaction(tx) {
  if (!tx?.transaction?.message) return null;
  const msg = tx.transaction.message;
  const meta = tx.meta || {};
  let keys = [];
  if (typeof msg.getAccountKeys === "function") {
    const resolved = msg.getAccountKeys({ accountKeysFromLookups: meta.loadedAddresses });
    keys = resolved.keySegments().flat().map(keyOf);
  } else {
    keys = (msg.accountKeys || msg.staticAccountKeys || []).map(keyOf);
    for (const k of [...(meta.loadedAddresses?.writable || []), ...(meta.loadedAddresses?.readonly || [])]) {
      keys.push(keyOf(k));
    }
  }
  const instructions = [];
  const top = msg.compiledInstructions || msg.instructions || [];
  top.forEach((ix, index) => {
    const programId = ix.programIdIndex != null ? keys[ix.programIdIndex] : keyOf(ix.programId);
    const accountIndexes = ix.accountKeyIndexes || ix.accounts || [];
    instructions.push({
      programId,
      accounts: accountIndexes.map((i) => (typeof i === "number" ? keys[i] : keyOf(i))),
      data: toData(ix.data),
      inner: false,
      index,
    });
  });
  for (const group of meta.innerInstructions || []) {
    for (const ix of group.instructions || []) {
      const programId = ix.programIdIndex != null ? keys[ix.programIdIndex] : keyOf(ix.programId);
      instructions.push({
        programId,
        accounts: (ix.accounts || []).map((i) => (typeof i === "number" ? keys[i] : keyOf(i))),
        data: toData(ix.data),
        inner: true,
        index: group.index,
      });
    }
  }
  return { blockTime: tx.blockTime ?? null, logs: meta.logMessages || [], instructions };
}

export function eventBuffersFromParsed(parsed, programId = PUMP_PROGRAM) {
  const out = [];
  for (const ix of parsed?.instructions || []) {
    if (ix.inner && ix.programId === programId && ix.data.length > 16 && ix.data.subarray(0, 8).equals(EVENT_IX_TAG)) {
      out.push(ix.data.subarray(8));
    }
  }
  out.push(...programDataBuffers(parsed?.logs));
  return out;
}

export function extractLaunchesFromTransaction(tx) {
  const parsed = parsePumpTransaction(tx);
  if (!parsed) return { launches: [], sawCreate: false, parsed: false, blockTime: null };
  const launches = launchesFromBuffers(eventBuffersFromParsed(parsed));
  if (!launches.length) {
    for (const ix of parsed.instructions) {
      if (ix.programId !== PUMP_PROGRAM) continue;
      try {
        const ev = decodeCreateInstruction(ix.data, ix.accounts);
        if (!ev?.mint) continue;
        launches.push({ ev, devBuy: null, tradeRaw: null });
        break;
      } catch {
        /* a create instruction we cannot read still counts as a create below */
      }
    }
  }
  const sawCreate = launches.length > 0 || parsed.logs.some((line) => /Instruction: Create/.test(line));
  return { launches, sawCreate, parsed: true, blockTime: parsed.blockTime };
}

export function extractLaunch(logs) {
  return extractLaunches(logs)[0] || null;
}

export function logsNeedTransaction(logs) {
  const lines = logs || [];
  if (!lines.length) return true;
  if (lines.some((line) => /log_truncated/i.test(line))) return true;
  if (lines.some((line) => /Instruction: Create/.test(line)) && !extractLaunch(lines)) return true;
  return !lines.some((line) => line.startsWith("Program data:"));
}

// Chain time only. An observation clock is not a launch time.
export function createTimestamp(tradedAt) {
  const n = Number(tradedAt);
  if (Number.isFinite(n) && n > 1e12 && n < 1e14) return Math.round(n);
  if (Number.isFinite(n) && n > 1e9 && n < 1e12) return Math.round(n * 1000);
  return null;
}

// Newest-first signature page. `before` is exclusive, so a retry must stay on
// the page: the next read starts at the signature just newer than the hole.
export function nextSignatureCursor(rows, outcome) {
  const list = Array.isArray(rows) ? rows : [];
  let firstRetry = -1;
  for (let i = 0; i < list.length; i++) {
    if (outcome(list[i], i) === "retry") {
      firstRetry = i;
      break;
    }
  }
  if (!list.length || firstRetry === 0) return { before: "", headComplete: false };
  if (firstRetry > 0) return { before: list[firstRetry - 1].signature, headComplete: true };
  return { before: list[list.length - 1].signature, headComplete: true };
}

export const WRAPPED_SOL_MINT = "So11111111111111111111111111111111111111112";
export const NATIVE_SOL_SENTINEL = "11111111111111111111111111111111";

export function describeQuote(raw, legacySol = false) {
  if (!raw) {
    if (legacySol) return { mint: WRAPPED_SOL_MINT, raw: null, native: true, decimals: 9, symbol: "SOL" };
    return { mint: null, raw: null, native: false, decimals: null, symbol: null };
  }
  if (raw === NATIVE_SOL_SENTINEL || raw === WRAPPED_SOL_MINT) {
    return { mint: WRAPPED_SOL_MINT, raw, native: true, decimals: 9, symbol: "SOL" };
  }
  return { mint: raw, raw, native: false, decimals: null, symbol: null };
}

function readU64At(buf, off) {
  return buf.readBigUInt64LE(off);
}

export function decodeTradeDetails(buf) {
  const prefix = 32 + 8 + 8 + 1 + 32 + 8 + 8 + 8 + 8 + 8;
  if (!Buffer.isBuffer(buf) || buf.length < 8 + prefix || !buf.subarray(0, 8).equals(TRADE_EVENT_DISC)) return null;
  const r = new Reader(buf.subarray(8));
  const out = {
    mint: r.pubkey(),
    quoteAmount: r.u64(),
    tokenAmount: r.u64(),
    isBuy: r.bool(),
    user: r.pubkey(),
    timestamp: Number(r.u64()),
    virtualQuote: r.u64(),
    virtualToken: r.u64(),
    realQuote: r.u64(),
    realToken: r.u64(),
    quoteMint: null,
    quoteKnown: false,
    legacySol: true,
  };
  if (r.remaining() === 0) return out;
  out.legacySol = false;
  try {
    const fixed = 32 + 8 + 8 + 32 + 8 + 8 + 1 + 8 + 8 + 8 + 8;
    if (r.remaining() < fixed) return out;
    r.pubkey();
    r.u64();
    r.u64();
    r.pubkey();
    r.u64();
    r.u64();
    r.bool();
    r.u64();
    r.u64();
    r.u64();
    r.u64();
    if (r.remaining() < 4) return out;
    const nameLen = r.buf.readUInt32LE(r.off);
    if (nameLen > 64 || r.remaining() < 4 + nameLen) return out;
    r.off += 4 + nameLen;
    if (r.remaining() < 1 + 8 + 8 + 8 + 8 + 4) return out;
    r.bool();
    r.u64();
    r.u64();
    r.u64();
    r.u64();
    const count = r.buf.readUInt32LE(r.off);
    r.off += 4;
    if (count > 64 || r.remaining() < count * 34 + 32) return out;
    r.off += count * 34;
    out.quoteMint = r.pubkey();
    out.quoteKnown = true;
    if (r.remaining() >= 8) out.explicitQuoteAmount = readU64At(r.buf, r.off);
    return out;
  } catch {
    return out;
  }
}

export function quotePerBaseScaled(quoteRaw, baseRaw, quoteDecimals, baseDecimals) {
  if (typeof quoteRaw !== "bigint" || typeof baseRaw !== "bigint") return null;
  if (!Number.isInteger(quoteDecimals) || !Number.isInteger(baseDecimals)) return null;
  if (baseRaw <= 0n || quoteRaw < 0n) return null;
  const prec = 12n;
  let num = quoteRaw;
  let den = baseRaw;
  const shift = BigInt(baseDecimals) - BigInt(quoteDecimals);
  if (shift >= 0n) num *= 10n ** (shift + prec);
  else {
    den *= 10n ** -shift;
    num *= 10n ** prec;
  }
  return num / den;
}

export function scaledToString(scaled, prec = 12) {
  if (typeof scaled !== "bigint" || scaled < 0n) return null;
  const base = 10n ** BigInt(prec);
  const whole = scaled / base;
  const frac = (scaled % base).toString().padStart(prec, "0").replace(/0+$/, "");
  return frac ? `${whole}.${frac}` : `${whole}`;
}

export function valueReserves({ quoteRaw, baseRaw, supplyRaw, quoteMint, legacySol, baseDecimals, solUsd }) {
  const quote = describeQuote(quoteMint, legacySol);
  const price = quote.decimals == null ? null : quotePerBaseScaled(quoteRaw, baseRaw, quote.decimals, baseDecimals);
  let spotUsd = null;
  let fdvUsd = null;
  if (price != null && quote.native && Number.isFinite(solUsd) && solUsd > 0) {
    const rate = BigInt(Math.round(solUsd * 1e6));
    const usdScaled = price * rate / 1_000_000n;
    const usd = Number(usdScaled) / 1e12;
    if (Number.isFinite(usd)) spotUsd = usd;
    if (typeof supplyRaw === "bigint" && supplyRaw > 0n && Number.isInteger(baseDecimals)) {
      const supplyScaled = quotePerBaseScaled(supplyRaw, 1n, baseDecimals, 0);
      if (supplyScaled != null) {
        const fdvScaled = supplyScaled * usdScaled / 10n ** 12n;
        const fdv = Number(fdvScaled) / 1e12;
        if (Number.isFinite(fdv)) fdvUsd = fdv;
      }
    }
  }
  return {
    quote,
    spotQuote: price == null ? null : scaledToString(price),
    spotUsd,
    fdvUsd,
  };
}

export const PUMP_BASE_DECIMALS = 6;
export const PUMP_SUPPLY_RAW = 1_000_000_000n * 1_000_000n;

function asReserve(value) {
  if (typeof value === "bigint") return value >= 0n ? value : null;
  if (typeof value === "number" && Number.isSafeInteger(value) && value >= 0) return BigInt(value);
  if (typeof value === "string" && /^\d+$/.test(value)) return BigInt(value);
  return null;
}

/** Pump.fun mints are 6 decimals and 1e9 supply. Fill those only for native SOL quotes. */
export function withPumpDefaults(args) {
  const quote = describeQuote(args?.quoteMint, args?.legacySol);
  if (!quote.native) return valueReserves(args);
  return valueReserves({
    ...args,
    baseDecimals: Number.isInteger(args?.baseDecimals) ? args.baseDecimals : PUMP_BASE_DECIMALS,
    supplyRaw: typeof args?.supplyRaw === "bigint" && args.supplyRaw > 0n ? args.supplyRaw : PUMP_SUPPLY_RAW,
  });
}

export function pumpCurveQuote(token, solUsd) {
  if (!token) return null;
  const quoteRaw = asReserve(token.virtualQuoteReserves) ?? asReserve(token.virtualSolReserves);
  const baseRaw = asReserve(token.virtualTokenReserves);
  if (quoteRaw == null || baseRaw == null) return null;
  const native = token.quoteNative !== false;
  return withPumpDefaults({
    quoteRaw,
    baseRaw,
    supplyRaw: asReserve(token.tokenTotalSupply),
    quoteMint: native ? null : token.quoteMint || null,
    legacySol: native,
    baseDecimals: Number.isInteger(token.baseDecimals) ? token.baseDecimals : null,
    solUsd: Number(solUsd),
  });
}

export function foldTradeVolume(rows, trade) {
  const next = Array.isArray(rows) ? rows.slice() : [];
  const when = createTimestamp(trade?.tradedAt);
  let partial = trade?.partial || null;
  if (when == null) partial = "time";
  else if (!trade?.quoteNative) partial = partial || "quote";
  else if (Number.isFinite(trade.quoteSol)) next.push({ ts: when, sol: trade.quoteSol });
  const now = Number(trade?.now) || 0;
  const cutoff = now - 864e5;
  const kept = next.filter((row) => row.ts >= cutoff);
  const valued = !partial && Number.isFinite(trade?.solUsd) && trade.solUsd > 0;
  const observed = valued ? Math.round(kept.reduce((sum, row) => sum + row.sol, 0) * trade.solUsd * 100) / 100 : null;
  const oldest = kept[0]?.ts;
  const covered = !partial && oldest != null && now - oldest >= 864e5;
  return {
    rows: kept,
    partial,
    volumeObservedUsd: observed,
    volumeComplete: Boolean(covered),
  };
}

export function settleMetadataJob(job, outcome, now = Date.now()) {
  if (outcome === "ready") return null;
  const attempts = (job?.attempts || 0) + 1;
  if (attempts > 5) return null;
  const wait = Math.min(60_000, 2_000 * 2 ** (attempts - 1));
  return {
    mint: job.mint,
    uri: job.uri,
    attempts,
    nextAt: now + wait,
    lastOutcome: outcome,
  };
}
