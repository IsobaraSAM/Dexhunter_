// @ts-nocheck
// Pons V2 market metrics. Pure: no RPC and no price fetch.
// USD is set only when the caller passed a trustworthy quote conversion.
// Unknown fields are omitted. They are never coerced to 0.

import { ethers } from "ethers";

const DAY_MS = 24 * 60 * 60 * 1000;
const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";
const PRICE_SCALE = 12n;

const curveTradeInterface = new ethers.Interface([
  "event CurveBuy(address indexed buyer, address indexed recipient, uint256 quoteIn, uint256 tokensOut, uint256 fee, uint256 tax)",
  "event CurveSell(address indexed seller, address indexed recipient, uint256 tokensIn, uint256 quoteOut, uint256 fee, uint256 tax)",
]);

export const CURVE_BUY_TOPIC = ethers.id("CurveBuy(address,address,uint256,uint256,uint256,uint256)");
export const CURVE_SELL_TOPIC = ethers.id("CurveSell(address,address,uint256,uint256,uint256,uint256)");

const PHASE_STATE = {
  0: { marketStage: "bonding_curve", isBondingCurve: true, isGraduated: false },
  1: { marketStage: "sweeping", isBondingCurve: false, isGraduated: false },
  2: { marketStage: "graduated", isBondingCurve: false, isGraduated: true },
  3: { marketStage: "rescued", isBondingCurve: false, isGraduated: false },
};

function finiteNumber(value) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function positiveNumber(value) {
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    return typeof parsed === "number" && Number.isFinite(parsed) && parsed > 0 ? parsed : null;
  }
  return typeof value === "number" && Number.isFinite(value) && value > 0 ? value : null;
}

function knownDecimals(value) {
  let n = value;
  if (typeof n === "bigint") {
    if (n < 0n || n > 255n) return null;
    n = Number(n);
  } else if (typeof n === "string" && /^\d+$/.test(n.trim())) {
    n = Number(n.trim());
  }
  if (typeof n !== "number" || !Number.isInteger(n) || n < 0 || n > 255) return null;
  return n;
}

function parseRaw(value) {
  if (typeof value === "bigint") return value >= 0n ? value : null;
  if (typeof value === "number") {
    if (!Number.isSafeInteger(value) || value < 0) return null;
    return BigInt(value);
  }
  if (typeof value === "string") {
    const s = value.trim();
    if (/^\d+$/.test(s)) return BigInt(s);
    if (/^0x[0-9a-fA-F]+$/.test(s)) return BigInt(s);
  }
  return null;
}

function rawToWhole(raw, decimals) {
  if (raw == null || decimals == null) return null;
  if (raw === 0n) return 0;
  const dec = BigInt(decimals);
  const base = 10n ** dec;
  const whole = raw / base;
  const frac = raw % base;
  const fracDigits = dec > PRICE_SCALE ? frac / (10n ** (dec - PRICE_SCALE)) : frac * (10n ** (PRICE_SCALE - dec));
  const num = Number(whole) + Number(fracDigits) / 1e12;
  return Number.isFinite(num) ? num : null;
}

function normalizeAddress(value) {
  if (typeof value !== "string") return "";
  const s = value.trim().toLowerCase();
  return /^0x[0-9a-f]{40}$/.test(s) ? s : "";
}

function normalizePhase(phase) {
  if (phase === 0 || phase === 1 || phase === 2 || phase === 3) return phase;
  if (phase === "0" || phase === "1" || phase === "2" || phase === "3") return Number(phase);
  return null;
}

function knownSymbol(value) {
  if (typeof value !== "string") return null;
  const s = value.trim();
  return s ? s.slice(0, 32) : null;
}

function isNativeQuote(input) {
  if (input.quoteIsNative === true) return true;
  if (input.quoteIsNative === false) return false;
  return normalizeAddress(input.quoteAddress) === ZERO_ADDRESS;
}

function resolveQuoteDecimals(native, quoteDecimals) {
  const known = knownDecimals(quoteDecimals);
  if (native) {
    if (known == null) return 18;
    return known === 18 ? 18 : null;
  }
  return known;
}

