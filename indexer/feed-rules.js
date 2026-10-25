// @ts-nocheck
// Feed rules for Latest, Trending, and Gaining Momentum.
//
// $500,000 / 24h was evaluated against live Pump and Argus launches.
// Those rows are usually under $50,000 of volume, so that floor empties
// Trending. The default is $5,000 and can be raised with
// DEXHUNTER_TRENDING_MIN_VOLUME. Missing volume or liquidity does not pass.

const num = (name, fallback) => {
  const raw = Number(process.env[name]);
  return Number.isFinite(raw) && raw >= 0 ? raw : fallback;
};

export const FEED_RULES = {
  // USD traded over the rolling 24h window the launchpad reader already stores.
  trendingMinVolume24h: num("DEXHUNTER_TRENDING_MIN_VOLUME", 5_000),
  // USD on the curve or in the pool. Unknown liquidity does not qualify.
  trendingMinLiquidity: num("DEXHUNTER_TRENDING_MIN_LIQUIDITY", 500),
  // A reading older than this cannot qualify for Trending or Momentum.
  marketDataMaxAgeMs: num("DEXHUNTER_MARKET_MAX_AGE_MS", 6 * 60 * 60 * 1000),
  // Below Trending, but real activity. Not "just detected".
  momentumMinVolume24h: num("DEXHUNTER_MOMENTUM_MIN_VOLUME", 250),
  momentumMinLiquidity: num("DEXHUNTER_MOMENTUM_MIN_LIQUIDITY", 100),
};

export function knownNumber(value) {
  return typeof value === "number" && Number.isFinite(value);
}

export function volume24h(token) {
  if (token?.volumeComplete === false) return null;
  const value = token?.volume?.h24 ?? token?.totalVolume24h;
  return knownNumber(value) ? value : null;
}

export function liquidityUsd(token) {
  const value = token?.liquidity?.usd ?? token?.totalLiquidityUsd;
  return knownNumber(value) ? value : null;
}

export function launchTime(token) {
  // pairCreatedAt only. firstSeenAt is detection time, not a launch.
  const raw = Number(token?.pairCreatedAt || 0);
  if (!raw || !Number.isFinite(raw)) return 0;
  return raw < 1e11 ? raw * 1000 : raw;
}

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

function withinWeek(token, now) {
  const ts = launchTime(token);
  // Unknown age is not "this week". It stays in the index and is not given a fake clock.
  if (!ts) return false;
  return ts <= now + 120000 && now - ts <= WEEK_MS;
}

export function isLaunch(token) {
  const platform = String(token?.launchPlatform || "");
  const dex = String(token?.dexId || token?.primaryDex || "").toLowerCase();
  return Boolean(
    token?.isArgusLaunch ||
    token?.isPonsLaunch ||
    token?.isBondingCurve ||
    platform === "Argus" ||
    platform === "Pump.fun" ||
    platform === "Pons V2" ||
    dex.includes("argus") ||
    dex.includes("pump") ||
    dex.includes("pons")
  );
}

function marketIsFresh(token, now, rules) {
  const updated = Number(token?.marketUpdatedAt || 0);
  return updated > 0 && now - updated <= rules.marketDataMaxAgeMs;
}

export function isTrendingEligible(token, now = Date.now(), rules = FEED_RULES) {
  const vol = volume24h(token);
  const liq = liquidityUsd(token);
  if (vol == null || liq == null) return false;
  if (vol < rules.trendingMinVolume24h || liq < rules.trendingMinLiquidity) return false;
  return marketIsFresh(token, now, rules);
}

export function isMomentumEligible(token, now = Date.now(), rules = FEED_RULES) {
  if (isTrendingEligible(token, now, rules)) return false;
  const vol = volume24h(token);
  const liq = liquidityUsd(token);
  if (vol == null || liq == null) return false;
  if (vol < rules.momentumMinVolume24h || liq < rules.momentumMinLiquidity) return false;
  return marketIsFresh(token, now, rules);
}

// Log scale so one large print cannot own the whole ordering.
// h1 / m5 are used only when the source actually sent them.
export function trendingScore(token) {
  const vol = volume24h(token) ?? 0;
  const liq = liquidityUsd(token) ?? 0;
  const h1 = knownNumber(token?.volume?.h1) ? token.volume.h1 : 0;
  const m5 = knownNumber(token?.volume?.m5) ? token.volume.m5 : 0;
  const volumeScore = Math.log10(1 + vol);
  const liquidityScore = Math.log10(1 + liq);
  const recentScore = Math.log10(1 + h1 * 4 + m5 * 12);
  const total = volumeScore * 0.45 + recentScore * 0.35 + liquidityScore * 0.2;
  return {
    total,
    volumeScore,
    liquidityScore,
    recentScore,
    volume24h: vol,
    liquidityUsd: liq,
  };
}

export function selectFeed(tokens, mode, now = Date.now(), rules = FEED_RULES) {
  const list = (Array.isArray(tokens) ? tokens : []).filter((token) => withinWeek(token, now));
  const byTime = (a, b) => launchTime(b) - launchTime(a) || String(a?.baseToken?.address || "").localeCompare(String(b?.baseToken?.address || ""));
  if (mode === "latest") {
    return [...list].sort(byTime);
  }
  if (mode === "fresh_mints") {
    return list.filter((token) => isLaunch(token)).sort(byTime);
  }
  if (mode === "momentum") {
    return list
      .filter((token) => isMomentumEligible(token, now, rules))
      .map((token) => ({ ...token, feedClass: "momentum", scoreBreakdown: trendingScore(token) }))
      .sort((a, b) => b.scoreBreakdown.total - a.scoreBreakdown.total);
  }
  return list
    .filter((token) => isTrendingEligible(token, now, rules))
    .map((token) => ({ ...token, feedClass: "trending", scoreBreakdown: trendingScore(token) }))
    .sort((a, b) => b.scoreBreakdown.total - a.scoreBreakdown.total);
}
