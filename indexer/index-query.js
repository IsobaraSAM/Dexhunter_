// @ts-nocheck
// Page the in-memory index without treating a missing metric as zero
// and without pretending the first few thousand rows are the whole set.
//
// Ordering is stable: known launch time newest-first, unknown launch time
// after that, identity as the tie-break. A cursor is the last row's key.
// Anything newer than that key stays on the first page, so a launch that
// arrives while someone is paging cannot skip or duplicate the next page.

import { isLaunch, isMomentumEligible, isTrendingEligible, trendingScore } from "./feed-rules.js";
import { chainTokenKey } from "../src/lib/addressCase.js";
import { matchesChainSelection, matchesSourceFilter } from "../src/lib/sourceMatch.js";
import { matchSocialFilters } from "../src/lib/xLinkKind.js";

export class DiscoveryQueryError extends Error {
  constructor(message) {
    super(message);
    this.name = "DiscoveryQueryError";
  }
}

export const AGE_WINDOWS_MS = {
  "1h": 60 * 60 * 1000,
  "6h": 6 * 60 * 60 * 1000,
  "24h": 24 * 60 * 60 * 1000,
  "48h": 48 * 60 * 60 * 1000,
  "1w": 7 * 24 * 60 * 60 * 1000,
  "1m": 30 * 24 * 60 * 60 * 1000,
};

const LAUNCH_CLOCK_SKEW_MS = 120_000;
const MAX_PAGE = 5000;