function quoteUsdRate({ native, decimals, ethUsd, stableUsd }) {
  if (native) {
    return typeof ethUsd === "number" && Number.isFinite(ethUsd) && ethUsd > 0 ? ethUsd : null;
  }
  // Stable peg is not inferred from the symbol. The caller must pass exactly 1.
  if (stableUsd === 1 && decimals != null) return 1;
  return null;
}

function normalizeLogIndex(value) {
  if (typeof value === "number" && Number.isInteger(value) && value >= 0) return value;
  if (typeof value === "bigint" && value >= 0n && value <= BigInt(Number.MAX_SAFE_INTEGER)) return Number(value);
  if (typeof value === "string") {
    const s = value.trim();
    if (/^\d+$/.test(s)) {
      const n = Number(s);
      return Number.isSafeInteger(n) ? n : null;
    }
    if (/^0x[0-9a-fA-F]+$/.test(s)) {
      const n = Number(BigInt(s));
      return Number.isSafeInteger(n) ? n : null;
    }
  }
  return null;
}

function normalizeTxHash(value) {
  if (typeof value !== "string") return "";
  const s = value.trim().toLowerCase();
  return s && s !== "0x" ? s : "";
}

function asBig(value) {
  return typeof value === "bigint" && value >= 0n ? value : null;
}

function bookHas(book, id) {
  if (book.seen && typeof book.seen.has === "function" && book.seen.has(id)) return true;
  return Array.isArray(book.trades) && book.trades.some((trade) => trade && trade.id === id);
}

function usdPriceString(value) {
  if (typeof value === "string") {
    const trimmed = value.trim();
    const n = Number(trimmed);
    return trimmed && Number.isFinite(n) && n > 0 ? trimmed : null;
  }
  if (typeof value === "number" && Number.isFinite(value) && value > 0) return String(value);
  return null;
}

function hasUsdMetric(patch) {
  return patch.priceUsd != null
    || patch.marketCap != null
    || patch.fdv != null
    || patch.volume?.h24 != null
    || patch.totalVolume24h != null
    || patch.volumeObservedUsd != null
    || patch.liquidity?.usd != null
    || patch.totalLiquidityUsd != null;
}

export function decodeCurveTrade(log) {
  if (!log || !Array.isArray(log.topics) || log.topics.length < 3) return null;
  const topic = String(log.topics[0] || "").toLowerCase();
  const side = topic === CURVE_BUY_TOPIC ? "buy" : topic === CURVE_SELL_TOPIC ? "sell" : "";
  if (!side) return null;
  if (typeof log.data !== "string" || !/^0x[0-9a-fA-F]*$/.test(log.data)) return null;
  let parsed;
  try {
    parsed = curveTradeInterface.parseLog({ topics: log.topics, data: log.data });
  } catch {
    return null;
  }
  if (!parsed) return null;
  const fee = asBig(parsed.args.fee);
  const tax = asBig(parsed.args.tax);
  if (fee == null || tax == null) return null;
  if (parsed.name === "CurveBuy") {
    const quoteIn = asBig(parsed.args.quoteIn);
    const tokensOut = asBig(parsed.args.tokensOut);
    if (quoteIn == null || tokensOut == null) return null;
    return {
      side: "buy",
      trader: parsed.args.buyer,
      recipient: parsed.args.recipient,
      quoteIn,
      tokensOut,
      tokensIn: null,
      quoteOut: null,
      fee,
      tax,
      // Executed quote in. A clamped buy's requested size is not in the log.
      quoteAmount: quoteIn,
    };
  }
  if (parsed.name === "CurveSell") {
    const tokensIn = asBig(parsed.args.tokensIn);
    const quoteOut = asBig(parsed.args.quoteOut);
    if (tokensIn == null || quoteOut == null) return null;
    return {
      side: "sell",
      trader: parsed.args.seller,
      recipient: parsed.args.recipient,
      quoteIn: null,
      tokensOut: null,
      tokensIn,
      quoteOut,
      fee,
      tax,
      quoteAmount: quoteOut,
    };
  }
  return null;
}

export function createTradeBook() {
  return { trades: [], seen: new Set() };
}

