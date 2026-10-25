// @ts-nocheck
// Live market lookup. The index is a cache, not the search. A mint that only
// exists on a launchpad (Raydium LaunchLab, for example) never appears in
// DexScreener, so address and text search ask the venue APIs directly.

import { matchesUserQuery } from "../src/lib/addressQuery.js";

const LAUNCHPAD = "https://launch-mint-v1.raydium.io";

async function fetchJson(url, timeoutMs = 6000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      headers: { Accept: "application/json", "User-Agent": "DexHunter/1.0" },
      signal: controller.signal,
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

export function tokenFromRaydiumLaunch(row) {
  const mint = String(row?.mint || "").trim();
  if (!mint) return null;
  const supply = Number(row.supply);
  const marketCap = Number(row.marketCap);
  const price = Number.isFinite(supply) && supply > 0 && Number.isFinite(marketCap) && marketCap > 0
    ? marketCap / supply
    : undefined;
  const progress = Number(row.finishingRate);
  const graduated = Number.isFinite(progress) && progress >= 1;
  const vol = Number(row.volumeU);
  const created = Number(row.createAt);
  return {
    chainId: "solana",
    dexId: "raydium",
    primaryDex: "Raydium",
    launchPlatform: "Raydium LaunchLab",
    primaryProvider: "Raydium LaunchLab",
    pairAddress: row.poolId || mint,
    pairCreatedAt: Number.isFinite(created) && created > 0 ? created : undefined,
    baseToken: {
      address: mint,
      name: row.name || undefined,
      symbol: row.symbol || undefined,
    },
    quoteToken: {
      address: row.mintB?.address || "So11111111111111111111111111111111111111112",
      name: row.mintB?.name || "Wrapped SOL",
      symbol: row.mintB?.symbol || "SOL",
    },
    priceUsd: price != null ? String(price) : undefined,
    marketCap: Number.isFinite(marketCap) && marketCap > 0 ? marketCap : undefined,
    fdv: Number.isFinite(marketCap) && marketCap > 0 ? marketCap : undefined,
    volume: Number.isFinite(vol) ? { h24: vol } : undefined,
    totalVolume24h: Number.isFinite(vol) ? vol : undefined,
    volumeComplete: Number.isFinite(vol),
    info: {
      imageUrl: row.imgUrl || undefined,
      description: row.description || undefined,
    },
    website: row.website || undefined,
    twitter: row.twitter || undefined,
    url: `https://raydium.io/launchpad/token/?mint=${mint}`,
    primaryDexTradingUrl: `https://raydium.io/launchpad/token/?mint=${mint}`,
    isBondingCurve: !graduated,
    isGraduated: graduated,
    bondingProgress: Number.isFinite(progress) ? Math.round(progress * 1000) / 10 : undefined,
    marketStage: graduated ? "graduated" : "bonding_curve",
    sources: ["Raydium LaunchLab"],
    dexes: ["Raydium"],
  };
}

function tokenFromDexPair(pair) {
  if (!pair?.baseToken?.address || !pair.chainId) return null;
  const dexId = String(pair.dexId || "").toLowerCase();
  return {
    ...pair,
    dexId: dexId || pair.dexId,
    primaryDex: pair.primaryDex || pair.dexId || "DEX",
    primaryProvider: pair.primaryProvider || "DexScreener",
    sources: Array.isArray(pair.sources) && pair.sources.length ? pair.sources : (dexId ? [dexId] : ["DexScreener"]),
    dexes: Array.isArray(pair.dexes) && pair.dexes.length ? pair.dexes : (dexId ? [dexId] : []),
  };
}

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Name or symbol only. A mint can contain the letters by accident, and so can "telegram". */
export function matchesTextQuery(token, query) {
  const q = String(query || "").trim().toLowerCase();
  if (!q) return false;
  const symbol = String(token?.baseToken?.symbol || "").trim();
  if (symbol && symbol.length <= 24) {
    const sl = symbol.toLowerCase();
    const extra = sl.length - q.length;
    if (sl === q || sl.startsWith(q) || (extra > 0 && extra <= 4 && sl.endsWith(q))) return true;
  }
  const name = String(token?.baseToken?.name || "").trim();
  if (!name || name.length > 80) return false;
  return new RegExp(`(?:^|[^a-z0-9])${escapeRegExp(q)}`, "i").test(name);
}

function isSolMint(value) {
  return value.length >= 32 && value.length <= 44 && !value.startsWith("0x") && !/\s/.test(value);
}

function isEvmAddress(value) {
  return /^0x[a-fA-F0-9]{40}$/.test(value);
}

async function raydiumRows(query) {
  const url = isSolMint(query)
    ? `${LAUNCHPAD}/get/by/mints?ids=${encodeURIComponent(query)}`
    : `${LAUNCHPAD}/get/search?text=${encodeURIComponent(query)}`;
  const json = await fetchJson(url);
  const rows = json?.data?.rows;
  if (!json?.success || !Array.isArray(rows)) return [];
  return rows.map(tokenFromRaydiumLaunch).filter(Boolean);
}

async function dexScreenerPairs(query) {
  const url = isSolMint(query) || isEvmAddress(query)
    ? `https://api.dexscreener.com/latest/dex/tokens/${encodeURIComponent(query)}`
    : `https://api.dexscreener.com/latest/dex/search?q=${encodeURIComponent(query)}`;
  const json = await fetchJson(url);
  const pairs = json?.pairs;
  if (!Array.isArray(pairs)) return [];
  return pairs.slice(0, 30).map(tokenFromDexPair).filter(Boolean);
}

export async function searchMarkets(query) {
  const q = String(query || "").trim();
  if (!q || q.length > 120) return [];
  const settled = await Promise.allSettled([raydiumRows(q), dexScreenerPairs(q)]);
  const out = [];
  const seen = new Set();
  for (const result of settled) {
    if (result.status !== "fulfilled") continue;
    for (const token of result.value) {
      if (!matchesUserQuery(token, q)) continue;
      const addr = token?.baseToken?.address;
      if (!addr) continue;
      const key = `${String(token.chainId || "").toLowerCase()}:${addr}`;
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(token);
    }
  }
  return out.slice(0, 40);
}