export function knownMetric(value) {
  if (value == null || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

export function launchMs(token) {
  const raw = Number(token?.pairCreatedAt);
  if (!Number.isFinite(raw) || raw <= 0) return null;
  return raw < 1e11 ? raw * 1000 : raw;
}

export function tokenIdentity(token) {
  return chainTokenKey(token?.chainId, token?.baseToken?.address || token?.pairAddress || "");
}

export function volumeMetric(token) {
  if (!token || token.volumeComplete === false) return null;
  const direct = knownMetric(token.volume?.h24);
  if (direct != null) return direct;
  return knownMetric(token.totalVolume24h);
}

export function liquidityMetric(token) {
  const direct = knownMetric(token?.liquidity?.usd);
  if (direct != null) return direct;
  return knownMetric(token?.totalLiquidityUsd);
}

export function marketCapMetric(token) {
  // Circulating market cap only. FDV is a separate field and must not satisfy this bound.
  return knownMetric(token?.marketCap);
}

function passesBound(value, min, max) {
  if (min == null && max == null) return true;
  if (value == null) return false;
  if (min != null && value < min) return false;
  if (max != null && value > max) return false;
  return true;
}

export function passesAgeWindow(token, age, now) {
  if (age === "all") return true;
  const windowMs = AGE_WINDOWS_MS[age];
  if (windowMs == null) return false;
  const ts = launchMs(token);
  if (ts == null) return false;
  if (ts > now + LAUNCH_CLOCK_SKEW_MS) return false;
  return now - ts <= windowMs;
}

function parseBound(raw, name) {
  if (raw == null) return undefined;
  const text = String(raw).trim();
  if (!text) return undefined;
  const n = Number(text);
  if (!Number.isFinite(n) || n < 0) {
    throw new DiscoveryQueryError(`${name} must be a finite number greater than or equal to 0`);
  }
  return n;
}

function parseSigned(raw, name) {
  if (raw == null) return undefined;
  const text = String(raw).trim();
  if (!text) return undefined;
  const n = Number(text);
  if (!Number.isFinite(n)) {
    throw new DiscoveryQueryError(`${name} must be a finite number`);
  }
  return n;
}

function parseFlag(raw) {
  if (raw == null) return false;
  const text = String(raw).trim().toLowerCase();
  return text === "1" || text === "true" || text === "yes";
}

function parseDex(raw) {
  if (raw == null) return undefined;
  const text = String(raw).trim();
  if (!text || text.toLowerCase() === "all") return undefined;
  return text.slice(0, 600);
}

function parseLimit(raw) {
  if (raw == null || String(raw).trim() === "") return 5000;
  const n = Number(String(raw).trim());
  if (!Number.isFinite(n) || n < 1) {
    throw new DiscoveryQueryError("limit must be a finite integer from 1 to 5000");
  }
  return Math.min(Math.floor(n), MAX_PAGE);
}

export function parseCursor(raw) {
  if (raw == null || String(raw).trim() === "") return null;
  const text = String(raw);
  const bar = text.indexOf("|");
  if (bar < 0 || bar === text.length - 1) {
    throw new DiscoveryQueryError("cursor is not valid");
  }
  const left = text.slice(0, bar);
  const id = text.slice(bar + 1);
  if (!id || id.includes("|")) throw new DiscoveryQueryError("cursor is not valid");
  if (left === "") return { known: false, rank: null, id };
  const rank = Number(left);
  if (!Number.isFinite(rank)) throw new DiscoveryQueryError("cursor is not valid");
  return { known: true, rank, id };
}

function readParam(input, name) {
  if (input && typeof input.get === "function") return input.get(name);
  if (input && Object.prototype.hasOwnProperty.call(input, name)) return input[name];
  return null;
}

export function parseDiscoveryParams(input) {
  const modeParam = readParam(input, "mode") || "trending";
  const mode = modeParam === "latest" || modeParam === "fresh_mints" || modeParam === "trending" || modeParam === "momentum"
    ? modeParam
    : "trending";
  const ageRaw = readParam(input, "age");
  const age = ageRaw == null || String(ageRaw).trim() === "" ? "1w" : String(ageRaw).trim();
  if (age !== "all" && !Object.prototype.hasOwnProperty.call(AGE_WINDOWS_MS, age)) {
    throw new DiscoveryQueryError("age must be one of 1h, 6h, 24h, 48h, 1w, 1m, all");
  }
  const chainRaw = readParam(input, "chain");
  const chain = chainRaw == null || String(chainRaw).trim() === "" ? undefined : String(chainRaw).trim();
  return {
    mode,
    age,
    limit: parseLimit(readParam(input, "limit")),
    cursor: parseCursor(readParam(input, "cursor")),
    chain,
    minLiquidity: parseBound(readParam(input, "minLiquidity"), "minLiquidity"),
    maxLiquidity: parseBound(readParam(input, "maxLiquidity"), "maxLiquidity"),
    minVolume: parseBound(readParam(input, "minVolume"), "minVolume"),
    maxVolume: parseBound(readParam(input, "maxVolume"), "maxVolume"),
    minMarketCap: parseBound(readParam(input, "minMarketCap"), "minMarketCap"),
    maxMarketCap: parseBound(readParam(input, "maxMarketCap"), "maxMarketCap"),
    minPriceChange: parseSigned(readParam(input, "minPriceChange"), "minPriceChange"),
    dex: parseDex(readParam(input, "dex")),
    telegram: parseFlag(readParam(input, "telegram")),
    twitter: parseFlag(readParam(input, "twitter")),
    discord: parseFlag(readParam(input, "discord")),
    website: parseFlag(readParam(input, "website")),
    verified: parseFlag(readParam(input, "verified")),
    xProfile: parseFlag(readParam(input, "xProfile")),
    xPost: parseFlag(readParam(input, "xPost")),
  };
}

function preferToken(a, b) {
  const ta = launchMs(a);
  const tb = launchMs(b);
  if (ta != null && tb == null) return a;
  if (tb != null && ta == null) return b;
  if (ta != null && tb != null && ta !== tb) return ta < tb ? a : b;
  const aVol = volumeMetric(a) != null;
  const bVol = volumeMetric(b) != null;
  if (aVol !== bVol) return aVol ? a : b;
  return a;
}

function dedupe(tokens) {
  const map = new Map();
  for (const token of Array.isArray(tokens) ? tokens : []) {
    const id = tokenIdentity(token);
    if (!id) continue;
    const prev = map.get(id);
    map.set(id, prev ? preferToken(prev, token) : token);
  }
  return map;
}

function timeCursor(token) {
  const ts = launchMs(token);
  return `${ts == null ? "" : ts}|${tokenIdentity(token)}`;
}

function scoreCursor(token) {
  const score = token?.scoreBreakdown?.total ?? 0;
  return `${score}|${tokenIdentity(token)}`;
}

function afterTime(token, cursor) {
  if (!cursor) return true;
  const ts = launchMs(token);
  const id = tokenIdentity(token);
  const known = ts != null;
  if (known !== cursor.known) return known ? false : true;
  if (known && ts !== cursor.rank) return ts < cursor.rank;
  return id > cursor.id;
}

function afterScore(token, cursor) {
  if (!cursor) return true;
  if (!cursor.known) return false;
  const score = token?.scoreBreakdown?.total ?? 0;
  const id = tokenIdentity(token);
  if (score !== cursor.rank) return score < cursor.rank;
  return id > cursor.id;
}

function compareTime(a, b) {
  const ta = launchMs(a);
  const tb = launchMs(b);
  const ka = ta != null;
  const kb = tb != null;
  if (ka !== kb) return ka ? -1 : 1;
  if (ka && ta !== tb) return tb - ta;
  const ia = tokenIdentity(a);
  const ib = tokenIdentity(b);
  return ia < ib ? -1 : ia > ib ? 1 : 0;
}

function compareScore(a, b) {
  const sa = a?.scoreBreakdown?.total ?? 0;
  const sb = b?.scoreBreakdown?.total ?? 0;
  if (sa !== sb) return sb - sa;
  const ia = tokenIdentity(a);
  const ib = tokenIdentity(b);
  return ia < ib ? -1 : ia > ib ? 1 : 0;
}

function eligible(token, mode, now) {
  if (mode === "latest") return token;
  if (mode === "fresh_mints") return isLaunch(token) ? token : null;
  if (mode === "momentum") {
    return isMomentumEligible(token, now) ? { ...token, feedClass: "momentum", scoreBreakdown: trendingScore(token) } : null;
  }
  return isTrendingEligible(token, now) ? { ...token, feedClass: "trending", scoreBreakdown: trendingScore(token) } : null;
}

export function queryIndex(tokens, options = {}) {
  const now = Number.isFinite(options.now) ? options.now : Date.now();
  const age = options.age || "1w";
  if (age !== "all" && !Object.prototype.hasOwnProperty.call(AGE_WINDOWS_MS, age)) {
    throw new DiscoveryQueryError("age must be one of 1h, 6h, 24h, 48h, 1w, 1m, all");
  }
  const mode = options.mode || "latest";
  const limit = Math.min(Math.max(Number(options.limit) || 5000, 1), MAX_PAGE);
  const cursor = typeof options.cursor === "string" || options.cursor instanceof String
    ? parseCursor(options.cursor)
    : options.cursor || null;
  const scored = mode === "trending" || mode === "momentum";
  if (scored && cursor && !cursor.known) {
    throw new DiscoveryQueryError("cursor is not valid");
  }

  const rows = [];
  for (const token of dedupe(tokens).values()) {
    if (!passesAgeWindow(token, age, now)) continue;
    if (options.chain && !matchesChainSelection(token?.chainId, options.chain)) continue;
    if (options.dex && !matchesSourceFilter(token, options.dex)) continue;
    const row = eligible(token, mode, now);
    if (!row) continue;
    if (!passesBound(volumeMetric(row), options.minVolume, options.maxVolume)) continue;
    if (!passesBound(liquidityMetric(row), options.minLiquidity, options.maxLiquidity)) continue;
    if (!passesBound(marketCapMetric(row), options.minMarketCap, options.maxMarketCap)) continue;
    if (options.minPriceChange != null) {
      const move = knownMetric(row?.priceChange?.h24);
      if (move == null || move < options.minPriceChange) continue;
    }
    if (!matchSocialFilters(row, options)) continue;
    rows.push(row);
  }

  rows.sort(scored ? compareScore : compareTime);
  const after = scored ? afterScore : afterTime;
  const encode = scored ? scoreCursor : timeCursor;
  const rest = cursor ? rows.filter((row) => after(row, cursor)) : rows;
  const page = rest.slice(0, limit);
  return {
    tokens: page,
    total: rows.length,
    nextCursor: rest.length > limit ? encode(page[page.length - 1]) : null,
  };
}