export function noteCurveTrade(book, log, meta = {}) {
  if (!book || typeof book !== "object") return { added: false };
  const decoded = decodeCurveTrade(log);
  if (!decoded) return { added: false };
  const txHash = normalizeTxHash(meta.txHash || log.transactionHash);
  const logIndex = normalizeLogIndex(meta.logIndex ?? log.logIndex ?? log.index);
  if (!txHash || logIndex == null) return { added: false };
  if (!Array.isArray(book.trades)) book.trades = [];
  if (!book.seen || typeof book.seen.add !== "function") book.seen = new Set();
  const id = `4663:${txHash}:${logIndex}`;
  if (bookHas(book, id)) {
    book.seen.add(id);
    return { added: false };
  }
  const curve = normalizeAddress(meta.curve || log.address);
  const timestamp = finiteNumber(meta.blockTimestampMs);
  book.seen.add(id);
  book.trades.push({
    id,
    curve,
    blockNumber: normalizeLogIndex(meta.blockNumber),
    txHash,
    logIndex,
    blockTimestampMs: timestamp,
    side: decoded.side,
    quoteAmount: decoded.quoteAmount.toString(),
  });
  return { added: true };
}

export function quotePerTokenFromReserves({ quoteReserve, tokenReserve, tokenDecimals, quoteDecimals } = {}) {
  // quoteReserve is reserve0 from getReserves(), which includes phantom quote.
  const qDec = knownDecimals(quoteDecimals);
  const tDec = knownDecimals(tokenDecimals);
  if (qDec == null || tDec == null) return null;
  const quote = parseRaw(quoteReserve);
  const token = parseRaw(tokenReserve);
  if (quote == null || token == null || quote === 0n || token === 0n) return null;
  const quoteWhole = rawToWhole(quote, qDec);
  const tokenWhole = rawToWhole(token, tDec);
  if (!(quoteWhole > 0) || !(tokenWhole > 0)) return null;
  const price = quoteWhole / tokenWhole;
  return price > 0 && Number.isFinite(price) ? price : null;
}

export function progressFromReserves({ realQuoteReserve, graduationThreshold } = {}) {
  const real = parseRaw(realQuoteReserve);
  const threshold = parseRaw(graduationThreshold);
  if (real == null || threshold == null || threshold === 0n) return null;
  if (real >= threshold) return 100;
  return Number((real * 10000n) / threshold) / 100;
}

function sumWindowQuote(book, curve, nowMs, windowMs) {
  const trades = Array.isArray(book?.trades) ? book.trades : null;
  if (!curve || !trades) return null;
  const start = nowMs - windowMs;
  let raw = 0n;
  for (const trade of trades) {
    if (!trade || normalizeAddress(trade.curve) !== curve) continue;
    const ts = finiteNumber(trade.blockTimestampMs);
    if (ts == null || ts < start || ts > nowMs) continue;
    const amount = parseRaw(trade.quoteAmount);
    if (amount == null) continue;
    raw += amount;
  }
  return raw;
}

export function metricsFromState(input = {}) {
  const patch = {};
  const phase = normalizePhase(input.phase);
  const nowMs = finiteNumber(input.nowMs) ?? Date.now();
  const windowMs = positiveNumber(input.windowMs) ?? DAY_MS;
  const native = isNativeQuote(input);
  const decimals = resolveQuoteDecimals(native, input.quoteDecimals);
  const rate = quoteUsdRate({
    native,
    decimals,
    ethUsd: input.ethUsd,
    stableUsd: input.stableUsd,
  });
  const curveLive = phase == null || phase === 0 || phase === 1;

  if (phase != null) {
    const stage = PHASE_STATE[phase];
    patch.marketStage = stage.marketStage;
    patch.isBondingCurve = stage.isBondingCurve;
    patch.isGraduated = stage.isGraduated;
    if (phase === 0) {
      const progress = progressFromReserves({
        realQuoteReserve: input.realQuoteReserve,
        graduationThreshold: input.graduationThreshold,
      });
      if (progress != null) patch.bondingProgress = progress;
    } else if (phase === 1 || phase === 2) {
      // Swept or pooled. Reserve math after a drain would read as 0%.
      patch.bondingProgress = 100;
    }
  }

  const quotePerToken = positiveNumber(input.quotePerToken);
  if (curveLive && quotePerToken != null && rate != null) {
    const px = quotePerToken * rate;
    if (Number.isFinite(px) && px > 0) patch.priceUsd = String(px);
  }
  if (curveLive && quotePerToken != null) patch.priceQuote = quotePerToken;

  // Phase 2 trades on the v4 pool. A curve spot must not be shown as that price.
  if (phase === 2 || phase === 3) {
    delete patch.priceUsd;
    delete patch.priceQuote;
    if (phase === 2) {
      const pool = usdPriceString(input.poolPriceUsd);
      if (pool) patch.priceUsd = pool;
    }
  }

  if (patch.priceUsd) {
    const px = Number(patch.priceUsd);
    const supply = positiveNumber(input.totalSupplyWhole);
    if (Number.isFinite(px) && px > 0 && supply != null) {
      const mc = px * supply;
      if (Number.isFinite(mc) && mc > 0) {
        patch.marketCap = mc;
        patch.fdv = mc;
        patch.marketCapBasis = "total_supply";
        patch.marketCapMethod = "spot_x_total_supply";
      }
    }
  }

  // Liquidity is the real quote on the curve, never the phantom side of getReserves.
  // Phase 2/3 moved (or abandoned) that quote; a curve reading is not pool liquidity.
  if (phase !== 2 && phase !== 3 && rate != null && decimals != null) {
    const real = parseRaw(input.realQuoteReserve);
    if (real != null) {
      const whole = rawToWhole(real, decimals);
      if (whole != null && whole >= 0) {
        const usd = whole * rate;
        if (Number.isFinite(usd) && usd >= 0) {
          patch.liquidity = { usd };
          patch.totalLiquidityUsd = usd;
        }
      }
    }
  }

  const curve = normalizeAddress(input.curve);
  const rawQuote = sumWindowQuote(input.book, curve, nowMs, windowMs);
  const wholeQuote = rawQuote != null && decimals != null ? rawToWhole(rawQuote, decimals) : null;
  const symbol = knownSymbol(input.quoteSymbol);
  if (input.windowComplete === true && rate != null && wholeQuote != null) {
    const usd = wholeQuote * rate;
    if (Number.isFinite(usd) && usd >= 0) {
      patch.volumeComplete = true;
      patch.volume = { h24: usd };
      patch.totalVolume24h = usd;
    } else {
      patch.volumeComplete = false;
    }
  } else if (wholeQuote != null && rate == null) {
    patch.volumeComplete = false;
    patch.volumeQuote = wholeQuote;
    if (symbol) patch.volumeQuoteSymbol = symbol;
  } else if (input.windowComplete !== true && rate != null && wholeQuote != null) {
    const usd = wholeQuote * rate;
    patch.volumeComplete = false;
    if (Number.isFinite(usd) && usd >= 0) patch.volumeObservedUsd = usd;
  } else {
    patch.volumeComplete = false;
  }

  if (hasUsdMetric(patch)) patch.marketUpdatedAt = nowMs;
  return patch;
}

export function applyMarketPatch(record, patch) {
  const target = record && typeof record === "object" ? record : {};
  if (!patch || typeof patch !== "object") return target;
  for (const [key, value] of Object.entries(patch)) {
    if (value == null) continue;
    if (typeof value === "number" && !Number.isFinite(value)) continue;
    if (key === "priceUsd") {
      if (typeof value !== "string" || !(Number(value) > 0)) continue;
      target.priceUsd = value;
      continue;
    }
    if (key === "volume") {
      if (value && typeof value.h24 === "number" && Number.isFinite(value.h24) && value.h24 >= 0) {
        target.volume = { ...(target.volume || {}), ...value };
      }
      continue;
    }
    if (key === "liquidity") {
      if (value && typeof value.usd === "number" && Number.isFinite(value.usd) && value.usd >= 0) {
        target.liquidity = { ...(target.liquidity || {}), usd: value.usd };
      }
      continue;
    }
    target[key] = value;
  }
  return target;
}
